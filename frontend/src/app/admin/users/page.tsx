"use client";

import { useState, useEffect } from "react";
import { Users, Search, Mail, Phone, Calendar, UserCheck, UserX } from "lucide-react";

interface User {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("admin_token");
            if (!token) return;

            const res = await fetch("http://localhost:5000/api/customer/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({})
            });

            const data = await res.json();
            if (data.success) {
                setUsers(data.data);
                setFilteredUsers(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter users when search query changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers(users);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = users.filter((u) =>
                u.name.toLowerCase().includes(query) ||
                u.email.toLowerCase().includes(query) ||
                (u.phone && u.phone.includes(query))
            );
            setFilteredUsers(filtered);
        }
    }, [searchQuery, users]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-8 mt-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand-pink)] border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-[var(--font-heading)] flex items-center gap-2">
                        <Users className="text-[var(--brand-pink)]" size={26} />
                        Customer Directory
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        View and manage all registered users on your platform.
                    </p>
                </div>

                {/* Metric Card */}
                <div className="bg-white border text-center border-pink-100 rounded-xl shadow-md px-6 py-3 flex items-center gap-4 hover:shadow-lg transition-shadow duration-200">
                    <div className="bg-pink-50 p-3 rounded-xl border border-pink-100">
                        <Users className="text-[var(--brand-pink)]" size={24} />
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                {/* Toolbar */}
                <div className="p-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent sm:text-sm transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-[#f8f9fa] border-b border-gray-200">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <Search className="h-10 w-10 text-gray-300 mb-2" />
                                            <p className="text-lg font-medium">No customers found</p>
                                            <p className="text-sm">We couldn't find anyone matching that search.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-[var(--brand-pink)] font-bold text-lg">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 flex items-center gap-1.5 mb-1">
                                                <Mail size={14} className="text-gray-400" />
                                                <a href={`mailto:${user.email}`} className="hover:text-[var(--brand-pink)] hover:underline">{user.email}</a>
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center gap-1.5">
                                                <Phone size={14} className="text-gray-400" />
                                                {user.phone ? <a href={`tel:${user.phone}`} className="hover:text-[var(--brand-pink)]">{user.phone}</a> : <span className="text-gray-300 italic">Not provided</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full gap-1 items-center ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-gray-400" />
                                                {formatDate(user.createdAt)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer details */}
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-right">
                    Showing {filteredUsers.length} of {users.length} registered customers
                </div>
            </div>
        </div>
    );
}
