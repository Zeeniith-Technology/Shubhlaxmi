import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ success: false, message: "Authentication required. Missing token." });
        }

        const token = authHeader.split(' ')[1]; // Format: "Bearer <token>"
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required. Malformed token." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        req.user = decoded; // attach user payload to request

        next();
    } catch (error) {
        console.error("Auth middleware error:", error.message);
        return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }
};

export default auth;
