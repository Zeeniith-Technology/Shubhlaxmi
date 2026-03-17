import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// mongoose.connect(process.env.MONGO_URL).then(() => {
//     console.log("Connected to MongoDB");
// }).catch((err) => {
//     console.log("Error connecting to MongoDB", err);
// });

export default async function connectdb() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB");
    } catch (err) {
        console.log("Error connecting to MongoDB", err);
    }
    
}