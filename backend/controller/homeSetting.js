import homeSettingSchema from "../schema/homeSetting.js";
import categorySchema from "../schema/category.js";
import sectionSchema from "../schema/section.js";
import productSchema from "../schema/product.js";
import mongoose from 'mongoose';

const HomeSetting = mongoose.models.tblhomesettings || mongoose.model('tblhomesettings', homeSettingSchema);
const Category = mongoose.models.tblcategories || mongoose.model('tblcategories', categorySchema);
const Section = mongoose.models.tblsections || mongoose.model('tblsections', sectionSchema);
const Product = mongoose.models.tblproducts || mongoose.model('tblproducts', productSchema);

export async function getTrendingSetting(req, res, next) {
    try {
        let setting = await HomeSetting.findOne({ sectionKey: 'trending_styles' });

        // Return default if setting hasn't been configured yet
        if (!setting) {
            return res.status(200).json({
                status: true,
                message: "Success",
                data: {
                    sectionKey: 'trending_styles',
                    selectionType: 'latest',
                    selectedIds: [],
                    isActive: true
                }
            });
        }

        return res.status(200).json({ status: true, message: "Success", data: setting });
    } catch (error) {
        req.api_error = { statusCode: 500, message: error.message };
        return next();
    }
}

export async function updateTrendingSetting(req, res, next) {
    try {
        const { selectionType, selectedIds, isActive } = req.body;

        if (!['latest', 'category', 'section', 'products'].includes(selectionType)) {
            req.api_error = { statusCode: 400, message: "Invalid selectionType. Must be 'latest', 'category', 'section', or 'products'." };
            return next();
        }

        let setting = await HomeSetting.findOne({ sectionKey: 'trending_styles' });

        if (setting) {
            setting.selectionType = selectionType;
            setting.selectedIds = selectedIds || [];
            if (isActive !== undefined) setting.isActive = isActive;
            setting.updatedAt = new Date().toISOString();
            await setting.save();
        } else {
            setting = new HomeSetting({
                sectionKey: 'trending_styles',
                selectionType,
                selectedIds: selectedIds || [],
                isActive: isActive !== undefined ? isActive : true
            });
            await setting.save();
        }

        return res.status(200).json({ status: true, message: "Trending setting updated successfully", data: setting });

    } catch (error) {
        req.api_error = { statusCode: 500, message: error.message };
        return next();
    }
}

// ─────────────────────────────────────────────────────────────────
// PUBLIC ENDPOINT API: Fetch actual products for the frontend layout
// ─────────────────────────────────────────────────────────────────
export async function getTrendingProducts(req, res, next) {
    try {
        // 1. Fetch Setting
        const setting = await HomeSetting.findOne({ sectionKey: 'trending_styles' });

        let products = [];

        // If no setting, or setting says 'latest', or disabled
        if (!setting || setting.selectionType === 'latest') {
            products = await Product.find({ isActive: true })
                .sort({ _id: -1 })
                .limit(8)
                .populate('categoryId', 'name')
                .lean();
        } else if (!setting.isActive) {
            products = []; // Hidden
        } else {
            const type = setting.selectionType;
            const ids = setting.selectedIds || [];

            if (type === 'category' && ids.length > 0) {
                products = await Product.find({ categoryId: ids[0], isActive: true })
                    .limit(8)
                    .populate('categoryId', 'name')
                    .lean();
            } else if (type === 'section' && ids.length > 0) {
                products = await Product.find({ sectionId: ids[0], isActive: true })
                    .limit(8)
                    .populate('categoryId', 'name')
                    .lean();
            } else if (type === 'products' && ids.length > 0) {
                products = await Product.find({ _id: { $in: ids }, isActive: true })
                    .populate('categoryId', 'name')
                    .lean();

                // Order products based on the IDs array matching
                const idStringMap = ids.map(id => id.toString());
                products.sort((a, b) => idStringMap.indexOf(a._id.toString()) - idStringMap.indexOf(b._id.toString()));
            } else {
                // Fallback to latest if mismatch
                products = await Product.find({ isActive: true })
                    .sort({ _id: -1 })
                    .limit(8)
                    .populate('categoryId', 'name')
                    .lean();
            }
        }

        // Format and return
        return res.status(200).json({ status: true, message: "Success", data: products });

    } catch (error) {
        req.api_error = { statusCode: 500, message: error.message };
        return next();
    }
}

// ─────────────────────────────────────────────────────────────────
// MARQUEE SETTINGS API
// ─────────────────────────────────────────────────────────────────
export async function getMarqueeSetting(req, res, next) {
    try {
        let setting = await HomeSetting.findOne({ sectionKey: 'marquee_text' });

        if (!setting) {
            return res.status(200).json({
                status: true,
                message: "Success",
                data: {
                    sectionKey: 'marquee_text',
                    textContent: 'STYLED MORE THAN 1M CLIENTS ✨',
                    isActive: true
                }
            });
        }

        return res.status(200).json({ status: true, message: "Success", data: setting });
    } catch (error) {
        req.api_error = { statusCode: 500, message: error.message };
        return next();
    }
}

export async function updateMarqueeSetting(req, res, next) {
    try {
        const { textContent, isActive } = req.body;

        let setting = await HomeSetting.findOne({ sectionKey: 'marquee_text' });

        if (setting) {
            setting.textContent = textContent || '';
            if (isActive !== undefined) setting.isActive = isActive;
            setting.updatedAt = new Date().toISOString();
            await setting.save();
        } else {
            setting = new HomeSetting({
                sectionKey: 'marquee_text',
                textContent: textContent || 'STYLED MORE THAN 1M CLIENTS ✨',
                isActive: isActive !== undefined ? isActive : true
            });
            await setting.save();
        }

        return res.status(200).json({ status: true, message: "Marquee setting updated successfully", data: setting });

    } catch (error) {
        req.api_error = { statusCode: 500, message: error.message };
        return next();
    }
}
