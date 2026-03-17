import db from '../method.js';
import errorLogSchema from '../schema/errorlog.js';

const responsedata = async (req, res) => {
    try {
        // If controller flagged an error, handle it
        if (req.api_error) {
            const statusCode = req.api_error.statusCode || 500;
            const message = req.api_error.message || "Something went wrong";

            // Store error in database if it's a server error (500+)
            if (statusCode >= 500) {
                try {
                    await db.checkTableExists('tblerrorlogs', errorLogSchema);
                    await db.executdata('tblerrorlogs', errorLogSchema, 'i', {
                        endpoint: req.originalUrl,
                        method: req.method,
                        statusCode: statusCode,
                        errorMessage: message,
                        errorStack: req.api_error.stack || '',
                        requestBody: JSON.stringify(req.body || {}),
                        userId: req.user ? req.user.id : null
                    });
                } catch (logError) {
                    console.error("[ResponseData] Failed to log error to DB:", logError);
                }
            }

            return res.status(statusCode).json({
                success: false,
                message: message
            });
        }

        // Success response
        const data = req.api_data !== undefined ? req.api_data : {};
        const message = req.api_message || "Success";

        return res.status(200).json({
            success: true,
            message: message,
            data: data
        });

    } catch (err) {
        console.error("[ResponseData] Critical error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export default responsedata;
