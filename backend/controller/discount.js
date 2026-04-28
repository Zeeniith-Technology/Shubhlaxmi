import db from '../method.js';
import discountSchema from '../schema/discount.js';

class DiscountController {

    async addDiscount(req, res, next) {
        try {
            const { name, targetType, targetIds, discountType, value, startDate, endDate, isActive } = req.body;
            
            // Required field check
            if (!name || !name.trim() || !targetType || !discountType || value === undefined || !startDate || !endDate) {
                req.api_error = { statusCode: 400, message: "Missing required fields: name, targetType, discountType, value, startDate, endDate" };
                return next();
            }

            // Value bounds check
            const numValue = Number(value);
            if (isNaN(numValue) || numValue <= 0) {
                req.api_error = { statusCode: 400, message: "Discount value must be a positive number" };
                return next();
            }
            if (discountType === 'Percentage' && numValue > 100) {
                req.api_error = { statusCode: 400, message: "Percentage discount cannot exceed 100%" };
                return next();
            }

            // Date logic check
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                req.api_error = { statusCode: 400, message: "Invalid date format for startDate or endDate" };
                return next();
            }
            if (end <= start) {
                req.api_error = { statusCode: 400, message: "endDate must be after startDate" };
                return next();
            }

            // Specific target must have at least 1 id
            const validatedTargetIds = Array.isArray(targetIds) ? targetIds : [];
            if (targetType !== 'All' && validatedTargetIds.length === 0) {
                req.api_error = { statusCode: 400, message: `targetIds must contain at least 1 ID when targetType is '${targetType}'` };
                return next();
            }

            await db.checkTableExists('tbldiscounts', discountSchema);
            const result = await db.executdata('tbldiscounts', discountSchema, 'i', {
                name: name.trim(),
                targetType,
                targetIds: validatedTargetIds,
                discountType,
                value: numValue,
                startDate: start,
                endDate: end,
                isActive: isActive !== undefined ? isActive : true
            });

            req.api_data = result;
            req.api_message = "Discount created successfully";
            next();
        } catch (error) {
            console.error("Add Discount error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    async listDiscounts(req, res, next) {
        try {
            await db.checkTableExists('tbldiscounts', discountSchema);
            const data = await db.fetchdata(req.body || {}, 'tbldiscounts', discountSchema);
            req.api_data = data;
            next();
        } catch (error) {
            console.error("List Discount error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    async updateDiscount(req, res, next) {
        try {
            const { id, value, startDate, endDate, discountType, targetType, targetIds, ...rest } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "Discount ID is required" };
                return next();
            }

            const updateFields = { ...rest };

            // Re-validate value if provided
            if (value !== undefined) {
                const numValue = Number(value);
                if (isNaN(numValue) || numValue <= 0) {
                    req.api_error = { statusCode: 400, message: "Discount value must be a positive number" };
                    return next();
                }
                const resolvedType = discountType || rest.discountType;
                if (resolvedType === 'Percentage' && numValue > 100) {
                    req.api_error = { statusCode: 400, message: "Percentage discount cannot exceed 100%" };
                    return next();
                }
                updateFields.value = numValue;
            }

            // Re-validate dates if provided
            if (startDate || endDate) {
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                if (start && isNaN(start.getTime())) {
                    req.api_error = { statusCode: 400, message: "Invalid startDate format" };
                    return next();
                }
                if (end && isNaN(end.getTime())) {
                    req.api_error = { statusCode: 400, message: "Invalid endDate format" };
                    return next();
                }
                if (start && end && end <= start) {
                    req.api_error = { statusCode: 400, message: "endDate must be after startDate" };
                    return next();
                }
                if (start) updateFields.startDate = start;
                if (end) updateFields.endDate = end;
            }

            if (discountType) updateFields.discountType = discountType;
            if (targetType) updateFields.targetType = targetType;
            if (targetIds !== undefined) updateFields.targetIds = Array.isArray(targetIds) ? targetIds : [];

            await db.checkTableExists('tbldiscounts', discountSchema);
            const result = await db.executdata('tbldiscounts', discountSchema, 'u', {
                condition: { _id: id },
                update: updateFields
            });

            req.api_data = result;
            req.api_message = "Discount updated successfully";
            next();
        } catch (error) {
            console.error("Update Discount error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    async deleteDiscount(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "Discount ID is required" };
                return next();
            }

            await db.checkTableExists('tbldiscounts', discountSchema);
            const result = await db.executdata('tbldiscounts', discountSchema, 'd', { _id: id });

            req.api_data = result;
            req.api_message = "Discount deleted successfully";
            next();
        } catch (error) {
            console.error("Delete Discount error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }

    async bulkDeleteDiscounts(req, res, next) {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                req.api_error = { statusCode: 400, message: "Array of ids is required" };
                return next();
            }

            await db.checkTableExists('tbldiscounts', discountSchema);
            const result = await db.executdata('tbldiscounts', discountSchema, 'd', { _id: { $in: ids } });

            req.api_data = result;
            req.api_message = "Discounts deleted successfully";
            next();
        } catch (error) {
            console.error("Bulk Delete Discount error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error" };
            next();
        }
    }
}

export default new DiscountController();
