import mongoose from 'mongoose';
import connectdb from '../connection.js';
import db from '../method.js';
import loginSchema from '../schema/login.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdminUser = async () => {
    try {
        console.log('Connecting to database...');
        await connectdb();

        const adminEmail = 'dharmiksuthar0509@gmail.com';
        const tablename = 'tblusers';

        // 1. Ensure the table exists
        await db.checkTableExists(tablename, loginSchema);

        // 2. Check if the user already exists
        const existingUsers = await db.fetchdata({ email: adminEmail }, tablename, loginSchema);

        if (existingUsers.length > 0) {
            console.log(`User ${adminEmail} already exists. Updating role to 'admin'...`);

            await db.executdata(tablename, loginSchema, 'u', {
                condition: { email: adminEmail },
                update: { role: 'admin' }
            });

            console.log('Admin role granted successfully.');
        } else {
            console.log(`Creating new Admin user for ${adminEmail}...`);

            const newAdmin = {
                name: 'Super Admin',
                email: adminEmail,
                number: '+910000000000', // Placeholder, user will verify with actual number later, or you can update this manually.
                role: 'admin'
            };

            await db.executdata(tablename, loginSchema, 'i', newAdmin);

            console.log('Admin user created successfully.');
        }

        // Close connection after seeding
        await mongoose.connection.close();
        console.log('Database connection closed. Seeding complete.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

seedAdminUser();
