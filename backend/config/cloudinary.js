import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'shubhlaxmi/products',  // All product images go inside this folder
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }]
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB hard limit (images should be compressed client-side first)
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG, WebP, and AVIF images are allowed'), false);
        }
    }
});

export const deleteImage = async (publicId) => {
    try {
        if (!publicId) return;
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Cloudinary Delete Error:", error);
    }
};

// Videos live in a different Cloudinary resource type — destroying them
// without resource_type:'video' silently no-ops and leaks storage.
export const deleteVideo = async (publicId) => {
    try {
        if (!publicId) return;
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    } catch (error) {
        console.error("Cloudinary Video Delete Error:", error);
    }
};

// Reels upload: 'thumbnailImage' field goes to image storage, 'video' field
// goes to video storage — decided per-file by fieldname.
const reelStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        if (file.fieldname === 'video') {
            return {
                folder: 'shubhlaxmi/reels/videos',
                resource_type: 'video',
                allowed_formats: ['mp4', 'mov', 'webm']
            };
        }
        return {
            folder: 'shubhlaxmi/reels/thumbnails',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
            transformation: [{ width: 800, height: 1400, crop: 'limit', quality: 'auto' }]
        };
    }
});

export const uploadReel = multer({
    storage: reelStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB — short reel clips, not full banner videos
    fileFilter: (req, file, cb) => {
        const allowedImage = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
        const allowedVideo = ['video/mp4', 'video/quicktime', 'video/webm'];
        if (file.fieldname === 'video' && allowedVideo.includes(file.mimetype)) {
            return cb(null, true);
        }
        if (file.fieldname === 'thumbnailImage' && allowedImage.includes(file.mimetype)) {
            return cb(null, true);
        }
        cb(new Error(`Invalid file type for ${file.fieldname}`), false);
    }
});

export { cloudinary, upload };
