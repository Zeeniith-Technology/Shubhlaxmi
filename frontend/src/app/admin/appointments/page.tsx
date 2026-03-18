"use client";

import { useState, useEffect } from "react";
import { Video, Calendar, Clock, User, Phone, Mail, FileText, CheckCircle, XCircle } from "lucide-react";

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
                setAppointments(data.data || []);
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

    if (loading) {
        return <div className="p-8 text-center text-gray-500 font-medium">Loading appointments...</div>;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                    <Video className="text-[var(--brand-pink)]" size={28} />
                    Video Appointments
                </h1>
                <div className="bg-white shadow-sm border border-gray-100 rounded-lg px-4 py-2 text-sm font-medium text-gray-600">
                    Total: {appointments.length}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
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
                            {appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No appointments booked yet.
                                    </td>
                                </tr>
                            ) : (
                                appointments.map((appt) => (
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
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${appt.status === 'Confirmed' ? 'bg-green-50 text-green-700 border border-green-200' :
                                                appt.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                                    appt.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                        'bg-blue-50 text-blue-700 border border-blue-200'
                                                }`}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <select
                                                value={appt.status}
                                                onChange={(e) => handleUpdateStatus(appt._id, e.target.value)}
                                                className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-pink)] font-medium text-gray-700"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Confirmed">Confirm</option>
                                                <option value="Completed">Complete</option>
                                                <option value="Cancelled">Cancel</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

