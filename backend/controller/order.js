import db from '../method.js';
import OrderSchema from '../schema/order.js';
import productSchema from '../schema/product.js';
import discountSchema from '../schema/discount.js';
import ProductController from './product.js';
import User from '../schema/user.js';
import { sendOrderConfirmation, sendOrderStatusUpdate, sendOrderCancellation } from '../services/email.js';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getModel = (tablename, schema) =>
    mongoose.models[tablename] || mongoose.model(tablename, schema);

const productPricer = new ProductController();

/**
 * Look up a currently-valid coupon discount by code. Returns the discount doc or null.
 */
async function findValidCoupon(couponCode) {
    if (!couponCode) return null;
    const now = new Date();
    const matches = await db.fetchdata({
        couponCode: String(couponCode).trim().toUpperCase(),
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
    }, 'tbldiscounts', discountSchema);
    return matches[0] || null;
}

/**
 * Recompute order items entirely server-side. NEVER trust client prices.
 * Input items: [{ productId, quantity, selectedOptions }]
 * Returns { pricedItems, subtotal, discountAmount, totalAmount, coupon } or throws { statusCode, message }.
 * If couponCode is provided but invalid, throws a 400.
 */
async function priceOrderItems(rawItems, couponCode = null) {
    const ids = rawItems.map(i => i.productId);
    const Product = getModel('tblproducts', productSchema);
    const products = await Product.find({ _id: { $in: ids } }).lean();

    // Apply the same active discounts the storefront shows
    const discounted = await productPricer.applyDiscounts(products);
    const byId = new Map(discounted.map(p => [p._id.toString(), p]));

    const pricedItems = [];
    let totalAmount = 0;

    for (const raw of rawItems) {
        const quantity = Math.floor(Number(raw.quantity));
        if (isNaN(quantity) || quantity < 1) {
            throw { statusCode: 400, message: "Invalid item quantity" };
        }

        const product = byId.get(String(raw.productId));
        if (!product) {
            throw { statusCode: 400, message: "One or more products in your cart no longer exist" };
        }
        if (product.isActive === false) {
            throw { statusCode: 400, message: `"${product.title}" is no longer available` };
        }

        const selectedOptions = (raw.selectedOptions && typeof raw.selectedOptions === 'object')
            ? raw.selectedOptions : {};

        // Unit price = discounted base price + selected customization add-ons
        let unitPrice = Number(product.price) || 0;
        if (Array.isArray(product.customizationOptions)) {
            for (const opt of product.customizationOptions) {
                const chosen = selectedOptions[opt.title];
                if (chosen !== undefined && chosen !== null && chosen !== '' && chosen !== false) {
                    unitPrice += Number(opt.priceModifier) || 0;
                }
            }
        }
        if (unitPrice <= 0) {
            throw { statusCode: 400, message: `Invalid price computed for "${product.title}"` };
        }

        pricedItems.push({
            productId: product._id,
            title: product.title,
            image: product.images?.[0]?.url || '',
            quantity,
            price: unitPrice,
            selectedOptions,
            // internal, stripped before saving — used for coupon eligibility
            _categoryId: product.categoryId?._id || product.categoryId,
            _sectionId: product.sectionId?._id || product.sectionId
        });
        totalAmount += unitPrice * quantity;
    }

    const subtotal = Math.round(totalAmount * 100) / 100;

    // Apply coupon (if any) on top of the auto-discounted prices
    let discountAmount = 0;
    let coupon = null;
    if (couponCode) {
        coupon = await findValidCoupon(couponCode);
        if (!coupon) {
            throw { statusCode: 400, message: "Invalid or expired coupon code" };
        }

        const idIn = (list, id) => (list || []).map(x => x.toString()).includes(id?.toString());
        const eligibleSubtotal = pricedItems.reduce((sum, item) => {
            let eligible = false;
            if (coupon.targetType === 'All') eligible = true;
            else if (coupon.targetType === 'Category') eligible = idIn(coupon.targetIds, item._categoryId);
            else if (coupon.targetType === 'Section') eligible = idIn(coupon.targetIds, item._sectionId);
            else if (coupon.targetType === 'Product') eligible = idIn(coupon.targetIds, item.productId);
            return eligible ? sum + item.price * item.quantity : sum;
        }, 0);

        if (eligibleSubtotal <= 0) {
            throw { statusCode: 400, message: "This coupon doesn't apply to any items in your cart" };
        }

        discountAmount = coupon.discountType === 'Percentage'
            ? (eligibleSubtotal * coupon.value) / 100
            : Math.min(coupon.value, eligibleSubtotal);
        discountAmount = Math.round(discountAmount * 100) / 100;
    }

    // Strip internal fields before the items are persisted
    for (const item of pricedItems) {
        delete item._categoryId;
        delete item._sectionId;
    }

    const finalTotal = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
    return { pricedItems, subtotal, discountAmount, totalAmount: finalTotal, coupon };
}

