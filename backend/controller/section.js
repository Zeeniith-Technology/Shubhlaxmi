import db from '../method.js';
import sectionSchema from '../schema/section.js';

class SectionController {

    // 1. Add Section
    async addsection(req, res, next) {
        try {
            if (req.body.name && !req.body.slug) {
                req.body.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }

            await db.checkTableExists('tblsections', sectionSchema);
            const result = await db.executdata('tblsections', sectionSchema, 'i', req.body);

            req.api_data = result;
            req.api_message = "Section added successfully";
            next();

        } catch (error) {
            console.error("Add Section error:", error);
            if (error.code === 11000) {
                req.api_error = { statusCode: 400, message: "Section with this name or slug already exists." };
            } else {
                req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            }
            next();
        }
    }

    // 2. List Section
    async listsection(req, res, next) {
        try {
            await db.checkTableExists('tblsections', sectionSchema);
            const filter = req.body || {};

            const data = await db.fetchdata(filter, 'tblsections', sectionSchema);

            req.api_data = data;
            next();

        } catch (error) {
            console.error("List Section error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }

    // 3. Update Section
    async updatesection(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "ID is required in body" };
                return next();
            }

            if (req.body.name && !req.body.slug) {
                req.body.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }

            await db.checkTableExists('tblsections', sectionSchema);
            const { id: _, ...updateFields } = req.body;

            const result = await db.executdata('tblsections', sectionSchema, 'u', {
                condition: { _id: id },
                update: updateFields
            });

            req.api_data = result;
            req.api_message = "Section updated successfully";
            next();

        } catch (error) {
            console.error("Update Section error:", error);
            if (error.code === 11000) {
                req.api_error = { statusCode: 400, message: "Section with this name or slug already exists." };
            } else {
                req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            }
            next();
        }
    }

    // 4. Delete Section
    async deletesection(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "ID is required in body" };
                return next();
            }

            await db.checkTableExists('tblsections', sectionSchema);
            const result = await db.executdata('tblsections', sectionSchema, 'd', { _id: id });

            req.api_data = result;
            req.api_message = "Section deleted successfully";
            next();

        } catch (error) {
            console.error("Delete Section error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }

    // 5. Bulk Add Sections — body: { items: [{ name: "Mens" }, { name: "Womens" }] }
    async bulkaddsection(req, res, next) {
        try {
            const { items } = req.body;
            if (!items || !Array.isArray(items) || items.length === 0) {
                req.api_error = { statusCode: 400, message: "items array is required" };
                return next();
            }

            await db.checkTableExists('tblsections', sectionSchema);
            const results = [];
            const errors = [];

            for (let i = 0; i < items.length; i++) {
                try {
                    if (items[i].name && !items[i].slug) {
                        items[i].slug = items[i].name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    }
                    const result = await db.executdata('tblsections', sectionSchema, 'i', items[i]);
                    results.push(result);
                } catch (err) {
                    errors.push({ index: i, name: items[i].name, error: err.message });
                }
            }

            req.api_data = { inserted: results, errors };
            req.api_message = `${results.length} sections added, ${errors.length} failed`;
            next();

        } catch (error) {
            console.error("Bulk Add Section error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }

    // 6. Bulk Update Sections — body: { items: [{ id: "...", name: "Updated" }, ...] }
    async bulkupdatesection(req, res, next) {
        try {
            const { items } = req.body;
            if (!items || !Array.isArray(items) || items.length === 0) {
                req.api_error = { statusCode: 400, message: "items array is required" };
                return next();
            }

            await db.checkTableExists('tblsections', sectionSchema);
            const results = [];
            const errors = [];

            for (let i = 0; i < items.length; i++) {
                try {
                    const { id, ...updateFields } = items[i];
                    if (!id) { errors.push({ index: i, error: "ID missing" }); continue; }
                    if (updateFields.name && !updateFields.slug) {
                        updateFields.slug = updateFields.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    }
                    const result = await db.executdata('tblsections', sectionSchema, 'u', {
                        condition: { _id: id },
                        update: updateFields
                    });
                    results.push(result);
                } catch (err) {
                    errors.push({ index: i, id: items[i].id, error: err.message });
                }
            }

            req.api_data = { updated: results.length, errors };
            req.api_message = `${results.length} sections updated, ${errors.length} failed`;
            next();

        } catch (error) {
            console.error("Bulk Update Section error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }

    // 7. Bulk Delete Sections — body: { ids: ["id1", "id2", ...] }
    async bulkdeletesection(req, res, next) {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                req.api_error = { statusCode: 400, message: "ids array is required" };
                return next();
            }

            await db.checkTableExists('tblsections', sectionSchema);
            const result = await db.executdata('tblsections', sectionSchema, 'd', { _id: { $in: ids } });

            req.api_data = result;
            req.api_message = `${result.deletedCount || 0} sections deleted`;
            next();

        } catch (error) {
            console.error("Bulk Delete Section error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }
}

export default SectionController;
