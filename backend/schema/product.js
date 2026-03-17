import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    title: {
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
    description: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        required: true
    },
    compareAtPrice: {
        type: Number,
        default: null  // Original MRP for showing discounts
    },
    sku: {
        type: String,
        default: ''
    },
    stock: {
        type: Number,
        default: 0
    },
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tblsections',
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tblcategories',
        required: true
    },
    // The base price/stock properties are kept as fallbacks/defaults
    // The actual values will primarily come from the variants array
    images: [{
        url: { type: String },
        publicId: { type: String }  // Cloudinary public_id for deletion
    }],

    // --- ADVANCED E-COMMERCE FIELDS ---

    // Dynamic Product Attributes (e.g., Fabric: Silk, Work Type: Embroidery)
    attributes: [{
        key: { type: String, required: true }, // e.g., 'Fabric', 'Occasion', 'Work Type'
        value: { type: String, required: true } // e.g., 'Georgette', 'Bridal', 'Zardosi'
    }],

    // Complex Variants (e.g., Size M + Red, Size L + Blue)
    variants: [{
        sku: { type: String, required: true, unique: true, sparse: true },
        price: { type: Number, required: true },
        compareAtPrice: { type: Number },
        stock: { type: Number, default: 0 },
        images: [{ url: String, publicId: String }], // Variant-specific images
        options: [{
            name: { type: String, required: true }, // e.g., 'Size', 'Color'
            value: { type: String, required: true } // e.g., 'XL', 'Maroon'
        }],
        isActive: { type: Boolean, default: true }
    }],

    // Customization / Add-on Services (e.g., Blouse Stitching, Fall-Pico)
    customizationOptions: [{
        title: { type: String, required: true }, // e.g., 'Blouse Stitching'
        type: { type: String, enum: ['checkbox', 'select', 'form'], required: true },
        priceModifier: { type: Number, default: 0 }, // Added cost for this option
        options: [{ label: String, value: String }] // For 'select' type
    }],

    // SEO Data
    seo: {
        metaTitle: { type: String },
        metaDescription: { type: String },
        keywords: { type: String } // Comma separated
    },

    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
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

export default productSchema;
