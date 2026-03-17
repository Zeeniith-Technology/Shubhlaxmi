import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function run() {
    try {
        const res = await cloudinary.uploader.upload('../banner_video.mp4', {
            resource_type: "video",
            folder: "shubhlaxmi_assets"
        });
        fs.writeFileSync('video_url.txt', res.secure_url.trim());
        console.log("Done");
    } catch (e) {
        console.error(e);
    }
}
run();
