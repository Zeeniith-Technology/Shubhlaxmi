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

// Prevent double-booking at the DB level: only one non-cancelled appointment
// per (date, timeSlot). Cancelled appointments leave the index, freeing the slot.
appointmentSchema.index(
    { date: 1, timeSlot: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ["Pending", "Confirmed", "Completed"] } }
    }
);

export default appointmentSchema;
