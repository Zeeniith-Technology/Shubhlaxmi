"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "../../context/CartContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function LoginPage() {
    const router = useRouter();
    const { cartCount } = useCart();
    const [view, setView] = useState<"login" | "register" | "forgot" | "reset">("login");

    const switchView = (newView: "login" | "register" | "forgot" | "reset") => {
        setView(newView);
        setSuccess("");
        setError("");
    };

    // Form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState("");

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Check if already logged in
    useEffect(() => {
        const token = localStorage.getItem("customer_token");
        if (token) {
            router.push("/profile");
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        let endpoint = "";
        let body: any = {};

        if (view === "login") {
            endpoint = "/customer/login";
            body = { email, password };
        } else if (view === "register") {
            endpoint = "/customer/register";
            body = { name, email, phone, password };
        } else if (view === "forgot") {
            endpoint = "/customer/forgot-password";
            body = { email };
        } else if (view === "reset") {
            endpoint = "/customer/reset-password";
            body = { email, token: resetToken, newPassword };
        }

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (data.success) {
                if (view === "forgot") {
                    setSuccess("Password reset email sent! Check your inbox.");
                    setTimeout(() => switchView("reset"), 2000);
                } else if (view === "reset") {
                    setSuccess("Password reset successful! You can now log in.");
                    setTimeout(() => switchView("login"), 2000);
                } else {
                    setSuccess(view === "login" ? "Login successful! Redirecting..." : "Registration successful! Redirecting...");
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
                }
            } else {
                setError(data.message || "Request failed");
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
                {/* Tabs (Only show on Login/Register) */}
                {(view === "login" || view === "register") && (
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => switchView("login")}
                            className={`flex-1 py-4 text-sm font-semibold tracking-wider uppercase transition-colors ${view === "login" ? "text-[var(--brand-pink)] border-b-2 border-[var(--brand-pink)]" : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => switchView("register")}
                            className={`flex-1 py-4 text-sm font-semibold tracking-wider uppercase transition-colors ${view === "register" ? "text-[var(--brand-pink)] border-b-2 border-[var(--brand-pink)]" : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            Create Account
                        </button>
                    </div>
                )}

                {/* Form */}
                <div className="p-8">
                    <h2 className="text-2xl font-[var(--font-heading)] text-center mb-6">
                        {view === "login" && "Welcome Back"}
                        {view === "register" && "Join Shubhlaxmi"}
                        {view === "forgot" && "Reset Password"}
                        {view === "reset" && "Create New Password"}
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
                        {view === "register" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent transition-all"
                                    placeholder="Jane Doe"
                                />
                            </div>
                        )}

                        {(view === "login" || view === "register" || view === "forgot" || view === "reset") && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={view === "reset"}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent transition-all disabled:bg-gray-100 disabled:text-gray-500"
                                    placeholder="jane@example.com"
                                />
                            </div>
                        )}

                        {view === "register" && (
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

                        {view === "reset" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reset Token (from Email) *</label>
                                    <input
                                        type="text"
                                        value={resetToken}
                                        onChange={(e) => setResetToken(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent transition-all"
                                        placeholder="123456"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </>
                        )}

                        {(view === "login" || view === "register") && (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Password *</label>
                                    {view === "login" && (
                                        <button type="button" onClick={() => switchView("forgot")} className="text-xs text-[var(--brand-pink)] hover:underline">Forgot password?</button>
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
                        )}

                        <button
                            type="submit"
                            disabled={loading || success !== ""}
                            className="w-full py-3 mt-4 bg-[var(--brand-pink)] text-white rounded-md text-sm font-semibold tracking-wider uppercase hover:bg-[var(--brand-pink-hover)] transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? "Processing..." : view === "login" ? "Sign In" : view === "register" ? "Create Account" : view === "forgot" ? "Send Reset Email" : "Reset Password"}
                        </button>
                        
                        {(view === "forgot" || view === "reset") && (
                            <button
                                type="button"
                                onClick={() => switchView("login")}
                                className="w-full py-2 mt-2 text-sm text-gray-500 hover:text-[var(--brand-pink)] transition-colors"
                            >
                                Back to Login
                            </button>
                        )}
                    </form>

                    <div className="mt-6 text-center text-xs text-gray-500">
                        By continuing, you agree to Shubhlaxmi's <Link href="/pages/terms" className="underline hover:text-[var(--brand-pink)]">Terms of Service</Link> and <Link href="/pages/privacy" className="underline hover:text-[var(--brand-pink)]">Privacy Policy</Link>.
                    </div>
                </div>
            </div>
        </div>
    );
}

