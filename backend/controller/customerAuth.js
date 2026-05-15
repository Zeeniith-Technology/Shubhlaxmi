import User from '../schema/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-email-password'
    }
});

export const register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            phone,
            password: hashedPassword
        });

        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: { _id: newUser._id, name: newUser.name, email: newUser.email, phone: newUser.phone }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account is deactivated' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, addresses: user.addresses }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            user: { _id: req.user._id, name: req.user.name, email: req.user.email, phone: req.user.phone, addresses: req.user.addresses }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (name) req.user.name = name;
        if (phone) req.user.phone = phone;

        await req.user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: { _id: req.user._id, name: req.user.name, email: req.user.email, phone: req.user.phone, addresses: req.user.addresses }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
    }
};

export const addAddress = async (req, res) => {
    try {
        const { name, phone, street, city, state, zipCode, country, isDefault } = req.body;

        const newAddress = { name, phone, street, city, state, zipCode, country, isDefault: isDefault || false };

        if (isDefault) {
            req.user.addresses.forEach(addr => addr.isDefault = false);
        } else if (req.user.addresses.length === 0) {
            // First address is default automatically
            newAddress.isDefault = true;
        }

        req.user.addresses.push(newAddress);
        await req.user.save();

        res.status(200).json({ success: true, message: 'Address added', addresses: req.user.addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add address', error: error.message });
    }
};

export const updateAddress = async (req, res) => {
    try {
        const { id, name, phone, street, city, state, zipCode, country, isDefault } = req.body;

        if (!id) return res.status(400).json({ success: false, message: 'Address ID required' });

        const address = req.user.addresses.id(id);
        if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

        if (isDefault) {
            req.user.addresses.forEach(addr => addr.isDefault = false);
        }

        // Update fields
        if (name !== undefined) address.name = name;
        if (phone !== undefined) address.phone = phone;
        if (street !== undefined) address.street = street;
        if (city !== undefined) address.city = city;
        if (state !== undefined) address.state = state;
        if (zipCode !== undefined) address.zipCode = zipCode;
        if (country !== undefined) address.country = country;
        if (isDefault !== undefined) address.isDefault = isDefault;

        await req.user.save();

        res.status(200).json({ success: true, message: 'Address updated', addresses: req.user.addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update address', error: error.message });
    }
};

export const deleteAddress = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) return res.status(400).json({ success: false, message: 'Address ID required' });

        const address = req.user.addresses.id(id);
        if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

        const wasDefault = address.isDefault;

        // Remove the subdocument (Mongoose method)
        address.deleteOne();

        // If we deleted the default and others remain, make the first one default
        if (wasDefault && req.user.addresses.length > 0) {
            req.user.addresses[0].isDefault = true;
        }

        await req.user.save();

        res.status(200).json({ success: true, message: 'Address deleted', addresses: req.user.addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete address', error: error.message });
    }
};

export const listUsers = async (req, res) => {
    try {
        // Exclude passwords
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            totalUsers: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    }
};

export const getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'wishlist',
            select: 'title price compareAtPrice images slug stock status isActive'
        });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            wishlist: user.wishlist
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch wishlist', error: error.message });
    }
};

export const toggleWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const wishlist = user.wishlist || [];
        const productIndex = wishlist.findIndex(id => id.toString() === productId);

        let action = '';
        if (productIndex === -1) {
            user.wishlist.push(productId);
            action = 'added';
        } else {
            user.wishlist.splice(productIndex, 1);
            action = 'removed';
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: `Product ${action} to wishlist`,
            wishlist: user.wishlist,
            action
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update wishlist', error: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ success: false, message: 'No account with that email found' });

        // Generate token
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit token
        
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Shubhlaxmi - Password Reset Request',
                text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
Your password reset token is: ${resetToken}\n\n
If you did not request this, please ignore this email and your password will remain unchanged.\n`
            });

            res.status(200).json({ success: true, message: 'An email has been sent to ' + user.email + ' with further instructions.' });
        } catch (emailErr) {
            console.error("Error sending reset email:", emailErr);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            return res.status(500).json({ success: false, message: 'Error sending email. Please try again later.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to process forgot password', error: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;
        
        if (!email || !token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email, token, and new password are required' });
        }

        const cleanToken = token.trim();
        
        const user = await User.findOne({
            email: email.toLowerCase(),
            resetPasswordToken: cleanToken,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ success: true, message: 'Your password has been successfully reset. Please log in.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
    }
};
