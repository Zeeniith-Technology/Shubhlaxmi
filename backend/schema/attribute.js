import mongoose from 'mongoose';

const attributeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true // e.g., 'Fabric', 'Occasion', 'Work Type'
    },
    values: [{
        type: String,
        trim: true // e.g., 'Silk', 'Georgette', 'Bridal', 'Casual'
    }],
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

export default attributeSchema;
