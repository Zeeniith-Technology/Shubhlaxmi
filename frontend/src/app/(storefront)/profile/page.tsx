"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, MapPin, Package, LogOut } from "lucide-react";
import PersonalInfo from "../../../components/profile/PersonalInfo";
import AddressManager from "../../../components/profile/AddressManager";

export default function ProfilePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("personal");
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const res = await fetch("http://localhost:5000/api/customer/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({})
            });

            const data = await res.json();
            if (data.success) {
                setProfile(data.user);
            } else {
                alert("Session expired. Please log in again.");
                localStorage.removeItem("token");
                router.push("/login");
            }
        } catch (error) {
            console.error("Error fetching profile", error);
            alert("Failed to fetch profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        alert("Logged out successfully");
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-[var(--brand-pink)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-gray-50/50 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="mb-8">
                    <h1 className="text-3xl font-[var(--font-heading)] text-gray-900 tracking-wide">My Account</h1>
                    <p className="text-gray-500 mt-2 font-[var(--font-body)]">Manage your profile, shipping addresses, and orders.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8">

                    {/* Sidebar Navigation */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <div className="w-12 h-12 bg-pink-100 text-[var(--brand-pink)] rounded-full flex items-center justify-center font-bold text-xl mb-3">
                                    {profile.name.charAt(0).toUpperCase()}
                                </div>
                                <h2 className="font-semibold text-gray-900 truncate">{profile.name}</h2>
                                <p className="text-sm text-gray-500 truncate">{profile.email}</p>
                            </div>
                            <nav className="p-2 space-y-1">
                                <button
                                    onClick={() => setActiveTab("personal")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors ${activeTab === "personal"
                                        ? "bg-pink-50 text-[var(--brand-pink)]"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <User size={18} />
                                    Personal Information
                                </button>
                                <button
                                    onClick={() => setActiveTab("addresses")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors ${activeTab === "addresses"
                                        ? "bg-pink-50 text-[var(--brand-pink)]"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <MapPin size={18} />
                                    Manage Addresses
                                </button>
                                <button
                                    onClick={() => setActiveTab("orders")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors ${activeTab === "orders"
                                        ? "bg-pink-50 text-[var(--brand-pink)]"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <Package size={18} />
                                    Order History
                                </button>

                                <div className="pt-4 mt-4 border-t border-gray-100">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <LogOut size={18} />
                                        Log Out
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sm:p-8">
                            {activeTab === "personal" && (
                                <PersonalInfo profile={profile} refreshProfile={fetchProfile} />
                            )}
                            {activeTab === "addresses" && (
                                <AddressManager addresses={profile.addresses || []} refreshProfile={fetchProfile} />
                            )}
                            {activeTab === "orders" && (
                                <div>
                                    <h2 className="text-xl font-[var(--font-heading)] font-semibold mb-6">Order History</h2>
                                    <p className="text-gray-500 italic">Order history integration coming soon...</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
