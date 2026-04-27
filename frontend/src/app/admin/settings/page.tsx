"use client";

import React, { useEffect, useState } from "react";
export default function StoreSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [whatsappCheckoutEnabled, setWhatsappCheckoutEnabled] = useState(true);
    const [whatsappNumber, setWhatsappNumber] = useState("");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/store-settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();
                if (data.status && data.data) {
                    setWhatsappCheckoutEnabled(data.data.whatsappCheckoutEnabled !== false); // default true
                    setWhatsappNumber(data.data.whatsappNumber || "");
                }
            } catch (error) {
                console.error("Failed to fetch store settings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/store-settings/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    whatsappCheckoutEnabled,
                    whatsappNumber
                })
            });

            const data = await res.json();
            if (data.status) {
                alert("Store settings saved successfully!");
            } else {
                alert(data.message || "Failed to save settings");
            }
        } catch (error) {
            console.error("Failed to update store settings:", error);
            alert("An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800">Checkout Configuration</h2>
                                <p className="text-sm text-gray-500 mt-1">Manage how customers place orders on your storefront.</p>
                            </div>

                            <div className="p-6 space-y-6">
                                {isLoading ? (
                                    <div className="flex justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
                                    </div>
                                ) : (
                                    <>
                                        {/* WhatsApp Toggle */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-md font-medium text-gray-800">Enable WhatsApp Checkout</h3>
                                                <p className="text-sm text-gray-500 mt-1">If enabled, checkout buttons will redirect users to WhatsApp to place their order manually instead of using the payment gateway.</p>
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

                                        {/* WhatsApp Number Input */}
                                        {whatsappCheckoutEnabled && (
                                            <div className="pt-4 border-t border-gray-100">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    WhatsApp Business Number
                                                </label>
                                                <div className="flex mt-1 relative rounded-md shadow-sm w-full max-w-md">
                                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                                        +
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="flex-1 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-gray-300 px-3 py-2 border focus:ring-[var(--brand-pink)] focus:border-[var(--brand-pink)] outline-none"
                                                        placeholder="919876543210"
                                                        value={whatsappNumber}
                                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">Enter your number with the country code, but without the + sign (e.g. 919876543210 for India).</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading || isSaving}
                                    className="px-4 py-2 bg-[var(--brand-pink)] text-white rounded shadow text-sm font-medium hover:bg-[var(--brand-pink-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-pink)] transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? "Saving..." : "Save Settings"}
                                </button>
                            </div>
            </div>
        </div>
    );
}
