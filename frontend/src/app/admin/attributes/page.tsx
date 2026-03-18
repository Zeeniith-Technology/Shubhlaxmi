"use client";

import { useState, useEffect } from "react";
import { Edit, Trash2, Plus } from "lucide-react";

// ── Inline notification modal ──────────────────────────────
function NotifModal({ msg, onClose }: { msg: { text: string; type: "success" | "error" } | null; onClose: () => void }) {
    if (!msg) return null;
    const isSuccess = msg.type === "success";
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm">
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
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-3xl">🗑️</div>
                <p className="text-center text-gray-800 font-medium text-sm">Are you sure you want to delete this attribute?</p>
                <div className="flex gap-3 w-full mt-1">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600">Delete</button>
                </div>
            </div>
        </div>
    );
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AttributesPage() {
    const [attributes, setAttributes] = useState<any[]>([]);
    const [name, setName] = useState("");
    const [valuesInput, setValuesInput] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    // UI State
    const [notif, setNotif] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const getToken = () => localStorage.getItem("admin_token") || "";
    const hdrs = () => ({ "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` });

    const fetchAttributes = async () => {
        try {
            const res = await fetch(`${API_BASE}/attribute/list`, {
                method: "POST",
                headers: hdrs(),
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.success) {
                setAttributes(data.data);
            }
        } catch (error) {
            console.error("Error fetching attributes", error);
        }
    };

    useEffect(() => {
        fetchAttributes();
    }, []);

    const resetForm = () => {
        setName("");
        setValuesInput("");
        setEditId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const trimmedName = name.trim();
        if (!trimmedName) {
            setNotif({ text: "Attribute Name is required", type: "error" });
            return;
        }

        // Check for duplicates (case-insensitive)
        const isDuplicate = attributes.some(
            attr => attr.name.toLowerCase() === trimmedName.toLowerCase() && attr._id !== editId
        );
        
        if (isDuplicate) {
            setNotif({ text: `An attribute named "${trimmedName}" already exists.`, type: "error" });
            return;
        }

        setLoading(true);

        const parsedValues = valuesInput
            .split(",")
            .map(v => v.trim())
            .filter(v => v !== "");

        if (parsedValues.length === 0) {
            setNotif({ text: "Please provide at least one valid value.", type: "error" });
            setLoading(false);
            return;
        }

        try {
            const url = editId ? `${API_BASE}/attribute/update` : `${API_BASE}/attribute/add`;
            const payload: any = { name: trimmedName, values: parsedValues };
            if (editId) payload.id = editId;

            const res = await fetch(url, {
                method: "POST",
                headers: hdrs(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success || data.status) {
                resetForm();
                fetchAttributes();
                setNotif({ text: editId ? "Attribute updated successfully!" : "Attribute created successfully!", type: "success" });
            } else {
                setNotif({ text: data.message || "Operation failed", type: "error" });
            }
        } catch {
            setNotif({ text: "Network error. Please try again.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        const id = confirmDeleteId;
        setConfirmDeleteId(null);
        
        try {
            const res = await fetch(`${API_BASE}/attribute/delete`, {
                method: "POST", headers: hdrs(),
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.success || data.status) {
                fetchAttributes();
                setNotif({ text: "Attribute deleted successfully.", type: "success" });
            } else {
                setNotif({ text: data.message || "Failed to delete attribute.", type: "error" });
            }
        } catch {
            setNotif({ text: "Network error while deleting.", type: "error" });
        }
    };

    const handleEdit = (attr: any) => {
        setEditId(attr._id);
        setName(attr.name);
        setValuesInput(attr.values.join(", "));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-300">
            {/* Modals */}
            <NotifModal msg={notif} onClose={() => setNotif(null)} />
            <ConfirmModal
                open={!!confirmDeleteId}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDeleteId(null)}
            />

            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Global Attributes</h1>
                <p className="text-sm text-gray-500 mt-2">Manage standard dropdown options like Fabric, Occasion, Color, etc. ensuring consistency across all products.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Form Column */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        {editId ? <Edit size={18} className="text-indigo-500" /> : <Plus size={18} className="text-[#ec268f]" />}
                        {editId ? "Edit Attribute" : "Add New Attribute"}
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Attribute Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Fabric"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#ec268f] focus:border-transparent outline-none transition-all text-sm"
                            />
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Values <span className="text-red-500">*</span></label>
                            <textarea
                                value={valuesInput}
                                onChange={(e) => setValuesInput(e.target.value)}
                                placeholder="Silk, Cotton, Georgette..."
                                rows={4}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#ec268f] focus:border-transparent outline-none transition-all text-sm resize-y"
                            />
                            <p className="text-xs text-gray-400 font-medium tracking-wide">Separate multiple values with commas.</p>
                        </div>
                        
                        <div className="pt-2 flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-sm
                                    ${loading ? "bg-gray-400 cursor-not-allowed" : editId ? "bg-indigo-600 hover:bg-indigo-700" : "bg-[#ec268f] hover:bg-[#c91873]"}`}
                            >
                                {loading ? "Saving..." : editId ? "Update Attribute" : "Save Attribute"}
                            </button>
                            
                            {editId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="w-full py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all text-sm"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Table Column */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    {attributes.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl opacity-50">📋</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">No attributes found</h3>
                            <p className="text-sm text-gray-500 max-w-sm">Create standard attributes here so you can easily assign them to your products later without typing them out each time.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Values</th>
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {attributes.map((attr) => (
                                        <tr key={attr._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-5 px-6">
                                                <span className="font-semibold text-gray-800">{attr.name}</span>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex flex-wrap gap-2">
                                                    {attr.values.map((v: string, idx: number) => (
                                                        <span key={idx} className="px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium shadow-sm">
                                                            {v}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-right space-x-3 whitespace-nowrap">
                                                <button 
                                                    onClick={() => handleEdit(attr)} 
                                                    className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors inline-block"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => setConfirmDeleteId(attr._id)} 
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

