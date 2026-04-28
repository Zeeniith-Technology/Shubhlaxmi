import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    targetType: {
        type: String,
        enum: ['All', 'Category', 'Section', 'Product'],
        required: true,
        default: 'All'
    },
    targetIds: [{
        type: mongoose.Schema.Types.ObjectId,
        // References can be generic depending on targetType
    }],
    discountType: {
        type: String,
        enum: ['Percentage', 'Flat'],
        required: true,
        default: 'Percentage'
    },
    value: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default discountSchema;
