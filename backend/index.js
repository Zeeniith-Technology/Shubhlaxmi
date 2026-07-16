import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import connectdb from './connection.js';
import router from './router.js';

import db from './method.js';

import categorySchema from './schema/category.js';
import sectionSchema from './schema/section.js';
import productSchema from './schema/product.js';
import attributeSchema from './schema/attribute.js';
import bannerSchema from './schema/banner.js';
import homeSettingSchema from './schema/homeSetting.js';

// Fail fast on missing critical secrets — running without them silently
// breaks auth (or would have fallen back to hardcoded dev secrets).
if (!process.env.JWT_SECRET) {
    console.error("FATAL: JWT_SECRET environment variable is not set. Refusing to start.");
    process.exit(1);
}
if (!process.env.MONGO_URL) {
    console.error("FATAL: MONGO_URL environment variable is not set. Refusing to start.");
    process.exit(1);
}

const app = express();

// Render runs behind a proxy — needed so rate limiting sees real client IPs
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());

// Global safety-net limiter (generous; auth routes have stricter limits in router.js)
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please try again later." }
}));

// Keep the raw request body so webhook signatures (Razorpay) can be verified
app.use(express.json({
    verify: (req, res, buf) => { req.rawBody = buf; }
}));
connectdb().then(async () => {
    try {
        await db.checkTableExists('tblcategories', categorySchema);
        await db.checkTableExists('tblsections', sectionSchema);
        await db.checkTableExists('tblproducts', productSchema);
        await db.checkTableExists('tblattributes', attributeSchema);
        await db.checkTableExists('tblbanners', bannerSchema);
        await db.checkTableExists('tblhomesettings', homeSettingSchema);
        console.log("Database initialized successfully.");
    } catch (err) {
        console.error("Failed to initialize collections:", err);
    }
});
app.use('/api', router);

// Global Error Handler for express/multer crashes
app.use((err, req, res, next) => {
    console.error("Global Express Error:", err);
    res.status(500).json({
        success: false,
        message: err.message || "Something went wrong processing your request"
    });
});

// Health check route for Render
app.get('/health', (req, res) => {
    res.status(200).send('Server is awake');
});

const PORT = process.env.PORT || process.env.port || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Self-ping every 14 minutes to prevent Render from sleeping
    const pingInterval = 14 * 60 * 1000; // 14 minutes
    const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    
    setInterval(() => {
        fetch(`${url}/health`)
            .then(res => console.log(`[Keep-Alive] Successfully pinged ${url}/health - Status: ${res.status}`))
            .catch(err => console.error(`[Keep-Alive] Ping failed:`, err.message));
    }, pingInterval);
});