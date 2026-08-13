"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, User, ShoppingBag, Menu, X, ChevronDown, Check, Heart } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useCurrency, CurrencyCode } from "../../context/CurrencyContext";
import { useWishlist } from "../../context/WishlistContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Category {
    _id: string;
    name: string;
    slug?: string;
    sectionId?: string | { _id: string };
    image?: { url: string };
    subcategories?: Category[];
}

interface Section {
    _id: string;
    name: string;
    slug?: string;
}

export default function Header() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [categorySearch, setCategorySearch] = useState("");
    const { cartCount, setIsCartOpen } = useCart();
    const { user, setIsLoginOpen } = useAuth();
    const { currency, setCurrency, isLoading } = useCurrency();
    const { wishlistIds } = useWishlist();
    const router = useRouter();
    const headerRef = useRef<HTMLElement>(null);
    const [headerHeight, setHeaderHeight] = useState(96);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const openMegaMenu = (key: string) => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        setActiveDropdown(key);
    };

    const scheduleMegaMenuClose = () => {
        closeTimerRef.current = setTimeout(() => setActiveDropdown(null), 120);
    };

    const cancelMegaMenuClose = () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };

    useEffect(() => {
        const updateHeight = () => {
            if (headerRef.current) {
                // Use .bottom (not .height) so announcement bar above the header is included
                setHeaderHeight(headerRef.current.getBoundingClientRect().bottom);
            }
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        window.addEventListener('scroll', updateHeight, { passive: true });
        return () => {
            window.removeEventListener('resize', updateHeight);
            window.removeEventListener('scroll', updateHeight);
        };
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setIsSearchOpen(false);
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery("");
        }
    };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE}/public/categories`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                });
                const data = await res.json();
                if (data.success) {
                    setCategories(data.data || []);
                }
            } catch (e) {
                console.error("Failed to fetch categories", e);
            }
        };
        const fetchSections = async () => {
            try {
                const res = await fetch(`${API_BASE}/public/sections`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                });
                const data = await res.json();
                if (data.success) {
                    setSections(data.data || []);
                }
            } catch (e) {
                console.error("Failed to fetch sections", e);
            }
        };
        fetchCategories();
        fetchSections();
    }, []);

    // Get only top-level categories (no parent) — was incorrectly checking
    // `parentCategory` (a field that doesn't exist) instead of `parentCategoryId`,
    // so every subcategory was being treated as top-level.
    const topCategories = categories.filter((c: any) => !c.parentCategoryId);

    const sectionId = (cat: Category) => (typeof cat.sectionId === 'object' ? cat.sectionId?._id : cat.sectionId);
    const categoriesForSection = (section: Section) =>
        topCategories.filter((cat) => sectionId(cat) === section._id);

    // Prefer the backend-generated `slug` (already strips special characters
    // like "&" consistently) over re-deriving one from `name` on the fly —
    // a name like "Suits & Dress" would otherwise produce a raw "&" in the
    // URL that can end up percent-encoded ("%26") and fail to match the
    // collection page's lookup. Fallback only covers stale data with no slug.
    const collectionHref = (item: { name: string; slug?: string }) =>
        `/collections/${item.slug || item.name.toLowerCase().replace(/\s+/g, "-")}`;

    return (
        <header
            ref={headerRef}
            className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${scrolled ? "shadow-md" : ""
                }`}
        >
            <div className="px-4 sm:px-6 lg:px-8">
                {/* Single Row: Logo (Left), Nav Categories (center-left), Search Bar, Icons (Right) */}
                <div className="flex items-center gap-3 sm:gap-6 py-3 sm:py-4">

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="lg:hidden text-[var(--text-primary)] p-2 -ml-2 hover:text-[var(--brand-pink)]"
                        aria-label="Open menu"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Logo (left) */}
                    <Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex-shrink-0">
                        <img src="/Logo.png" alt="Shubhlaxmi" className="h-10 sm:h-14 lg:h-16 w-auto object-contain" />
                    </Link>

                    {/* Nav Categories (desktop, positioned right after the logo) */}
                    <nav className="hidden lg:flex items-center gap-6 flex-shrink-0">
                        {/* Section-level nav (Mens / Womens / Kids) — each reveals a mega menu.
                    Categories with subcategories get their own column (nested list);
                    categories with none are grouped into one compact link row instead
                    of wasting a whole empty column each — most categories only have
                    0-2 subcategories in practice.
                    A section with zero categories still renders as a plain link
                    (instead of being hidden) so newly-created sections are visible
                    in the header right away, before any category has been assigned. */}
                {sections.map((section) => {
                    const sectionCategories = categoriesForSection(section);
                    const sectionHref = collectionHref(section);

                    if (sectionCategories.length === 0) {
                        return (
                            <Link
                                key={section._id}
                                href={sectionHref}
                                className="text-[12px] font-[var(--font-nav)] font-bold uppercase tracking-wide text-[var(--text-primary)] hover:text-[#ea2083]"
                            >
                                {section.name}
                            </Link>
                        );
                    }
                    const dropdownKey = `section-${section._id}`;

                    const withSubs = sectionCategories
                        .map((cat) => ({ cat, subCategories: categories.filter((sub: any) => sub.parentCategoryId === cat._id) }))
                        .filter((g) => g.subCategories.length > 0);
                    const standalone = sectionCategories.filter(
                        (cat) => !categories.some((sub: any) => sub.parentCategoryId === cat._id)
                    );

                    return (
                        <div
                            key={section._id}
                            className="relative group"
                            onMouseEnter={() => openMegaMenu(dropdownKey)}
                            onMouseLeave={scheduleMegaMenuClose}
                        >
                            <button className="flex items-center gap-1 text-[12px] font-[var(--font-nav)] font-bold uppercase tracking-wide text-[var(--text-primary)] hover:text-[#ea2083] focus:outline-none">
                                {section.name}
                                <ChevronDown size={12} className="transition-transform group-hover:rotate-180 opacity-50" />
                            </button>

                            <div
                                className={`fixed left-0 w-screen bg-white border-t border-gray-100 z-50 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out origin-top ${
                                    activeDropdown === dropdownKey
                                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                                        : 'opacity-0 -translate-y-3 pointer-events-none'
                                }`}
                                style={{ top: headerHeight }}
                                onMouseEnter={cancelMegaMenuClose}
                                onMouseLeave={scheduleMegaMenuClose}
                            >
                                <div className="max-w-[1400px] mx-auto px-8 py-8">
                                    <div className="flex items-center justify-between mb-7">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-5 bg-[var(--brand-pink)] rounded-full" />
                                            <span className="text-[11px] font-bold tracking-[0.25em] text-gray-500 uppercase">Shop {section.name}</span>
                                        </div>
                                        <Link
                                            href={collectionHref(section)}
                                            onClick={() => setActiveDropdown(null)}
                                            className="text-[12px] text-[var(--brand-pink)] font-semibold tracking-wide flex items-center gap-1 group/link hover:underline"
                                        >
                                            See All {section.name}
                                            <span className="inline-block transition-transform group-hover/link:translate-x-1">→</span>
                                        </Link>
                                    </div>

                                    <div className="flex gap-12">
                                        {/* Main content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Categories with subcategories — one column each, small thumbnail + nested list */}
                                            {withSubs.length > 0 && (
                                                <div className="grid gap-x-8 gap-y-8 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 200px))' }}>
                                                    {withSubs.map(({ cat, subCategories }) => (
                                                        <div key={cat._id}>
                                                            <Link
                                                                href={collectionHref(cat)}
                                                                onClick={() => setActiveDropdown(null)}
                                                                className="group/cat flex items-center gap-2.5 mb-3.5"
                                                            >
                                                                <span className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                                                                    {cat.image?.url && (
                                                                        <img src={cat.image.url} alt={cat.name} className="w-full h-full object-cover" />
                                                                    )}
                                                                </span>
                                                                <span className="text-[13px] font-bold text-gray-900 uppercase tracking-wide group-hover/cat:text-[var(--brand-pink)] transition-colors">
                                                                    {cat.name}
                                                                </span>
                                                            </Link>
                                                            <div className="space-y-2.5 pl-[46px]">
                                                                <Link
                                                                    href={collectionHref(cat)}
                                                                    onClick={() => setActiveDropdown(null)}
                                                                    className="block text-[13px] text-[var(--brand-pink)] font-semibold hover:underline"
                                                                >
                                                                    See All {cat.name}
                                                                </Link>
                                                                {subCategories.map((sub: any) => (
                                                                    <Link
                                                                        key={sub._id}
                                                                        href={collectionHref(sub)}
                                                                        onClick={() => setActiveDropdown(null)}
                                                                        className="block text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors"
                                                                    >
                                                                        {sub.name}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Categories with no subcategories — image tile grid */}
                                            {standalone.length > 0 && (
                                                <div className={withSubs.length > 0 ? 'pt-7 border-t border-gray-100' : ''}>
                                                    <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 150px))' }}>
                                                        {standalone.map((cat) => (
                                                            <Link
                                                                key={cat._id}
                                                                href={collectionHref(cat)}
                                                                onClick={() => setActiveDropdown(null)}
                                                                className="group/tile flex flex-col items-center gap-2.5 text-center"
                                                            >
                                                                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 relative shadow-sm group-hover/tile:shadow-md transition-shadow duration-300">
                                                                    {cat.image?.url ? (
                                                                        <img
                                                                            src={cat.image.url}
                                                                            alt={cat.name}
                                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover/tile:scale-110"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-100">
                                                                            <span className="text-3xl font-bold text-[var(--brand-pink)] opacity-20 select-none">
                                                                                {cat.name.charAt(0).toUpperCase()}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/tile:opacity-100 transition-opacity duration-300" />
                                                                </div>
                                                                <span className="text-[12.5px] font-semibold text-gray-800 group-hover/tile:text-[var(--brand-pink)] transition-colors leading-tight">
                                                                    {cat.name}
                                                                </span>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Promo panel */}
                                        {sectionCategories[0]?.image?.url && (
                                            <Link
                                                href={collectionHref(section)}
                                                onClick={() => setActiveDropdown(null)}
                                                className="group/promo hidden lg:block w-[190px] xl:w-[230px] 2xl:w-[280px] shrink-0 relative rounded-xl overflow-hidden shadow-md"
                                            >
                                                <img
                                                    src={sectionCategories[0].image.url}
                                                    alt={section.name}
                                                    className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover/promo:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                                <div className="relative h-full min-h-[280px] flex flex-col justify-end p-5">
                                                    <p className="text-white/80 text-[11px] font-semibold tracking-[0.2em] uppercase mb-1">New Season</p>
                                                    <h3 className="text-white text-xl font-[var(--font-heading)] mb-3">{section.name} Collection</h3>
                                                    <span className="inline-flex items-center gap-1.5 text-white text-[11px] font-bold tracking-widest uppercase border border-white/70 rounded-full px-3.5 py-1.5 w-fit group-hover/promo:bg-white group-hover/promo:text-gray-900 transition-colors">
                                                        Shop Now
                                                    </span>
                                                </div>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <Link
                    href="/video-appointment"
                    className="text-[12px] font-[var(--font-nav)] font-bold uppercase tracking-wide text-[var(--text-primary)] hover:text-[#ea2083]"
                >
                    Live Video Shopping
                </Link>
                <Link
                    href="/pages/contact"
                    className="text-[12px] font-[var(--font-nav)] font-bold uppercase tracking-wide text-[var(--text-primary)] hover:text-[#ea2083]"
                >
                    Contact Us
                </Link>
                    </nav>

                    {/* Search Bar (desktop, persistent) — pushed next to the icon
                        cluster on the far right, instead of stretching to fill
                        the middle of the row, so it sits right beside currency/
                        user/wishlist/cart rather than floating in empty space. */}
                    <form onSubmit={handleSearchSubmit} className="hidden lg:flex w-64 xl:w-80 relative ml-auto">
                        <input
                            type="text"
                            name="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for sarees, lehengas, kurtis..."
                            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-pink)] focus:border-[var(--brand-pink)] font-[var(--font-body)] transition-all"
                        />
                        <button
                            type="submit"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--brand-pink)] transition-colors"
                            aria-label="Search"
                        >
                            <Search size={18} />
                        </button>
                    </form>

                    {/* Right: Icons */}
                    <div className="flex items-center gap-4 sm:gap-6 ml-auto lg:ml-0">
                        <div className="relative hidden lg:block">
                            <button
                                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                                className="flex items-center gap-1.5 text-xs font-bold text-gray-700 tracking-wider cursor-pointer hover:text-[var(--brand-pink)] transition-colors focus:outline-none"
                            >
                                <span className={`transition-opacity flex items-center gap-1.5 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                                    <span className="w-4 h-4 flex items-center justify-center rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                                        <img
                                            src={`https://flagcdn.com/${{ "INR": "in", "USD": "us", "EUR": "eu", "GBP": "gb", "AUD": "au", "CAD": "ca" }[currency]}.svg`}
                                            alt={currency}
                                            className="w-full h-full object-cover"
                                        />
                                    </span>
                                    <span>{currency}</span>
                                </span>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Currency Dropdown */}
                            {isCurrencyOpen && (
                                <div className="absolute top-8 right-0 bg-white shadow-xl border border-gray-100 rounded-md py-2 w-[120px] z-50 animate-in fade-in zoom-in-95 duration-200">
                                    {(["INR", "USD", "EUR", "GBP", "AUD", "CAD"] as CurrencyCode[]).map((c) => {
                                        const countryCodes: Record<string, string> = {
                                            "INR": "in",
                                            "USD": "us",
                                            "EUR": "eu",
                                            "GBP": "gb",
                                            "AUD": "au",
                                            "CAD": "ca"
                                        };
                                        return (
                                            <button
                                                key={c}
                                                onClick={() => {
                                                    setCurrency(c);
                                                    setIsCurrencyOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-xs font-medium tracking-wider flex items-center justify-between hover:bg-gray-50 transition-colors ${currency === c ? 'text-[var(--brand-pink)]' : 'text-gray-600 hover:text-gray-900'}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="w-4 h-4 flex items-center justify-center rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                                                        <img
                                                            src={`https://flagcdn.com/${countryCodes[c]}.svg`}
                                                            alt={c}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </span>
                                                    {c}
                                                </span>
                                                {currency === c && <Check size={14} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className={`transition-colors lg:hidden ${isSearchOpen ? 'text-[var(--brand-pink)]' : 'text-[var(--text-primary)] hover:text-[var(--brand-pink)]'}`}
                            aria-label="Toggle Search"
                        >
                            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                        </button>
                        {user ? (
                            <Link href="/profile" className="text-[var(--text-primary)] hover:text-[var(--brand-pink)] transition-colors flex items-center gap-2" aria-label="Account">
                                <div className="w-6 h-6 bg-[var(--brand-pink)] rounded-full text-white flex items-center justify-center text-xs font-bold">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="text-[var(--text-primary)] hover:text-[var(--brand-pink)] transition-colors flex items-center"
                                aria-label="Login"
                            >
                                <User size={20} />
                            </Link>
                        )}
                        <Link
                            href="/profile/wishlist"
                            className="relative text-[var(--text-primary)] hover:text-[var(--brand-pink)] transition-colors"
                            aria-label="Wishlist"
                        >
                            <Heart size={20} />
                            {wishlistIds.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-[var(--brand-pink)] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                    {wishlistIds.length}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative text-[var(--text-primary)] hover:text-[var(--brand-pink)] transition-colors"
                            aria-label="Cart"
                        >
                            <ShoppingBag size={20} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-[var(--brand-pink)] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Dropdown */}
            {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 bg-white shadow-md border-t border-gray-100 z-50 py-6 px-4 sm:px-6 lg:px-8">
                    <form onSubmit={handleSearchSubmit} className="max-w-7xl mx-auto w-full relative flex items-center">
                        <input
                            type="text"
                            name="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for sarees, lehengas, kurtis..."
                            className="w-full pl-6 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-full text-base sm:text-lg focus:outline-none focus:ring-1 focus:ring-[var(--brand-pink)] focus:border-[var(--brand-pink)] font-[var(--font-body)] transition-all shadow-sm"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="absolute right-5 p-2 text-gray-400 hover:text-[var(--brand-pink)] transition-colors"
                        >
                            <Search size={24} />
                        </button>
                    </form>
                </div>
            )}

            {/* Mobile Menu Drawer Overlay */}
            <div 
                className={`lg:hidden fixed inset-0 bg-black/60 z-[90] transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
                onClick={() => setMobileMenuOpen(false)}
            />

            {/* Mobile Menu Drawer */}
            <div className={`lg:hidden fixed top-0 left-0 h-[100dvh] w-[85vw] max-w-[400px] bg-white shadow-2xl z-[100] flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                    <img src="/Logo.png" alt="Shubhlaxmi" className="h-8 sm:h-10 w-auto object-contain" />
                    <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-gray-400 hover:text-[var(--brand-pink)] transition-colors rounded-full hover:bg-gray-50">
                        <X size={24} />
                    </button>
                </div>

                {/* Drawer Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Top action bar in mobile drawer: Currency Selector */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative">
                            <button
                                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-800 tracking-wider focus:outline-none"
                            >
                                <span className={`flex items-center gap-2 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                                    <span className="w-5 h-5 flex items-center justify-center rounded-full overflow-hidden border border-gray-200 bg-white">
                                        <img src={`https://flagcdn.com/${{ "INR": "in", "USD": "us", "EUR": "eu", "GBP": "gb", "AUD": "au", "CAD": "ca" }[currency]}.svg`} alt={currency} className="w-full h-full object-cover" />
                                    </span>
                                    {currency}
                                </span>
                                <ChevronDown size={16} className={`text-gray-500 transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isCurrencyOpen && (
                                <div className="absolute top-full left-0 mt-2 bg-white shadow-lg border border-gray-100 rounded-md py-2 w-[180px] z-[60]">
                                    {(["INR", "USD", "EUR", "GBP", "AUD", "CAD"] as CurrencyCode[]).map((c) => {
                                        const countryCodes: Record<string, string> = { "INR": "in", "USD": "us", "EUR": "eu", "GBP": "gb", "AUD": "au", "CAD": "ca" };
                                        return (
                                            <button
                                                key={c}
                                                onClick={() => { setCurrency(c); setIsCurrencyOpen(false); }}
                                                className={`w-full text-left px-4 py-3 text-sm font-medium tracking-wide flex items-center gap-3 hover:bg-gray-50 transition-colors ${currency === c ? 'text-[var(--brand-pink)]' : 'text-gray-700'}`}
                                            >
                                                <span className="w-5 h-5 flex items-center justify-center rounded-full overflow-hidden border border-gray-200 bg-white shadow-sm flex-shrink-0">
                                                    <img src={`https://flagcdn.com/${countryCodes[c]}.svg`} alt={c} className="w-full h-full object-cover" />
                                                </span>
                                                <span className="flex-1">{c}</span>
                                                {currency === c && <Check size={16} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Menu Links */}
                    <div className="px-6 py-2 pb-24">
                        {/* Category Search Bar */}
                        <div className="mt-4 mb-4 relative">
                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-pink)] focus:border-[var(--brand-pink)] transition-all"
                            />
                            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>

                        {/* Sections (Mens/Womens/Kids) as top-level accordions, each revealing its categories */}
                        {sections.map((section) => {
                            const allSectionCategories = categoriesForSection(section);
                            const sectionCategories = allSectionCategories.filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase()));
                            const sectionKey = `mobile-section-${section._id}`;

                            // Section has no categories at all yet — show as a plain link
                            // instead of hiding it (matches desktop behavior).
                            if (allSectionCategories.length === 0) {
                                if (categorySearch.trim()) return null;
                                return (
                                    <Link
                                        key={section._id}
                                        href={collectionHref(section)}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-4 text-[17px] font-bold text-gray-900 font-[var(--font-nav)] tracking-wide uppercase border-b border-gray-100"
                                    >
                                        {section.name}
                                    </Link>
                                );
                            }

                            // Section has categories, but none match the current search filter.
                            if (sectionCategories.length === 0) return null;

                            return (
                                <div key={section._id} className="border-b border-gray-100">
                                    <button
                                        onClick={() => setActiveDropdown(activeDropdown === sectionKey ? null : sectionKey)}
                                        className="w-full flex items-center justify-between py-4 text-[17px] font-bold text-gray-900 font-[var(--font-nav)] tracking-wide uppercase"
                                    >
                                        {section.name}
                                        <ChevronDown size={18} className={`text-gray-400 transition-transform ${activeDropdown === sectionKey ? 'rotate-180' : ''}`} />
                                    </button>

                                    {activeDropdown === sectionKey && (
                                        <div className="pb-3">
                                            <Link href={collectionHref(section)} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[15px] font-semibold text-[var(--brand-pink)] font-[var(--font-body)]">
                                                View All {section.name}
                                            </Link>
                                            {sectionCategories.map((cat) => {
                                                const subCategories = categories.filter((sub: any) => sub.parentCategoryId === cat._id);
                                                const hasSubCategories = subCategories.length > 0;
                                                const catKey = `mobile-cat-${cat._id}`;

                                                if (hasSubCategories) {
                                                    return (
                                                        <div key={cat._id} className="border-t border-gray-50">
                                                            <button
                                                                onClick={() => setActiveDropdown(activeDropdown === catKey ? null : catKey)}
                                                                className="w-full flex items-center justify-between py-3 text-[15px] font-medium text-gray-800 font-[var(--font-body)]"
                                                            >
                                                                <span className="flex items-center gap-3">
                                                                    {cat.image?.url ? (
                                                                        <img src={cat.image.url} alt={cat.name} className="w-8 h-8 rounded-full object-cover shadow-sm border border-slate-200" />
                                                                    ) : (
                                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center text-[var(--brand-pink)] font-bold text-sm shadow-sm border border-pink-200">
                                                                            {cat.name.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                    {cat.name}
                                                                </span>
                                                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${activeDropdown === catKey ? 'rotate-180' : ''}`} />
                                                            </button>
                                                            {activeDropdown === catKey && (
                                                                <div className="pb-3 pl-4 space-y-3">
                                                                    <Link href={collectionHref(cat)} onClick={() => setMobileMenuOpen(false)} className="block text-[14px] font-semibold text-[var(--brand-pink)] font-[var(--font-body)]">
                                                                        View All {cat.name}
                                                                    </Link>
                                                                    {subCategories.map((sub: any) => (
                                                                        <Link key={sub._id} href={collectionHref(sub)} onClick={() => setMobileMenuOpen(false)} className="block text-[14px] text-gray-600 font-[var(--font-body)]">
                                                                            {sub.name}
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <Link
                                                        key={cat._id}
                                                        href={collectionHref(cat)}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="flex items-center gap-3 py-3 border-t border-gray-50"
                                                    >
                                                        {cat.image?.url ? (
                                                            <img src={cat.image.url} alt={cat.name} className="w-8 h-8 rounded-full object-cover shadow-sm border border-slate-200" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center text-[var(--brand-pink)] font-bold text-sm shadow-sm border border-pink-200">
                                                                {cat.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <span className="text-[15px] font-medium text-gray-800 font-[var(--font-body)]">
                                                            {cat.name}
                                                        </span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Additional links from Desktop menu */}
                        <Link href="/video-appointment" onClick={() => setMobileMenuOpen(false)} className="block py-4 text-[15px] font-bold uppercase text-gray-900 border-b border-gray-100 font-[var(--font-nav)] tracking-wide">
                            Live Video Shopping
                        </Link>
                        <Link href="/pages/contact" onClick={() => setMobileMenuOpen(false)} className="block py-4 text-[15px] font-bold uppercase text-gray-900 border-b border-gray-100 font-[var(--font-nav)] tracking-wide">
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}

