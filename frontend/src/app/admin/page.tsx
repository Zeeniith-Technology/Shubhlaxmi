"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [stats, setStats] = useState<{
        totalProducts: number;
        totalOrders: number;
        totalRevenue: number;
        totalCategories: number;
        lowStockCount?: number;
        lowStockProducts?: { _id: string; title: string; stock: number; slug: string }[];
    }>({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalCategories: 0 });

    useEffect(() => {
        // Basic client-side route protection
        const token = localStorage.getItem("admin_token");
        if (!token) {
            router.push("/admin/login");
        } else {
            setIsAuthenticated(true);
            fetchStats(token);
        }
    }, [router]);

    const fetchStats = async (token: string) => {
        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            const res = await fetch(`${API_BASE}/dashboard/stats`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        }
    };

    if (!isAuthenticated) return null; // Or a loading spinner

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="mt-4 text-gray-600">
                Welcome to your secure admin panel. Only authorized users can see this.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                <Link href="/admin/products" className="bg-white p-6 rounded-lg shadow border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer block">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Total Products</h2>
                    <p className="text-3xl font-bold text-[#ec268f]">{stats.totalProducts}</p>
                </Link>
                <Link href="/admin/categories" className="bg-white p-6 rounded-lg shadow border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer block">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Total Categories</h2>
                    <p className="text-3xl font-bold text-[#ec268f]">{stats.totalCategories}</p>
                </Link>
                <Link href="/admin/orders" className="bg-white p-6 rounded-lg shadow border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer block">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Total Orders</h2>
                    <p className="text-3xl font-bold text-[#ec268f]">{stats.totalOrders}</p>
                </Link>
                <Link href="/admin/orders" className="bg-white p-6 rounded-lg shadow border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer block">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Revenue</h2>
                    <p className="text-3xl font-bold text-[#ec268f]">₹{stats.totalRevenue.toLocaleString()}</p>
                </Link>
            </div>

            {/* Low Stock Alert */}
            {(stats.lowStockCount ?? 0) > 0 && (
                <div className="mt-8 bg-white rounded-lg shadow border border-amber-200 overflow-hidden">
                    <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-amber-800">
                            ⚠️ Low Stock Alert — {stats.lowStockCount} product{(stats.lowStockCount ?? 0) > 1 ? 's' : ''} running out (≤ 5 left)
                        </h2>
                        <Link href="/admin/products" className="text-sm font-semibold text-amber-700 hover:underline">Manage Stock →</Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {(stats.lowStockProducts || []).map(p => (
                            <div key={p._id} className="px-6 py-3 flex items-center justify-between text-sm">
                                <span className="text-gray-800 font-medium truncate pr-4">{p.title}</span>
                                <span className={`font-bold px-2.5 py-1 rounded-full text-xs ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} left`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={() => {
                    localStorage.removeItem("admin_token");
                    router.push("/admin/login");
                }}
                className="mt-8 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
                Logout
            </button>
        </div>
    );
}
