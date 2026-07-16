import type { Metadata } from "next";
import ProductDetailsClient from "./ProductDetailsClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Server-side metadata so the SEO fields set in the admin panel become real
// <meta> tags that Google/social platforms can read.
export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    try {
        const res = await fetch(`${API_BASE}/public/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
            next: { revalidate: 300 }
        });
        const data = await res.json();
        const product = data?.data?.[0];

        if (!product) {
            return { title: "Product Not Found — Shubhlaxmi" };
        }

        const title = product.seo?.metaTitle || `${product.title} — Shubhlaxmi`;
        const description = product.seo?.metaDescription
            || (product.description ? String(product.description).replace(/<[^>]*>/g, '').slice(0, 160) : `Shop ${product.title} at Shubhlaxmi — designer ethnic wear for every occasion.`);
        const image = product.images?.[0]?.url;

        return {
            title,
            description,
            keywords: product.seo?.keywords || undefined,
            openGraph: {
                title,
                description,
                type: "website",
                ...(image ? { images: [{ url: image }] } : {})
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                ...(image ? { images: [image] } : {})
            }
        };
    } catch {
        return { title: "Shubhlaxmi — Designer Ethnic Wear" };
    }
}

export default function ProductPage() {
    return <ProductDetailsClient />;
}
