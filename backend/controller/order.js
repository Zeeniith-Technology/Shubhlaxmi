import db from '../method.js';
import OrderSchema from '../schema/order.js';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class OrderController {

    // 1. Customer: Place Order
    async placeOrder(req, res, next) {
        try {
            const { items, totalAmount, shippingAddress, paymentMethod } = req.body;

            if (!items || items.length === 0) {
                req.api_error = { statusCode: 400, message: "Order must contain items" };
                return next();
            }

            if (!shippingAddress || !shippingAddress.street) {
                req.api_error = { statusCode: 400, message: "Shipping address is required" };
                return next();
            }

            // Ensure table exists
            await db.checkTableExists('tblorders', OrderSchema);

            const result = await db.executdata('tblorders', OrderSchema, 'i', {
                userId: req.user.id || req.user._id, // Support different token shapes
                items,
                totalAmount,
                shippingAddress,
                paymentMethod: paymentMethod || 'COD'
            });

            req.api_data = { orderId: result._id };
            req.api_message = "Order placed successfully";
            next();

        } catch (error) {
            console.error("Place Order error:", error);
            req.api_error = { statusCode: 500, message: "Failed to place order", stack: error.stack };
            next();
        }
    }

    // 1b. Customer: Create Razorpay Order
    async createRazorpayOrder(req, res, next) {
        try {
            const { items, totalAmount, shippingAddress, currency = "INR" } = req.body;

            if (!items || items.length === 0) {
                req.api_error = { statusCode: 400, message: "Order must contain items" };
                return next();
            }

            if (!shippingAddress || !shippingAddress.street) {
                req.api_error = { statusCode: 400, message: "Shipping address is required" };
                return next();
            }

            await db.checkTableExists('tblorders', OrderSchema);

            // 1. Create Order in MongoDB first (Status: Pending)
            const mongoOrder = await db.executdata('tblorders', OrderSchema, 'i', {
                userId: req.user.id || req.user._id,
                items,
                totalAmount,
                shippingAddress,
                paymentMethod: 'Online',
                paymentStatus: 'Pending',
                currency
            });

            // 2. Create Order in Razorpay
            // Razorpay expects amount in smallest sub-unit (e.g. paise for INR, cents for USD)
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
                keyId: process.env.RAZORPAY_KEY_ID
            };
            req.api_message = "Razorpay order created successfully";
            next();

        } catch (error) {
            console.error("Create Razorpay Order error:", error);
            req.api_error = { statusCode: 500, message: "Failed to create payment order", stack: error.stack };
            next();
        }
    }

    // 1c. Customer/Webhook: Verify Razorpay Payment Signature
    async verifyPayment(req, res, next) {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                req.api_error = { statusCode: 400, message: "Missing required payment parameters" };
                return next();
            }

            // Verify Signature to ensure the frontend wasn't spoofed
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest("hex");

            const isAuthentic = expectedSignature === razorpay_signature;

            if (!isAuthentic) {
                req.api_error = { statusCode: 400, message: "Invalid payment signature" };
                return next();
            }

            // Signature is valid! Find the order and mark as Completed
            await db.checkTableExists('tblorders', OrderSchema);

            const result = await db.executdata('tblorders', OrderSchema, 'u', {
                condition: { _id: orderId, razorpayOrderId: razorpay_order_id },
                update: {
                    paymentStatus: 'Completed',
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature
                }
            });

            if (!result) {
                req.api_error = { statusCode: 404, message: "Order not found" };
                return next();
            }

            req.api_data = { success: true, orderId };
            req.api_message = "Payment verified successfully";
            next();

        } catch (error) {
            console.error("Verify Payment error:", error);
            req.api_error = { statusCode: 500, message: "Failed to verify payment", stack: error.stack };
            next();
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
                        from: "tblproducts", // Assuming product collection is tblproducts
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                {
                    $group: {
                        _id: "$_id",
                        userId: { $first: "$userId" },
                        totalAmount: { $first: "$totalAmount" },
                        shippingAddress: { $first: "$shippingAddress" },
                        paymentMethod: { $first: "$paymentMethod" },
                        status: { $first: "$status" },
                        createdAt: { $first: "$createdAt" },
                        items: {
                            $push: {
                                productId: "$items.productId",
                                quantity: "$items.quantity",
                                price: "$items.price",
                                product: {
                                    title: "$productDetails.title",
                                    price: "$productDetails.price",
                                    images: "$productDetails.images"
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
                    $lookup: {
                        from: "tblusers",
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
                        status: { $first: "$status" },
                        createdAt: { $first: "$createdAt" },
                        items: {
                            $push: {
                                productId: "$items.productId",
                                quantity: "$items.quantity",
                                price: "$items.price",
                                product: {
                                    title: "$productDetails.title",
                                    images: "$productDetails.images"
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

    // 4. Admin: Update Order Status
    async updateorderstatus(req, res, next) {
        try {
            const { id, status } = req.body;
            if (!id || !status) {
                req.api_error = { statusCode: 400, message: "Order ID and Status are required" };
                return next();
            }

            await db.checkTableExists('tblorders', OrderSchema);

            const result = await db.executdata('tblorders', OrderSchema, 'u', {
                condition: { _id: id },
                update: { status }
            });

            req.api_data = result;
            req.api_message = "Order status updated successfully";
            next();

        } catch (error) {
            console.error("Update Order Status error:", error);
            req.api_error = { statusCode: 500, message: "Failed to update order status", stack: error.stack };
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
