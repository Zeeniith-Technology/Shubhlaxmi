"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Phone, Shirt, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";

const API_BASE = "http://localhost:5000/api";

/* ──────────────── HERO CAROUSEL ──────────────── */
function HeroCarousel({ banners }: { banners: any[] }) {
    const [current, setCurrent] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const nextSlide = useCallback(() => {
        setCurrent((prev) => (prev + 1) % banners.length);
    }, [banners.length]);

    const prevSlide = () => {
        setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
    };

    useEffect(() => {
        if (!isAutoPlaying || banners.length <= 1) return;
        const interval = setInterval(nextSlide, 4000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, nextSlide, banners.length]);

    if (banners.length === 0) return null;

    return (
        <section
            className="relative w-full overflow-hidden bg-gray-100"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
        >
            {/* Desktop Banner */}
            <div className="hidden md:block relative w-full" style={{ aspectRatio: "16/9" }}>
                {banners.map((banner, idx) => (
                    <div
                        key={banner._id}
                        className={`absolute inset-0 transition-opacity duration-700 ${idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
                            }`}
                    >
                        <Link href={banner.link || "#"}>
                            <img
                                src={banner.desktopImage?.url}
                                alt={banner.title || "Banner"}
                                className="w-full h-full object-cover"
                            />
                        </Link>
                    </div>
                ))}
            </div>

            {/* Mobile Banner */}
            <div className="md:hidden relative w-full" style={{ aspectRatio: "3/4" }}>
                {banners.map((banner, idx) => (
                    <div
                        key={banner._id}
                        className={`absolute inset-0 transition-opacity duration-700 ${idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
                            }`}
                    >
                        <Link href={banner.link || "#"}>
                            <img
                                src={banner.mobileImage?.url}
                                alt={banner.title || "Banner"}
                                className="w-full h-full object-cover"
                            />
                        </Link>
                    </div>
                ))}
            </div>

            {/* Carousel Controls */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                        aria-label="Previous"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                        aria-label="Next"
                    >
                        <ChevronRight size={20} />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                        {banners.map((_: any, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => setCurrent(idx)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${idx === current
                                    ? "bg-[var(--brand-pink)] w-6"
                                    : "bg-white/70 hover:bg-white"
                                    }`}
                                aria-label={`Slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}

/* ──────────────── CATEGORY GRID ──────────────── */
const CATEGORY_GRADIENTS = [
    "from-rose-400 to-pink-600",
    "from-fuchsia-500 to-purple-600",
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-600",
    "from-sky-400 to-blue-600",
];

function CategoryGrid({ categories, title = "Shop By Category" }: { categories: any[], title?: string }) {
    const topCategories = categories.filter(
        (c: any) => !c.parentCategory || c.parentCategory === ""
    );

    if (topCategories.length === 0) return null;

    return (
        <section className="w-full px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
            <h2 className="text-2xl sm:text-3xl font-[var(--font-heading)] text-center mb-8 sm:mb-12 tracking-wide">
                {title}
            </h2>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 lg:gap-5">
                {topCategories.slice(0, 6).map((cat, index) => (
                    <Link
                        key={cat._id}
                        href={`/collections/${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
                        className="group relative overflow-hidden rounded-none aspect-[3/5] 
                                   w-[calc(50%-6px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(16.666%-17px)]"
                    >
                        {cat.image?.url ? (
                            <img
                                src={cat.image.url}
                                alt={cat.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length]} transition-all duration-700 group-hover:scale-105`} />
                        )}
                        {/* Category Name Badge */}
                        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex flex-col items-center justify-center px-2">
                            <h3 className="bg-white text-gray-800 w-auto max-w-[95%] inline-block py-2 px-3 sm:py-2.5 sm:px-6 text-[11px] sm:text-sm font-medium tracking-wide capitalize text-center shadow-md transition-colors duration-300 hover:text-[var(--brand-pink)] truncate">
                                {cat.name}
                            </h3>
                            {!cat.image?.url && (
                                <span className="absolute bottom-10 sm:bottom-12 text-white/90 bg-black/60 px-2 py-1 text-[10px] tracking-wider uppercase">Image Coming Soon</span>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

/* ──────────────── SPECIAL COLLECTIONS ──────────────── */
function SpecialCollectionsGrid({ collections }: { collections: any[] }) {
    if (!collections || collections.length === 0) return null;

    return (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 bg-gray-50/50">
            <h2 className="text-2xl sm:text-3xl font-[var(--font-heading)] text-center mb-6 sm:mb-12 tracking-wide">
                Special Collections
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-6">
                {collections.map((collection) => {
                    const slug = collection.categoryId?.name?.toLowerCase().replace(/\s+/g, "-");
                    const link = `/collections/${slug}?maxPrice=${collection.maxPrice}`;

                    return (
                        <Link
                            key={collection._id}
                            href={link}
                            className="group relative overflow-hidden rounded-none aspect-[3/4] w-full block"
                        >
                            <img
                                src={collection.image?.url}
                                alt={collection.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex flex-col items-center justify-center px-1">
                                <h3 className="bg-white text-gray-800 w-auto max-w-[95%] inline-block py-2 px-2 sm:py-2.5 sm:px-6 text-[10px] sm:text-sm font-medium tracking-wide text-center shadow-md transition-colors duration-300 hover:text-[var(--brand-pink)] leading-tight line-clamp-2">
                                    {collection.title}
                                </h3>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

/* ──────────────── PRODUCT CARD ──────────────── */
function ProductCard({ product }: { product: any }) {
    const mainImage = product.images?.[0]?.url || "";
    const hoverImage = product.images?.[1]?.url || mainImage;
    const { addToCart } = useCart();
    const { formatPrice } = useCurrency();

    return (
        <Link
            href={`/product/${product.slug}`}
            className="group block"
        >
            <div className="relative overflow-hidden rounded-lg aspect-[3/4] bg-gray-50 mb-3">
                {/* Primary Image */}
                <img
                    src={mainImage}
                    alt={product.title}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                />
                {/* Hover Image */}
                <img
                    src={hoverImage}
                    alt={product.title}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                />

                {/* Add to Cart Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            addToCart(product, 1);
                        }}
                        className="w-full py-2.5 bg-white/95 backdrop-blur-sm text-[var(--brand-pink)] font-semibold text-sm tracking-wider uppercase rounded shadow-lg hover:bg-[var(--brand-pink)] hover:text-white transition-colors flex justify-center items-center gap-2"
                    >
                        <ShoppingBag size={16} /> Add to Cart
                    </button>
                </div>
            </div>

            {/* Product Info */}
            <h3 className="text-sm font-[var(--font-body)] text-[var(--text-primary)] mb-1 leading-snug line-clamp-2 group-hover:text-[var(--brand-pink)] transition-colors">
                {product.title}
            </h3>
            <p className="text-sm font-semibold font-[var(--font-body)] text-[var(--text-primary)] leading-none mt-1">
                {formatPrice(product.price || 0)}
                {product.mrp && product.mrp > product.price && (
                    <span className="text-xs text-gray-400 line-through ml-2 font-normal">
                        {formatPrice(product.mrp)}
                    </span>
                )}
            </p>
        </Link>
    );
}

/* ──────────────── TRENDING PRODUCTS ──────────────── */
function TrendingProducts({ products }: { products: any[] }) {
    if (products.length === 0) {
        return (
            <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
                <h2 className="text-2xl sm:text-3xl font-[var(--font-heading)] mb-4 tracking-wide">
                    Trending Styles
                </h2>
                <div className="bg-orange-50 text-orange-600 border border-orange-200 p-8 rounded-lg max-w-2xl mx-auto shadow-sm">
                    <p className="font-medium">Our latest trends are being updated. Check back soon for exciting new styles!</p>
                </div>
            </section>
        );
    }

    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-16">
            <h2 className="text-3xl sm:text-3xl font-[var(--font-heading)] text-center mb-6 sm:mb-12 tracking-wide">
                Trending Styles
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6">
                {products.slice(0, 8).map((product) => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>
            {products.length > 8 && (
                <div className="text-center mt-10">
                    <Link
                        href="/collections/all"
                        className="inline-block px-8 py-3 border-2 border-[var(--brand-pink)] text-[var(--brand-pink)] text-sm font-semibold tracking-wider uppercase rounded-md hover:bg-[var(--brand-pink)] hover:text-white transition-colors font-[var(--font-body)]"
                    >
                        View All Products
                    </Link>
                </div>
            )}
        </section>
    );
}

const PlusPattern = () => (
    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z\' fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }}></div>
);

/* ──────────────── VIDEO SHOPPING CTA ──────────────── */
function VideoShoppingCTA() {
    return (
        <section className="w-full my-6 sm:my-10">
            <div className="w-full flex flex-col md:flex-row items-stretch min-h-[320px]">
                {/* Left Panel */}
                <div className="flex-1 bg-[#ea2083] relative flex items-center justify-center p-8 text-center overflow-hidden">
                    <PlusPattern />
                    <h2 className="text-white text-3xl sm:text-[34px] font-medium tracking-wide relative z-10 drop-shadow-sm font-[var(--font-heading)]">
                        Lets meet virtually
                    </h2>
                </div>

                {/* Center Panel (Video) */}
                <div className="flex-[1.5] bg-[#d58d9c] flex flex-col items-center justify-center relative min-h-[300px]">
                    <div className="absolute inset-0 w-full h-full z-10 overflow-hidden cursor-pointer group">
                        <video
                            src="https://res.cloudinary.com/djisqvhix/video/upload/v1773037171/shubhlaxmi_assets/kcbw5lameawqiyagbh2z.mp4"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                        {/* Dark gradient overlay for button contrast */}
                        <div className="absolute inset-x-0 bottom-0 h-[100px] bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                        {/* The overlaid button */}
                        <div className="absolute inset-x-0 bottom-6 sm:bottom-10 flex justify-center z-20 pointer-events-none">
                            <Link
                                href="/video-appointment"
                                className="pointer-events-auto bg-white text-black px-6 py-3.5 sm:px-8 sm:py-4 rounded-full text-[11px] sm:text-[13px] font-extrabold tracking-widest uppercase shadow-xl hover:bg-gray-100 hover:text-[#ea2083] hover:scale-105 transition-all whitespace-nowrap"
                            >
                                BOOK YOUR APPOINTMENT NOW
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="flex-1 bg-[#ea2083] relative flex items-center justify-center p-8 text-center overflow-hidden">
                    <PlusPattern />
                    <h2 className="text-white text-3xl sm:text-[34px] leading-snug font-medium tracking-wide relative z-10 drop-shadow-sm font-[var(--font-heading)]">
                        Our fashion expert<br />will connect you soon
                    </h2>
                </div>
            </div>
        </section>
    );
}

/* ──────────────── STYLE SHOWCASE ──────────────── */
function StyleShowcase() {
    return (
        <section className="max-w-[1536px] mx-auto px-0 sm:px-6 lg:px-8 py-4 sm:py-12">
            <style dangerouslySetInnerHTML={{ __html: "@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');" }} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-5">
                {/* Traditional Style Panel */}
                <Link href="/collections/all" className="relative group block w-full overflow-hidden bg-gray-900" style={{ aspectRatio: '4/3' }}>
                    <img src="/assets/images/traditional_style.png" alt="Traditional Style" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700" />
                    {/* Inner White Border */}
                    <div className="absolute inset-4 sm:inset-6 border-2 border-white/60 pointer-events-none z-10 transition-colors duration-500 group-hover:border-white/90"></div>
                    {/* Dark gradient overlay at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-[rgba(15,10,25,0.9)] via-[rgba(15,10,25,0.4)] to-transparent pointer-events-none"></div>
                    {/* Cursive Text Overlay */}
                    <div className="absolute inset-x-0 bottom-4 sm:bottom-6 bg-transparent flex justify-center z-20 pointer-events-none mix-blend-plus-lighter">
                        <span className="text-[#f8f4fa] text-[64px] sm:text-[80px] md:text-[6vw] lg:text-[100px] leading-snug text-center tracking-wider drop-shadow-[0_2px_15px_rgba(0,0,0,1)]" style={{ fontFamily: "'Great Vibes', cursive", textShadow: "0 2px 10px rgba(0,0,0,0.9), 0 0 20px rgba(255,255,255,0.2)" }}>Traditional Style</span>
                    </div>
                </Link>

                {/* Ready In Style Panel */}
                <Link href="/collections/all" className="relative group block w-full overflow-hidden bg-gray-900" style={{ aspectRatio: '4/3' }}>
                    <img src="/assets/images/ready_in_style.png" alt="Ready in Style" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700" />
                    {/* Inner White Border */}
                    <div className="absolute inset-4 sm:inset-6 border-2 border-white/60 pointer-events-none z-10 transition-colors duration-500 group-hover:border-white/90"></div>
                    {/* Dark gradient overlay at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-[rgba(15,10,25,0.9)] via-[rgba(15,10,25,0.4)] to-transparent pointer-events-none"></div>
                    {/* Cursive Text Overlay */}
                    <div className="absolute inset-x-0 bottom-4 sm:bottom-6 bg-transparent flex justify-center z-20 pointer-events-none mix-blend-plus-lighter">
                        <span className="text-[#f8f4fa] text-[64px] sm:text-[80px] md:text-[6vw] lg:text-[100px] leading-snug text-center tracking-wider drop-shadow-[0_2px_15px_rgba(0,0,0,1)]" style={{ fontFamily: "'Great Vibes', cursive", textShadow: "0 2px 10px rgba(0,0,0,0.9), 0 0 20px rgba(255,255,255,0.2)" }}>Ready in Style</span>
                    </div>
                </Link>
            </div>
        </section>
    );
}

/* ──────────────── SEO BRAND SECTION ──────────────── */
function SeoBrandSection() {
    const [showMore, setShowMore] = useState(false);
    return (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <div className="border-t border-gray-200 pt-10">
                <h2 className="text-[22px] lg:text-[26px] font-[var(--font-heading)] text-gray-900 font-medium mb-5 leading-tight">Shubhlaxmi - The Fashion Icon</h2>
                <div className="relative">
                    <div className={`text-[14px] text-gray-600 leading-[1.9] font-[var(--font-body)] space-y-4 ${!showMore ? 'max-h-[140px] overflow-hidden' : ''}`}>
                        <p>
                            Welcome to <strong className="text-gray-800">Shubhlaxmi</strong> – <em>The Ultimate Ethnic Fashion Destination!</em>
                        </p>
                        <p>
                            Shubhlaxmi is a celebration of India&apos;s rich textile heritage, bringing you handcrafted lehengas, sarees, salwar suits, and designer ethnic wear that blend traditional artistry with contemporary elegance. Each piece in our collection is meticulously crafted by skilled artisans, ensuring unmatched quality in embroidery, fabric, and finish. You may wear our garments anywhere and for any occasion since they are made to be comfortable and adaptable.
                        </p>
                        <p>
                            From bridal lehengas adorned with intricate zardozi and mirror work to lightweight festive sarees perfect for every occasion, our curated range caters to the modern Indian woman who values authenticity and style. We source the finest fabrics — including pure silk, georgette, organza, and velvet — to deliver outfits that look and feel luxurious.
                        </p>
                        <p>
                            At Shubhlaxmi, we believe every woman deserves to feel special. Whether you&apos;re shopping for a wedding, engagement, reception, or a festive celebration like Diwali or Navratri, our designs are crafted to make you stand out. We offer worldwide shipping, assured quality, and dedicated customer support including personal video call consultations to help you choose the perfect outfit.
                        </p>
                        <p>
                            Explore our collections of designer lehenga choli sets, embroidered bridal wear, party wear sarees, Anarkali suits, and Indo-Western outfits — all available at competitive prices with secure payment options. Shop with confidence at Shubhlaxmi, where tradition meets trend.
                        </p>
                    </div>
                    {/* Gradient fade overlay when collapsed */}
                    {!showMore && (
                        <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    )}
                </div>
                <button
                    onClick={() => setShowMore(!showMore)}
                    className="text-[#c62828] text-sm font-medium hover:underline focus:outline-none mt-3"
                >
                    {showMore ? 'Read Less' : 'Read More'}
                </button>
            </div>
        </section>
    );
}

/* ──────────────── HOMEPAGE ──────────────── */
export default function HomePage() {
    // Shared state
    const [banners, setBanners] = useState([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [specialCollections, setSpecialCollections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const safeFetch = async (url: string) => {
            try {
                const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
                return await res.json();
            } catch (e) {
                console.warn(`[Storefront] Failed to fetch ${url}:`, e);
                return null;
            }
        };

        const fetchAll = async () => {
            try {
                const [bannersData, categoriesData, sectionsData, trendingData, specialCollectionsData] = await Promise.all([
                    safeFetch(`${API_BASE}/public/banners`),
                    safeFetch(`${API_BASE}/public/categories`),
                    safeFetch(`${API_BASE}/public/sections`),
                    safeFetch(`${API_BASE}/storefront/trending-products`),
                    safeFetch(`${API_BASE}/public/special-collections`),
                ]);

                if (bannersData?.success || bannersData?.status) {
                    const sorted = (bannersData.data || [])
                        .filter((b: any) => b.isActive)
                        .sort((a: any, b: any) => a.order - b.order);
                    setBanners(sorted);
                }
                if (categoriesData?.success || categoriesData?.status) {
                    setCategories(categoriesData.data || []);
                }
                if (sectionsData?.success || sectionsData?.status) {
                    setSections(sectionsData.data || []);
                }
                if (trendingData?.success || trendingData?.status) {
                    setTrendingProducts(trendingData.data || []);
                }
                if (specialCollectionsData?.success || specialCollectionsData?.status) {
                    setSpecialCollections((specialCollectionsData.data || []).filter((sc: any) => sc.isActive));
                }

            } catch (e) {
                console.error("Failed to fetch storefront data", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAll();
    }, []);


    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-[var(--brand-pink)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Find the Mens section and filter categories that belong to it
    const mensSection = sections.find((s: any) => s.name?.toLowerCase().includes('men') && !s.name?.toLowerCase().includes('women'));
    const mensCategories = mensSection
        ? categories.filter((c: any) => c.sectionId === mensSection._id || String(c.sectionId) === String(mensSection._id))
        : [];

    // Find the Womens section and filter categories that belong to it
    const womensSection = sections.find((s: any) => s.name?.toLowerCase().includes('women'));
    const womensCategories = womensSection
        ? categories.filter((c: any) => c.sectionId === womensSection._id || String(c.sectionId) === String(womensSection._id))
        : [];

    return (
        <>
            <HeroCarousel banners={banners} />
            {/* Men's Category Grid */}
            <CategoryGrid
                categories={mensCategories.length > 0 ? mensCategories : categories}
                title={mensCategories.length > 0 ? "Shop Men's Ethnic Wear" : "Shop By Category"}
            />

            {/* Video Shopping CTA */}
            <VideoShoppingCTA />

            {/* Women's Category Grid */}
            {womensCategories.length > 0 && (
                <CategoryGrid
                    categories={womensCategories}
                    title="Shop Women's Ethnic Wear"
                />
            )}

            <StyleShowcase />

            {/* Dynamic Curated Price Segments Block */}
            <SpecialCollectionsGrid collections={specialCollections} />

            {/* Trending Products */}
            <TrendingProducts products={trendingProducts} />

            <SeoBrandSection />
        </>
    );
}
