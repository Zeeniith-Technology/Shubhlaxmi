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
        const { whatsappCheckoutEnabled, whatsappNumber } = req.body;

        let setting = await StoreSetting.findOne();

        if (setting) {
            setting.whatsappCheckoutEnabled = whatsappCheckoutEnabled !== undefined ? whatsappCheckoutEnabled : setting.whatsappCheckoutEnabled;
            setting.whatsappNumber = whatsappNumber || setting.whatsappNumber;
            setting.updatedAt = new Date().toISOString();
            await setting.save();
        } else {
            setting = await StoreSetting.create({
                whatsappCheckoutEnabled: whatsappCheckoutEnabled !== undefined ? whatsappCheckoutEnabled : true,
                whatsappNumber: whatsappNumber || "919876543210"
            });
        }

        return res.status(200).json({ status: true, message: "Store settings updated successfully", data: setting });
    } catch (error) {
        req.api_error = { statusCode: 500, message: error.message };
        return next();
    }
}
