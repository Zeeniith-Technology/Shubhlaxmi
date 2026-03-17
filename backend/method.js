import mongoose from 'mongoose';

class DatabaseMethods {
    /**
     * Check if a table (collection) exists, and create it if it doesn't.
     * @param {String} tablename - The name of the collection/model
     * @param {Object} schema - The mongoose schema
     * @returns {Promise<Boolean>} True if it existed or was created successfully
     */
    async checkTableExists(tablename, schema) {
        try {
            // Register model if not already registered
            const Model = mongoose.models[tablename] || mongoose.model(tablename, schema);

            // In MongoDB, collections are created implicitly when the first document is inserted,
            // but we can explicitly create it using the db connection to ensure it exists.
            const collections = await mongoose.connection.db.listCollections({ name: tablename }).toArray();

            if (collections.length === 0) {
                await mongoose.connection.db.createCollection(tablename);
                console.log(`Collection '${tablename}' created successfully.`);
            }
            return true;
        } catch (error) {
            console.error(`Error checking/creating table '${tablename}':`, error);
            throw error;
        }
    }

    /**
     * Fetch Data from Database
     * @param {Object} data - The query filters
     * @param {String} tablename - The name of the collection/model
     * @param {Object} schema - The mongoose schema
     * @param {Array} pipeline - Aggregation pipeline array (if aggregation is true)
     * @param {Boolean} aggregation - Whether to use aggregation or regular find
     * @param {Object} projection - Fields to include/exclude
     * @returns {Promise<Array>}
     */
    async fetchdata(data = {}, tablename, schema, pipeline = [], aggregation = false, projection = {}) {
        try {
            // Get existing model or compile a new one
            const Model = mongoose.models[tablename] || mongoose.model(tablename, schema);

            if (aggregation && pipeline.length > 0) {
                return await Model.aggregate(pipeline);
            } else {
                return await Model.find(data, projection);
            }
        } catch (error) {
            console.error(`Error in fetchdata (${tablename}):`, error);
            throw error;
        }
    }

    /**
     * Execute CUD (Create, Update, Delete) Data in Database
     * @param {String} tablename - The name of the collection/model
     * @param {Object} schema - The mongoose schema
     * @param {String} action - 'i' for insert, 'u' for update, 'd' for delete
     * @param {Object} data - The payload (For insert: body. For update/delete: { condition: {}, update: {} })
     * @returns {Promise<Object>}
     */
    async executdata(tablename, schema, action, data) {
        try {
            // Get existing model or compile a new one
            const Model = mongoose.models[tablename] || mongoose.model(tablename, schema);

            switch (action.toLowerCase()) {
                case 'i': // Insert
                    const newDocument = new Model(data);
                    return await newDocument.save();

                case 'u': // Update
                    // Assuming data payload for update contains { condition: {...}, update: {...} }
                    if (!data.condition || !data.update) {
                        throw new Error("For update ('u'), data must include both 'condition' and 'update' objects.");
                    }
                    return await Model.updateMany(data.condition, data.update);

                case 'd': // Delete
                    // Assuming data contains the condition to delete, e.g. { _id: "..." }
                    return await Model.deleteMany(data.condition || data);

                default:
                    throw new Error("Invalid action type. Expected 'i' (insert), 'u' (update), or 'd' (delete).");
            }
        } catch (error) {
            console.error(`Error in executdata (${tablename}, Action: ${action}):`, error);
            throw error;
        }
    }
}

export default new DatabaseMethods();
