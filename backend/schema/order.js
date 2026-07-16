import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        // Snapshots taken at order time so history survives product edits/deletes
        title: {
            type: String,
            default: ''
        },
        image: {
            type: String,
            default: ''
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        // Server-computed unit price (base price after discounts + customization modifiers)
        price: {
            type: Number,
            required: true
        },
        // Size / color / customization selections, e.g. { "Lehenga Waist": "32 Inch", "Sleeves": "Halfsleeves" }
        selectedOptions: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    couponCode: {
        type: String,
        default: null
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    paymentMethod: {
        type: String,
        default: 'COD', // Cash on Delivery or Online
        enum: ['COD', 'Online']
    },
    paymentStatus: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Completed', 'Failed', 'Refunded']
    },
    razorpayOrderId: {
        type: String,
        default: null
    },
    razorpayPaymentId: {
        type: String,
        default: null
    },
    razorpaySignature: {
        type: String,
        default: null
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
    },
    trackingNumber: {
        type: String,
        default: ''
    },
    courierName: {
        type: String,
        default: ''
    },
    // Guards against duplicate confirmation emails (verify-payment vs webhook)
    confirmationEmailSent: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export default OrderSchema;
