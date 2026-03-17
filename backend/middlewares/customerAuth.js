import jwt from 'jsonwebtoken';
import User from '../schema/user.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

const authCustomer = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || (!user.isActive)) {
            return res.status(401).json({ success: false, message: 'User not found or inactive' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

export default authCustomer;
