"use client";

import { useState } from "react";

interface PersonalInfoProps {
    profile: any;
    refreshProfile: () => void;
}

export default function PersonalInfo({ profile, refreshProfile }: PersonalInfoProps) {
    const [name, setName] = useState(profile?.name || "");
    const [phone, setPhone] = useState(profile?.phone || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/customer/profile/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, phone })
            });

            const data = await res.json();
            if (data.success) {
                alert("Profile updated successfully!");
                refreshProfile();
            } else {
                alert(data.message || "Failed to update profile");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-[var(--font-heading)] font-semibold mb-6">Personal Information</h2>

            <form onSubmit={handleSave} className="space-y-6 max-w-lg">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-colors"
                        placeholder="e.g. Jane Doe"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        disabled
                        value={profile?.email || ""}
                        className="w-full px-4 py-3 rounded-md border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email address cannot be changed.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-colors"
                        placeholder="e.g. +91 9876543210"
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`px-8 py-3 bg-[var(--brand-pink)] text-white font-medium rounded-md shadow hover:bg-pink-700 focus:outline-none transition-colors ${saving ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                    >
                        {saving ? "Saving Changes..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
