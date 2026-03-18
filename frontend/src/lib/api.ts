// Central API configuration
// Uses NEXT_PUBLIC_API_URL in production, falls back to localhost:5000 in development
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default API_BASE;