/**
 * Atomically decrement stock for each item; rolls back on failure so a
 * partially-stocked cart never oversells.
 */
async function decrementStock(pricedItems) {
    const Product = getModel('tblproducts', productSchema);
    const decremented = [];
    for (const item of pricedItems) {
        const result = await Product.updateOne(
            { _id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } }
        );
        if (result.modifiedCount === 0) {
            await restoreStock(decremented);
            throw { statusCode: 400, message: `"${item.title}" doesn't have enough stock` };
        }
        decremented.push(item);
    }
}

async function restoreStock(items) {
    if (!items || items.length === 0) return;
    const Product = getModel('tblproducts', productSchema);
    for (const item of items) {
        try {
            await Product.updateOne(
                { _id: item.productId },
                { $inc: { stock: item.quantity } }
            );
        } catch (e) {
            console.error("Failed to restore stock for", item.productId, e.message);
        }
    }
}

class OrderController {

    // 1. Customer: Place Order (COD)
    async placeOrder(req, res, next) {
        try {
            const { items, shippingAddress, paymentMethod, couponCode } = req.body;

            if (!items || items.length === 0) {
                req.api_error = { statusCode: 400, message: "Order must contain items" };
                return next();
            }

            if (!shippingAddress || !shippingAddress.street) {
                req.api_error = { statusCode: 400, message: "Shipping address is required" };
                return next();
            }

            await db.checkTableExists('tblorders', OrderSchema);

            // Server-side pricing — client-sent prices/totals are ignored
            const { pricedItems, totalAmount, discountAmount, coupon } = await priceOrderItems(items, couponCode);
            await decrementStock(pricedItems);

            let result;
            try {
                result = await db.executdata('tblorders', OrderSchema, 'i', {
                    userId: req.user.id || req.user._id,
                    items: pricedItems,
                    totalAmount,
                    couponCode: coupon ? coupon.couponCode : null,
                    discountAmount,
                    shippingAddress,
                    paymentMethod: paymentMethod === 'Online' ? 'Online' : 'COD',
                    confirmationEmailSent: true
                });
            } catch (insertErr) {
                await restoreStock(pricedItems);
                throw insertErr;
            }

            // COD order is confirmed immediately
            sendOrderConfirmation(req.user, result);

            req.api_data = { orderId: result._id, totalAmount };
            req.api_message = "Order placed successfully";
            next();

        } catch (error) {
            if (error.statusCode) {
                req.api_error = { statusCode: error.statusCode, message: error.message };
                return next();
            }
            console.error("Place Order error:", error);
            req.api_error = { statusCode: 500, message: "Failed to place order", stack: error.stack };
            next();
        }
    }

