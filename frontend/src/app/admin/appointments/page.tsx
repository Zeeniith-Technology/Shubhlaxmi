"use client";

import { useState, useEffect, useMemo } from "react";
import { Video, Calendar, Clock, User, Phone, Mail, FileText, Search, Filter, Trash2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Appointment {
    _id: string;
    name: string;
    email: string;
    phone: string;
    date: string;
    timeSlot: string;
    status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
    notes?: string;
    createdAt: string;
}

export default function AdminAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [dateFilter, setDateFilter] = useState("All");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`${API_BASE}/appointment/list`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({})
            });

            const data = await res.json();
            if (data.success) {
                // Sort by most recent first
                const sorted = (data.data || []).sort((a: Appointment, b: Appointment) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setAppointments(sorted);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`${API_BASE}/appointment/update`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ id, status: newStatus })
            });

            const data = await res.json();
            if (data.success) {
                fetchAppointments(); // Refresh list
            } else {
                alert(data.message || "Failed to update status");
            }
        } catch (error) {
            console.error("Error updating appointment:", error);
            alert("Network error.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this appointment? This action cannot be undone.")) {
            return;
        }

        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`${API_BASE}/appointment/delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ id })
            });

            const data = await res.json();
            if (data.success) {
                fetchAppointments();
            } else {
                alert(data.message || "Failed to delete appointment");
            }
        } catch (error) {
            console.error("Error deleting appointment:", error);
            alert("Network error.");
        }
    };

    // Filter logic
    const filteredAppointments = useMemo(() => {
        return appointments.filter(appt => {
            // 1. Search Query
            const query = searchQuery.toLowerCase();
            const matchesSearch = 
                (appt.name || "").toLowerCase().includes(query) ||
                (appt.email || "").toLowerCase().includes(query) ||
                (appt.phone || "").toLowerCase().includes(query);

            if (!matchesSearch) return false;

            // 2. Status Filter
            if (statusFilter !== "All" && appt.status !== statusFilter) {
                return false;
            }

            // 3. Date Filter (using booking createdAt time)
            if (dateFilter !== "All") {
                const apptDate = new Date(appt.createdAt);
                const now = new Date();
                
                if (dateFilter === "Today") {
                    if (apptDate.toDateString() !== now.toDateString()) return false;
                } else if (dateFilter === "Last 7 Days") {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(now.getDate() - 7);
                    if (apptDate < sevenDaysAgo) return false;
                } else if (dateFilter === "Last 30 Days") {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(now.getDate() - 30);
                    if (apptDate < thirtyDaysAgo) return false;
                }
            }

            return true;
        });
    }, [appointments, searchQuery, statusFilter, dateFilter]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, dateFilter]);

    // Pagination logic
    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
    const paginatedAppointments = filteredAppointments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) {
        return <div className="p-8 text-center text-gray-500 font-medium">Loading appointments...</div>;
    }

    return (
        <div className="p-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                    <Video className="text-[var(--brand-pink)]" size={28} />
                    Video Appointments
                </h1>
                
                <div className="flex gap-4">
                    <div className="bg-white shadow-sm border border-gray-100 rounded-lg px-4 py-2 text-sm font-medium text-gray-600">
                        Total: {appointments.length}
                    </div>
                    <div className="bg-white shadow-sm border border-gray-100 rounded-lg px-4 py-2 text-sm font-medium text-[var(--brand-pink)]">
                        Showing: {filteredAppointments.length}
                    </div>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                
                {/* Search */}
                <div className="relative w-full sm:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Name, Email, or Phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="py-2.5 pl-3 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] cursor-pointer bg-gray-50"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Date Dropdown */}
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="py-2.5 pl-3 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] cursor-pointer bg-gray-50"
                        >
                            <option value="All">All Time</option>
                            <option value="Today">Booked Today</option>
                            <option value="Last 7 Days">Booked Last 7 Days</option>
                            <option value="Last 30 Days">Booked Last 30 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-medium border-b border-gray-100">Customer Details</th>
                                <th className="p-4 font-medium border-b border-gray-100 w-48">Schedule</th>
                                <th className="p-4 font-medium border-b border-gray-100 min-w-[200px]">Notes</th>
                                <th className="p-4 font-medium border-b border-gray-100 w-32">Status</th>
                                <th className="p-4 font-medium border-b border-gray-100 w-48 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                                            <Video className="text-gray-400" size={32} />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments found</h3>
                                        <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedAppointments.map((appt) => (
                                    <tr key={appt._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 mb-1 flex items-center gap-1.5">
                                                <User size={14} className="text-gray-400" /> {appt.name}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                                                <Mail size={12} className="text-gray-400" /> {appt.email}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                                <Phone size={12} className="text-gray-400" /> {appt.phone}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 mb-1 flex items-center gap-1.5">
                                                <Calendar size={14} className="text-gray-400" /> {appt.date}
                                            </div>
                                            <div className="text-xs font-semibold text-[var(--brand-pink)] flex items-center gap-1.5">
                                                <Clock size={12} className="text-pink-300" /> {appt.timeSlot}
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-2">
                                                Booked: {new Date(appt.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {appt.notes ? (
                                                <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded p-2 border border-gray-100 flex gap-2">
                                                    <FileText size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                                    {appt.notes}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">None</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                                appt.status === 'Confirmed' ? 'bg-green-50 text-green-700 border border-green-200' :
                                                appt.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                                appt.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                'bg-blue-50 text-blue-700 border border-blue-200'
                                            }`}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <select
                                                    value={appt.status}
                                                    onChange={(e) => handleUpdateStatus(appt._id, e.target.value)}
                                                    className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-pink)] font-medium text-gray-700 cursor-pointer"
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Confirmed">Confirm</option>
                                                    <option value="Completed">Complete</option>
                                                    <option value="Cancelled">Cancel</option>
                                                </select>
                                                
                                                <button 
                                                    onClick={() => handleDelete(appt._id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete Appointment"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filteredAppointments.length)}</span> of <span className="font-medium text-gray-900">{filteredAppointments.length}</span> entries
                        </span>
                        
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-200 rounded text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            
                            {Array.from({ length: totalPages }).map((_, i) => {
                                if (
                                    totalPages <= 7 || 
                                    (i === 0 || i === totalPages - 1) ||
                                    (i >= currentPage - 2 && i <= currentPage)
                                ) {
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-8 h-8 flex items-center justify-center border rounded text-sm font-medium transition-colors ${
                                                currentPage === i + 1 
                                                    ? 'bg-[var(--brand-pink)] border-[var(--brand-pink)] text-white' 
                                                    : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    );
                                } else if (
                                    (i === 1 && currentPage > 3) || 
                                    (i === totalPages - 2 && currentPage < totalPages - 2)
                                ) {
                                    return <span key={i} className="px-2 py-1 text-gray-400">...</span>;
                                }
                                return null;
                            })}
                            
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-200 rounded text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
