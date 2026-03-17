"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<"request" | "verify">("request");
    const [email, setEmail] = useState("");
    const [number, setNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("http://localhost:5000/api/request-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, number, name: "Admin User" }),
            });

            const data = await res.json();
            if (data.success) {
                setStep("verify");
            } else {
                setError(data.message || "Failed to request OTP");
            }
        } catch (err) {
            setError("Network error. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("http://localhost:5000/api/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });

            const data = await res.json();
            if (data.success) {
                // Save token to localStorage (or cookies for better security)
                localStorage.setItem("admin_token", data.token);
                // Redirect to admin dashboard
                router.push("/admin");
            } else {
                setError(data.message || "Invalid OTP");
            }
        } catch (err) {
            setError("Network error processing OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    Admin Secure Login
                </h1>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                {step === "request" ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#ec268f] focus:border-[#ec268f] text-black"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@amrut.co"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
                            <input
                                type="tel"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#ec268f] focus:border-[#ec268f] text-black"
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                placeholder="+91 9876543210"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#ec268f] hover:bg-[#d01e7a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ec268f] disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div className="text-sm text-gray-600 mb-4 text-center">
                            OTP sent to <strong>{email}</strong>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">4-Digit OTP</label>
                            <input
                                type="text"
                                required
                                maxLength={4}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#ec268f] focus:border-[#ec268f] text-center text-2xl tracking-widest text-black"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#ec268f] hover:bg-[#d01e7a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ec268f] disabled:opacity-50"
                        >
                            {loading ? "Verifying..." : "Verify & Login"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep("request")}
                            className="w-full mt-2 text-sm text-gray-500 hover:text-gray-800"
                        >
                            Back to Email
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
