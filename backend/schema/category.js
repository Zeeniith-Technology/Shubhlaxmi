import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tblsections',
        required: true
    },
    parentCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tblcategories',
        default: null // If null, it's a main category. If set, it's a subcategory.
    },
    isActive: {
        type: Boolean,
        default: true
    },
    image: {
        url: { type: String, default: '' },
        publicId: { type: String, default: '' }
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

export default categorySchema;
