import storeSettingSchema from "../schema/storeSetting.js";
import mongoose from 'mongoose';

const StoreSetting = mongoose.models.tblstoresettings || mongoose.model('tblstoresettings', storeSettingSchema);

export async function getStoreSettings(req, res, next) {
    try {
        let setting = await StoreSetting.findOne();

        if (!setting) {
            setting = await StoreSetting.create({
                whatsappCheckoutEnabled: true,
                whatsappNumber: "919876543210"
            });
        }

        return res.status(200).json({ status: true, message: "Success", data: setting });
    } catch (error) {
        req.api_error = { statusCode: 500, message: error.message };
        return next();
    }
}

export async function updateStoreSettings(req, res, next) {
    try {
        const { whatsappCheckoutEnabled, whatsappNumber, budgetFriendlyMinPrice, budgetFriendlyMaxPrice } = req.body;

        // Validate budget prices
        if (budgetFriendlyMinPrice !== undefined && budgetFriendlyMaxPrice !== undefined) {
            const min = Number(budgetFriendlyMinPrice);
            const max = Number(budgetFriendlyMaxPrice);
            if (isNaN(min) || min < 0 || isNaN(max) || max < 0) {
                return res.status(400).json({ status: false, message: "Budget prices must be non-negative numbers" });
            }
            if (max <= min) {
                return res.status(400).json({ status: false, message: "Budget max price must be greater than min price" });
            }
        }

        let setting = await StoreSetting.findOne();

        if (setting) {
            if (whatsappCheckoutEnabled !== undefined) setting.whatsappCheckoutEnabled = whatsappCheckoutEnabled;
            if (whatsappNumber) setting.whatsappNumber = whatsappNumber;
            if (budgetFriendlyMinPrice !== undefined) setting.budgetFriendlyMinPrice = Number(budgetFriendlyMinPrice);
            if (budgetFriendlyMaxPrice !== undefined) setting.budgetFriendlyMaxPrice = Number(budgetFriendlyMaxPrice);
            setting.updatedAt = new Date().toISOString();
            await setting.save();
        } else {
            setting = await StoreSetting.create({
                whatsappCheckoutEnabled: whatsappCheckoutEnabled !== undefined ? whatsappCheckoutEnabled : true,
                whatsappNumber: whatsappNumber || "919876543210",
                budgetFriendlyMinPrice: budgetFriendlyMinPrice !== undefined ? Number(budgetFriendlyMinPrice) : 0,
                budgetFriendlyMaxPrice: budgetFriendlyMaxPrice !== undefined ? Number(budgetFriendlyMaxPrice) : 2000
            });
        }

        return res.status(200).json({ status: true, message: "Store settings updated successfully", data: setting });
    } catch (error) {
        req.api_error = { statusCode: 500, message: error.message };
        return next();
    }
}
