"use client";

import { useState } from "react";
import Link from "next/link";
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin, ChevronDown } from "lucide-react";

export default function Footer() {
    const [openSection, setOpenSection] = useState<string | null>(null);

    const toggleSection = (section: string) => {
        setOpenSection(prev => prev === section ? null : section);
    };

    return (
        <footer className="bg-[var(--brand-pink)] text-white">
            {/* Main Footer Content */}
            <div className="max-w-[1400px] mx-auto px-6 sm:px-6 lg:px-8 py-10 sm:py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 sm:gap-8">

                    {/* Brand Column (Always visible, first on all screens) */}
                    <div className="mb-8 sm:mb-0">
                        <Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-block mb-5">
                            <img src="/Logo.png" alt="Shubhlaxmi" className="h-14 w-auto object-contain bg-white px-4 py-2 rounded-lg shadow-sm" />
                        </Link>
                        <p className="text-[13px] text-white/90 leading-relaxed font-[var(--font-body)] pr-4 sm:pr-0">
                            Your one-stop destination for designer ethnic wear. We bring you the finest collection of sarees, lehengas, salwar kameez and more.
                        </p>
                        {/* Social Icons */}
                        <div className="flex gap-4 mt-6">
                            <a href="#" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shadow-sm" aria-label="Instagram">
                                <Instagram size={16} />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shadow-sm" aria-label="Facebook">
                                <Facebook size={16} />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shadow-sm" aria-label="YouTube">
                                <Youtube size={16} />
                            </a>
                        </div>
                    </div>

                    {/* Categories Column */}
                    <div className="border-t border-white/20 sm:border-transparent py-4 sm:py-0">
                        <button
                            onClick={() => toggleSection("categories")}
                            className="w-full flex items-center justify-between sm:cursor-default outline-none"
                        >
                            <h3 className="text-sm font-medium tracking-[0.15em] uppercase font-[var(--font-body)]">
                                Categories
                            </h3>
                            <ChevronDown size={16} className={`sm:hidden transition-transform ${openSection === "categories" ? "rotate-180" : ""}`} />
                        </button>
                        <div className={`sm:mt-5 overflow-hidden transition-all duration-300 ${openSection === "categories" ? "max-h-96 mt-4" : "max-h-0 sm:max-h-max"}`}>
                            <ul className="space-y-3 pb-2 sm:pb-0">
                                {["New Arrivals", "Sarees", "Lehengas", "Salwar Kameez", "Gowns", "Kurtis"].map((item) => (
                                    <li key={item}>
                                        <Link
                                            href={`/collections/${item.toLowerCase().replace(/\s+/g, "-")}`}
                                            className="text-[13px] text-white/80 hover:text-white transition-colors font-[var(--font-body)]"
                                        >
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Policies Column */}
                    <div className="border-t border-white/20 sm:border-transparent py-4 sm:py-0">
                        <button
                            onClick={() => toggleSection("policies")}
                            className="w-full flex items-center justify-between sm:cursor-default outline-none"
                        >
                            <h3 className="text-sm font-medium tracking-[0.15em] uppercase font-[var(--font-body)]">
                                Policies
                            </h3>
                            <ChevronDown size={16} className={`sm:hidden transition-transform ${openSection === "policies" ? "rotate-180" : ""}`} />
                        </button>
                        <div className={`sm:mt-5 overflow-hidden transition-all duration-300 ${openSection === "policies" ? "max-h-96 mt-4" : "max-h-0 sm:max-h-max"}`}>
                            <ul className="space-y-3 pb-2 sm:pb-0">
                                {[
                                    { label: "Contact Us", href: "/pages/contact" },
                                    { label: "Shipping Policy", href: "/pages/shipping" },
                                    { label: "Refund Policy", href: "/pages/refund" },
                                    { label: "Privacy Policy", href: "/pages/privacy" },
                                    { label: "Terms of Service", href: "/pages/terms" },
                                    { label: "Contact Information", href: "/pages/contact-information" },
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            href={item.href}
                                            className="text-[13px] text-white/80 hover:text-white transition-colors font-[var(--font-body)]"
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Newsletter & Contact Column */}
                    <div className="border-t border-b border-white/20 sm:border-transparent py-4 sm:py-0">
                        <button
                            onClick={() => toggleSection("signup")}
                            className="w-full flex items-center justify-between sm:cursor-default outline-none"
                        >
                            <h3 className="text-sm font-medium tracking-[0.15em] uppercase font-[var(--font-body)]">
                                Sign Up And Save
                            </h3>
                            <ChevronDown size={16} className={`sm:hidden transition-transform ${openSection === "signup" ? "rotate-180" : ""}`} />
                        </button>

                        <div className={`sm:mt-5 overflow-hidden transition-all duration-300 ${openSection === "signup" ? "max-h-[500px] mt-4" : "max-h-0 sm:max-h-max"}`}>
                            <div className="pb-2 sm:pb-0">
                                <p className="text-[13px] text-white/90 mb-4 font-[var(--font-body)] leading-relaxed pr-4 sm:pr-0">
                                    Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
                                </p>
                                <form onSubmit={(e) => e.preventDefault()} className="flex gap-0 shadow-sm max-w-sm">
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="flex-1 min-w-0 px-4 py-2.5 text-sm bg-white/10 border border-white/30 rounded-l-md text-white placeholder-white/60 outline-none focus:border-white/60 font-[var(--font-body)]"
                                    />
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-white text-[var(--brand-pink)] py-[1px] text-sm font-bold rounded-r-md hover:bg-gray-100 transition-colors font-[var(--font-body)]"
                                    >
                                        <Mail size={16} />
                                    </button>
                                </form>

                                {/* Contact Info */}
                                <div className="mt-8 border-t border-white/20 pt-6 sm:border-none sm:pt-0">
                                    <h3 className="text-sm font-medium tracking-[0.15em] uppercase mb-4 font-[var(--font-body)] hidden sm:block">
                                        Get In Touch
                                    </h3>
                                    <div className="space-y-3 text-[13px] text-white/90 font-[var(--font-body)]">
                                        <p className="flex items-center gap-2"><Phone size={14} className="opacity-80" /> Customer Care: +9198985 76254</p>
                                        <p className="flex items-center gap-2"><MapPin size={14} className="opacity-80" /> Krishna Icon, Near Townhall, Anand - Vidhyanagar Road, Anand 388001</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Bar */}
            <div className="bg-black/10">
                <div className="max-w-[1400px] mx-auto px-6 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[11px] sm:text-xs text-white/80 font-[var(--font-body)] uppercase tracking-widest text-center sm:text-left">
                        © {new Date().getFullYear()} SHUBHLAXMI. All Rights Reserved.
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5 text-[9px] sm:text-[10px] font-bold text-white/90 tracking-widest">
                            <span className="px-2.5 py-1 sm:py-1.5 bg-[#006FCF]/80 rounded-sm">AMEX</span>
                            <span className="px-2.5 py-1 sm:py-1.5 bg-[#EB001B]/80 rounded-sm">MC</span>
                            <span className="px-2.5 py-1 sm:py-1.5 bg-[#172B85]/80 rounded-sm">VISA</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
