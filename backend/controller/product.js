import db from '../method.js';
import productSchema from '../schema/product.js';
import discountSchema from '../schema/discount.js';
import { cloudinary, deleteImage } from '../config/cloudinary.js';
import mongoose from 'mongoose';

const toObjectId = (id) => {
    try { return new mongoose.Types.ObjectId(String(id)); } catch { return id; }
};

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

            // Numeric validation
            const numPrice = Number(price);
            const numStock = stock !== undefined ? Number(stock) : 0;
            if (isNaN(numPrice) || numPrice <= 0) {
                req.api_error = { statusCode: 400, message: "Price must be a positive number" };
                return next();
            }
            if (isNaN(numStock) || numStock < 0) {
                req.api_error = { statusCode: 400, message: "Stock cannot be negative" };
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
                price: numPrice,
                compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
                sku: sku || '',
                stock: numStock,
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

    // Helper to dynamically apply active discounts
    async applyDiscounts(products) {
        if (!products || products.length === 0) return products;

        const now = new Date();
        // Fetch all active discounts that are currently valid
        const activeDiscounts = await db.fetchdata({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }, 'tbldiscounts', discountSchema);

        if (activeDiscounts.length === 0) return products;

        return products.map(product => {
            let maxDiscountAmount = 0;
            let appliedDiscount = null;
            const prodPrice = Number(product.price) || 0;

            activeDiscounts.forEach(discount => {
                let isApplicable = false;

                if (discount.targetType === 'All') {
                    isApplicable = true;
                } else if (discount.targetType === 'Category' && product.categoryId) {
                    const catId = typeof product.categoryId === 'object' ? product.categoryId._id : product.categoryId;
                    if (discount.targetIds.map(id => id.toString()).includes(catId?.toString())) isApplicable = true;
                } else if (discount.targetType === 'Section' && product.sectionId) {
                    const secId = typeof product.sectionId === 'object' ? product.sectionId._id : product.sectionId;
                    if (discount.targetIds.map(id => id.toString()).includes(secId?.toString())) isApplicable = true;
                } else if (discount.targetType === 'Product') {
                    if (discount.targetIds.map(id => id.toString()).includes(product._id?.toString())) isApplicable = true;
                }

                if (isApplicable) {
                    let discountAmount = 0;
                    if (discount.discountType === 'Percentage') {
                        discountAmount = (prodPrice * discount.value) / 100;
                    } else if (discount.discountType === 'Flat') {
                        discountAmount = discount.value;
                    }

                    if (discountAmount > maxDiscountAmount) {
                        maxDiscountAmount = discountAmount;
                        appliedDiscount = discount;
                    }
                }
            });

            if (maxDiscountAmount > 0 && appliedDiscount) {
                const newPrice = Math.max(0, prodPrice - maxDiscountAmount);
                // If compareAtPrice doesn't exist or is lower, use the original price
                const compareAt = (product.compareAtPrice && Number(product.compareAtPrice) > prodPrice) ? Number(product.compareAtPrice) : prodPrice;
                
                // Apply discount to variants if they exist
                let updatedVariants = product.variants;
                if (product.variants && Array.isArray(product.variants)) {
                    updatedVariants = product.variants.map(v => {
                        const vPrice = Number(v.price) || 0;
                        if (vPrice <= 0) return v;

                        let vDiscountAmount = 0;
                        if (appliedDiscount.discountType === 'Percentage') {
                            vDiscountAmount = (vPrice * appliedDiscount.value) / 100;
                        } else if (appliedDiscount.discountType === 'Flat') {
                            vDiscountAmount = appliedDiscount.value;
                        }

                        const newVPrice = Math.max(0, vPrice - vDiscountAmount);
                        const vCompareAt = (v.compareAtPrice && Number(v.compareAtPrice) > vPrice) ? Number(v.compareAtPrice) : vPrice;

                        return {
                            ...(v._doc || v),
                            price: newVPrice,
                            compareAtPrice: vCompareAt,
                            originalPrice: vPrice
                        };
                    });
                }

                return {
                    ...(product._doc || product),
                    price: newPrice,
                    compareAtPrice: compareAt,
                    originalPrice: prodPrice,
                    variants: updatedVariants
                };
            }

            return product;
        });
    }

    // 2. List Products
    async listproduct(req, res, next) {
        try {
            await db.checkTableExists('tblproducts', productSchema);
            const { categoryId, sectionId, minPrice, maxPrice, sort, search, ids, ...rest } = req.body || {};

            let filter = {}; // Do NOT spread rest — it can introduce invalid Mongo fields

            // Cast IDs to ObjectId so aggregation $match works correctly
            if (categoryId) filter.categoryId = toObjectId(categoryId);
            if (sectionId)  filter.sectionId  = toObjectId(sectionId);

            if (ids && Array.isArray(ids) && ids.length > 0) {
                filter._id = { $in: ids.map(toObjectId) };
            }

            // Price filtering
            if (minPrice !== undefined || maxPrice !== undefined) {
                filter.price = {};
                if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
                if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
            }

            if (search) {
                filter.title = { $regex: search, $options: 'i' };
            }

            // Sort logic
            let sortQuery = {};
            if (sort === "price-asc") sortQuery.price = 1;
            else if (sort === "price-desc") sortQuery.price = -1;
            else if (sort === "newest") sortQuery.createdAt = -1;
            else if (sort === "title-asc") sortQuery.title = 1;
            else if (sort === "title-desc") sortQuery.title = -1;
            else sortQuery.createdAt = -1; // default featured/newest

            const pipeline = [
                { $match: filter },
                {
                    $lookup: {
                        from: 'tblcategories',
                        localField: 'categoryId',
                        foreignField: '_id',
                        as: 'categoryId'
                    }
                },
                {
                    $unwind: {
                        path: '$categoryId',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'tblsections',
                        localField: 'sectionId',
                        foreignField: '_id',
                        as: 'sectionId'
                    }
                },
                {
                    $unwind: {
                        path: '$sectionId',
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $sort: sortQuery }
            ];

            const data = await db.fetchdata(filter, 'tblproducts', productSchema, pipeline, true);
            
            // Re-instantiate controller if 'this' is unbound (Express router behavior)
            const controller = this && this.applyDiscounts ? this : new ProductController();
            let discountedData = await controller.applyDiscounts(data);

            // Re-apply price filter on discounted prices (discount may have changed product.price)
            if (minPrice !== undefined || maxPrice !== undefined) {
                discountedData = discountedData.filter(p => {
                    const price = Number(p.price) || 0;
                    if (minPrice !== undefined && price < Number(minPrice)) return false;
                    if (maxPrice !== undefined && price > Number(maxPrice)) return false;
                    return true;
                });
            }

            req.api_data = discountedData;
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
            if (!products || products.length === 0) {
                req.api_error = { statusCode: 404, message: "Product not found" };
                return next();
            }

            if (products[0].images) {
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
