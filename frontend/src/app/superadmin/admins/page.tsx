"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ShieldAlert, Shield, Mail, Calendar, User } from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AdminManagementPage() {
    const router = useRouter();
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("admin"); // 'admin' or 'superadmin'

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("superadmin_token");
            if (!token) return router.push("/superadmin/login");

            const res = await fetch(`${API_BASE}/superadmin/admins/list`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}),
            });

            const data = await res.json();
            if (data.success) {
                setAdmins(data.admins);
            } else {
                setError(data.message || "Failed to fetch admins");
            }
        } catch (err: any) {
            setError(err.message || "Network Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Quick verification check
        const adminDataStr = localStorage.getItem("superadmin_data");
        if (adminDataStr) {
            try {
                const adminData = JSON.parse(adminDataStr);
                if (adminData.role !== "superadmin") {
                    router.push("/superadmin"); // Kick out non-superadmins
                    return;
                }
            } catch (e) { }
        } else {
            router.push("/superadmin/login");
            return;
        }

        fetchAdmins();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to permanently delete this admin?")) return;
        
        try {
            const token = localStorage.getItem("superadmin_token");
            const res = await fetch(`${API_BASE}/superadmin/admins/delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ id }),
            });

            const data = await res.json();
            if (data.success) {
                fetchAdmins();
            } else {
                alert(data.message || "Failed to delete admin");
            }
        } catch (err: any) {
            alert(err.message || "Network Error");
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("superadmin_token");
            const res = await fetch(`${API_BASE}/superadmin/admins/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole }),
            });

            const data = await res.json();
            if (data.success) {
                setIsModalOpen(false);
                setNewName("");
                setNewEmail("");
                setNewPassword("");
                setNewRole("admin");
                fetchAdmins();
            } else {
                alert(data.message || "Failed to create admin");
            }
        } catch (err: any) {
            alert(err.message || "Network Error");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-[#ec268f] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Admin Management</h1>
                    <p className="text-gray-500 text-sm mt-1">SuperAdmin exclusive: Create and manage system administrators.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#ec268f] hover:bg-[#d01e7a] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    Create Admin
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2 border border-red-100">
                    <ShieldAlert size={20} />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role Level</th>
                                <th className="px-6 py-4">Registered Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {admins.map((admin) => (
                                <tr key={admin._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-pink-100 text-[#ec268f] flex items-center justify-center font-bold">
                                                {admin.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-gray-900">{admin.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Mail size={14} className="text-gray-400" />
                                            {admin.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                            admin.role === 'superadmin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                                        }`}>
                                            {admin.role === 'superadmin' ? <ShieldAlert size={12} /> : <Shield size={12} />}
                                            {admin.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            {new Date(admin.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(admin._id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Admin"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Admin Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
                        >
                            ✕
                        </button>
                        
                        <div className="mb-6">
                            <div className="w-12 h-12 bg-pink-50 text-[#ec268f] rounded-xl flex items-center justify-center mb-4">
                                <User size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Add New Admin</h2>
                            <p className="text-sm text-gray-500 mt-1">Create a new dashboard manager account.</p>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ec268f] focus:border-transparent text-black"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ec268f] focus:border-transparent text-black"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ec268f] focus:border-transparent text-black"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ec268f] focus:border-transparent bg-white text-black"
                                >
                                    <option value="admin">Admin (Standard Dashboard Access)</option>
                                    <option value="superadmin">Super Admin (Full Root Access)</option>
                                </select>
                            </div>
                            
                            <div className="pt-4 mt-6 border-t border-gray-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-[#ec268f] hover:bg-[#d01e7a] text-white rounded-lg transition-colors font-medium shadow-sm"
                                >
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
