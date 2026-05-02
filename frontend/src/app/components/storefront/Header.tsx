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
    image?: { url: string };
    subcategories?: Category[];
}

export default function Header() {
    const [categories, setCategories] = useState<Category[]>([]);
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

    const openMegaMenu = () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        setActiveDropdown('new-arrivals');
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
        fetchCategories();
    }, []);

    // Get only top-level categories (no parent)
    const topCategories = categories.filter((c: any) => !c.parentCategory || c.parentCategory === "");

    return (
        <header
            ref={headerRef}
            className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${scrolled ? "shadow-md" : ""
                }`}
        >
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Row: Search/Menu (Left), Logo (Center), Icons (Right) */}
                <div className="flex items-center justify-between h-16 sm:h-24 pb-2 pt-4">

                    {/* Left: Mobile Menu & Desktop Search */}
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden text-[var(--text-primary)] p-2 -ml-2 hover:text-[var(--brand-pink)]"
                            aria-label="Open menu"
                        >
                            <Menu size={24} />
                        </button>
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className={`transition-colors hidden sm:block ${isSearchOpen ? 'text-[var(--brand-pink)]' : 'text-[var(--text-primary)] hover:text-[var(--brand-pink)]'}`}
                            aria-label="Toggle Search"
                        >
                            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                        </button>
                    </div>

                    {/* Center: Logo */}
                    <Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex-shrink-0 mx-4 text-center flex-1 flex justify-center flex-col items-center">
                        <img src="/Logo.png" alt="Shubhlaxmi" className="h-10 sm:h-14 lg:h-16 w-auto object-contain" />
                    </Link>

                    {/* Right: Icons */}
                    <div className="flex items-center gap-4 sm:gap-6 flex-1 justify-end">
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
                            className={`transition-colors sm:hidden ${isSearchOpen ? 'text-[var(--brand-pink)]' : 'text-[var(--text-primary)] hover:text-[var(--brand-pink)]'}`}
                            aria-label="Toggle Search"
                        >
                            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                        </button>
                        {user ? (
                            <Link href="/profile" className="text-[var(--text-primary)] hover:text-[var(--brand-pink)] transition-colors hidden sm:flex items-center gap-2" aria-label="Account">
                                <div className="w-6 h-6 bg-[var(--brand-pink)] rounded-full text-white flex items-center justify-center text-xs font-bold">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                            </Link>
                        ) : (
                            <button
                                onClick={() => setIsLoginOpen(true)}
                                className="text-[var(--text-primary)] hover:text-[var(--brand-pink)] transition-colors hidden sm:block"
                                aria-label="Login"
                            >
                                <User size={20} />
                            </button>
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

            {/* Bottom Row: Navigation (Desktop only) */}
            <nav className="hidden lg:flex items-center justify-center gap-6 py-2 pb-4">
                {/* New Arrivals — Animated Horizontal Scroll Mega Menu */}
                <div
                    className="relative group"
                    onMouseEnter={openMegaMenu}
                    onMouseLeave={scheduleMegaMenuClose}
                >
                    <button className="flex items-center gap-1 text-[13px] font-[var(--font-body)] text-[var(--text-primary)] hover:text-[#ea2083] tracking-wide focus:outline-none">
                        New Arrivals <ChevronDown size={12} className="transition-transform group-hover:rotate-180 opacity-50" />
                    </button>

                    <div
                        className={`fixed left-0 w-screen bg-white border-t border-gray-100 z-50 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out origin-top ${
                            activeDropdown === 'new-arrivals'
                                ? 'opacity-100 translate-y-0 pointer-events-auto'
                                : 'opacity-0 -translate-y-3 pointer-events-none'
                        }`}
                        style={{ top: headerHeight }}
                        onMouseEnter={cancelMegaMenuClose}
                        onMouseLeave={scheduleMegaMenuClose}
                    >
                        <div className="max-w-[1400px] mx-auto px-8 py-6">
                            {/* Header row */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-5 bg-[var(--brand-pink)] rounded-full" />
                                    <span className="text-[11px] font-bold tracking-[0.25em] text-gray-500 uppercase">Shop by Category</span>
                                </div>
                                <Link
                                    href="/categories"
                                    onClick={() => setActiveDropdown(null)}
                                    className="text-[12px] text-[var(--brand-pink)] font-semibold tracking-wide flex items-center gap-1 group/link hover:underline"
                                >
                                    View All
                                    <span className="inline-block transition-transform group-hover/link:translate-x-1">→</span>
                                </Link>
                            </div>

                            {/* Horizontal scroll row */}
                            <div
                                className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {topCategories.map((cat, i) => (
                                    <Link
                                        key={cat._id}
                                        href={`/collections/${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                                        className="group/cat flex-shrink-0 flex flex-col items-center gap-2.5 text-center"
                                        style={{
                                            animationDelay: `${i * 40}ms`,
                                            animation: activeDropdown === 'new-arrivals' ? 'fadeSlideUp 0.35s ease forwards' : 'none',
                                            opacity: activeDropdown === 'new-arrivals' ? undefined : 0,
                                        }}
                                    >
                                        {/* Card */}
                                        <div className="w-[130px] aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 relative shadow-sm group-hover/cat:shadow-lg transition-shadow duration-300">
                                            {cat.image?.url ? (
                                                <img
                                                    src={cat.image.url}
                                                    alt={cat.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/cat:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-100">
                                                    <span className="text-5xl font-bold text-[var(--brand-pink)] opacity-20 select-none">
                                                        {cat.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Bottom gradient overlay with "Shop Now" */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/cat:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
                                                <span className="text-white text-[10px] font-bold tracking-[0.15em] uppercase border border-white/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
                                                    Shop Now
                                                </span>
                                            </div>
                                        </div>

                                        {/* Name */}
                                        <span className="text-[12px] font-medium text-gray-700 group-hover/cat:text-[var(--brand-pink)] transition-colors duration-200 leading-tight max-w-[120px]">
                                            {cat.name}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Keyframe style */}
                        <style>{`
                            @keyframes fadeSlideUp {
                                from { opacity: 0; transform: translateY(10px); }
                                to   { opacity: 1; transform: translateY(0); }
                            }
                            .scrollbar-hide::-webkit-scrollbar { display: none; }
                        `}</style>
                    </div>
                </div>
                {topCategories.slice(0, 5).map((cat) => {
                    const subCategories = categories.filter((sub: any) => sub.parentCategoryId === cat._id);
                    const hasSubCategories = subCategories.length > 0;

                    return (
                        <div
                            key={cat._id}
                            className="relative group"
                            onMouseEnter={() => hasSubCategories ? setActiveDropdown(cat._id) : undefined}
                            onMouseLeave={() => setActiveDropdown(null)}
                        >
                            {/* If no subcategories, render as a plain link */}
                            {!hasSubCategories ? (
                                <Link
                                    href={`/collections/${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
                                    className="flex items-center gap-1 text-[13px] font-[var(--font-body)] text-[var(--text-primary)] hover:text-[#ea2083] tracking-wide"
                                >
                                    {cat.name}
                                </Link>
                            ) : (
                                <button className="flex items-center gap-1 text-[13px] font-[var(--font-body)] text-[var(--text-primary)] hover:text-[#ea2083] tracking-wide focus:outline-none">
                                    {cat.name}
                                    <ChevronDown size={12} className="transition-transform group-hover:rotate-180 opacity-50" />
                                </button>
                            )}

                            {/* Standard Dropdown */}
                            {activeDropdown === cat._id && hasSubCategories && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-b-lg border border-gray-100 py-4 px-6 min-w-[220px] z-50">
                                    <Link
                                        href={`/collections/${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
                                        className="block text-sm font-bold text-[#ea2083] mb-3 font-[var(--font-body)] border-b border-gray-100 pb-2"
                                    >
                                        See All {cat.name}
                                    </Link>
                                    {subCategories.map((sub: any) => (
                                        <Link
                                            key={sub._id}
                                            href={`/collections/${sub.name.toLowerCase().replace(/\s+/g, "-")}`}
                                            className="block py-1.5 text-[13px] text-gray-600 hover:text-[#ea2083] font-[var(--font-body)]"
                                        >
                                            {sub.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                <Link
                    href="/video-appointment"
                    className="text-[13px] font-[var(--font-body)] text-[var(--text-primary)] hover:text-[#ea2083] tracking-wide"
                >
                    Live Video Shopping
                </Link>
                <Link
                    href="/collections/budget-friendly"
                    className="text-[13px] font-[var(--font-body)] text-[var(--text-primary)] hover:text-[#ea2083] tracking-wide"
                >
                    Budget Friendly
                </Link>
                <Link
                    href="/collections/1000-sarees"
                    className="text-[13px] font-[var(--font-body)] text-[var(--text-primary)] hover:text-[#ea2083] tracking-wide"
                >
                    Under ₹1000
                </Link>
            </nav>

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

                        {/* Top Categories from API mapped with accordions */}
                        {topCategories.filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase())).map((cat) => {
                            const subCategories = categories.filter((sub: any) => sub.parentCategoryId === cat._id);
                            const hasSubCategories = subCategories.length > 0;
                            const isMegaMenu = cat.name.toLowerCase() === 'saree' || cat.name.toLowerCase() === 'sarees' || cat.name.toLowerCase().includes('salwar');
                            
                            if (isMegaMenu || hasSubCategories) {
                                return (
                                    <div key={cat._id} className="border-b border-gray-100">
                                        <button
                                            onClick={() => setActiveDropdown(activeDropdown === `mobile-${cat._id}` ? null : `mobile-${cat._id}`)}
                                            className="w-full flex items-center justify-between py-4 text-[17px] font-medium text-gray-800 font-[var(--font-heading)] tracking-wide"
                                        >
                                            <div className="flex items-center gap-4">
                                                {cat.image?.url ? (
                                                    <img src={cat.image.url} alt={cat.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center text-[var(--brand-pink)] font-bold shadow-sm border border-pink-200">
                                                        {cat.name.charAt(0)}
                                                    </div>
                                                )}
                                                <span>{cat.name}</span>
                                            </div>
                                            <ChevronDown size={18} className={`text-gray-400 transition-transform ${activeDropdown === `mobile-${cat._id}` ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {activeDropdown === `mobile-${cat._id}` && (
                                            <div className="pb-4 pl-4 space-y-4">
                                                <Link href={`/collections/${cat.name.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setMobileMenuOpen(false)} className="block text-[15px] font-semibold text-[var(--brand-pink)] font-[var(--font-body)]">
                                                    View All {cat.name}
                                                </Link>
                                                {subCategories.map((sub: any) => (
                                                    <Link key={sub._id} href={`/collections/${sub.name.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-gray-600 font-[var(--font-body)]">
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
                                    href={`/collections/${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-4 py-4 border-b border-gray-100"
                                >
                                    {cat.image?.url ? (
                                        <img src={cat.image.url} alt={cat.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center text-[var(--brand-pink)] font-bold shadow-sm border border-pink-200">
                                            {cat.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-[17px] font-medium text-gray-800 font-[var(--font-heading)] tracking-wide">
                                        {cat.name}
                                    </span>
                                </Link>
                            );
                        })}

                        {/* Additional links from Desktop menu */}
                        <Link href="/video-appointment" onClick={() => setMobileMenuOpen(false)} className="block py-4 text-[17px] font-medium text-gray-800 border-b border-gray-100 font-[var(--font-heading)] tracking-wide">
                            Live Video Shopping
                        </Link>
                        <Link href="/collections/budget-friendly" onClick={() => setMobileMenuOpen(false)} className="block py-4 text-[17px] font-medium text-gray-800 border-b border-gray-100 font-[var(--font-heading)] tracking-wide">
                            Budget Friendly
                        </Link>
                        <Link href="/collections/1000-sarees" onClick={() => setMobileMenuOpen(false)} className="block py-4 text-[17px] font-medium text-gray-800 border-b border-gray-100 font-[var(--font-heading)] tracking-wide">
                            Under ₹1000
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}

