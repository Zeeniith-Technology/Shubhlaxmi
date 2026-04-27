"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Package, Clock, CheckCircle, CreditCard, Box, MapPin } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function OrderHistory() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`${API_BASE}/customer/order/history`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({})
            });

            const data = await res.json();
            if (data.status) { // Assuming response comes from responsedata middleware
                setOrders(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch order history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "completed":
                return "text-green-600 bg-green-50 border-green-200";
            case "pending":
                return "text-orange-600 bg-orange-50 border-orange-200";
            case "processing":
                return "text-blue-600 bg-blue-50 border-blue-200";
            case "shipped":
                return "text-purple-600 bg-purple-50 border-purple-200";
            case "cancelled":
                return "text-red-600 bg-red-50 border-red-200";
            default:
                return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    if (loading) {
        return (
            <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-4">
                <Package className="h-10 w-10 text-gray-300 animate-pulse" strokeWidth={1} />
                <p className="text-gray-500 font-[var(--font-body)]">Loading your orders...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="min-h-[40vh] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 p-8 text-center">
                <Box className="h-16 w-16 text-gray-300 mb-4" strokeWidth={1} />
                <h3 className="text-lg font-[var(--font-heading)] font-semibold text-gray-900 mb-1">No Orders Yet</h3>
                <p className="text-gray-500 max-w-sm mb-6">Looks like you haven't made any purchases yet. Your future orders will appear here!</p>
                <a href="/collections" className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-[var(--brand-pink)] hover:bg-pink-700 transition-colors">
                    Start Shopping
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-[var(--font-heading)] font-semibold border-b border-gray-100 pb-4">Order History ({orders.length})</h2>
            
            <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                {orders.map((order) => (
                    <div key={order._id} className="bg-white border text-sm border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col hover:border-pink-100 transition-colors">
                        
                        {/* Header Area */}
                        <div className="p-4 sm:p-5 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1 font-mono uppercase tracking-wider">Order #{order._id.substring(order._id.length - 8)}</p>
                                <div className="flex items-center gap-2 text-gray-900 font-medium">
                                    <Clock size={14} className="text-gray-400" />
                                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border shadow-sm text-gray-700 font-medium whitespace-nowrap">
                                    <CreditCard size={14} className="text-gray-400"/>
                                    {order.paymentMethod || 'COD'}
                                </div>
                                <span className={`px-3 py-1 flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                                    {order.status === 'Completed' ? <CheckCircle size={14} /> : <Package size={14} />}
                                    {order.status || 'Pending'}
                                </span>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="p-4 sm:p-5">
                            <div className="space-y-4">
                                {order.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-4 items-center">
                                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50 relative">
                                            {item.product?.images?.[0]?.url ? (
                                                <Image 
                                                    src={item.product.images[0].url} 
                                                    alt={item.product?.title || "Product"} 
                                                    fill
                                                    className="object-cover object-center"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                    <Package size={20} />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-gray-900 font-medium truncate">{item.product?.title || 'Unknown Product'}</h4>
                                            <p className="text-gray-500 mt-0.5">Qty {item.quantity}</p>
                                        </div>
                                        
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-medium text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">₹{item.price?.toLocaleString()} each</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer details */}
                        <div className="p-4 sm:p-5 border-t border-gray-50 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 text-gray-600">
                                <p className="font-medium text-gray-900 text-xs tracking-wider uppercase mb-1">Shipping To</p>
                                {order.shippingAddress ? (
                                    <div className="flex items-start gap-2">
                                        <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                                        <p className="text-[13px] leading-relaxed">
                                            {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-[13px] italic text-gray-400">Unknown destination</p>
                                )}
                            </div>
                            
                            <div className="flex flex-col justify-end items-start sm:items-end mt-4 sm:mt-0">
                                <div className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                                    <span>Total Amount</span>
                                </div>
                                <span className="text-lg font-[var(--font-heading)] font-semibold text-[var(--brand-pink)]">
                                    ₹{order.totalAmount?.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        
                    </div>
                ))}
            </div>
        </div>
    );
}

