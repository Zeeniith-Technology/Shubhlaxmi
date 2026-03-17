"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Basic client-side route protection
        const token = localStorage.getItem("admin_token");
        if (!token) {
            router.push("/admin/login");
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    if (!isAuthenticated) return null; // Or a loading spinner

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="mt-4 text-gray-600">
                Welcome to your secure admin panel. Only authorized users can see this.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Total Products</h2>
                    <p className="text-3xl font-bold text-[#ec268f]">0</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Total Orders</h2>
                    <p className="text-3xl font-bold text-[#ec268f]">0</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Revenue</h2>
                    <p className="text-3xl font-bold text-[#ec268f]">₹0</p>
                </div>
            </div>

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
