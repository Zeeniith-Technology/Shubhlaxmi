"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, AlertCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AppointmentHistory() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const token = localStorage.getItem("customer_token");
                const res = await fetch(`${API_BASE}/customer/appointment/history`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({})
                });

                const data = await res.json();
                if (data.success) {
                    setAppointments(data.appointments);
                } else {
                    setError("Failed to fetch appointments");
                }
            } catch (err) {
                console.error("Error fetching appointments:", err);
                setError("Network error");
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="w-8 h-8 border-2 border-[var(--brand-pink)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm border border-red-100 flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-pink-50 text-[var(--brand-pink)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments found</h3>
                <p className="text-gray-500">You haven't booked any video shopping sessions yet.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 font-[var(--font-heading)] tracking-wide">My Appointments</h2>
            <div className="space-y-4">
                {appointments.map((apt) => (
                    <div key={apt._id} className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="font-semibold text-gray-900 text-lg">Live Video Shopping</h3>
                                <div className="flex items-center text-sm text-gray-500 gap-4">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={14} className="text-[var(--brand-pink)]" />
                                        {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={14} className="text-[var(--brand-pink)]" />
                                        {apt.timeSlot}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                                    apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                                    apt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {apt.status || 'Pending'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
