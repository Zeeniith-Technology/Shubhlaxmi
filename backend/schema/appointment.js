import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: String,
        required: true, // YYYY-MM-DD format
    },
    timeSlot: {
        type: String,
        required: true, // e.g. "10:30 AM - 11:00 AM"
    },
    status: {
        type: String,
        enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
        default: "Pending"
    },
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

export default appointmentSchema;
