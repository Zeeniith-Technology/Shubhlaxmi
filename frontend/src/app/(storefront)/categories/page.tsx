"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE}/public/categories`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({})
                });
                const data = await res.json();
                if (data.success && data.data) {
                    // Only top-level categories
                    setCategories(data.data.filter((c: any) => !c.parentCategory || c.parentCategory === ""));
                }
            } catch (e) {
                console.error("Failed to fetch categories", e);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    return (
        <div className="min-h-screen bg-white pt-4 pb-20">
            {/* Breadcrumb */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <nav className="flex items-center gap-2 text-[13px] text-gray-400 font-[var(--font-body)]">
                    <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
                    <ChevronRight size={14} />
                    <span className="text-gray-700 font-medium">All Categories</span>
                </nav>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page Title */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl sm:text-4xl font-[var(--font-heading)] text-gray-900 tracking-wide">
                        All Categories
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">Browse our complete collection by category</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-[var(--brand-pink)] rounded-full animate-spin" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-24">
                        <p className="text-gray-400 text-sm">No categories found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                        {categories.map((cat, i) => (
                            <Link
                                key={cat._id}
                                href={`/collections/${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
                                className="group flex flex-col items-center gap-3 text-center"
                                style={{
                                    animation: `fadeSlideUp 0.4s ease ${i * 40}ms both`
                                }}
                            >
                                {/* Image Card */}
                                <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 relative shadow-sm group-hover:shadow-xl transition-all duration-400">
                                    {cat.image?.url ? (
                                        <img
                                            src={cat.image.url}
                                            alt={cat.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-100">
                                            <span className="text-6xl font-bold text-[var(--brand-pink)] opacity-20 select-none">
                                                {cat.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                                        <span className="text-white text-[11px] font-bold tracking-[0.15em] uppercase border border-white/60 px-3 py-1 rounded-full backdrop-blur-sm">
                                            Shop Now
                                        </span>
                                    </div>
                                </div>

                                {/* Name */}
                                <span className="text-[13px] font-medium text-gray-800 group-hover:text-[var(--brand-pink)] transition-colors duration-200 leading-tight">
                                    {cat.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
