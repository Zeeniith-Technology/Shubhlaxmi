"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

// ── Inline notification modal ──────────────────────────────
function NotifModal({ msg, onClose }: { msg: { text: string; type: "success" | "error" } | null; onClose: () => void }) {
    if (!msg) return null;
    const isSuccess = msg.type === "success";
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.35)" }}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${isSuccess ? "bg-green-100" : "bg-red-100"}`}>
                    {isSuccess ? "✅" : "❌"}
                </div>
                <p className="text-center text-gray-800 font-medium text-sm leading-relaxed">{msg.text}</p>
                <button onClick={onClose} className={`mt-1 px-8 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${isSuccess ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"}`}>
                    OK
                </button>
            </div>
        </div>
    );
}

// ── Confirm delete modal ───────────────────────────────────
function ConfirmModal({ open, onConfirm, onCancel }: { open: boolean; onConfirm: () => void; onCancel: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.35)" }}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-3xl">🗑️</div>
                <p className="text-center text-gray-800 font-medium text-sm">Are you sure you want to delete this special collection?</p>
                <div className="flex gap-3 w-full mt-1">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600">Delete</button>
                </div>
            </div>
        </div>
    );
}

// ── Loading overlay ────────────────────────────────────────
function LoadingOverlay() {
    return (
        <div className="fixed inset-0 z-[998] flex flex-col items-center justify-center gap-4" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white text-sm font-medium tracking-wide">Saving, please wait…</p>
        </div>
    );
}

