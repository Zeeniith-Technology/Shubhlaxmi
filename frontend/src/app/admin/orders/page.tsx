"use client";

import React, { useState, useEffect } from "react";
import { Package, Calendar, User, Phone, Mail, MapPin, Search } from "lucide-react";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type OrderItem = {
    productId: string;
    quantity: number;
    price: number;
    product: {
        title: string;
        images: string[];
    };
};

type Order = {
    _id: string;
    userId: string;
    user: {
        name: string;
        email: string;
        phone: string;
    };
    totalAmount: number;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    paymentMethod: string;
    status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
    items: OrderItem[];
    createdAt: string;
};

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`${API_BASE}/order/list`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({})
            });

            const data = await res.json();
            if (data.success) {
                setOrders(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`${API_BASE}/order/update-status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ id, status: newStatus })
            });

            const data = await res.json();
            if (data.success) {
                fetchOrders(); // Refresh list
            } else {
                alert(data.message || "Failed to update status");
            }
        } catch (error) {
            console.error("Error updating order:", error);
            alert("Network error.");
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedOrderId(expandedOrderId === id ? null : id);
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500 font-medium">Loading orders...</div>;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                    <Package className="text-[var(--brand-pink)]" size={28} />
                    Orders Management
                </h1>
                <div className="bg-white shadow-sm border border-gray-100 rounded-lg px-4 py-2 text-sm font-medium text-gray-600">
                    Total: {orders.length}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-medium border-b border-gray-100">Order ID & Date</th>
                                <th className="p-4 font-medium border-b border-gray-100">Customer Details</th>
                                <th className="p-4 font-medium border-b border-gray-100">Shipping To</th>
                                <th className="p-4 font-medium border-b border-gray-100 text-right">Total</th>
                                <th className="p-4 font-medium border-b border-gray-100 w-40">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <React.Fragment key={order._id}>
                                        <tr className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-4 align-top">
                                                <div className="font-mono text-xs font-bold text-[var(--brand-pink)] mb-1 cursor-pointer hover:underline" onClick={() => toggleExpand(order._id)}>
                                                    #{order._id.substring(order._id.length - 8).toUpperCase()}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-gray-400" /> {new Date(order.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="mt-2">
                                                    <button
                                                        onClick={() => toggleExpand(order._id)}
                                                        className="text-[10px] uppercase font-bold text-gray-500 hover:text-[var(--brand-pink)]"
                                                    >
                                                        {expandedOrderId === order._id ? 'Hide Items' : `${order.items.length} Items`}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="font-medium text-gray-900 mb-1 flex items-center gap-1.5">
                                                    <User size={14} className="text-gray-400" /> {order.user?.name || "Unknown User"}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                                                    <Mail size={12} className="text-gray-400" /> {order.user?.email || "N/A"}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                                    <Phone size={12} className="text-gray-400" /> {order.user?.phone || "N/A"}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top max-w-[250px]">
                                                <div className="text-sm text-gray-700 font-medium mb-1">
                                                    {order.shippingAddress?.street}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-start flex-col gap-0.5">
                                                    <span>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</span>
                                                    <span>{order.shippingAddress?.country}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top text-right">
                                                <div className="font-bold text-gray-900 mb-1">
                                                    ₹{order.totalAmount.toLocaleString()}
                                                </div>
                                                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider bg-gray-50 inline-block px-2 py-0.5 rounded">
                                                    {order.paymentMethod}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                                    className={`w-full text-xs font-bold border rounded px-2 py-2 shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-pink)] cursor-pointer ${order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            order.status === 'Processing' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                                order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                        }`}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Processing">Processing</option>
                                                    <option value="Shipped">Shipped</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                        </tr>
                                        {/* Expandable Order Items Row */}
                                        {expandedOrderId === order._id && (
                                            <tr className="bg-gray-50/50">
                                                <td colSpan={5} className="p-0 border-t border-gray-100">
                                                    <div className="px-8 py-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                            <Package size={14} /> Order Items Summary
                                                        </h4>
                                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                            {order.items.map((item, index) => (
                                                                <div key={index} className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm flex gap-4 items-center">
                                                                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative border border-gray-50">
                                                                        {item.product?.images?.[0] ? (
                                                                            <Image src={`http://localhost:5000${item.product.images[0]}`} alt="Product" fill className="object-cover" />
                                                                        ) : (
                                                                            <span className="text-[10px] text-gray-400 flex items-center justify-center h-full w-full text-center p-1">No Image</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h5 className="text-sm font-bold text-gray-900 truncate mb-1" title={item.product?.title || "Unknown Product"}>
                                                                            {item.product?.title || "Unknown Product"}
                                                                        </h5>
                                                                        <div className="flex items-center justify-between mt-2">
                                                                            <span className="text-xs text-gray-500">Qty: <strong className="text-gray-900">{item.quantity}</strong></span>
                                                                            <span className="text-sm font-bold text-[var(--brand-pink)]">₹{item.price.toLocaleString()}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

