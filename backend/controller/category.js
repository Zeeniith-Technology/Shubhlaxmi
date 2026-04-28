import db from '../method.js';
import categorySchema from '../schema/category.js';
import { deleteImage } from '../config/cloudinary.js';

class CategoryController {

    // 1. Add Category
    async addcategory(req, res, next) {
        try {
            if (!req.body.name || !req.body.name.trim()) {
                req.api_error = { statusCode: 400, message: "Category name is required" };
                return next();
            }

            if (req.body.name && !req.body.slug) {
                req.body.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }

            await db.checkTableExists('tblcategories', categorySchema);

            // Handle image upload from Multer/Cloudinary
            if (req.file) {
                req.body.image = {
                    url: req.file.path,
                    publicId: req.file.filename
                };
            }

            const result = await db.executdata('tblcategories', categorySchema, 'i', req.body);

            req.api_data = result;
            req.api_message = "Category added successfully";
            next();

        } catch (error) {
            console.error("Add Category error:", error);
            if (error.code === 11000) {
                req.api_error = { statusCode: 400, message: "Category with this name or slug already exists." };
            } else {
                req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            }
            next();
        }
    }

    // 2. List Category
    async listcategory(req, res, next) {
        try {
            await db.checkTableExists('tblcategories', categorySchema);
            const filter = req.body || {};

            const data = await db.fetchdata(filter, 'tblcategories', categorySchema);

            req.api_data = data;
            next();

        } catch (error) {
            console.error("List Category error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }

    // 3. Update Category
    async updatecategory(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "ID is required in body" };
                return next();
            }

            if (req.body.name && !req.body.slug) {
                req.body.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }

            await db.checkTableExists('tblcategories', categorySchema);
            const { id: _, ...updateFields } = req.body;

            // Handle image upload from Multer/Cloudinary
            if (req.file) {
                // Determine existing category to delete old image
                const existingCategoryArray = await db.fetchdata({ _id: id }, 'tblcategories', categorySchema);
                if (existingCategoryArray && existingCategoryArray.length > 0) {
                    const existingCat = existingCategoryArray[0];
                    if (existingCat.image && existingCat.image.publicId) {
                        try { await deleteImage(existingCat.image.publicId); } catch (e) { /* ignore */ }
                    }
                }

                updateFields.image = {
                    url: req.file.path,
                    publicId: req.file.filename
                };
            }

            const result = await db.executdata('tblcategories', categorySchema, 'u', {
                condition: { _id: id },
                update: updateFields
            });

            req.api_data = result;
            req.api_message = "Category updated successfully";
            next();

        } catch (error) {
            console.error("Update Category error:", error);
            if (error.code === 11000) {
                req.api_error = { statusCode: 400, message: "Category with this name or slug already exists." };
            } else {
                req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            }
            next();
        }
    }

    // 4. Delete Category
    async deletecategory(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "ID is required in body" };
                return next();
            }

            await db.checkTableExists('tblcategories', categorySchema);

            // Determine if the category had an image, if so delete from Cloudinary
            const existingCategoryArray = await db.fetchdata({ _id: id }, 'tblcategories', categorySchema);
            if (!existingCategoryArray || existingCategoryArray.length === 0) {
                req.api_error = { statusCode: 404, message: "Category not found" };
                return next();
            }

            const existingCat = existingCategoryArray[0];
            if (existingCat.image && existingCat.image.publicId) {
                try { await deleteImage(existingCat.image.publicId); } catch (e) { /* ignore */ }
            }

            const result = await db.executdata('tblcategories', categorySchema, 'd', { _id: id });

            req.api_data = result;
            req.api_message = "Category deleted successfully";
            next();

        } catch (error) {
            console.error("Delete Category error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }

    // 5. Bulk Add Categories — body: { items: [{ name, sectionId }, ...] }
    async bulkaddcategory(req, res, next) {
        try {
            let { items } = req.body;
            if (typeof items === 'string') {
                try { items = JSON.parse(items); } catch (e) { }
            }
            if (!items || !Array.isArray(items) || items.length === 0) {
                req.api_error = { statusCode: 400, message: "items array is required" };
                return next();
            }

            await db.checkTableExists('tblcategories', categorySchema);
            const results = [];
            const errors = [];

            for (let i = 0; i < items.length; i++) {
                try {
                    if (items[i].name && !items[i].slug) {
                        items[i].slug = items[i].name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    }
                    
                    // Handle image upload mapping (field name expected to be image_0, image_1, etc.)
                    if (req.files && Array.isArray(req.files)) {
                        const file = req.files.find(f => f.fieldname === `image_${i}`);
                        if (file) {
                            items[i].image = { url: file.path, publicId: file.filename };
                        }
                    }

                    const result = await db.executdata('tblcategories', categorySchema, 'i', items[i]);
                    results.push(result);
                } catch (err) {
                    errors.push({ index: i, name: items[i].name, error: err.message });
                }
            }

            req.api_data = { inserted: results, errors };
            req.api_message = `${results.length} categories added, ${errors.length} failed`;
            next();

        } catch (error) {
            console.error("Bulk Add Category error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }

    // 6. Bulk Update Categories — body: { items: [{ id, name }, ...] }
    async bulkupdatecategory(req, res, next) {
        try {
            let { items } = req.body;
            if (typeof items === 'string') {
                try { items = JSON.parse(items); } catch (e) { }
            }
            if (!items || !Array.isArray(items) || items.length === 0) {
                req.api_error = { statusCode: 400, message: "items array is required" };
                return next();
            }

            await db.checkTableExists('tblcategories', categorySchema);
            const results = [];
            const errors = [];

            for (let i = 0; i < items.length; i++) {
                try {
                    const { id, ...updateFields } = items[i];
                    if (!id) { errors.push({ index: i, error: "ID missing" }); continue; }
                    if (updateFields.name && !updateFields.slug) {
                        updateFields.slug = updateFields.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    }

                    // Handle image upload
                    if (req.files && Array.isArray(req.files)) {
                        const file = req.files.find(f => f.fieldname === `image_${i}`);
                        if (file) {
                            // Determine existing category to delete old image
                            const existingCategoryArray = await db.fetchdata({ _id: id }, 'tblcategories', categorySchema);
                            if (existingCategoryArray && existingCategoryArray.length > 0) {
                                const existingCat = existingCategoryArray[0];
                                if (existingCat.image && existingCat.image.publicId) {
                                    try { await deleteImage(existingCat.image.publicId); } catch (e) { /* ignore */ }
                                }
                            }
                            updateFields.image = { url: file.path, publicId: file.filename };
                        }
                    }

                    const result = await db.executdata('tblcategories', categorySchema, 'u', {
                        condition: { _id: id },
                        update: updateFields
                    });
                    results.push(result);
                } catch (err) {
                    errors.push({ index: i, id: items[i].id, error: err.message });
                }
            }

            req.api_data = { updated: results.length, errors };
            req.api_message = `${results.length} categories updated, ${errors.length} failed`;
            next();

        } catch (error) {
            console.error("Bulk Update Category error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }

    // 7. Bulk Delete Categories — body: { ids: ["id1", "id2"] }
    async bulkdeletecategory(req, res, next) {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                req.api_error = { statusCode: 400, message: "ids array is required" };
                return next();
            }

            await db.checkTableExists('tblcategories', categorySchema);
            const result = await db.executdata('tblcategories', categorySchema, 'd', { _id: { $in: ids } });

            req.api_data = result;
            req.api_message = `${result.deletedCount || 0} categories deleted`;
            next();

        } catch (error) {
            console.error("Bulk Delete Category error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }
}

export default CategoryController;