    // 1b. Customer: Create Razorpay Order
    async createRazorpayOrder(req, res, next) {
        try {
            const { items, shippingAddress, currency = "INR", couponCode } = req.body;

            if (!items || items.length === 0) {
                req.api_error = { statusCode: 400, message: "Order must contain items" };
                return next();
            }

            if (!shippingAddress || !shippingAddress.street) {
                req.api_error = { statusCode: 400, message: "Shipping address is required" };
                return next();
            }

            await db.checkTableExists('tblorders', OrderSchema);

            // Server-side pricing — client-sent prices/totals are ignored
            const { pricedItems, totalAmount, discountAmount, coupon } = await priceOrderItems(items, couponCode);
            await decrementStock(pricedItems);

            let mongoOrder;
            try {
                // 1. Create Order in MongoDB first (Status: Pending)
                mongoOrder = await db.executdata('tblorders', OrderSchema, 'i', {
                    userId: req.user.id || req.user._id,
                    items: pricedItems,
                    totalAmount,
                    couponCode: coupon ? coupon.couponCode : null,
                    discountAmount,
                    shippingAddress,
                    paymentMethod: 'Online',
                    paymentStatus: 'Pending',
                    currency
                });

                // 2. Create Order in Razorpay (amount in paise, from the SERVER total)
                const options = {
                    amount: Math.round(totalAmount * 100),
                    currency: currency,
                    receipt: mongoOrder._id.toString()
                };

                const razorpayOrder = await razorpay.orders.create(options);

                // 3. Update MongoDB order with Razorpay Order ID
                await db.executdata('tblorders', OrderSchema, 'u', {
                    condition: { _id: mongoOrder._id },
                    update: { razorpayOrderId: razorpayOrder.id }
                });

                // 4. Send Order details to client to initialize checkout
                req.api_data = {
                    orderId: mongoOrder._id,
                    razorpayOrderId: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    keyId: process.env.RAZORPAY_KEY_ID,
                    totalAmount
                };
                req.api_message = "Razorpay order created successfully";
                next();
            } catch (innerErr) {
                // Razorpay/DB failure after stock was reserved — release it
                await restoreStock(pricedItems);
                if (mongoOrder && mongoOrder._id) {
                    try {
                        await db.executdata('tblorders', OrderSchema, 'd', { condition: { _id: mongoOrder._id } });
                    } catch (e) { /* best effort */ }
                }
                throw innerErr;
            }

        } catch (error) {
            if (error.statusCode) {
                req.api_error = { statusCode: error.statusCode, message: error.message };
                return next();
            }
            console.error("Create Razorpay Order error:", error);
            req.api_error = { statusCode: 500, message: "Failed to create payment order", stack: error.stack };
            next();
        }
    }

    // 1b-2. Public: Preview a coupon against cart items (no order created)
    async previewCoupon(req, res, next) {
        try {
            const { items, couponCode } = req.body;
            if (!couponCode || !items || items.length === 0) {
                req.api_error = { statusCode: 400, message: "couponCode and items are required" };
                return next();
            }

            const { subtotal, discountAmount, totalAmount, coupon } = await priceOrderItems(items, couponCode);

            req.api_data = {
                couponCode: coupon.couponCode,
                subtotal,
                discountAmount,
                totalAmount
            };
            req.api_message = "Coupon applied";
            next();
        } catch (error) {
            if (error.statusCode) {
                req.api_error = { statusCode: error.statusCode, message: error.message };
                return next();
            }
            console.error("Preview Coupon error:", error);
            req.api_error = { statusCode: 500, message: "Failed to validate coupon", stack: error.stack };
            next();
        }
    }

    // 1c. Customer: Verify Razorpay Payment Signature
    async verifyPayment(req, res, next) {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
                req.api_error = { statusCode: 400, message: "Missing required payment parameters" };
                return next();
            }

            // Verify Signature to ensure the frontend wasn't spoofed
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest("hex");

            let isAuthentic = false;
            try {
                isAuthentic = crypto.timingSafeEqual(
                    Buffer.from(expectedSignature),
                    Buffer.from(razorpay_signature)
                );
            } catch (e) {
                isAuthentic = false;
            }

            if (!isAuthentic) {
                req.api_error = { statusCode: 400, message: "Invalid payment signature" };
                return next();
            }

            await db.checkTableExists('tblorders', OrderSchema);
            const Order = getModel('tblorders', OrderSchema);

