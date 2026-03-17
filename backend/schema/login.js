import mongoose from 'mongoose';

const loginSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    number: {
        type: String
    },
    name: {
        type: String,
        required: true
    },
    otp: {
        code: { type: String },
        expiresAt: { type: Date }
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
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

export default loginSchema;
