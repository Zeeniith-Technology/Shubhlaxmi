"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2, Edit2, Star, Check } from "lucide-react";

interface Address {
    _id?: string;
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
}

interface AddressManagerProps {
    addresses: Address[];
    refreshProfile: () => void;
}

export default function AddressManager({ addresses, refreshProfile }: AddressManagerProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Address>({
        name: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "India",
        isDefault: false
    });

    const resetForm = () => {
        setFormData({
            name: "",
            phone: "",
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "India",
            isDefault: false
        });
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleEdit = (address: Address) => {
        setFormData({
            name: address.name || "",
            phone: address.phone || "",
            street: address.street || "",
            city: address.city || "",
            state: address.state || "",
            zipCode: address.zipCode || "",
            country: address.country || "India",
            isDefault: address.isDefault || false
        });
        setEditingId(address._id as string);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/customer/address/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ id })
            });

            const data = await res.json();
            if (data.success) {
                alert("Address deleted");
                refreshProfile();
            } else {
                alert(data.message || "Failed to delete address");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/customer/address/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ id, isDefault: true })
            });

            const data = await res.json();
            if (data.success) {
                alert("Default address updated");
                refreshProfile();
            }
        } catch (error) {
            console.error(error);
            alert("Failed to update default address");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem("token");
            const endpoint = editingId
                ? "http://localhost:5000/api/customer/address/update"
                : "http://localhost:5000/api/customer/address/add";

            const payload = editingId ? { ...formData, id: editingId } : formData;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                alert(editingId ? "Address updated" : "Address added");
                refreshProfile();
                resetForm();
            } else {
                alert(data.message || "Operation failed");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while saving the address");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-[var(--font-heading)] font-semibold">Saved Addresses</h2>
                {!isFormOpen && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--brand-pink)] text-white text-sm font-medium rounded-md shadow hover:bg-pink-700 transition"
                    >
                        <Plus size={16} /> Add New Address
                    </button>
                )}
            </div>

            {/* Address Form */}
            {isFormOpen && (
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 mb-8 mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="font-semibold text-lg mb-4 text-gray-800 border-b pb-2">
                        {editingId ? "Edit Shipping Address" : "Add New Shipping Address"}
                    </h3>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-1">
                            <label className="block text-sm text-gray-700 mb-1">Receipt Name <span className="text-red-500">*</span></label>
                            <input
                                required type="text"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-pink-500 outline-none"
                                placeholder="Full Name"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm text-gray-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                            <input
                                required type="tel"
                                value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-pink-500 outline-none"
                                placeholder="Phone number"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-700 mb-1">Street Address <span className="text-red-500">*</span></label>
                            <input
                                required type="text"
                                value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-pink-500 outline-none"
                                placeholder="House No, Building, Street, Area"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                            <input
                                required type="text"
                                value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-pink-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                            <input
                                required type="text"
                                value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-pink-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm text-gray-700 mb-1">Pincode/Zip <span className="text-red-500">*</span></label>
                            <input
                                required type="text"
                                value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-pink-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                            <input
                                required type="text"
                                value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-pink-500 outline-none"
                            />
                        </div>

                        <div className="md:col-span-2 pt-2 flex items-center">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={formData.isDefault}
                                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                                className="h-4 w-4 text-[var(--brand-pink)] rounded border-gray-300 focus:ring-pink-500"
                            />
                            <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700 cursor-pointer">
                                Set as default shipping address
                            </label>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-5 py-2 text-gray-600 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2 text-white bg-[var(--brand-pink)] rounded shadow hover:bg-pink-700 transition"
                            >
                                {saving ? "Saving..." : "Save Address"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Address List */}
            {!isFormOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.length === 0 ? (
                        <div className="col-span-full py-10 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                            <MapPin className="mx-auto text-gray-300 mb-3" size={40} />
                            <p className="text-gray-500 font-medium tracking-wide">No addresses saved yet.</p>
                            <p className="text-gray-400 text-sm mt-1">Add a shipping address to speed up your checkout.</p>
                        </div>
                    ) : (
                        addresses.map((address) => (
                            <div
                                key={address._id}
                                className={`relative border rounded-lg p-5 transition-all ${address.isDefault ? "border-pink-300 bg-pink-50/30" : "border-gray-200 hover:border-pink-200"
                                    }`}
                            >
                                {address.isDefault && (
                                    <div className="absolute top-0 right-0 py-1 px-3 bg-pink-100 text-[var(--brand-pink)] text-xs font-bold rounded-bl-lg rounded-tr-lg flex items-center gap-1">
                                        <Star size={12} fill="currentColor" /> Default
                                    </div>
                                )}

                                <h3 className="font-semibold text-gray-900 text-lg">{address.name}</h3>
                                <p className="text-sm font-medium text-gray-600 mt-1 mb-3">{address.phone}</p>

                                <div className="text-gray-600 text-sm leading-relaxed space-y-0.5 min-h-[80px]">
                                    <p>{address.street}</p>
                                    <p>{address.city}, {address.state}</p>
                                    <p>{address.zipCode}</p>
                                    <p>{address.country}</p>
                                </div>

                                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100/80">
                                    <button
                                        onClick={() => handleEdit(address)}
                                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 transition-colors"
                                    >
                                        <Edit2 size={14} /> Edit
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        onClick={() => handleDelete(address._id as string)}
                                        className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 transition-colors"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>

                                    {!address.isDefault && (
                                        <button
                                            onClick={() => handleSetDefault(address._id as string)}
                                            className="ml-auto text-gray-500 hover:text-[var(--brand-pink)] py-1.5 px-3 rounded text-xs font-semibold uppercase tracking-wider bg-white border border-gray-200 hover:border-pink-200 transition-colors shadow-sm"
                                        >
                                            Set Default
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
