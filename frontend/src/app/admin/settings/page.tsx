"use client";

import React, { useEffect, useState } from "react";
import { Tag, MessageCircle, IndianRupee, Save, AlertCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function StoreSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

    const [whatsappCheckoutEnabled, setWhatsappCheckoutEnabled] = useState(true);
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [budgetMin, setBudgetMin] = useState<number>(0);
    const [budgetMax, setBudgetMax] = useState<number>(2000);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_BASE}/public/store-settings`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                });
                const data = await res.json();
                if (data.status && data.data) {
                    setWhatsappCheckoutEnabled(data.data.whatsappCheckoutEnabled !== false);
                    setWhatsappNumber(data.data.whatsappNumber || "");
                    setBudgetMin(data.data.budgetFriendlyMinPrice ?? 0);
                    setBudgetMax(data.data.budgetFriendlyMaxPrice ?? 2000);
                }
            } catch (error) {
                console.error("Failed to fetch store settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const showMsg = (text: string, type: "success" | "error" = "success") => {
        setMsg({ text, type });
        setTimeout(() => setMsg(null), 4000);
    };

    const handleSave = async () => {
        if (budgetMax <= budgetMin) {
            showMsg("Max budget price must be greater than min price.", "error");
            return;
        }
        if (budgetMin < 0 || budgetMax < 0) {
            showMsg("Budget prices cannot be negative.", "error");
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`${API_BASE}/admin/store-settings/update`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    whatsappCheckoutEnabled,
                    whatsappNumber,
                    budgetFriendlyMinPrice: budgetMin,
                    budgetFriendlyMaxPrice: budgetMax
                })
            });

            const data = await res.json();
            if (data.status) {
                showMsg("Store settings saved successfully!", "success");
            } else {
                showMsg(data.message || "Failed to save settings", "error");
            }
        } catch (error) {
            console.error("Failed to update store settings:", error);
            showMsg("An error occurred while saving.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Toast Message */}
            {msg && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                    <AlertCircle size={16} />
                    {msg.text}
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center p-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--brand-pink)]"></div>
                </div>
            ) : (
                <>
                    {/* Budget Friendly Price Range */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                                <Tag size={18} className="text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-gray-800">Budget Friendly Price Range</h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    When a customer clicks <strong>"Budget Friendly"</strong> in the header, only products within this price window will be shown.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum Price (₹)</label>
                                <div className="relative">
                                    <IndianRupee size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="number"
                                        min={0}
                                        value={budgetMin}
                                        onChange={(e) => setBudgetMin(Number(e.target.value))}
                                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-pink)] focus:border-[var(--brand-pink)]"
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Products priced above this will qualify</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Maximum Price (₹)</label>
                                <div className="relative">
                                    <IndianRupee size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="number"
                                        min={1}
                                        value={budgetMax}
                                        onChange={(e) => setBudgetMax(Number(e.target.value))}
                                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-pink)] focus:border-[var(--brand-pink)]"
                                        placeholder="2000"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Products priced below this will qualify</p>
                            </div>

                            {/* Live Preview */}
                            <div className="sm:col-span-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-3">
                                <Tag size={15} className="text-green-600 flex-shrink-0" />
                                <p className="text-sm text-green-800">
                                    Customers will see products priced between{" "}
                                    <strong>₹{budgetMin.toLocaleString()}</strong> and{" "}
                                    <strong>₹{budgetMax.toLocaleString()}</strong> under "Budget Friendly".
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp Checkout */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                                <MessageCircle size={18} className="text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-gray-800">WhatsApp Checkout</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Manage how customers place orders on your storefront.</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-800">Enable WhatsApp Checkout</h3>
                                    <p className="text-xs text-gray-500 mt-1">Redirect users to WhatsApp to place orders manually instead of the payment gateway.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={whatsappCheckoutEnabled}
                                        onChange={(e) => setWhatsappCheckoutEnabled(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--brand-pink)]"></div>
                                </label>
                            </div>

                            {whatsappCheckoutEnabled && (
                                <div className="pt-4 border-t border-gray-100">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Business Number</label>
                                    <div className="flex mt-1 relative rounded-md shadow-sm w-full max-w-md">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+</span>
                                        <input
                                            type="text"
                                            className="flex-1 block w-full min-w-0 rounded-none rounded-r-md text-sm border-gray-300 px-3 py-2 border focus:ring-[var(--brand-pink)] focus:border-[var(--brand-pink)] outline-none"
                                            placeholder="919876543210"
                                            value={whatsappNumber}
                                            onChange={(e) => setWhatsappNumber(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Enter number with country code, without + (e.g. 919876543210 for India).</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Save */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[var(--brand-pink)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            <Save size={15} />
                            {isSaving ? "Saving..." : "Save All Settings"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
