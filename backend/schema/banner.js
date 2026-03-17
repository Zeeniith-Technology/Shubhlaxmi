import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        default: ""
    },
    desktopImage: {
        public_id: { type: String, required: true },
        url: { type: String, required: true }
    },
    mobileImage: {
        public_id: { type: String, required: true },
        url: { type: String, required: true }
    },
    link: {
        type: String,
        trim: true,
        default: ""
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: String,
        default: () => new Date().toISOString()
    },
    updatedAt: {
        type: String,
        default: () => new Date().toISOString()
    }
});

export default bannerSchema;
