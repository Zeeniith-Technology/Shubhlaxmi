import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express()
app.use(cors());
app.use(express.json());
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