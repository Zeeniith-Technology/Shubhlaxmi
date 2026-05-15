import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import loginSchema from './schema/login.js';
import dotenv from 'dotenv';
dotenv.config();

const runSeed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const User = mongoose.model('tblusers', loginSchema);
        
        const email = 'dharmiksuthar0509@gmail.com';
        const password = await bcrypt.hash('Admin@123', 10);
        
        let user = await User.findOne({ email });
        if (user) {
            user.role = 'superadmin';
            user.password = password;
            await user.save();
            console.log('Admin user updated to Super Admin!');
        } else {
            await User.create({
                name: 'Dharmik Suthar',
                email: email,
                password: password,
                role: 'superadmin',
                number: '9876543210'
            });
            console.log('Super Admin user created!');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

runSeed();
