"use client";

import { useState, useEffect } from "react";

export default function HomepageSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [selectionType, setSelectionType] = useState('latest');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(true);

    // Reference Data
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubCategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        fetchSettings();
        fetchReferenceData();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/settings/trending/get", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({})
            });
            const resData = await res.json();
            if (resData.status) {
                const data = resData.data;
                setSelectionType(data.selectionType || 'latest');
                setSelectedIds(data.selectedIds || []);
                setIsActive(data.isActive !== false);
            }
        } catch (error) {
            console.error("Error fetching homepage settings", error);
            alert("Failed to load settings.");
        } finally {
            setLoading(false);
        }
    };

    const fetchReferenceData = async () => {
        try {
            const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            };

            // Using standard POST endpoints to populate options.
            const [catRes, prodRes] = await Promise.all([
                fetch("http://localhost:5000/api/category/list", { method: "POST", headers, body: JSON.stringify({}) }),
                fetch("http://localhost:5000/api/product/list", { method: "POST", headers, body: JSON.stringify({}) })
            ]);

            const [catData, prodData] = await Promise.all([
                catRes.json(),
                prodRes.json()
            ]);

            if (catData.success) {
                setCategories(catData.data.filter((c: any) => !c.parentCategoryId));
                setSubCategories(catData.data.filter((c: any) => c.parentCategoryId));
            }
            if (prodData.success) {
                setProducts(prodData.data);
            }

        } catch (error) {
            console.error("Error fetching reference data", error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/settings/trending/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    selectionType,
                    selectedIds,
                    isActive
                })
            });

            const resData = await res.json();
            if (resData.status) {
                alert("Homepage settings updated successfully!");
            } else {
                alert(resData.message || "Failed to update settings.");
            }
        } catch (error: any) {
            console.error(error);
            alert("Server Error.");
        } finally {
            setSaving(false);
        }
    };

    const handleProductToggle = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(pid => pid !== id));
        } else {
            // Add ID
            setSelectedIds([...selectedIds, id]);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Homepage Configuration</h1>

            {loading ? (
                <div className="py-20 flex justify-center text-gray-400">Loading settings...</div>
            ) : (
                <div className="space-y-8">
                    {/* Section: Trending Styles */}
                    <div className="bg-gray-50 border border-gray-100 p-6 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-700">Trending Styles Section</h2>
                            <label className="flex items-center cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isActive ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <span className="ml-3 text-sm font-medium text-gray-700">
                                    {isActive ? 'Visible' : 'Hidden'}
                                </span>
                            </label>
                        </div>

                        <p className="text-sm text-gray-500 mb-6">Configure what products appear in the Trending Styles banner on the storefront homepage.</p>

                        <div className="opacity-100 transition-opacity" style={{ opacity: isActive ? 1 : 0.5 }}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Display Mode</label>
                                <select
                                    className="w-full sm:w-1/2 rounded-md border border-gray-300 p-2.5 shadow-sm focus:border-[var(--brand-pink)] focus:ring-[var(--brand-pink)] sm:text-sm"
                                    value={selectionType}
                                    onChange={(e) => {
                                        setSelectionType(e.target.value);
                                        setSelectedIds([]); // Reset selection when changing modes
                                    }}
                                    disabled={!isActive}
                                >
                                    <option value="latest">Auto: Show 8 Most Recently Added Products</option>
                                    <option value="category">Category: Show newest from a specific Root Category</option>
                                    <option value="section">Sub-Category: Show newest from a specific Sub-Category</option>
                                    <option value="products">Manual: Hand-pick specific products to feature</option>
                                </select>
                            </div>

                            {/* Conditional Inputs */}
                            {selectionType === 'category' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Root Category</label>
                                    <select
                                        className="w-full sm:w-1/2 rounded-md border border-gray-300 p-2.5 shadow-sm"
                                        value={selectedIds[0] || ''}
                                        onChange={(e) => setSelectedIds([e.target.value])}
                                    >
                                        <option value="">-- Choose Category --</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectionType === 'section' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Sub-Category</label>
                                    <select
                                        className="w-full sm:w-1/2 rounded-md border border-gray-300 p-2.5 shadow-sm"
                                        value={selectedIds[0] || ''}
                                        onChange={(e) => setSelectedIds([e.target.value])}
                                    >
                                        <option value="">-- Choose Sub-Category --</option>
                                        {subcategories.map((subcat) => (
                                            <option key={subcat._id} value={subcat._id}>{subcat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectionType === 'products' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Individual Products (Max 8)</label>
                                    <div className="bg-white border border-gray-200 rounded-md h-64 overflow-y-auto p-4 space-y-2">
                                        {products.length === 0 ? (
                                            <p className="text-gray-400 text-sm">No products found in system.</p>
                                        ) : (
                                            products.map(prod => {
                                                const isSelected = selectedIds.includes(prod._id);
                                                const isDisabled = !isSelected && selectedIds.length >= 8;
                                                return (
                                                    <label key={prod._id} className={`flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer ${isDisabled ? 'opacity-50' : ''}`}>
                                                        <input
                                                            type="checkbox"
                                                            className="flex-shrink-0 w-4 h-4 text-[var(--brand-pink)] border-gray-300 rounded focus:ring-[var(--brand-pink)]"
                                                            checked={isSelected}
                                                            onChange={() => handleProductToggle(prod._id)}
                                                            disabled={isDisabled}
                                                        />
                                                        <span className="ml-3 block">
                                                            <span className="text-sm font-medium text-gray-800">{prod.title}</span>
                                                            <span className="text-xs text-gray-500 ml-2 block sm:inline">({prod.categoryName || 'No Category'} - ₹{prod.price})</span>
                                                        </span>
                                                        {isSelected && <span className="ml-auto text-xs bg-green-100 text-green-800 py-1 px-2 rounded-full">Selected</span>}
                                                    </label>
                                                )
                                            })
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">{selectedIds.length} / 8 Products Selected</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`w-full sm:w-auto px-6 py-2.5 bg-[var(--brand-pink)] text-white font-medium rounded-md shadow hover:bg-pink-700 focus:outline-none transition-colors ${saving ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
