"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${API_BASE}/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (data.success) {
                // Save token to localStorage
                localStorage.setItem("admin_token", data.token);
                // Redirect to admin dashboard
                router.push("/admin");
            } else {
                setError(data.message || "Invalid credentials");
            }
        } catch (err) {
            setError("Network error. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <img src="/Logo.png" alt="Shubhlaxmi" className="h-14 w-auto object-contain" />
                </div>
                <h1 className="text-lg font-bold text-center mb-6 text-gray-600 uppercase tracking-widest">
                    Admin Secure Login
                </h1>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#ec268f] focus:border-[#ec268f] text-black"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#ec268f] focus:border-[#ec268f] text-black"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#ec268f] hover:bg-[#d01e7a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ec268f] disabled:opacity-50"
                    >
                        {loading ? "Authenticating..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}

