"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, ChevronDown, X, ChevronRight, Heart } from "lucide-react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { useCurrency } from "../../../context/CurrencyContext";
import { useWishlist } from "../../../context/WishlistContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type SortOption = "featured" | "price-asc" | "price-desc" | "newest" | "title-asc" | "title-desc";

export default function CollectionPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const slug = params.slug as string;
    const { formatPrice } = useCurrency();
    const { toggleWishlist, isInWishlist } = useWishlist();

    // Default price state matching query parameters if present
    const maxPriceQuery = searchParams?.get('maxPrice');
    const urlMaxPrice = maxPriceQuery ? Number(maxPriceQuery) : 100000;
    const isUrlFiltered = !!maxPriceQuery;

    const [products, setProducts] = useState<any[]>([]);
    const [category, setCategory] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<SortOption>("featured");
    const [filterOpen, setFilterOpen] = useState(false);

    // Budget Friendly mode
    const isBudgetFriendly = slug === "budget-friendly";
    const [budgetSettings, setBudgetSettings] = useState<{ min: number; max: number } | null>(null);

    // Special price-based slugs
    const specialPriceSlugs: Record<string, { min: number; max: number; label: string }> = {
        "1000-sarees": { min: 0, max: 1000, label: "Under \u20b91000" },
    };
    const isSpecialPrice = Object.keys(specialPriceSlugs).includes(slug);

    // Price filter (Slider)
    const [priceRange, setPriceRange] = useState<[number, number]>([0, urlMaxPrice]);
    const [availableMin, setAvailableMin] = useState(0);
    const [availableMax, setAvailableMax] = useState(100000);
    const [isPriceFiltered, setIsPriceFiltered] = useState(isUrlFiltered);

    // Decode the slug to match category name
    const categoryName = slug.replace(/-/g, " ");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // If budget-friendly, first fetch the configured price range from store settings
                let budgetMin = 0;
                let budgetMax = 100000;
                if (isBudgetFriendly) {
                    try {
                        const settingsRes = await fetch(`${API_BASE}/public/store-settings`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({})
                        });
                        const settingsData = await settingsRes.json();
                        if (settingsData.status && settingsData.data) {
                            budgetMin = settingsData.data.budgetFriendlyMinPrice ?? 0;
                            budgetMax = settingsData.data.budgetFriendlyMaxPrice ?? 2000;
                            setBudgetSettings({ min: budgetMin, max: budgetMax });
                        }
                    } catch (e) {
                        console.error("Failed to fetch budget settings", e);
                    }
                }

                // Fetch all categories to find the matching one
                const catRes = await fetch(`${API_BASE}/public/categories`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({})
                });
                const catData = await catRes.json();

                let matchedCategory: any = null;
                let matchedSection: any = null;

                if (catData.success && catData.data) {
                    matchedCategory = catData.data.find((c: any) => {
                        const nameSlug = c.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                        const currentSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
                        return nameSlug === currentSlug || c.slug === slug.toLowerCase();
                    });
                    setCategory(matchedCategory || null);
                }

                // If no category found, try sections
                if (!matchedCategory) {
                    try {
                        const secRes = await fetch(`${API_BASE}/public/sections`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({})
                        });
                        const secData = await secRes.json();
                        if (secData.success && secData.data) {
                            matchedSection = secData.data.find((s: any) => {
                                const nameSlug = s.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                                return nameSlug === slug.toLowerCase() || s.slug === slug.toLowerCase();
                            });
                        }
                    } catch (e) { /* sections are optional */ }
                }

                // Fetch products — filter by category/section, price, sort directly on backend
                const productBody: any = {};
                if (matchedCategory) {
                    productBody.categoryId = matchedCategory._id;
                } else if (matchedSection) {
                    productBody.sectionId = matchedSection._id;
                }

                // For budget-friendly slug: always apply the configured price range
                if (isBudgetFriendly) {
                    productBody.minPrice = budgetMin;
                    productBody.maxPrice = budgetMax;
                } else if (isSpecialPrice) {
                    productBody.minPrice = specialPriceSlugs[slug].min;
                    productBody.maxPrice = specialPriceSlugs[slug].max;
                } else if (isPriceFiltered) {
                    productBody.minPrice = priceRange[0];
                    productBody.maxPrice = priceRange[1];
                }

                // GUARD: if nothing matched AND not a special slug AND not 'all', show empty
                const isAllCollection = slug === "all";
                if (!matchedCategory && !matchedSection && !isBudgetFriendly && !isSpecialPrice && !isAllCollection) {
                    setProducts([]);
                    setLoading(false);
                    return;
                }

                productBody.sort = sortBy;

                const prodRes = await fetch(`${API_BASE}/public/products`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(productBody)
                });
                const prodData = await prodRes.json();
                if (prodData.success && prodData.data) {
                    const fetchedProducts = prodData.data;
                    setProducts(fetchedProducts);

                    if (fetchedProducts.length > 0 && !isPriceFiltered && !isBudgetFriendly) {
                        setAvailableMin(0);
                        setAvailableMax(100000);
                        if (!isUrlFiltered) {
                            setPriceRange([0, 100000]);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch collection data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug, isPriceFiltered, sortBy, isBudgetFriendly]); 

    // Client-side safety filter: enforce price limits for special/budget slugs
    const displayProducts = (() => {
        if (isSpecialPrice) {
            const { min, max } = specialPriceSlugs[slug];
            return products.filter(p => Number(p.price) >= min && Number(p.price) <= max);
        }
        if (isBudgetFriendly && budgetSettings) {
            return products.filter(p => Number(p.price) >= budgetSettings.min && Number(p.price) <= budgetSettings.max);
        }
        return products;
    })();

    const applyPriceFilter = () => {
        setIsPriceFiltered(true);
        setFilterOpen(false);
    };

    const clearFilters = () => {
        setPriceRange([availableMin, availableMax]);
        setIsPriceFiltered(false);
        setFilterOpen(false);
    };

    const hasActiveFilters = isPriceFiltered;

    const displayTitle = isBudgetFriendly
        ? "Budget Friendly"
        : isSpecialPrice
        ? specialPriceSlugs[slug].label
        : slug === "all"
        ? "All Products"
        : category?.name || (category as any)?.name || categoryName.replace(/(^|\s)\S/g, (t: string) => t.toUpperCase());

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[var(--brand-pink)] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-4 pb-20">
            {/* Breadcrumb */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <nav className="flex items-center gap-2 text-[13px] text-gray-400 font-[var(--font-body)]">
                    <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
                    <ChevronRight size={14} />
                    <span className="text-gray-700 font-medium">{displayTitle}</span>
                </nav>
            </div>

            {/* Category Title */}
            <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-[var(--font-heading)] text-gray-900 tracking-wide">
                    {displayTitle}
                </h1>
            </div>



            {/* Filter + Sort Bar */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <div className="flex items-center justify-between border-y border-gray-200 py-3">
                    {/* Filter Button */}
                    <button
                        onClick={() => setFilterOpen(!filterOpen)}
                        className="flex items-center gap-2 text-[13px] font-medium text-gray-700 hover:text-gray-900 transition-colors py-1 px-3 border border-gray-300 rounded-sm hover:border-gray-400"
                    >
                        <SlidersHorizontal size={15} />
                        <span>Filter</span>
                        {hasActiveFilters && (
                            <span className="w-2 h-2 bg-[var(--brand-pink)] rounded-full"></span>
                        )}
                    </button>

                    {/* Product Count */}
                    <p className="text-[13px] text-gray-500 font-[var(--font-body)]">
                        {displayProducts.length} {displayProducts.length === 1 ? "product" : "products"}
                    </p>

                    {/* Sort Dropdown */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as SortOption)}
                            className="appearance-none bg-white border border-gray-300 rounded-sm py-2 pl-3 pr-8 text-[13px] text-gray-700 focus:outline-none focus:border-gray-400 cursor-pointer font-[var(--font-body)]"
                        >
                            <option value="featured">Featured</option>
                            <option value="newest">Newest</option>
                            <option value="price-asc">Price, low to high</option>
                            <option value="price-desc">Price, high to low</option>
                            <option value="title-asc">Alphabetically, A-Z</option>
                            <option value="title-desc">Alphabetically, Z-A</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                {/* Filter Panel */}
                {filterOpen && (
                    <div className="border border-t-0 border-gray-200 bg-gray-50 p-5 animate-in">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-800">Price Range</h3>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="text-xs text-[var(--brand-pink)] hover:underline flex items-center gap-1">
                                    <X size={12} /> Clear filters
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-6 mt-6 max-w-lg">
                            <div className="flex-1 px-2">
                                <Slider
                                    range
                                    min={availableMin}
                                    max={availableMax}
                                    value={priceRange}
                                    onChange={(val) => setPriceRange(val as [number, number])}
                                    styles={{
                                        track: { backgroundColor: '#111827', height: 4 },
                                        handle: {
                                            borderColor: '#111827',
                                            backgroundColor: '#111827',
                                            opacity: 1,
                                            boxShadow: 'none',
                                            width: 14,
                                            height: 14,
                                            marginTop: -5
                                        },
                                        rail: { backgroundColor: '#e5e7eb', height: 4 }
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="border border-gray-300 rounded-sm py-2 px-3 focus-within:border-gray-500 bg-white">
                                    <span className="text-gray-500 text-[13px] mr-1">₹</span>
                                    <input
                                        type="number"
                                        value={priceRange[0]}
                                        onChange={(e) => {
                                            const val = Math.max(availableMin, Math.min(Number(e.target.value), priceRange[1]));
                                            setPriceRange([val, priceRange[1]]);
                                        }}
                                        className="w-16 text-[13px] text-gray-800 focus:outline-none appearance-none bg-transparent"
                                        style={{ MozAppearance: 'textfield' }}
                                    />
                                </div>
                                <span className="text-gray-400 text-[13px]">to</span>
                                <div className="border border-gray-300 rounded-sm py-2 px-3 focus-within:border-gray-500 bg-white">
                                    <span className="text-gray-500 text-[13px] mr-1">₹</span>
                                    <input
                                        type="number"
                                        value={priceRange[1]}
                                        onChange={(e) => {
                                            const val = Math.min(availableMax, Math.max(Number(e.target.value), priceRange[0]));
                                            setPriceRange([priceRange[0], val]);
                                        }}
                                        className="w-16 text-[13px] text-gray-800 focus:outline-none appearance-none bg-transparent"
                                        style={{ MozAppearance: 'textfield' }}
                                    />
                                </div>
                                <button
                                    onClick={applyPriceFilter}
                                    className="bg-[#111827] text-white text-[13px] font-medium py-2 px-6 rounded-sm hover:bg-black transition-colors ml-2"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Grid */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                {displayProducts.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 01-8 0" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2 font-[var(--font-heading)]">No Products Found</h3>
                        <p className="text-sm text-gray-400 font-[var(--font-body)] mb-6">We couldn&apos;t find any products in this collection.</p>
                        <Link
                            href="/"
                            className="inline-block px-6 py-3 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors uppercase tracking-wider"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 lg:gap-x-8">
                        {displayProducts.map((product: any) => {
                            const isWishlisted = isInWishlist(product._id);
                            return (
                                <Link
                                    key={product._id}
                                    href={`/product/${product.slug}`}
                                    className="group flex flex-col cursor-pointer"
                                >
                                    {/* Product Image */}
                                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
                                        <img
                                            src={product.images?.[0]?.url || 'https://placehold.co/400x530/f3f4f6/a1a1aa?text=No+Image'}
                                            alt={product.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        {product.compareAtPrice > product.price && (
                                            <span className="absolute top-3 left-3 bg-[var(--brand-pink)] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest shadow-sm">
                                                {Math.round(((Number(product.compareAtPrice) - Number(product.price)) / Number(product.compareAtPrice)) * 100)}% OFF
                                            </span>
                                        )}
                                        {/* Wishlist Toggle Button */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleWishlist(product._id);
                                            }}
                                            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-white/70 backdrop-blur-md rounded-full shadow-sm hover:scale-110 transition-transform"
                                        >
                                            <Heart 
                                                size={16} 
                                                className={`transition-colors ${isWishlisted ? "fill-[#ea2083] stroke-[#ea2083]" : "stroke-gray-600"}`} 
                                            />
                                        </button>
                                    </div>

                                    {/* Product Title */}
                                    <h3 className="text-[12px] sm:text-[13px] text-gray-800 text-center font-[var(--font-body)] group-hover:text-[#ea2083] transition-colors leading-[1.6] px-1 mb-2">
                                        {product.title}
                                    </h3>

                                {/* Product Price */}
                                <div className="mt-auto text-center flex flex-wrap items-center justify-center gap-2">
                                    <span className={`font-semibold text-[13px] sm:text-[14px] font-[var(--font-body)] ${
                                        product.compareAtPrice > product.price ? 'text-[var(--brand-pink)]' : 'text-gray-900'
                                    }`}>
                                        {formatPrice(product.price)}
                                    </span>
                                    {product.compareAtPrice > product.price && (
                                        <span className="text-gray-400 text-[12px] line-through font-[var(--font-body)]">
                                            {formatPrice(product.compareAtPrice)}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
