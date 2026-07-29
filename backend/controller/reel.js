import db from '../method.js';
import reelSchema from '../schema/reel.js';
import { deleteImage, deleteVideo } from '../config/cloudinary.js';

class ReelController {

    // 1. Add Reel
    async addReel(req, res, next) {
        try {
            const { title, type, instagramLink, order, isActive } = req.body;

            if (!type || !['video', 'instagram'].includes(type)) {
                req.api_error = { statusCode: 400, message: "type must be 'video' or 'instagram'" };
                return next();
            }

            const thumbnailFile = req.files && req.files.thumbnailImage ? req.files.thumbnailImage[0] : null;
            const videoFile = req.files && req.files.video ? req.files.video[0] : null;

            // Thumbnail is only required for Instagram cards (their only visual).
            // Video cards autoplay immediately, so no thumbnail is needed.
            if (type === 'instagram' && !thumbnailFile) {
                req.api_error = { statusCode: 400, message: "A thumbnail image is required for type 'instagram'" };
                return next();
            }
            if (type === 'video' && !videoFile) {
                if (thumbnailFile) await deleteImage(thumbnailFile.filename);
                req.api_error = { statusCode: 400, message: "A video file is required for type 'video'" };
                return next();
            }
            if (type === 'instagram' && !instagramLink) {
                if (thumbnailFile) await deleteImage(thumbnailFile.filename);
                req.api_error = { statusCode: 400, message: "An Instagram link is required for type 'instagram'" };
                return next();
            }

            await db.checkTableExists('tblreels', reelSchema);

            const doc = {
                title: title || "",
                type,
                thumbnailImage: thumbnailFile
                    ? { public_id: thumbnailFile.filename, url: thumbnailFile.path }
                    : { public_id: '', url: '' },
                order: order || 0,
                isActive: isActive === undefined ? true : isActive
            };

            if (type === 'video') {
                doc.video = { public_id: videoFile.filename, url: videoFile.path };
            } else {
                doc.instagramLink = instagramLink;
                // A video file isn't expected for Instagram-type entries, but if one
                // was sent anyway, don't silently keep it uploaded and orphaned.
                if (videoFile) await deleteVideo(videoFile.filename);
            }

            const result = await db.executdata('tblreels', reelSchema, 'i', doc);

            req.api_data = result;
            req.api_message = "Reel created successfully";
            next();
        } catch (error) {
            console.error("Add Reel Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    // 2. List Reels
    async listReel(req, res, next) {
        try {
            await db.checkTableExists('tblreels', reelSchema);
            const filter = { ...req.body };
            delete filter.sort;

            // Storefront-only visibility filter, matching the same publicOnly
            // convention used by category/section/product/banner listings.
            if (req.publicOnly) filter.isActive = { $ne: false };

            const data = await db.fetchdata(filter, 'tblreels', reelSchema);
            data.sort((a, b) => (a.order || 0) - (b.order || 0));

            req.api_data = data;
            next();
        } catch (error) {
            console.error("List Reel Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    // 3. Update Reel
    async updateReel(req, res, next) {
        try {
            const { id, title, type, instagramLink, order, isActive } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "ID is required" };
                return next();
            }

            await db.checkTableExists('tblreels', reelSchema);
            const existingArr = await db.fetchdata({ _id: id }, 'tblreels', reelSchema);
            if (!existingArr || existingArr.length === 0) {
                req.api_error = { statusCode: 404, message: "Reel not found" };
                return next();
            }
            const existing = existingArr[0];
            const finalType = type || existing.type;

            if (finalType === 'instagram' && !(instagramLink || existing.instagramLink)) {
                req.api_error = { statusCode: 400, message: "An Instagram link is required for type 'instagram'" };
                return next();
            }
            const willHaveThumbnail = (req.files && req.files.thumbnailImage) || (existing.thumbnailImage && existing.thumbnailImage.public_id);
            if (finalType === 'instagram' && !willHaveThumbnail) {
                req.api_error = { statusCode: 400, message: "A thumbnail image is required for type 'instagram'" };
                return next();
            }

            const updateFields = {};
            if (title !== undefined) updateFields.title = title;
            if (type !== undefined) updateFields.type = type;
            if (order !== undefined) updateFields.order = order;
            if (isActive !== undefined) updateFields.isActive = isActive;
            if (instagramLink !== undefined) updateFields.instagramLink = instagramLink;

            const thumbnailFile = req.files && req.files.thumbnailImage ? req.files.thumbnailImage[0] : null;
            if (thumbnailFile) {
                if (existing.thumbnailImage && existing.thumbnailImage.public_id) {
                    await deleteImage(existing.thumbnailImage.public_id);
                }
                updateFields.thumbnailImage = { public_id: thumbnailFile.filename, url: thumbnailFile.path };
            }

            const videoFile = req.files && req.files.video ? req.files.video[0] : null;
            if (videoFile) {
                if (existing.video && existing.video.public_id) {
                    await deleteVideo(existing.video.public_id);
                }
                updateFields.video = { public_id: videoFile.filename, url: videoFile.path };
            }

            // Switching from video -> instagram: drop the now-unused video asset
            if (finalType === 'instagram' && existing.type === 'video' && existing.video?.public_id && !videoFile) {
                await deleteVideo(existing.video.public_id);
                updateFields.video = { public_id: '', url: '' };
            }

            updateFields.updatedAt = new Date().toISOString();

            const result = await db.executdata('tblreels', reelSchema, 'u', {
                condition: { _id: id },
                update: updateFields
            });

            req.api_data = result;
            req.api_message = "Reel updated successfully";
            next();
        } catch (error) {
            console.error("Update Reel Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    // 4. Delete Reel
    async deleteReel(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "ID is required" };
                return next();
            }

            await db.checkTableExists('tblreels', reelSchema);
            const existingArr = await db.fetchdata({ _id: id }, 'tblreels', reelSchema);

            if (existingArr && existingArr.length > 0) {
                const existing = existingArr[0];
                if (existing.thumbnailImage && existing.thumbnailImage.public_id) {
                    await deleteImage(existing.thumbnailImage.public_id);
                }
                if (existing.video && existing.video.public_id) {
                    await deleteVideo(existing.video.public_id);
                }
            }

            const result = await db.executdata('tblreels', reelSchema, 'd', { _id: id });

            req.api_data = result;
            req.api_message = "Reel deleted successfully";
            next();
        } catch (error) {
            console.error("Delete Reel Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }
}

export default new ReelController();
