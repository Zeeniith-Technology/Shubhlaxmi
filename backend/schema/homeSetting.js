import mongoose from 'mongoose';

const homeSettingSchema = new mongoose.Schema({
    sectionKey: {
        type: String,
        required: true,
        unique: true,
        default: 'trending_styles'
    },
    selectionType: {
        type: String,
        enum: ['latest', 'category', 'section', 'products'],
        default: 'latest'
    },
    // This can hold a categoryId, sectionId, or an array of productIds depending on selectionType
    selectedIds: {
        type: [mongoose.Schema.Types.ObjectId],
        default: []
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

export default homeSettingSchema;
