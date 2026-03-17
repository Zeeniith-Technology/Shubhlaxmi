"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "../../context/CartContext";

const API_BASE = "http://localhost:5000/api";

export default function LoginPage() {
    const router = useRouter();
    const { cartCount } = useCart();
    const [isLogin, setIsLogin] = useState(true);

    // Form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        const endpoint = isLogin ? "/customer/login" : "/customer/register";
        const body = isLogin
            ? { email, password }
            : { name, email, phone, password };

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(isLogin ? "Login successful! Redirecting..." : "Registration successful! Redirecting...");
                localStorage.setItem("customer_token", data.token);
                localStorage.setItem("customer_data", JSON.stringify(data.user));

                setTimeout(() => {
                    // Redirect to checkout if they have items, else profile
                    if (cartCount > 0) {
                        router.push("/checkout");
                    } else {
                        router.push("/profile");
                    }
                }, 1000);
            } else {
                setError(data.message || "Authentication failed");
            }
        } catch (err) {
            setError("Network error. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex justify-center">
            <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-4 text-sm font-semibold tracking-wider uppercase transition-colors ${isLogin ? "text-[var(--brand-pink)] border-b-2 border-[var(--brand-pink)]" : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-4 text-sm font-semibold tracking-wider uppercase transition-colors ${!isLogin ? "text-[var(--brand-pink)] border-b-2 border-[var(--brand-pink)]" : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        Create Account
                    </button>
                </div>

                {/* Form */}
                <div className="p-8">
                    <h2 className="text-2xl font-[var(--font-heading)] text-center mb-6">
                        {isLogin ? "Welcome Back" : "Join Shubhlaxmi"}
                    </h2>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 text-center">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-100 text-center">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={!isLogin}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent transition-all"
                                    placeholder="Jane Doe"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent transition-all"
                                placeholder="jane@example.com"
                            />
                        </div>

                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent transition-all"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        )}

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">Password *</label>
                                {isLogin && (
                                    <a href="#" className="text-xs text-[var(--brand-pink)] hover:underline">Forgot password?</a>
                                )}
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || success !== ""}
                            className="w-full py-3 mt-4 bg-[var(--brand-pink)] text-white rounded-md text-sm font-semibold tracking-wider uppercase hover:bg-[var(--brand-pink-hover)] transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-gray-500">
                        By continuing, you agree to Shubhlaxmi's <Link href="/pages/terms" className="underline hover:text-[var(--brand-pink)]">Terms of Service</Link> and <Link href="/pages/privacy" className="underline hover:text-[var(--brand-pink)]">Privacy Policy</Link>.
                    </div>
                </div>
            </div>
        </div>
    );
}
