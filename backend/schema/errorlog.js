import mongoose from 'mongoose';

const errorLogSchema = new mongoose.Schema({
    endpoint: {
        type: String,
        required: true
    },
    method: {
        type: String
    },
    statusCode: {
        type: Number,
        default: 500
    },
    errorMessage: {
        type: String
    },
    errorStack: {
        type: String
    },
    requestBody: {
        type: Object
    },
    userId: {
        type: String,
        default: null
    },
    createdAt: {
        type: String,
        default: () => new Date().toISOString()
    }
});

export default errorLogSchema;
