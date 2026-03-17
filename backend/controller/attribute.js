import db from '../method.js';
import attributeSchema from '../schema/attribute.js';

class AttributeController {

    // 1. Add Attribute
    async addattribute(req, res, next) {
        try {
            const { name, values, isActive } = req.body;
            if (!name) {
                req.api_error = { statusCode: 400, message: "Attribute name is required" };
                return next();
            }

            await db.checkTableExists('tblattributes', attributeSchema);

            // Check if attribute already exists (case-insensitive)
            const existing = await db.fetchdata({ name: { $regex: new RegExp(`^${name}$`, 'i') } }, 'tblattributes', attributeSchema);
            if (existing && existing.length > 0) {
                req.api_error = { statusCode: 400, message: `Attribute '${name}' already exists.` };
                return next();
            }

            const result = await db.executdata('tblattributes', attributeSchema, 'i', {
                name,
                values: values || [],
                isActive: isActive === undefined ? true : isActive
            });

            req.api_data = result;
            req.api_message = "Attribute created successfully";
            next();
        } catch (error) {
            console.error("Add Attribute Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    // 2. List Attributes
    async listattribute(req, res, next) {
        try {
            await db.checkTableExists('tblattributes', attributeSchema);
            const filter = req.body || {};
            const data = await db.fetchdata(filter, 'tblattributes', attributeSchema);
            req.api_data = data;
            next();
        } catch (error) {
            console.error("List Attribute Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    // 3. Update Attribute
    async updateattribute(req, res, next) {
        try {
            const { id, name, values, isActive } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "ID is required" };
                return next();
            }

            await db.checkTableExists('tblattributes', attributeSchema);
            const updateFields = {};

            if (name !== undefined) {
                // Check if new name conflicts with a different attribute
                const existing = await db.fetchdata({ name: { $regex: new RegExp(`^${name}$`, 'i') } }, 'tblattributes', attributeSchema);
                if (existing && existing.length > 0) {
                    // If it exists but it's not THIS attribute, reject it
                    const conflict = existing.find(attr => attr._id.toString() !== id);
                    if (conflict) {
                        req.api_error = { statusCode: 400, message: `Attribute with name '${name}' already exists.` };
                        return next();
                    }
                }
                updateFields.name = name;
            }

            if (values !== undefined) updateFields.values = values;
            if (isActive !== undefined) updateFields.isActive = isActive;
            updateFields.updatedAt = new Date().toISOString();

            const result = await db.executdata('tblattributes', attributeSchema, 'u', {
                condition: { _id: id },
                update: updateFields
            });

            req.api_data = result;
            req.api_message = "Attribute updated successfully";
            next();
        } catch (error) {
            console.error("Update Attribute Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    // 4. Delete Attribute
    async deleteattribute(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "ID is required" };
                return next();
            }

            await db.checkTableExists('tblattributes', attributeSchema);
            const result = await db.executdata('tblattributes', attributeSchema, 'd', { _id: id });

            req.api_data = result;
            req.api_message = "Attribute deleted successfully";
            next();
        } catch (error) {
            console.error("Delete Attribute Error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }
}

export default new AttributeController();
