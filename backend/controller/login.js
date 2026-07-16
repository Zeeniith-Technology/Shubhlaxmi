import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../method.js';
import loginSchema from '../schema/login.js';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

// Configure Nodemailer securely (in production, use real environment variables)
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to your email provider
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-email-password'
    }
});

class LoginController {
    /**
     * Step 1: Request OTP for Login or Signup
     * Expects: { email, number, name }
     */
    async requestOtp(req, res) {
        try {
            const { email, number, name } = req.body;

            if (!email) {
                return res.status(400).json({ success: false, message: "Email is required." });
            }

            // Cryptographically random 6-digit OTP
            const otpCode = crypto.randomInt(100000, 1000000).toString();

            // OTP expires in 10 minutes
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);
            const now = new Date();

            // Check if user exists
            const existingUsers = await db.fetchdata({ email }, 'tblusers', loginSchema);

            if (existingUsers.length > 0) {
                // Throttle resends to one per minute
                const lastSentAt = existingUsers[0].otp?.lastSentAt;
                if (lastSentAt && (now - new Date(lastSentAt)) < OTP_RESEND_COOLDOWN_MS) {
                    return res.status(429).json({ success: false, message: "Please wait a minute before requesting another OTP." });
                }

                // User exists -> Update their OTP (attempts reset for the new code)
                await db.executdata('tblusers', loginSchema, 'u', {
                    condition: { email },
                    update: { 'otp.code': otpCode, 'otp.expiresAt': expiresAt, 'otp.attempts': 0, 'otp.lastSentAt': now }
                });
            } else {
                // New User -> Insert
                if (!name) {
                    return res.status(400).json({ success: false, message: "Name is required for new signups." });
                }

                const newUser = {
                    email,
                    number: number || '',
                    name,
                    role: 'user',
                    otp: { code: otpCode, expiresAt, attempts: 0, lastSentAt: now }
                };
                await db.executdata('tblusers', loginSchema, 'i', newUser);
            }

            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Your Shubhlaxmi Login OTP',
                    text: `Your 6-digit OTP is: ${otpCode}. It will expire in 10 minutes.`
                });
            } catch (emailError) {
                console.error("Failed to send OTP email:", emailError.message);
                return res.status(500).json({ success: false, message: "Failed to send OTP email. Please try again." });
            }

            return res.status(200).json({
                success: true,
                message: "OTP sent successfully to email"
            });

        } catch (error) {
            console.error("Request OTP error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    /**
     * Step 2: Verify OTP and Login
     * Expects: { email, otp }
     */
    async verifyOtp(req, res) {
        try {
            const { email, otp } = req.body;

            if (!email || !otp) {
                return res.status(400).json({ success: false, message: "Email and OTP are required." });
            }

            // Fetch user
            const users = await db.fetchdata({ email }, 'tblusers', loginSchema);
            if (users.length === 0) {
                return res.status(404).json({ success: false, message: "User not found." });
            }

            const user = users[0];

            if (!user.otp || !user.otp.code) {
                return res.status(401).json({ success: false, message: "No OTP requested. Please request a new one." });
            }

            // Check if OTP is expired
            if (new Date() > new Date(user.otp.expiresAt)) {
                return res.status(401).json({ success: false, message: "OTP has expired." });
            }

            // Lock out after too many wrong guesses (brute-force protection)
            if ((user.otp.attempts || 0) >= OTP_MAX_ATTEMPTS) {
                await db.executdata('tblusers', loginSchema, 'u', {
                    condition: { email },
                    update: { 'otp.code': null, 'otp.expiresAt': null, 'otp.attempts': 0 }
                });
                return res.status(429).json({ success: false, message: "Too many incorrect attempts. Please request a new OTP." });
            }

            // Validate OTP
            if (user.otp.code !== String(otp).trim()) {
                await db.executdata('tblusers', loginSchema, 'u', {
                    condition: { email },
                    update: { 'otp.attempts': (user.otp.attempts || 0) + 1 }
                });
                return res.status(401).json({ success: false, message: "Invalid OTP." });
            }

            // Clear the OTP so it can't be reused
            await db.executdata('tblusers', loginSchema, 'u', {
                condition: { email },
                update: { 'otp.code': null, 'otp.expiresAt': null, 'otp.attempts': 0 }
            });

            // Generate JWT Token (Valid for 20 days as requested)
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '20d' }
            );

            return res.status(200).json({
                success: true,
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    number: user.number,
                    role: user.role
                }
            });

        } catch (error) {
            console.error("Verify OTP error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    /**
     * Step 3: Admin Login with Email & Password
     * Expects: { email, password }
     */
    async adminLogin(req, res) {
        try {
            const { password } = req.body;
            const email = req.body.email ? req.body.email.toLowerCase() : undefined;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: "Email and password are required." });
            }

            const users = await db.fetchdata({ email }, 'tblusers', loginSchema);
            if (users.length === 0) {
                return res.status(404).json({ success: false, message: "User not found." });
            }

            const user = users[0];

            if (user.role !== 'admin') {
                return res.status(403).json({ success: false, message: "Access denied. Regular Admins only." });
            }

            if (!user.password) {
                return res.status(401).json({ success: false, message: "Admin password not set. Please use OTP or update your account." });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: "Invalid credentials." });
            }

            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '20d' }
            );

            return res.status(200).json({
                success: true,
                message: "Admin login successful",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            console.error("Admin login error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    // SuperAdmin Login
    async superAdminLogin(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: "Email and password are required" });
            }

            const users = await db.fetchdata({ email }, 'tblusers', loginSchema);
            if (users.length === 0) {
                return res.status(401).json({ success: false, message: "Invalid credentials." });
            }

            const user = users[0];

            if (user.role !== 'superadmin') {
                return res.status(403).json({ success: false, message: "Access denied. Super Admins only." });
            }

            if (!user.password) {
                return res.status(401).json({ success: false, message: "Super Admin password not set." });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: "Invalid credentials." });
            }

            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '20d' }
            );

            return res.status(200).json({
                success: true,
                message: "Super Admin login successful",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            console.error("Super Admin login error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    // SuperAdmin only: List Admins
    async listAdmins(req, res) {
        try {
            const query = { role: { $in: ['admin', 'superadmin'] } };
            const admins = await db.fetchdata(query, 'tblusers', loginSchema);
            // Remove passwords from response
            const safeAdmins = admins.map(a => ({ _id: a._id, name: a.name, email: a.email, role: a.role, createdAt: a.createdAt }));
            return res.status(200).json({ success: true, admins: safeAdmins });
        } catch (error) {
            console.error("List admins error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    // SuperAdmin only: Create Admin
    async createAdmin(req, res) {
        try {
            const { name, email, number, password, role } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ success: false, message: "Name, email and password are required" });
            }

            const existing = await db.fetchdata({ email }, 'tblusers', loginSchema);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: "User already exists with this email" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newAdmin = {
                name,
                email,
                number: number || '',
                password: hashedPassword,
                role: role === 'superadmin' ? 'superadmin' : 'admin'
            };

            await db.executdata('tblusers', loginSchema, 'i', newAdmin);
            return res.status(201).json({ success: true, message: "Admin created successfully" });
        } catch (error) {
            console.error("Create admin error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    // SuperAdmin only: Delete Admin
    async deleteAdmin(req, res) {
        try {
            const { id } = req.body;
            if (!id) return res.status(400).json({ success: false, message: "Admin ID is required" });

            const admins = await db.fetchdata({ _id: id }, 'tblusers', loginSchema);
            if (admins.length === 0) return res.status(404).json({ success: false, message: "Admin not found" });

            if (admins[0].role === 'superadmin' && admins[0]._id.toString() === req.user.id.toString()) {
                return res.status(400).json({ success: false, message: "Cannot delete your own superadmin account" });
            }

            await db.executdata('tblusers', loginSchema, 'd', { _id: id });
            return res.status(200).json({ success: true, message: "Admin deleted successfully" });
        } catch (error) {
            console.error("Delete admin error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
}

export default new LoginController();
