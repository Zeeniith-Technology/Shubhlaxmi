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
    updatedAt: {
        type: String,
        default: () => new Date().toISOString()
    }
});

export default storeSettingSchema;
