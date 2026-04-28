"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Image as ImageIcon, Layers, FolderTree, Sparkles, ShoppingBag, Video, Package, Home, Users, Star, Tag } from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const navItems = [
        { name: "Dashboard", href: "/admin", icon: <LayoutDashboard size={20} /> },
        { name: "Banners", href: "/admin/banners", icon: <ImageIcon size={20} /> },
        { name: "Special Collections", href: "/admin/special-collections", icon: <Star size={20} /> },
        { name: "Sections", href: "/admin/sections", icon: <Layers size={20} /> },
        { name: "Categories", href: "/admin/categories", icon: <FolderTree size={20} /> },
        { name: "Attributes", href: "/admin/attributes", icon: <Sparkles size={20} /> },
        { name: "Products", href: "/admin/products", icon: <ShoppingBag size={20} /> },
        { name: "Discounts & Offers", href: "/admin/discounts", icon: <Tag size={20} /> },
        { name: "Appointments", href: "/admin/appointments", icon: <Video size={20} /> },
        { name: "Orders", href: "/admin/orders", icon: <Package size={20} /> },
        { name: "Customers", href: "/admin/users", icon: <Users size={20} /> },
        { name: "Homepage Config", href: "/admin/homepage", icon: <Home size={20} /> },
        { name: "Store Settings", href: "/admin/settings", icon: <Sparkles size={20} /> },
    ];

    const handleLogout = () => {
        localStorage.removeItem("admin_token");
        router.push("/admin/login");
    };

    return (
        <>
            {/* Mobile Hamburger Button */}
            <div className="md:hidden flex items-center justify-between bg-gray-800 text-white p-4">
                <img src="/Logo.png" alt="Shubhlaxmi" className="h-8 w-auto object-contain bg-white px-2 py-1 rounded" />
                <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-2xl">
                    ☰
                </button>
            </div>

            {/* Sidebar Overlay for Mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
                    } flex flex-col`}
            >
                <div className="p-6 text-center border-b border-gray-800 hidden md:block">
                    <img src="/Logo.png" alt="Shubhlaxmi" className="h-12 w-auto object-contain mx-auto bg-white px-3 py-1.5 rounded-lg shadow" />
                    <p className="text-xs text-gray-500 mt-3 uppercase tracking-widest font-semibold">Admin Panel</p>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? "bg-[#ec268f] text-white shadow-md shadow-pink-900/20"
                                    : "text-gray-400 hover:bg-gray-800/60 hover:text-white hover:translate-x-1"
                                    }`}
                            >
                                <span className={`mr-3 transition-transform duration-200 ${!isActive && "group-hover:scale-110 group-hover:text-[#ec268f]"}`}>{item.icon}</span>
                                <span className="font-medium text-sm">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 rounded-xl hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-900/20 transition-all duration-200"
                    >
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
