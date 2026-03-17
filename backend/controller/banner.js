import db from '../method.js';
import bannerSchema from '../schema/banner.js';
import { deleteImage } from '../config/cloudinary.js';

class BannerController {

    // 1. Add Banner
    async addbanner(req, res, next) {
        try {
            const { title, link, order, isActive } = req.body;

            // req.files should contain 'desktopImage' and 'mobileImage' arrays/objects
            const desktopFile = req.files && req.files.desktopImage ? req.files.desktopImage[0] : null;
            const mobileFile = req.files && req.files.mobileImage ? req.files.mobileImage[0] : null;

            if (!desktopFile || !mobileFile) {
                req.api_error = { statusCode: 400, message: "Both desktop and mobile images are required" };
                return next();
            }

            await db.checkTableExists('tblbanners', bannerSchema);

            // Enforce maximum 5 banners limit
            const existingBanners = await db.fetchdata({}, 'tblbanners', bannerSchema);
            if (existingBanners && existingBanners.length >= 5) {
                // Delete the just-uploaded images from Cloudinary so we don't leak storage
                await deleteImage(desktopFile.filename);
                await deleteImage(mobileFile.filename);

                req.api_error = { statusCode: 400, message: "Maximum limit reached. You can only have up to 5 banners. Please delete an existing banner first." };
                return next();
            }

            const desktopData = { public_id: desktopFile.filename, url: desktopFile.path };
            const mobileData = { public_id: mobileFile.filename, url: mobileFile.path };

            const result = await db.executdata('tblbanners', bannerSchema, 'i', {
                title: title || "",
                link: link || "",
                desktopImage: desktopData,
                mobileImage: mobileData,
                order: order || 0,
                isActive: isActive === undefined ? true : isActive
            });

            req.api_data = result;
            req.api_message = "Banner created successfully";
            next();
        } catch (error) {
            console.error("Add Banner Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    // 2. List Banners
    async listbanner(req, res, next) {
        try {
            await db.checkTableExists('tblbanners', bannerSchema);
            const filter = { ...req.body };

            // Remove sort from the filter query since it's an instruction, not a data match
            if (filter.sort) {
                delete filter.sort;
            }

            const data = await db.fetchdata(filter, 'tblbanners', bannerSchema);
            req.api_data = data;
            next();
        } catch (error) {
            console.error("List Banner Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    // 3. Update Banner
    async updatebanner(req, res, next) {
        try {
            const { id, title, link, order, isActive } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "ID is required" };
                return next();
            }

            await db.checkTableExists('tblbanners', bannerSchema);
            const existingBannerArray = await db.fetchdata({ _id: id }, 'tblbanners', bannerSchema);
            if (!existingBannerArray || existingBannerArray.length === 0) {
                req.api_error = { statusCode: 404, message: "Banner not found" };
                return next();
            }
            const existingBanner = existingBannerArray[0];

            const updateFields = {};
            if (title !== undefined) updateFields.title = title;
            if (link !== undefined) updateFields.link = link;
            if (order !== undefined) updateFields.order = order;
            if (isActive !== undefined) updateFields.isActive = isActive;

            // Handle Desktop Image Update
            if (req.files && req.files.desktopImage && req.files.desktopImage.length > 0) {
                const newDesktop = req.files.desktopImage[0];
                if (existingBanner.desktopImage && existingBanner.desktopImage.public_id) {
                    await deleteImage(existingBanner.desktopImage.public_id);
                }
                updateFields.desktopImage = { public_id: newDesktop.filename, url: newDesktop.path };
            }

            // Handle Mobile Image Update
            if (req.files && req.files.mobileImage && req.files.mobileImage.length > 0) {
                const newMobile = req.files.mobileImage[0];
                if (existingBanner.mobileImage && existingBanner.mobileImage.public_id) {
                    await deleteImage(existingBanner.mobileImage.public_id);
                }
                updateFields.mobileImage = { public_id: newMobile.filename, url: newMobile.path };
            }

            updateFields.updatedAt = new Date().toISOString();

            const result = await db.executdata('tblbanners', bannerSchema, 'u', {
                condition: { _id: id },
                update: updateFields
            });

            req.api_data = result;
            req.api_message = "Banner updated successfully";
            next();
        } catch (error) {
            console.error("Update Banner Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    // 4. Delete Banner
    async deletebanner(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "ID is required" };
                return next();
            }

            await db.checkTableExists('tblbanners', bannerSchema);
            const existingBannerArray = await db.fetchdata({ _id: id }, 'tblbanners', bannerSchema);

            if (existingBannerArray && existingBannerArray.length > 0) {
                const existingBanner = existingBannerArray[0];
                // Clean up Cloudinary images
                if (existingBanner.desktopImage && existingBanner.desktopImage.public_id) {
                    await deleteImage(existingBanner.desktopImage.public_id);
                }
                if (existingBanner.mobileImage && existingBanner.mobileImage.public_id) {
                    await deleteImage(existingBanner.mobileImage.public_id);
                }
            }

            const result = await db.executdata('tblbanners', bannerSchema, 'd', { _id: id });

            req.api_data = result;
            req.api_message = "Banner deleted successfully";
            next();
        } catch (error) {
            console.error("Delete Banner Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }
}

export default new BannerController();
