import mongoose from 'mongoose';

const storeSettingSchema = new mongoose.Schema({
    whatsappCheckoutEnabled: {
        type: Boolean,
        default: true
    },
    whatsappNumber: {
        type: String,
        default: "919876543210"
    },
    budgetFriendlyMinPrice: {
        type: Number,
        default: 0
    },
    budgetFriendlyMaxPrice: {
        type: Number,
        default: 2000
    },
    updatedAt: {
        type: String,
        default: () => new Date().toISOString()
    }
});

export default storeSettingSchema;
