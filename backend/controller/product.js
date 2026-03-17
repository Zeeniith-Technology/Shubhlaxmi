import db from '../method.js';
import productSchema from '../schema/product.js';
import { cloudinary, deleteImage } from '../config/cloudinary.js';

class ProductController {

    // 1. Add Product
    async addproduct(req, res, next) {
        try {
            const {
                title, description, price, compareAtPrice, sku, stock, sectionId, categoryId, isFeatured,
                variants, attributes, customizationOptions, seo
            } = req.body;

            if (!title || !price || !sectionId || !categoryId) {
                req.api_error = { statusCode: 400, message: "Title, price, sectionId, and categoryId are required." };
                return next();
            }

            // Auto-generate slug
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

            // Process uploaded images from Multer/Cloudinary
            let images = [];
            if (req.files && req.files.length > 0) {
                images = req.files.map(file => ({
                    url: file.path,
                    publicId: file.filename
                }));
            }

            // Helper to parse JSON arrays sent as strings (e.g., from FormData)
            const parseJSONField = (field) => {
                if (!field) return [];
                if (typeof field === 'string') {
                    try { return JSON.parse(field); } catch (e) { return []; }
                }
                return Array.isArray(field) ? field : [field];
            };

            const parsedVariants = parseJSONField(variants);
            const parsedAttributes = parseJSONField(attributes);
            const parsedCustomizationOptions = parseJSONField(customizationOptions);
            const parsedSeo = typeof seo === 'string' ? JSON.parse(seo || '{}') : (seo || {});

            await db.checkTableExists('tblproducts', productSchema);
            const result = await db.executdata('tblproducts', productSchema, 'i', {
                title,
                slug,
                description: description || '',
                price: Number(price),
                compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
                sku: sku || '',
                stock: stock ? Number(stock) : 0,
                sectionId,
                categoryId,
                images,
                variants: parsedVariants,
                attributes: parsedAttributes,
                customizationOptions: parsedCustomizationOptions,
                seo: parsedSeo,
                isFeatured: isFeatured === 'true' || isFeatured === true
            });

            req.api_data = result;
            req.api_message = "Product added successfully";
            next();

        } catch (error) {
            console.error("Add Product error:", error);
            if (error.code === 11000) {
                req.api_error = { statusCode: 400, message: "Product with this title already exists." };
            } else {
                req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            }
            next();
        }
    }

    // 2. List Products
    async listproduct(req, res, next) {
        try {
            await db.checkTableExists('tblproducts', productSchema);
            const filter = req.body || {};

            const data = await db.fetchdata(filter, 'tblproducts', productSchema);

            req.api_data = data;
            next();

        } catch (error) {
            console.error("List Product error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }

    // 3. Update Product
    async updateproduct(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "ID is required in body" };
                return next();
            }

            // Auto-generate new slug if title is changing
            if (req.body.title && !req.body.slug) {
                req.body.slug = req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }

            // Process new uploaded images
            let newImages = [];
            if (req.files && req.files.length > 0) {
                newImages = req.files.map(file => ({
                    url: file.path,
                    publicId: file.filename
                }));
            }

            await db.checkTableExists('tblproducts', productSchema);
            const { id: _, ...updateFields } = req.body;

            // Parse JSON fields if sent as strings (e.g., from FormData)
            ['variants', 'attributes', 'customizationOptions'].forEach(field => {
                if (updateFields[field] && typeof updateFields[field] === 'string') {
                    try { updateFields[field] = JSON.parse(updateFields[field]); } catch (e) { /* keep as-is */ }
                }
            });
            if (updateFields.seo && typeof updateFields.seo === 'string') {
                try { updateFields.seo = JSON.parse(updateFields.seo); } catch (e) { }
            }

            // If new images uploaded, we replace the existing images
            if (newImages.length > 0) {
                // Determine existing product to delete old images from Cloudinary
                const existingProductArray = await db.fetchdata({ _id: id }, 'tblproducts', productSchema);
                if (existingProductArray && existingProductArray.length > 0) {
                    const existingProd = existingProductArray[0];
                    if (existingProd.images && existingProd.images.length > 0) {
                        for (const img of existingProd.images) {
                            if (img.publicId) {
                                try { await deleteImage(img.publicId); } catch (e) { /* ignore */ }
                            }
                        }
                    }
                }

                updateFields.images = newImages; // Replace instead of pushing
            }

            const result = await db.executdata('tblproducts', productSchema, 'u', {
                condition: { _id: id },
                update: updateFields
            });

            req.api_data = result;
            req.api_message = "Product updated successfully";
            next();

        } catch (error) {
            console.error("Update Product error:", error);
            if (error.code === 11000) {
                req.api_error = { statusCode: 400, message: "Product with this title already exists." };
            } else {
                req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            }
            next();
        }
    }

