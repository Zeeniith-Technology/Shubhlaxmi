"use client";

import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import { Bell, Search, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const isLoginPage = pathname === "/admin/login";
    const [isCheckingAuth, setIsCheckingAuth] = useState(!isLoginPage);

    useEffect(() => {
        if (!isLoginPage) {
            const token = localStorage.getItem("admin_token");
            if (!token) {
                router.push("/admin/login");
            } else {
                setIsCheckingAuth(false);
            }
        }
    }, [isLoginPage, router]);

    if (isLoginPage) {
        return <>{children}</>;
    }

    if (isCheckingAuth) {
        return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">Loading...</div>;
    }

    const getPageTitle = () => {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length === 1 && segments[0] === 'admin') return 'Dashboard Overview';

        const lastSegment = segments[segments.length - 1];
        // Custom formatting for specific routes
        if (lastSegment === 'users') return 'Customer Directory';
        if (lastSegment === 'homepage') return 'Homepage Config';

        // Default Title Case
        return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row h-screen overflow-hidden font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto flex flex-col">
                {/* Dynamic Header Topbar */}
                <header className="bg-white shadow-sm h-16 flex-shrink-0 flex items-center justify-between px-8 border-b border-gray-100/80 z-10 sticky top-0 md:static">
                    <div className="flex items-center gap-4">
                        <span className="text-gray-800 font-bold text-lg">{getPageTitle()}</span>
                    </div>

                    {/* Top Right Header Elements */}
                    <div className="flex items-center gap-5">
                        <button className="text-gray-400 hover:text-[var(--brand-pink)] transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <div className="h-8 w-[1px] bg-gray-200"></div>
                        <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-gray-700 group-hover:text-[var(--brand-pink)] transition-colors">Admin User</p>
                                <p className="text-xs text-gray-400">Owner</p>
                            </div>
                            <div className="h-9 w-9 rounded-full bg-pink-100 flex items-center justify-center text-[var(--brand-pink)] overflow-hidden border border-pink-200">
                                <UserCircle size={32} className="text-pink-300 mt-1" />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
