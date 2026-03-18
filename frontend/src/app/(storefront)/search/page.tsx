"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search as SearchIcon, X, SlidersHorizontal } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get("q") || "";

    const { addToCart } = useCart();
    const { formatPrice } = useCurrency();

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!initialQuery) return;

        const fetchResults = async () => {
            setLoading(true);
            try {
                // To do a real search, we fetch all active and filter on frontend for simplicity here,
                // or we could add a ?search= query to the backend if the backend supports it.
                // Assuming backend /public/products returns all active products
                const res = await fetch(`${API_BASE}/public/products`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isActive: true })
                });

                const data = await res.json();
                if (data.success && data.data) {
                    const q = initialQuery.toLowerCase();
                    const filtered = data.data.filter((p: any) =>
                        p.title.toLowerCase().includes(q) ||
                        p.description?.toLowerCase().includes(q) ||
                        p.categoryId?.name?.toLowerCase().includes(q)
                    );
                    setResults(filtered);
                }
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [initialQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Search Header */}
            <div className="max-w-3xl mx-auto mb-12">
                <h1 className="text-3xl font-[var(--font-heading)] text-center mb-8">
                    Search Our Store
                </h1>
                <form onSubmit={handleSearch} className="relative flex items-center">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for sarees, lehengas, kurtis..."
                        className="w-full pl-5 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-full text-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent font-[var(--font-body)] transition-shadow"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="absolute right-4 p-2 text-gray-500 hover:text-[var(--brand-pink)] transition-colors"
                    >
                        <SearchIcon size={24} />
                    </button>
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="absolute right-14 border-r border-gray-200 pr-3 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </form>
            </div>

            {/* Results Section */}
            {initialQuery && (
                <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-4">
                    <p className="text-gray-600 font-[var(--font-body)]">
                        Showing results for <span className="font-semibold text-[var(--brand-pink)]">"{initialQuery}"</span>
                    </p>
                    <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-[var(--text-primary)] transition-colors">
                        <SlidersHorizontal size={16} /> Filter
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--brand-pink)]"></div>
                </div>
            ) : initialQuery && results.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-xl text-gray-500 mb-4 font-[var(--font-body)]">No products found matching your search.</p>
                    <button
                        onClick={() => router.push("/collections/all")}
                        className="text-[var(--brand-pink)] hover:underline font-semibold font-[var(--font-body)]"
                    >
                        Browse all collections
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    {results.map((product) => (
                        <div key={product._id} className="group flex flex-col">
                            {/* Image Container */}
                            <Link href={`/product/${product.slug}`} className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 mb-4">
                                {product.images && product.images[0] ? (
                                    <img
                                        src={product.images[0].url}
                                        alt={product.title}
                                        className="object-cover w-full h-full product-img-zoom"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--brand-pink)] opacity-50 product-img-zoom bg-gradient-to-br from-pink-50 to-rose-100 p-4 text-center">
                                        <h3 className="text-xl font-[var(--font-heading)]">{product.title}</h3>
                                    </div>
                                )}

                                {/* Hover Add to Cart Button */}
                                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            addToCart(product, 1);
                                        }}
                                        className="w-full py-3 bg-white/95 backdrop-blur-sm text-[var(--brand-pink)] font-semibold text-sm tracking-wider uppercase rounded shadow-lg hover:bg-[var(--brand-pink)] hover:text-white transition-colors"
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </Link>

                            {/* Product Info */}
                            <div className="flex flex-col flex-1">
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-[var(--font-body)]">
                                    {product.categoryId?.name || "Shubhlaxmi"}
                                </p>
                                <Link href={`/product/${product.slug}`}>
                                    <h3 className="text-sm sm:text-base text-[var(--text-primary)] font-medium mb-2 font-[var(--font-body)] line-clamp-2 hover:text-[var(--brand-pink)] transition-colors">
                                        {product.title}
                                    </h3>
                                </Link>
                                <div className="mt-auto flex items-center gap-3">
                                    <span className="text-[var(--brand-pink)] font-semibold text-sm sm:text-base font-[var(--font-body)]">
                                        {formatPrice(product.price)}
                                    </span>
                                    {product.comparePrice && product.comparePrice > product.price && (
                                        <span className="text-gray-400 text-xs sm:text-sm line-through font-[var(--font-body)]">
                                            {formatPrice(product.comparePrice)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading search...</div>}>
            <SearchContent />
        </Suspense>
    );
}

