"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Video, User, Phone, Mail, CheckCircle, AlertCircle } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

// Helper to generate 30-min slots between 10 AM and 6 PM
const generateTimeSlots = () => {
    const slots = [];
    let startHour = 10;
    let endHour = 18; // 6 PM

    for (let h = startHour; h < endHour; h++) {
        // First half hour
        let time1 = `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
        let time2 = `${h > 12 ? h - 12 : h}:30 ${h >= 12 ? 'PM' : 'AM'}`;
        slots.push(`${time1} - ${time2}`);

        // Second half hour
        let time3 = time2;
        let nextH = h + 1;
        let time4 = `${nextH > 12 ? nextH - 12 : nextH}:00 ${nextH >= 12 ? 'PM' : 'AM'}`;
        slots.push(`${time3} - ${time4}`);
    }
    return slots;
};

const ALL_SLOTS = generateTimeSlots();
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function VideoAppointmentPage() {
    const [date, setDate] = useState<Date>(new Date());
    const [selectedSlot, setSelectedSlot] = useState("");
    const [formData, setFormData] = useState({ name: "", email: "", phone: "", notes: "" });
    const [errors, setErrors] = useState({ name: "", email: "", phone: "" });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // Disable past dates
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        // Handled entirely by the initialized Date object now
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset errors
        const newErrors = { name: "", email: "", phone: "" };
        let hasError = false;

        // Custom Validation Rules
        if (!formData.name.trim()) {
            newErrors.name = "Full name is required.";
            hasError = true;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = "Email address is required.";
            hasError = true;
        } else if (!emailRegex.test(formData.email) || formData.email.includes("..")) {
            newErrors.email = "Please enter a valid email address.";
            hasError = true;
        }

        const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required.";
            hasError = true;
        } else if (!phoneRegex.test(formData.phone)) {
            newErrors.phone = "Please enter a valid phone number.";
            hasError = true;
        }

        setErrors(newErrors);

        if (hasError) return;

        if (!date || !selectedSlot) {
            setMessage({ text: "Please select a Date and a Time Slot.", type: "error" });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch(`${API_BASE}/public/appointment/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: format(date, "yyyy-MM-dd"),
                    timeSlot: selectedSlot,
                    ...formData
                })
            });

            const data = await res.json();
            if (data.success) {
                setIsSuccess(true);
            } else {
                setMessage({ text: data.message || "Something went wrong. Please try again.", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "Network error. Please try again later.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-gray-50">
                <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-100 max-w-lg w-full text-center">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-green-500" />
                    </div>
                    <h2 className="text-2xl font-[var(--font-heading)] text-gray-900 mb-4 tracking-wide">Appointment Confirmed!</h2>
                    <p className="text-gray-600 font-[var(--font-body)] mb-8 leading-relaxed">
                        Thank you, {formData.name}. Your video shopping appointment is scheduled for <strong className="text-gray-900">{format(date, "MMM do, yyyy")}</strong> at <strong className="text-gray-900">{selectedSlot}</strong>.
                        We will send the meeting link to {formData.email} shortly.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-[var(--brand-pink)] text-white px-8 py-3 rounded-full font-medium hover:bg-pink-600 transition-colors shadow-sm"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1000px] mx-auto">
                {/* Header section */}
                <div className="text-center mb-12">
                    <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-50 mb-4 text-[var(--brand-pink)]">
                        <Video size={30} />
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-[var(--font-heading)] text-gray-900 tracking-wide mb-4">
                        Live Video Shopping
                    </h1>
                    <p className="max-w-xl mx-auto text-gray-600 font-[var(--font-body)] text-[15px] leading-relaxed">
                        Experience our exclusive collection from the comfort of your home. Book a 30-minute personalized video consultation with our fashion experts.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">

                    {/* Left Column: Date and Time Selection */}
                    <div className="flex-1 p-6 sm:p-10 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/30">
                        <h2 className="text-lg font-bold text-gray-900 font-[var(--font-heading)] mb-6 flex items-center gap-2">
                            <Calendar size={18} className="text-[var(--brand-pink)]" />
                            Step 1: Choose Date & Time
                        </h2>

                        <div className="mb-8 relative z-50">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                            <div className="relative">
                                <DatePicker
                                    selected={date}
                                    onChange={(d: Date | null) => { if (d) setDate(d); setSelectedSlot(""); }}
                                    minDate={new Date()}
                                    dateFormat="MMMM d, yyyy"
                                    className="w-full sm:w-[280px] border border-gray-300 rounded-lg py-2.5 px-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent transition-all shadow-sm font-medium"
                                    calendarClassName="rounded-xl border-gray-100 shadow-xl font-[var(--font-body)] p-2 bg-white"
                                />
                                <div className="absolute top-1/2 -translate-y-1/2 left-[245px] sm:left-[245px] pointer-events-none text-gray-500">
                                    <Calendar size={18} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                                <Clock size={16} className="text-gray-400" />
                                Available Slots for {format(date, "MMM do")}
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {ALL_SLOTS.map(slot => (
                                    <button
                                        key={slot}
                                        type="button"
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`py-2 px-1 text-xs sm:text-[13px] font-medium rounded-lg border transition-all ${selectedSlot === slot
                                            ? 'bg-pink-50 border-[var(--brand-pink)] text-[var(--brand-pink)] shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Contact Details Form */}
                    <div className="flex-1 p-6 sm:p-10">
                        <h2 className="text-lg font-bold text-gray-900 font-[var(--font-heading)] mb-6 flex items-center gap-2">
                            <User size={18} className="text-[var(--brand-pink)]" />
                            Step 2: Your Details
                        </h2>

                        {message && (
                            <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                <p className="text-sm font-medium">{message.text}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <div className="relative">
                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${errors.name ? 'text-red-400' : 'text-gray-400'}`}>
                                        <User size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={e => {
                                            setFormData({ ...formData, name: e.target.value });
                                            if (errors.name) setErrors({ ...errors, name: "" });
                                        }}
                                        className={`pl-10 w-full border rounded-lg py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 transition-all ${errors.name
                                                ? 'border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50/30'
                                                : 'border-gray-300 focus:ring-[var(--brand-pink)] focus:border-transparent'
                                            }`}
                                    />
                                </div>
                                {errors.name && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12} />{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                                <div className="relative">
                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${errors.email ? 'text-red-400' : 'text-gray-400'}`}>
                                        <Mail size={16} />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={e => {
                                            setFormData({ ...formData, email: e.target.value });
                                            if (errors.email) setErrors({ ...errors, email: "" });
                                        }}
                                        className={`pl-10 w-full border rounded-lg py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 transition-all ${errors.email
                                                ? 'border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50/30'
                                                : 'border-gray-300 focus:ring-[var(--brand-pink)] focus:border-transparent'
                                            }`}
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12} />{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                <div className="relative">
                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${errors.phone ? 'text-red-400' : 'text-gray-400'}`}>
                                        <Phone size={16} />
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="+91 98765 43210"
                                        value={formData.phone}
                                        onChange={e => {
                                            setFormData({ ...formData, phone: e.target.value });
                                            if (errors.phone) setErrors({ ...errors, phone: "" });
                                        }}
                                        className={`pl-10 w-full border rounded-lg py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 transition-all ${errors.phone
                                                ? 'border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50/30'
                                                : 'border-gray-300 focus:ring-[var(--brand-pink)] focus:border-transparent'
                                            }`}
                                    />
                                </div>
                                {errors.phone && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12} />{errors.phone}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">What are you looking for? (Optional)</label>
                                <textarea
                                    rows={3}
                                    placeholder="E.g., Bridal lehenga in pastel colors..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent transition-all"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !date || !selectedSlot}
                                className="w-full bg-gray-900 text-white font-medium py-3.5 px-4 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {loading ? "Booking..." : selectedSlot ? `Book for ${selectedSlot}` : "Select a Time Slot First"}
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}

