import User from '../schema/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

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
