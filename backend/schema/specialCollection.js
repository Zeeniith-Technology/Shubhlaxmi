import mongoose from 'mongoose';

const specialCollectionSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: true
    },
    image: {
        public_id: { type: String, required: true },
        url: { type: String, required: true }
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tblcategories',
        required: true
    },
    maxPrice: {
        type: Number,
        required: true,
        min: 0
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

export default specialCollectionSchema;
