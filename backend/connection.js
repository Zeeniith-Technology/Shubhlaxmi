import mongoose from "mongoose";

export default async function connectdb() {
    const mongoUrl = process.env.MONGO_URL;
    
    if (!mongoUrl) {
        console.error("FATAL: MONGO_URL environment variable is not set! Check Render's Environment Variables.");
        return;
    }
    
    console.log(`Connecting to MongoDB... (host: ${mongoUrl.split('@')[1]?.split('/')[0] || 'unknown'})`);
    
    try {
        await mongoose.connect(mongoUrl);
        console.log("✅ Connected to MongoDB successfully!");
    } catch (err) {
        console.error("❌ Error connecting to MongoDB:", err.message);
    }
}