    // 4. Delete Product
    async deleteproduct(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "ID is required in body" };
                return next();
            }

            await db.checkTableExists('tblproducts', productSchema);

            // Fetch product first to delete images from Cloudinary
            const products = await db.fetchdata({ _id: id }, 'tblproducts', productSchema);
            if (products.length > 0 && products[0].images) {
                for (const img of products[0].images) {
                    if (img.publicId) {
                        try {
                            await deleteImage(img.publicId);
                        } catch (cloudErr) {
                            console.error("Cloudinary delete error:", cloudErr);
                        }
                    }
                }
            }

            const result = await db.executdata('tblproducts', productSchema, 'd', { _id: id });

            req.api_data = result;
            req.api_message = "Product deleted successfully";
            next();

        } catch (error) {
            console.error("Delete Product error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }

    // 5. Bulk Add Products — body: { items: [{ title, price, sectionId, categoryId }, ...] }
    async bulkaddproduct(req, res, next) {
        try {
            const { items } = req.body;
            if (!items || !Array.isArray(items) || items.length === 0) {
                req.api_error = { statusCode: 400, message: "items array is required" };
                return next();
            }

            await db.checkTableExists('tblproducts', productSchema);
            const results = [];
            const errors = [];

            for (let i = 0; i < items.length; i++) {
                try {
                    const item = items[i];
                    if (!item.title || !item.price || !item.sectionId || !item.categoryId) {
                        errors.push({ index: i, error: "title, price, sectionId, categoryId required" });
                        continue;
                    }
                    item.slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    item.price = Number(item.price);
                    if (item.compareAtPrice) item.compareAtPrice = Number(item.compareAtPrice);
                    if (item.stock) item.stock = Number(item.stock);
                    const result = await db.executdata('tblproducts', productSchema, 'i', item);
                    results.push(result);
                } catch (err) {
                    errors.push({ index: i, title: items[i].title, error: err.message });
                }
            }

            req.api_data = { inserted: results, errors };
            req.api_message = `${results.length} products added, ${errors.length} failed`;
            next();

        } catch (error) {
            console.error("Bulk Add Product error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }

    // 6. Bulk Update Products — body: { items: [{ id, title, price }, ...] }
    async bulkupdateproduct(req, res, next) {
        try {
            const { items } = req.body;
            if (!items || !Array.isArray(items) || items.length === 0) {
                req.api_error = { statusCode: 400, message: "items array is required" };
                return next();
            }

            await db.checkTableExists('tblproducts', productSchema);
            const results = [];
            const errors = [];

            for (let i = 0; i < items.length; i++) {
                try {
                    const { id, ...updateFields } = items[i];
                    if (!id) { errors.push({ index: i, error: "ID missing" }); continue; }
                    if (updateFields.title && !updateFields.slug) {
                        updateFields.slug = updateFields.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    }
                    const result = await db.executdata('tblproducts', productSchema, 'u', {
                        condition: { _id: id },
                        update: updateFields
                    });
                    results.push(result);
                } catch (err) {
                    errors.push({ index: i, id: items[i].id, error: err.message });
                }
            }

            req.api_data = { updated: results.length, errors };
            req.api_message = `${results.length} products updated, ${errors.length} failed`;
            next();

        } catch (error) {
            console.error("Bulk Update Product error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }

    // 7. Bulk Delete Products — body: { ids: ["id1", "id2"] }
    async bulkdeleteproduct(req, res, next) {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                req.api_error = { statusCode: 400, message: "ids array is required" };
                return next();
            }

            await db.checkTableExists('tblproducts', productSchema);

            // Delete images from Cloudinary for each product
            const products = await db.fetchdata({ _id: { $in: ids } }, 'tblproducts', productSchema);
            for (const prod of products) {
                if (prod.images) {
                    for (const img of prod.images) {
                        if (img.publicId) {
                            try { await deleteImage(img.publicId); } catch (e) { /* skip */ }
                        }
                    }
                }
            }

            const result = await db.executdata('tblproducts', productSchema, 'd', { _id: { $in: ids } });

            req.api_data = result;
            req.api_message = `${result.deletedCount || 0} products deleted`;
            next();

        } catch (error) {
            console.error("Bulk Delete Product error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }
}

export default ProductController;
