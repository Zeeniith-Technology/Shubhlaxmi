import db from '../method.js';
import specialCollectionSchema from '../schema/specialCollection.js';
import { deleteImage } from '../config/cloudinary.js';

class SpecialCollectionController {

    // 1. Add Special Collection
    async addSpecialCollection(req, res, next) {
        try {
            const { title, categoryId, maxPrice, order, isActive } = req.body;

            // req.files should contain 'image' array/object from Multer
            const file = req.files && req.files.image ? req.files.image[0] : null;

            if (!file) {
                req.api_error = { statusCode: 400, message: "An image is required for the collection banner" };
                return next();
            }

            if (!title || !categoryId || !maxPrice) {
                await deleteImage(file.filename); // cleanup
                req.api_error = { statusCode: 400, message: "Title, Category, and Max Price are all required fields" };
                return next();
            }

            await db.checkTableExists('tblspecialcollections', specialCollectionSchema);

            // Enforce maximum exactly like banners (can be adjusted as needed, currently 4 grid slots exist)
            const existingCollections = await db.fetchdata({}, 'tblspecialcollections', specialCollectionSchema);
            if (existingCollections && existingCollections.length >= 8) {
                await deleteImage(file.filename);
                req.api_error = { statusCode: 400, message: "Maximum limit reached. You can only have up to 8 special collections." };
                return next();
            }

            const imageData = { public_id: file.filename, url: file.path };

            const result = await db.executdata('tblspecialcollections', specialCollectionSchema, 'i', {
                title: title,
                categoryId: categoryId,
                maxPrice: Number(maxPrice),
                image: imageData,
                order: order ? Number(order) : 0,
                isActive: isActive === undefined ? true : String(isActive) === 'true'
            });

            req.api_data = result;
            req.api_message = "Special Collection created successfully";
            next();
        } catch (error) {
            console.error("Add Special Collection Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    // 2. List Special Collections
    async listSpecialCollections(req, res, next) {
        try {
            await db.checkTableExists('tblspecialcollections', specialCollectionSchema);
            const filter = { ...req.body };

            if (filter.sort) delete filter.sort;

            // Use populate through mongoose context to join category data
            const mongoose = (await import('mongoose')).default;
            const SpecialCollection = mongoose.models.tblspecialcollections || mongoose.model('tblspecialcollections', specialCollectionSchema);

            // Need to ensure category schema is loaded to populate
            await import('../schema/category.js');

            const data = await SpecialCollection.find(filter)
                .populate('categoryId', 'name slug')
                .sort({ order: 1, createdAt: -1 })
                .lean();

            req.api_data = data;
            next();
        } catch (error) {
            console.error("List Special Collection Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    // 3. Update Special Collection
    async updateSpecialCollection(req, res, next) {
        try {
            const { id, title, categoryId, maxPrice, order, isActive } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "ID is required" };
                return next();
            }

            await db.checkTableExists('tblspecialcollections', specialCollectionSchema);
            const existingArray = await db.fetchdata({ _id: id }, 'tblspecialcollections', specialCollectionSchema);
            if (!existingArray || existingArray.length === 0) {
                req.api_error = { statusCode: 404, message: "Special Collection not found" };
                return next();
            }
            const existingCol = existingArray[0];

            const updateFields = {};
            if (title !== undefined) updateFields.title = title;
            if (categoryId !== undefined) updateFields.categoryId = categoryId;
            if (maxPrice !== undefined) updateFields.maxPrice = Number(maxPrice);
            if (order !== undefined) updateFields.order = Number(order);
            if (isActive !== undefined) updateFields.isActive = String(isActive) === 'true';

            // Handle Image Update
            if (req.files && req.files.image && req.files.image.length > 0) {
                const newImage = req.files.image[0];
                if (existingCol.image && existingCol.image.public_id) {
                    await deleteImage(existingCol.image.public_id);
                }
                updateFields.image = { public_id: newImage.filename, url: newImage.path };
            }

            updateFields.updatedAt = new Date().toISOString();

            const result = await db.executdata('tblspecialcollections', specialCollectionSchema, 'u', {
                condition: { _id: id },
                update: updateFields
            });

            req.api_data = result;
            req.api_message = "Special Collection updated successfully";
            next();
        } catch (error) {
            console.error("Update Special Collection Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    // 4. Delete Special Collection
    async deleteSpecialCollection(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "ID is required" };
                return next();
            }

            await db.checkTableExists('tblspecialcollections', specialCollectionSchema);
            const existingArray = await db.fetchdata({ _id: id }, 'tblspecialcollections', specialCollectionSchema);

            if (existingArray && existingArray.length > 0) {
                const existingCol = existingArray[0];
                if (existingCol.image && existingCol.image.public_id) {
                    await deleteImage(existingCol.image.public_id);
                }
            }

            const result = await db.executdata('tblspecialcollections', specialCollectionSchema, 'd', { _id: id });

            req.api_data = result;
            req.api_message = "Special Collection deleted successfully";
            next();
        } catch (error) {
            console.error("Delete Special Collection Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }
}

export default new SpecialCollectionController();
