import jwt from 'jsonwebtoken';
import db from '../method.js';
import loginSchema from '../schema/login.js';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

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

            // Generate 4 digit OTP
            const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

            // OTP expires in 10 minutes
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            // Check if user exists
            const existingUsers = await db.fetchdata({ email }, 'tblusers', loginSchema);
            let role = 'user';

            if (existingUsers.length > 0) {
                role = existingUsers[0].role;
                // User exists -> Update their OTP
                await db.executdata('tblusers', loginSchema, 'u', {
                    condition: { email },
                    update: { 'otp.code': otpCode, 'otp.expiresAt': expiresAt }
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
                    otp: { code: otpCode, expiresAt }
                };
                await db.executdata('tblusers', loginSchema, 'i', newUser);
            }

            // Send Email Notification for normal users và admins

            try {
                // Uncomment to actually send email when credentials are added to .env
                /*
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Your Amrut.co Login OTP',
                    text: `Your 4-digit OTP is: ${otpCode}. It will expire in 10 minutes.`
                });
                */
                console.log(`[USER LOGIN] OTP sent to email ${email}: ${otpCode}`);
            } catch (emailError) {
                console.error("Failed to send OTP email:", emailError);
                // We still proceed even if email fails in Dev, but in prod you might want to return an error
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

            // Validate OTP
            if (!user.otp || user.otp.code !== otp) {
                return res.status(401).json({ success: false, message: "Invalid OTP." });
            }

            // Check if OTP is expired
            if (new Date() > new Date(user.otp.expiresAt)) {
                return res.status(401).json({ success: false, message: "OTP has expired." });
            }

            // Clear the OTP so it can't be reused
            await db.executdata('users', loginSchema, 'u', {
                condition: { email },
                update: { 'otp.code': null, 'otp.expiresAt': null }
            });

            // Generate JWT Token (Valid for 20 days as requested)
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET || 'fallback_secret_key',
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

            // --- SUPER ADMIN BYPASS ---
            if (email === 'dharmiksuthar0509@gmail.com' && password === 'Admin@123') {
                const superAdminUsers = await db.fetchdata({ email }, 'tblusers', loginSchema);
                if (superAdminUsers.length > 0) {
                    const sa = superAdminUsers[0];
                    const token = jwt.sign(
                        { id: sa._id, role: 'admin' },
                        process.env.JWT_SECRET || 'fallback_secret_key',
                        { expiresIn: '20d' }
                    );

                    return res.status(200).json({
                        success: true,
                        message: "Superadmin login successful",
                        token,
                        user: { id: sa._id, name: sa.name, email: sa.email, role: 'admin' }
                    });
                }
            }
            // --------------------------

            const users = await db.fetchdata({ email }, 'tblusers', loginSchema);
            if (users.length === 0) {
                return res.status(404).json({ success: false, message: "User not found." });
            }

            const user = users[0];

            if (user.role !== 'admin') {
                return res.status(403).json({ success: false, message: "Access denied. Admins only." });
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
                process.env.JWT_SECRET || 'fallback_secret_key',
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
}

export default new LoginController();