export default function SpecialCollectionsPage() {
    const [collections, setCollections] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notif, setNotif] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Modal State Mngt
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCol, setEditingCol] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form Data
    const [formData, setFormData] = useState({
        title: "",
        categoryId: "",
        maxPrice: "",
        order: "0",
        isActive: true,
        image: null as File | null,
    });
    const [previewImage, setPreviewImage] = useState<string>("");

    useEffect(() => {
        fetchCollections();
        fetchCategories();
    }, []);

    const fetchCollections = async () => {
        try {
            const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/special-collection/list`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.success) {
                setCollections(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching special collections", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/category/list`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.success) setCategories(data.data || []);
        } catch (error) {
            console.error("Error fetching categories", error);
        }
    };

    const handleOpenModal = (collection: any = null) => {
        setEditingCol(collection);
        if (collection) {
            setFormData({
                title: collection.title || "",
                categoryId: collection.categoryId?._id || collection.categoryId || "",
                maxPrice: collection.maxPrice || "0",
                order: collection.order?.toString() || "0",
                isActive: collection.isActive,
                image: null,
            });
            setPreviewImage(collection.image?.url || "");
        } else {
            setFormData({
                title: "",
                categoryId: "",
                maxPrice: "",
                order: "0",
                isActive: true,
                image: null,
            });
            setPreviewImage("");
        }
        setIsModalOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, image: file }));
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.categoryId || !formData.maxPrice) {
            setNotif({ text: "Title, Category, and Max Price are required fields.", type: "error" });
            return;
        }

        if (!editingCol && !formData.image) {
            setNotif({ text: "An image is required for new collections.", type: "error" });
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
            const data = new FormData();

            data.append("title", formData.title);
            data.append("categoryId", formData.categoryId);
            data.append("maxPrice", formData.maxPrice);
            data.append("order", formData.order);
            data.append("isActive", formData.isActive.toString());

            if (formData.image) {
                data.append("image", formData.image);
            }
            if (editingCol) {
                data.append("id", editingCol._id);
            }

            const url = editingCol
                ? `${API_BASE}/special-collection/update`
                : `${API_BASE}/special-collection/add`;

            const res = await fetch(url, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: data
            });

            const resData = await res.json();
            if (resData.success) {
                setIsModalOpen(false);
                fetchCollections();
                setNotif({ text: editingCol ? "Collection updated successfully!" : "Special Collection created successfully!", type: "success" });
            } else {
                setNotif({ text: resData.message || "Operation failed. Please try again.", type: "error" });
            }
        } catch (error) {
            console.error("Submit Error:", error);
            setNotif({ text: "Network error. Please check your connection and try again.", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        const id = confirmDeleteId;
        setConfirmDeleteId(null);
        try {
            const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/special-collection/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.success) {
                fetchCollections();
                setNotif({ text: "Collection deleted successfully.", type: "success" });
            } else {
                setNotif({ text: "Failed to delete. Please try again.", type: "error" });
            }
        } catch (error) {
            console.error("Delete Error", error);
            setNotif({ text: "Network error while deleting.", type: "error" });
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Modals */}
            {isSubmitting && <LoadingOverlay />}
            <NotifModal msg={notif} onClose={() => setNotif(null)} />
            <ConfirmModal
                open={!!confirmDeleteId}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDeleteId(null)}
            />
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Special Collections</h1>
                    <p className="text-gray-500 mt-2 text-sm">Design Storefront visual banners mapped safely to automated category links</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
                >
                    + Add New Banner
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Image Preview</th>
                                <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Button Title</th>
                                <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Link Routing</th>
                                <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {collections.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400">
                                        No special collections created yet. Add one to feature it on the homepage!
                                    </td>
                                </tr>
                            ) : (
                                collections.map((col) => (
                                    <tr key={col._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-5">
                                            {col.image?.url ? (
                                                <div className="relative w-20 h-28 rounded-md overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                                                    <Image src={col.image.url} alt={col.title} fill className="object-cover" />
                                                </div>
                                            ) : <div className="w-20 h-28 bg-gray-100 rounded-md"></div>}
                                        </td>
                                        <td className="p-5">
                                            <p className="font-medium text-gray-900">{col.title}</p>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block w-max">
                                                    Category: <strong>{col.categoryId?.name || 'Unknown'}</strong>
                                                </span>
                                                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block w-max">
                                                    Max Price: <strong>₹{col.maxPrice}</strong>
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${col.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                {col.isActive ? "Active" : "Hidden"}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right space-x-3">
                                            <button onClick={() => handleOpenModal(col)} className="text-indigo-600 hover:text-indigo-900 font-medium text-sm">Edit</button>
                                            <button onClick={() => setConfirmDeleteId(col._id)} className="text-red-500 hover:text-red-700 font-medium text-sm">Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold mb-6">{editingCol ? "Edit Special Collection" : "New Special Collection"}</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Image Upload Block */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image (Portrait 2/3 ratio)</label>
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 flex flex-col items-center gap-2"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {previewImage ? (
                                        <div className="relative w-32 h-48 rounded-md overflow-hidden bg-gray-100">
                                            <Image src={previewImage} alt="Preview" fill className="object-cover" />
                                        </div>
                                    ) : (
                                        <div className="py-8 text-gray-400">Click to upload image file</div>
                                    )}
                                    <p className="text-xs text-indigo-600 font-medium">{previewImage ? "Change Image" : "Select Image"}</p>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                            </div>

                            {/* Button Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Overlay Button Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-black outline-none"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Sarees Under 10K"
                                />
                            </div>

                            {/* Link Data */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Automated Linking</h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Target Category</label>
                                    <select
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-black outline-none bg-white"
                                        value={formData.categoryId}
                                        onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                    >
                                        <option value="" disabled>Choose category...</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Price Limit (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-black outline-none"
                                        value={formData.maxPrice}
                                        onChange={e => setFormData({ ...formData, maxPrice: e.target.value })}
                                        onWheel={e => e.currentTarget.blur()}
                                        placeholder="e.g. 10000"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-black rounded rounded focus:ring-black"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium text-gray-700">Banner Visible</span>
                                </label>
                            </div>

                            {/* Form Options */}
                            <div className="flex gap-3 pt-6 border-t mt-4 border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                                >
                                    {isSubmitting ? "Saving..." : "Save Banner"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

