"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const API_BASE = "http://localhost:5000/api";

export default function LoginModal() {
    const router = useRouter();
    const { isLoginOpen, setIsLoginOpen, login } = useAuth();
    const { cartCount } = useCart();

    // Switch between Login / Registration
    const [isLoginView, setIsLoginView] = useState(true);

    // Form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Prevent body scroll when open
    useEffect(() => {
        if (isLoginOpen) {
            document.body.style.overflow = 'hidden';
            // Reset state
            setError("");
            setSuccess("");
            setEmail("");
            setPassword("");
            setName("");
            setPhone("");
            setIsLoginView(true);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isLoginOpen]);

    if (!isLoginOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        const endpoint = isLoginView ? "/customer/login" : "/customer/register";
        const body = isLoginView
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
                setSuccess(isLoginView ? "Login successful!" : "Registration successful!");
                login(data.token, data.user);

                setTimeout(() => {
                    setIsLoginOpen(false);
                    if (cartCount > 0) {
                        router.push("/checkout");
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setIsLoginOpen(false)}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-[fadeIn_0.3s_ease-out]">

                {/* Left Side: Brand & Promotion (Hidden on small screens) */}
                <div className="hidden md:flex flex-col justify-center w-5/12 bg-gradient-to-br from-[var(--brand-pink)] to-rose-600 text-white p-10 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/floral-motif.png')]"></div>

                    <div className="relative z-10">
                        <h2 className="text-4xl font-[var(--font-heading)] mb-2 tracking-wide font-bold drop-shadow-md">
                            Shubhlaxmi
                        </h2>
                        <p className="text-pink-100 uppercase tracking-widest text-xs font-semibold mb-12">
                            The Fashion Icon
                        </p>

                        <h3 className="text-2xl font-bold mb-10 leading-snug drop-shadow-sm uppercase">
                            {isLoginView ? "Welcome Back to Luxury" : "Ready to Ship Lehengas"}
                        </h3>

                        <div className="grid grid-cols-3 gap-4 pb-8">
                            <div className="bg-[#cc1870] rounded-xl p-4 flex flex-col items-center justify-start text-center border border-[#e5338a] shadow-inner transition-transform hover:-translate-y-1 duration-300">
                                <div className="w-10 h-10 flex items-center justify-center mb-3">
                                    <Star size={28} className="text-yellow-300 drop-shadow-md" fill="currentColor" />
                                </div>
                                <h4 className="font-bold text-sm mb-1 line-clamp-1">Customer-first</h4>
                                <p className="text-[10px] text-pink-100/90 leading-snug">Putting you in the center</p>
                            </div>

                            <div className="bg-[#cc1870] rounded-xl p-4 flex flex-col items-center justify-start text-center border border-[#e5338a] shadow-inner transition-transform hover:-translate-y-1 duration-300">
                                <div className="w-10 h-10 flex items-center justify-center mb-3">
                                    <Star size={28} className="text-yellow-300 drop-shadow-md" fill="currentColor" />
                                </div>
                                <h4 className="font-bold text-sm mb-1 line-clamp-1">Transparent</h4>
                                <p className="text-[10px] text-pink-100/90 leading-snug">Honest from the inside out</p>
                            </div>

                            <div className="bg-[#cc1870] rounded-xl p-4 flex flex-col items-center justify-start text-center border border-[#e5338a] shadow-inner transition-transform hover:-translate-y-1 duration-300">
                                <div className="w-10 h-10 flex items-center justify-center mb-3">
                                    <Star size={28} className="text-yellow-300 drop-shadow-md" fill="currentColor" />
                                </div>
                                <h4 className="font-bold text-sm mb-1 line-clamp-1">Innovative</h4>
                                <p className="text-[10px] text-pink-100/90 leading-snug">Getting the absolute best</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form Container */}
                <div className="w-full md:w-6/12 p-3 my-3 mr-3 flex flex-col">
                    <div className="bg-white rounded-xl shadow-lg flex-1 p-8 md:p-12 flex flex-col justify-center relative min-h-[500px]">

                        {/* Close Button inside right container */}
                        <button
                            onClick={() => setIsLoginOpen(false)}
                            className="absolute top-4 right-4 z-10 w-8 h-8 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2 font-[var(--font-heading)]">
                                {isLoginView ? "Login to get exclusive offers!" : "Sign up to get exclusive offers!"}
                            </h2>
                            <p className="text-gray-500 text-sm">
                                {isLoginView ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    onClick={() => setIsLoginView(!isLoginView)}
                                    className="text-[var(--brand-pink)] font-semibold hover:underline"
                                >
                                    {isLoginView ? "Create one" : "Sign in"}
                                </button>
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 text-center animate-[fadeIn_0.3s]">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-100 text-center animate-[fadeIn_0.3s]">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {!isLoginView && (
                                <div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required={!isLoginView}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ea2083] focus:border-transparent transition-all shadow-sm text-sm"
                                        placeholder="Full Name"
                                    />
                                </div>
                            )}

                            <div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ea2083] focus:border-transparent transition-all shadow-sm text-sm"
                                    placeholder="Email Address"
                                />
                            </div>

                            {!isLoginView && (
                                <div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ea2083] focus:border-transparent transition-all shadow-sm text-sm"
                                        placeholder="Mobile Number"
                                    />
                                </div>
                            )}

                            <div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ea2083] focus:border-transparent transition-all shadow-sm text-sm"
                                    placeholder="Password"
                                />
                                {isLoginView && (
                                    <div className="text-right mt-2">
                                        <button type="button" className="text-xs text-gray-500 hover:text-[#ea2083]">
                                            Forgot password?
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || success !== ""}
                                className="w-full py-4 mt-2 bg-black text-white rounded-md text-sm font-bold tracking-wider hover:bg-gray-800 transition-all shadow-md disabled:opacity-70 flex justify-center items-center"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    "Submit"
                                )}
                            </button>
                        </form>

                        <div className="text-center mt-6 text-xs text-gray-400">
                            I accept that I have read & understood your <br />
                            <span className="underline hover:text-gray-600 cursor-pointer">Privacy Policy</span> and <span className="underline hover:text-gray-600 cursor-pointer">T&Cs</span>.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
