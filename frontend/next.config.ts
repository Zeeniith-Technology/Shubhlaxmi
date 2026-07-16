import type { NextConfig } from "next";

// Security headers applied to every response (BUG-003).
// Note: a strict Content-Security-Policy is intentionally omitted here because
// the app loads Razorpay's checkout script and Cloudinary images inline; a CSP
// tight enough to help without breaking those needs per-route nonces. The
// headers below are the high-value, low-risk ones.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HSTS only takes effect over HTTPS; harmless on http (browsers ignore it there)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Don't disclose the framework
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
