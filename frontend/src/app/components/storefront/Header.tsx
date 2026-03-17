"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, User, ShoppingBag, Menu, X, ChevronDown, Check } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useCurrency, CurrencyCode } from "../../context/CurrencyContext";

const API_BASE = "http://localhost:5000/api";

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
    const { cartCount, setIsCartOpen } = useCart();
    const { user, setIsLoginOpen } = useAuth();
    const { currency, setCurrency, isLoading } = useCurrency();
    const router = useRouter();

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
            className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${scrolled ? "shadow-md" : ""
                }`}
        >
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Row: Search/Menu (Left), Logo (Center), Icons (Right) */}
                <div className="flex items-center justify-between h-16 sm:h-24 pb-2 pt-4">

                    {/* Left: Mobile Menu & Desktop Search */}
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden text-[var(--text-primary)] p-2 -ml-2"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
                    <Link href="/" className="flex-shrink-0 mx-4 text-center flex-1 flex justify-center flex-col items-center">
                        <h1 className="text-3xl sm:text-4xl font-[var(--font-heading)] text-[#ea2083] tracking-widest font-normal drop-shadow-sm lowercase flex items-center gap-1">
                            <img src="/floral-swirl.png" className="w-6 h-6 object-contain hidden lg:inline-block opacity-70" alt="" onError={e => e.currentTarget.style.display = 'none'} />
                            shubhlaxmi
                        </h1>
                        <span className="text-[#ea2083] text-[9px] uppercase tracking-widest font-bold hidden sm:block">the fashion icon</span>
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
                {/* New Arrivals Dropdown */}
                <div
                    className="relative group"
                    onMouseEnter={() => setActiveDropdown('new-arrivals')}
                    onMouseLeave={() => setActiveDropdown(null)}
                >
                    <button className="flex items-center gap-1 text-[13px] font-[var(--font-body)] text-[var(--text-primary)] hover:text-[#ea2083] tracking-wide focus:outline-none">
                        New Arrivals <ChevronDown size={12} className="transition-transform group-hover:rotate-180 opacity-50" />
                    </button>

                    {activeDropdown === 'new-arrivals' && (
                        <div className="absolute top-full left-0 bg-white shadow-xl rounded-b-lg border border-gray-100 py-4 px-6 min-w-[260px] z-50 transition-all duration-300">
                            <Link href="/collections/latest-salwar-kameez" className="block py-2 text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Latest Salwar Kameez Designs</Link>
                            <Link href="/collections/latest-sarees" className="block py-2 text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Latest Sarees Design</Link>
                            <Link href="/collections/latest-lehengas" className="block py-2 text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Latest Lehengas</Link>
                            <Link href="/collections/latest-gowns" className="block py-2 text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Latest Gowns</Link>
                            <Link href="/collections/latest-kurtis" className="block py-2 text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Latest Kurtis</Link>
                            <Link href="/collections/latest-western" className="block py-2 text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Latest Western Outfit</Link>
                        </div>
                    )}
                </div>
                {topCategories.slice(0, 5).map((cat) => {
                    const isSareeMegaMenu = cat.name.toLowerCase() === 'saree' || cat.name.toLowerCase() === 'sarees';
                    const isSalwarMegaMenu = cat.name.toLowerCase().includes('salwar');
                    const isMegaMenu = isSareeMegaMenu || isSalwarMegaMenu;

                    const subCategories = categories.filter((sub: any) => sub.parentCategory === cat._id);
                    const hasSubCategories = subCategories.length > 0;

                    return (
                        <div
                            key={cat._id}
                            className={`group ${isMegaMenu ? '' : 'relative'}`}
                            onMouseEnter={() => (isMegaMenu || hasSubCategories) ? setActiveDropdown(cat._id) : undefined}
                            onMouseLeave={() => setActiveDropdown(null)}
                        >
                            {/* If no subcategories and not a mega-menu, render as a plain link */}
                            {!isMegaMenu && !hasSubCategories ? (
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

                            {/* Standard Dropdown (for generic categories) */}
                            {!isMegaMenu && activeDropdown === cat._id && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-b-lg border border-gray-100 py-4 px-6 min-w-[220px] z-50">
                                    <Link
                                        href={`/collections/${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
                                        className="block text-sm font-bold text-[#ea2083] mb-3 font-[var(--font-body)] border-b border-gray-100 pb-2"
                                    >
                                        See All {cat.name}
                                    </Link>
                                    {categories
                                        .filter((sub: any) => sub.parentCategory === cat._id)
                                        .map((sub) => (
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

                            {/* Mega Menu: Sarees */}
                            {isSareeMegaMenu && activeDropdown === cat._id && (
                                <div className="absolute top-full left-0 w-full bg-white shadow-xl border-t border-gray-100 z-50 transition-all duration-300">
                                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
                                        {/* Column 1: STYLE */}
                                        <div className="flex-1 group/item cursor-pointer">
                                            <div className="overflow-hidden mb-4 rounded-sm">
                                                <img src="https://images.unsplash.com/photo-1610189014168-527e2b86abce?auto=format&fit=crop&q=80&w=400" alt="Style" className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover/item:scale-110" />
                                            </div>
                                            <h4 className="font-bold text-[13px] tracking-widest text-black mb-4 uppercase">STYLE</h4>
                                            <div className="flex flex-col gap-3">
                                                <Link href="/collections/sarees" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">See all Sarees</Link>
                                                <Link href="/collections/sarees-embroidered" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Embroidered Sarees</Link>
                                                <Link href="/collections/sarees-designer" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Designer Sarees</Link>
                                                <Link href="/collections/sarees-ready-to-wear" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Ready to Wear Sarees</Link>
                                                <Link href="/collections/sarees-ready-blouse" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Ready Blouse with Saree</Link>
                                                <Link href="/collections/sarees-printed" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Printed Sarees</Link>
                                                <Link href="/collections/sarees-hand-embroidered" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Hand Embroidered Sarees</Link>
                                            </div>
                                        </div>
                                        {/* Column 2: FABRICS */}
                                        <div className="flex-1 group/item cursor-pointer">
                                            <div className="overflow-hidden mb-4 rounded-sm">
                                                <img src="https://images.unsplash.com/photo-1583391733958-6115fa01fcd2?auto=format&fit=crop&q=80&w=400" alt="Fabrics" className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover/item:scale-110" />
                                            </div>
                                            <h4 className="font-bold text-[13px] tracking-widest text-black mb-4 uppercase">FABRICS</h4>
                                            <div className="flex flex-col gap-3">
                                                <Link href="/collections/sarees-banarasi" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Banarasi Sarees</Link>
                                                <Link href="/collections/sarees-patola" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Patola Weaving Sarees from ₹3000-₹6000</Link>
                                            </div>
                                        </div>
                                        {/* Column 3: OCCASION */}
                                        <div className="flex-1 group/item cursor-pointer">
                                            <div className="overflow-hidden mb-4 rounded-sm">
                                                <img src="https://images.unsplash.com/photo-1613852348851-f7a93a11488c?auto=format&fit=crop&q=80&w=400" alt="Occasion" className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover/item:scale-110" />
                                            </div>
                                            <h4 className="font-bold text-[13px] tracking-widest text-black mb-4 uppercase">OCCASION</h4>
                                            <div className="flex flex-col gap-3">
                                                <Link href="/collections/sarees-bridal" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Bridal Sarees</Link>
                                                <Link href="/collections/sarees-party" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Party wear Sarees</Link>
                                                <Link href="/collections/sarees-wedding" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Wedding Sarees</Link>
                                                <Link href="/collections/sarees-festival" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Festival Sarees</Link>
                                            </div>
                                        </div>
                                        {/* Column 4: BUDGET STYLES */}
                                        <div className="flex-1 group/item cursor-pointer">
                                            <div className="overflow-hidden mb-4 rounded-sm">
                                                <img src="https://images.unsplash.com/photo-1583391265691-10c0e764a8be?auto=format&fit=crop&q=80&w=400" alt="Budget" className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover/item:scale-110" />
                                            </div>
                                            <h4 className="font-bold text-[13px] tracking-widest text-black mb-4 uppercase">BUDGET STYLES</h4>
                                            <div className="flex flex-col gap-3">
                                                <Link href="/collections/sarees-under-2000" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Sarees Under INR 2000</Link>
                                                <Link href="/collections/sarees-under-3500" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">Sarees Under INR 3500</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mega Menu: Salwar Kameez & Indo Western */}
                            {isSalwarMegaMenu && activeDropdown === cat._id && (
                                <div className="absolute top-full left-0 w-full bg-white shadow-xl border-t border-gray-100 z-50 transition-all duration-300">
                                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
                                        {/* Column 1: SALWAR KAMEEZ */}
                                        <div className="flex-1 max-w-[280px] group/item cursor-pointer">
                                            <div className="overflow-hidden mb-4 rounded-sm">
                                                <img src="https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=400" alt="Salwar Kameez" className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover/item:scale-110" />
                                            </div>
                                            <h4 className="font-bold text-[13px] tracking-widest text-black mb-4 uppercase">SALWAR KAMEEZ</h4>
                                            <div className="flex flex-col gap-3">
                                                <Link href="/collections/salwar-kameez" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">See all Salwar Kameez</Link>
                                            </div>
                                        </div>
                                        {/* Column 2: PALAZZO SUITS */}
                                        <div className="flex-1 max-w-[280px] group/item cursor-pointer">
                                            <div className="overflow-hidden mb-4 rounded-sm">
                                                <img src="https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&q=80&w=400" alt="Palazzo Suits" className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover/item:scale-110" />
                                            </div>
                                            <h4 className="font-bold text-[13px] tracking-widest text-black mb-4 uppercase">PALAZZO SUITS</h4>
                                            <div className="flex flex-col gap-3">
                                                <Link href="/collections/palazzo-suits" className="text-[13px] text-gray-600 hover:text-[var(--brand-pink)] transition-colors">See all Palazzo Suits</Link>
                                            </div>
                                        </div>
                                        {/* Right Side: SEE ALL */}
                                        <div className="flex-1 flex flex-col justify-start items-start pt-8 pl-10 border-l border-gray-100 ml-6">
                                            <Link href={`/collections/${cat.name.toLowerCase().replace(/\s+/g, "-")}`} className="text-sm tracking-[0.2em] font-bold text-black hover:text-[var(--brand-pink)] uppercase transition-colors">
                                                See All
                                            </Link>
                                        </div>
                                    </div>
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
                    Budget Friendly Sarees
                </Link>
                <Link
                    href="/collections/1000-sarees"
                    className="text-[13px] font-[var(--font-body)] text-[var(--text-primary)] hover:text-[#ea2083] tracking-wide"
                >
                    ₹1000 SAREES
                </Link>
                <Link
                    href="/collections/patan-patolas"
                    className="text-[13px] font-[var(--font-body)] text-[var(--text-primary)] hover:text-[#ea2083] tracking-wide"
                >
                    Patan Patolas
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

            {/* Mobile Menu Drawer */}
            {mobileMenuOpen && (
                <div className="lg:hidden bg-white border-t border-gray-100 absolute top-full left-0 w-full shadow-2xl z-50 h-[calc(100vh-64px)] overflow-y-auto">
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
                        <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-gray-800 p-1">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation Menu Links */}
                    <div className="px-6 py-2 pb-24">
                        {/* Static links */}
                        <div className="border-b border-gray-100">
                            <button
                                onClick={() => setActiveDropdown(activeDropdown === 'mobile-new-arrivals' ? null : 'mobile-new-arrivals')}
                                className="w-full flex items-center justify-between py-4 text-[17px] font-medium text-gray-800 font-[var(--font-heading)] tracking-wide"
                            >
                                New Arrivals
                                <ChevronDown size={18} className={`text-gray-400 transition-transform ${activeDropdown === 'mobile-new-arrivals' ? 'rotate-180' : ''}`} />
                            </button>
                            {activeDropdown === 'mobile-new-arrivals' && (
                                <div className="pb-4 pl-4 space-y-4">
                                    <Link href="/collections/latest-salwar-kameez" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-gray-600 font-[var(--font-body)]">Latest Salwar Kameez Designs</Link>
                                    <Link href="/collections/latest-sarees" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-gray-600 font-[var(--font-body)]">Latest Sarees Design</Link>
                                    <Link href="/collections/latest-lehengas" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-gray-600 font-[var(--font-body)]">Latest Lehengas</Link>
                                    <Link href="/collections/latest-gowns" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-gray-600 font-[var(--font-body)]">Latest Gowns</Link>
                                    <Link href="/collections/latest-kurtis" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-gray-600 font-[var(--font-body)]">Latest Kurtis</Link>
                                    <Link href="/collections/latest-western" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-gray-600 font-[var(--font-body)]">Latest Western Outfit</Link>
                                </div>
                            )}
                        </div>

                        {/* Top Categories from API mapped with accordions */}
                        {topCategories.map((cat) => {
                            const subCategories = categories.filter((sub: any) => sub.parentCategory === cat._id);
                            const hasSubCategories = subCategories.length > 0;
                            const isMegaMenu = cat.name.toLowerCase() === 'saree' || cat.name.toLowerCase() === 'sarees' || cat.name.toLowerCase().includes('salwar');
                            
                            if (isMegaMenu || hasSubCategories) {
                                return (
                                    <div key={cat._id} className="border-b border-gray-100">
                                        <button
                                            onClick={() => setActiveDropdown(activeDropdown === `mobile-${cat._id}` ? null : `mobile-${cat._id}`)}
                                            className="w-full flex items-center justify-between py-4 text-[17px] font-medium text-gray-800 font-[var(--font-heading)] tracking-wide"
                                        >
                                            {cat.name}
                                            <ChevronDown size={18} className={`text-gray-400 transition-transform ${activeDropdown === `mobile-${cat._id}` ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {activeDropdown === `mobile-${cat._id}` && (
                                            <div className="pb-4 pl-4 space-y-4">
                                                <Link href={`/collections/${cat.name.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setMobileMenuOpen(false)} className="block text-[15px] font-semibold text-[var(--brand-pink)] font-[var(--font-body)]">
                                                    View All {cat.name}
                                                </Link>
                                                {/* If Mega menu (Sarees), we render the hardcoded links for it like desktop, or just subcategories if available */}
                                                {(cat.name.toLowerCase() === 'saree' || cat.name.toLowerCase() === 'sarees') ? (
                                                    <>
                                                        <Link href="/collections/sarees-embroidered" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-gray-600 font-[var(--font-body)]">Embroidered Sarees</Link>
                                                        <Link href="/collections/sarees-designer" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-gray-600 font-[var(--font-body)]">Designer Sarees</Link>
                                                        <Link href="/collections/sarees-ready-to-wear" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-gray-600 font-[var(--font-body)]">Ready to Wear Sarees</Link>
                                                        <Link href="/collections/sarees-printed" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-gray-600 font-[var(--font-body)]">Printed Sarees</Link>
                                                        <Link href="/collections/sarees-banarasi" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-gray-600 font-[var(--font-body)]">Banarasi Sarees</Link>
                                                        <Link href="/collections/sarees-bridal" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-gray-600 font-[var(--font-body)]">Bridal Sarees</Link>
                                                    </>
                                                ) : cat.name.toLowerCase().includes('salwar') ? (
                                                    <Link href="/collections/palazzo-suits" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-gray-600 font-[var(--font-body)]">Palazzo Suits</Link>
                                                ) : (
                                                    subCategories.map((sub: any) => (
                                                        <Link key={sub._id} href={`/collections/${sub.name.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-gray-600 font-[var(--font-body)]">
                                                            {sub.name}
                                                        </Link>
                                                    ))
                                                )}
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
                                    className="block py-4 text-[17px] font-medium text-gray-800 border-b border-gray-100 font-[var(--font-heading)] tracking-wide"
                                >
                                    {cat.name}
                                </Link>
                            );
                        })}

                        {/* Additional links from Desktop menu */}
                        <Link href="/video-appointment" onClick={() => setMobileMenuOpen(false)} className="block py-4 text-[17px] font-medium text-gray-800 border-b border-gray-100 font-[var(--font-heading)] tracking-wide">
                            Live Video Shopping
                        </Link>
                        <Link href="/collections/budget-friendly" onClick={() => setMobileMenuOpen(false)} className="block py-4 text-[17px] font-medium text-gray-800 border-b border-gray-100 font-[var(--font-heading)] tracking-wide">
                            Budget Friendly Sarees
                        </Link>
                        <Link href="/collections/1000-sarees" onClick={() => setMobileMenuOpen(false)} className="block py-4 text-[17px] font-medium text-gray-800 border-b border-gray-100 font-[var(--font-heading)] tracking-wide">
                            ₹1000 SAREES
                        </Link>
                        <Link href="/collections/patan-patolas" onClick={() => setMobileMenuOpen(false)} className="block py-4 text-[17px] font-medium text-gray-800 border-b border-gray-100 font-[var(--font-heading)] tracking-wide">
                            Patan Patolas
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