            // The order must exist, match the Razorpay order, and belong to this customer
            const userId = req.user.id || req.user._id;
            const order = await Order.findOne({
                _id: orderId,
                razorpayOrderId: razorpay_order_id,
                userId: userId
            });

            if (!order) {
                req.api_error = { statusCode: 404, message: "Order not found" };
                return next();
            }

            // Confirm with Razorpay that the captured amount matches the order amount
            const payment = await razorpay.payments.fetch(razorpay_payment_id);
            if (!payment || payment.order_id !== razorpay_order_id) {
                req.api_error = { statusCode: 400, message: "Payment does not belong to this order" };
                return next();
            }
            const expectedPaise = Math.round(order.totalAmount * 100);
            if (Number(payment.amount) !== expectedPaise) {
                console.error(`Payment amount mismatch for order ${orderId}: paid ${payment.amount}, expected ${expectedPaise}`);
                req.api_error = { statusCode: 400, message: "Payment amount does not match order amount" };
                return next();
            }

            order.paymentStatus = 'Completed';
            order.razorpayPaymentId = razorpay_payment_id;
            order.razorpaySignature = razorpay_signature;
            const shouldEmail = !order.confirmationEmailSent;
            if (shouldEmail) order.confirmationEmailSent = true;
            await order.save();

            if (shouldEmail) sendOrderConfirmation(req.user, order);

