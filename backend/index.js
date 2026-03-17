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

app.listen(process.env.port, () => {
    console.log(`Server is running on port ${process.env.port}`);
});