import mongoose from 'mongoose';

const reelSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        default: ""
    },
    // 'video' = an uploaded clip playable inline on the site.
    // 'instagram' = a thumbnail that links out to an Instagram post/reel.
    type: {
        type: String,
        enum: ['video', 'instagram'],
        required: true
    },
    // Required for type 'instagram' (it's the only visual for that card).
    // Optional for type 'video' — videos autoplay immediately, so a
    // thumbnail is unnecessary; if provided it's just used as a poster
    // frame while the video buffers. Enforced in the controller, not here,
    // since the requirement depends on `type`.
    thumbnailImage: {
        public_id: { type: String, default: '' },
        url: { type: String, default: '' }
    },
    // Only set when type === 'video'
    video: {
        public_id: { type: String, default: '' },
        url: { type: String, default: '' }
    },
    // Only set when type === 'instagram'
    instagramLink: {
        type: String,
        trim: true,
        default: ''
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: String,
        default: () => new Date().toISOString()
    },
    updatedAt: {
        type: String,
        default: () => new Date().toISOString()
    }
});

export default reelSchema;