            req.api_data = { success: true, orderId };
            req.api_message = "Payment verified successfully";
            next();

        } catch (error) {
            console.error("Verify Payment error:", error);
            req.api_error = { statusCode: 500, message: "Failed to verify payment", stack: error.stack };
            next();
        }
    }

    // 1d. Razorpay Webhook — server-to-server payment confirmation.
    // Does not depend on the customer's browser staying open after payment.
    // Configure in the Razorpay dashboard with RAZORPAY_WEBHOOK_SECRET.
    async razorpayWebhook(req, res) {
        try {
            const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
            if (!webhookSecret) {
                console.error("RAZORPAY_WEBHOOK_SECRET is not set; webhook rejected");
                return res.status(503).json({ success: false, message: "Webhook not configured" });
            }

            const signature = req.headers['x-razorpay-signature'];
            if (!signature || !req.rawBody) {
                return res.status(400).json({ success: false, message: "Missing signature or body" });
            }

            const expected = crypto
                .createHmac('sha256', webhookSecret)
                .update(req.rawBody)
                .digest('hex');

            let valid = false;
            try {
                valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
            } catch (e) {
                valid = false;
            }
            if (!valid) {
                return res.status(400).json({ success: false, message: "Invalid webhook signature" });
            }

            const event = req.body?.event;
            const paymentEntity = req.body?.payload?.payment?.entity;

            if (paymentEntity?.order_id) {
                await db.checkTableExists('tblorders', OrderSchema);
                const Order = getModel('tblorders', OrderSchema);
                const order = await Order.findOne({ razorpayOrderId: paymentEntity.order_id });

                if (order) {
                    if (event === 'payment.captured' && order.paymentStatus !== 'Completed') {
                        const expectedPaise = Math.round(order.totalAmount * 100);
                        if (Number(paymentEntity.amount) === expectedPaise) {
                            order.paymentStatus = 'Completed';
                            order.razorpayPaymentId = paymentEntity.id;
                            const shouldEmail = !order.confirmationEmailSent;
                            if (shouldEmail) order.confirmationEmailSent = true;
                            await order.save();
                            if (shouldEmail) {
                                const user = await User.findById(order.userId).lean();
                                sendOrderConfirmation(user, order);
                            }
                        } else {
                            console.error(`Webhook amount mismatch for order ${order._id}: paid ${paymentEntity.amount}, expected ${expectedPaise}`);
                        }
                    } else if (event === 'payment.failed' && order.paymentStatus === 'Pending') {
                        order.paymentStatus = 'Failed';
                        await order.save();
                    }
                }
            }

            // Always 200 so Razorpay doesn't retry events we've consciously ignored
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Razorpay Webhook error:", error);
            return res.status(500).json({ success: false });
        }
    }

    // 2. Customer: Get My Orders
    async getMyOrders(req, res, next) {
        try {
            await db.checkTableExists('tblorders', OrderSchema);
            const userId = req.user.id || req.user._id;

            // Use aggregation to mimic populate
            const pipeline = [
                { $match: { userId: new mongoose.Types.ObjectId(userId) } },
                { $sort: { createdAt: -1 } },
                { $unwind: "$items" },
                {
                    $lookup: {
                        from: "tblproducts",
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                // Keep the order line even if the product was deleted — the item
                // snapshot (title/image) still renders in that case.
                { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: "$_id",
                        userId: { $first: "$userId" },
                        totalAmount: { $first: "$totalAmount" },
                        shippingAddress: { $first: "$shippingAddress" },
                        paymentMethod: { $first: "$paymentMethod" },
                        paymentStatus: { $first: "$paymentStatus" },
                        status: { $first: "$status" },
                        trackingNumber: { $first: "$trackingNumber" },
                        courierName: { $first: "$courierName" },
                        createdAt: { $first: "$createdAt" },
                        items: {
                            $push: {
                                productId: "$items.productId",
                                quantity: "$items.quantity",
                                price: "$items.price",
                                selectedOptions: "$items.selectedOptions",
                                product: {
                                    title: { $ifNull: ["$productDetails.title", "$items.title"] },
                                    price: { $ifNull: ["$productDetails.price", "$items.price"] },
                                    images: {
                                        $ifNull: ["$productDetails.images", [{ url: "$items.image" }]]
                                    }
                                }
                            }
                        }
                    }
                },
                { $sort: { createdAt: -1 } }
            ];

            const data = await db.fetchdata({}, 'tblorders', OrderSchema, pipeline, true);
            req.api_data = data;
            next();

        } catch (error) {
            console.error("Get My Orders error:", error);
            req.api_error = { statusCode: 500, message: "Failed to fetch orders", stack: error.stack };
            next();
        }
    }

    // 3. Admin: List All Orders
    async listorders(req, res, next) {
        try {
            await db.checkTableExists('tblorders', OrderSchema);
            const query = {};
            if (req.body.status) query.status = req.body.status;

            const pipeline = [
                { $match: query },
                { $sort: { createdAt: -1 } },
                {
                    // Customer accounts live in the 'users' collection (User model),
                    // not 'tblusers' (which holds admin/OTP logins).
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
                { $unwind: "$items" },
                {
                    $lookup: {
                        from: "tblproducts",
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: "$_id",
                        userId: { $first: "$userId" },
                        user: {
                            $first: {
                                name: "$userDetails.name",
                                email: "$userDetails.email",
                                phone: "$userDetails.phone"
                            }
                        },
                        totalAmount: { $first: "$totalAmount" },
                        shippingAddress: { $first: "$shippingAddress" },
                        paymentMethod: { $first: "$paymentMethod" },
                        paymentStatus: { $first: "$paymentStatus" },
                        status: { $first: "$status" },
                        createdAt: { $first: "$createdAt" },
                        items: {
                            $push: {
                                productId: "$items.productId",
                                quantity: "$items.quantity",
                                price: "$items.price",
                                selectedOptions: "$items.selectedOptions",
                                product: {
                                    title: { $ifNull: ["$productDetails.title", "$items.title"] },
                                    images: {
                                        $ifNull: ["$productDetails.images", [{ url: "$items.image" }]]
                                    }
                                }
                            }
                        }
                    }
                },
                { $sort: { createdAt: -1 } }
            ];

            const data = await db.fetchdata({}, 'tblorders', OrderSchema, pipeline, true);
            req.api_data = data;
            next();

        } catch (error) {
            console.error("List Orders error:", error);
            req.api_error = { statusCode: 500, message: "Failed to fetch all orders", stack: error.stack };
            next();
        }
    }

    // 4. Admin: Update Order Status (optionally with tracking info)
    async updateorderstatus(req, res, next) {
        try {
            const { id, status, trackingNumber, courierName } = req.body;
            if (!id || !status) {
                req.api_error = { statusCode: 400, message: "Order ID and Status are required" };
                return next();
            }

            await db.checkTableExists('tblorders', OrderSchema);
            const Order = getModel('tblorders', OrderSchema);

            const order = await Order.findById(id);
            if (!order) {
                req.api_error = { statusCode: 404, message: "Order not found" };
                return next();
            }

            // Return reserved stock when an order gets cancelled
            if (status === 'Cancelled' && order.status !== 'Cancelled') {
                await restoreStock(order.items);
            }
            // Re-reserve if an admin un-cancels an order
            if (order.status === 'Cancelled' && status !== 'Cancelled') {
                await decrementStock(order.items);
            }

            const statusChanged = order.status !== status;
            order.status = status;
            if (trackingNumber !== undefined) order.trackingNumber = String(trackingNumber);
            if (courierName !== undefined) order.courierName = String(courierName);
            await order.save();

            // Notify the customer about meaningful transitions
            if (statusChanged && ['Shipped', 'Delivered', 'Cancelled'].includes(status)) {
                const user = await User.findById(order.userId).lean();
                if (status === 'Cancelled') {
                    sendOrderCancellation(user, order, order.paymentStatus === 'Completed');
                } else {
                    sendOrderStatusUpdate(user, order);
                }
            }

            req.api_data = order;
            req.api_message = "Order status updated successfully";
            next();

        } catch (error) {
            if (error.statusCode) {
                req.api_error = { statusCode: error.statusCode, message: error.message };
                return next();
            }
            console.error("Update Order Status error:", error);
            req.api_error = { statusCode: 500, message: "Failed to update order status", stack: error.stack };
            next();
        }
    }

    // 4b. Customer: Cancel own order (only before it ships)
    async cancelOrder(req, res, next) {
        try {
            const { orderId } = req.body;
            if (!orderId) {
                req.api_error = { statusCode: 400, message: "Order ID is required" };
                return next();
            }

            await db.checkTableExists('tblorders', OrderSchema);
            const Order = getModel('tblorders', OrderSchema);

            const userId = req.user.id || req.user._id;
            const order = await Order.findOne({ _id: orderId, userId });

            if (!order) {
                req.api_error = { statusCode: 404, message: "Order not found" };
                return next();
            }

            if (!['Pending', 'Processing'].includes(order.status)) {
                req.api_error = { statusCode: 400, message: `This order can no longer be cancelled (status: ${order.status})` };
                return next();
            }

            await restoreStock(order.items);
            order.status = 'Cancelled';
            await order.save();

            const wasPaid = order.paymentStatus === 'Completed';
            sendOrderCancellation(req.user, order, wasPaid);

            req.api_data = { orderId: order._id, status: order.status };
            req.api_message = wasPaid
                ? "Order cancelled. Your refund will be processed within 5-7 business days."
                : "Order cancelled successfully";
            next();

        } catch (error) {
            console.error("Cancel Order error:", error);
            req.api_error = { statusCode: 500, message: "Failed to cancel order", stack: error.stack };
            next();
        }
    }

    // 5. Admin: Delete Order
    async deleteorder(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "Order ID is required" };
                return next();
            }

            await db.checkTableExists('tblorders', OrderSchema);
            const Order = getModel('tblorders', OrderSchema);

            const order = await Order.findById(id);
            if (order && order.status !== 'Cancelled' && order.status !== 'Delivered') {
                // Deleting an open order releases its reserved stock
                await restoreStock(order.items);
            }

            const result = await db.executdata('tblorders', OrderSchema, 'd', { _id: id });

            req.api_data = result;
            req.api_message = "Order deleted successfully";
            next();

        } catch (error) {
            console.error("Delete Order error:", error);
            req.api_error = { statusCode: 500, message: "Failed to delete order", stack: error.stack };
            next();
        }
    }
}

export default new OrderController();
