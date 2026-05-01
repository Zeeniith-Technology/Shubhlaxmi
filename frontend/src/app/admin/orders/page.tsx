"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Package, Calendar, User, Phone, Mail, Search, Filter } from "lucide-react";
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

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [dateFilter, setDateFilter] = useState("All");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 20;

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
                // Sort by newest first
                const sortedOrders = (data.data || []).sort((a: Order, b: Order) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setOrders(sortedOrders);
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

    // Filter logic
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            // 1. Search Query
            const query = searchQuery.toLowerCase();
            const matchesSearch = 
                order._id.toLowerCase().includes(query) ||
                (order.user?.name || "").toLowerCase().includes(query) ||
                (order.user?.email || "").toLowerCase().includes(query) ||
                (order.user?.phone || "").toLowerCase().includes(query);

            if (!matchesSearch) return false;

            // 2. Status Filter
            if (statusFilter !== "All" && order.status !== statusFilter) {
                return false;
            }

            // 3. Date Filter
            if (dateFilter !== "All") {
                const orderDate = new Date(order.createdAt);
                const now = new Date();
                
                if (dateFilter === "Today") {
                    if (orderDate.toDateString() !== now.toDateString()) return false;
                } else if (dateFilter === "Last 7 Days") {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(now.getDate() - 7);
                    if (orderDate < sevenDaysAgo) return false;
                } else if (dateFilter === "Last 30 Days") {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(now.getDate() - 30);
                    if (orderDate < thirtyDaysAgo) return false;
                }
            }

            return true;
        });
    }, [orders, searchQuery, statusFilter, dateFilter]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, dateFilter]);

    // Pagination logic
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ordersPerPage,
        currentPage * ordersPerPage
    );

    if (loading) {
        return <div className="p-8 text-center text-gray-500 font-medium">Loading orders...</div>;
    }

    return (
        <div className="p-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                    <Package className="text-[var(--brand-pink)]" size={28} />
                    Orders Management
                </h1>
                
                <div className="flex gap-4">
                    <div className="bg-white shadow-sm border border-gray-100 rounded-lg px-4 py-2 text-sm font-medium text-gray-600">
                        Total Orders: {orders.length}
                    </div>
                    <div className="bg-white shadow-sm border border-gray-100 rounded-lg px-4 py-2 text-sm font-medium text-[var(--brand-pink)]">
                        Showing: {filteredOrders.length}
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
                        placeholder="Search by Order ID, Name, Email, or Phone..."
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
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
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
                            <option value="Today">Today</option>
                            <option value="Last 7 Days">Last 7 Days</option>
                            <option value="Last 30 Days">Last 30 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-medium border-b border-gray-100">Order ID & Date</th>
                                <th className="p-4 font-medium border-b border-gray-100">Customer Details</th>
                                <th className="p-4 font-medium border-b border-gray-100">Shipping To</th>
                                <th className="p-4 font-medium border-b border-gray-100 text-right">Total</th>
                                <th className="p-4 font-medium border-b border-gray-100 w-48">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                                            <Package className="text-gray-400" size={32} />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
                                        <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedOrders.map((order) => (
                                    <React.Fragment key={order._id}>
                                        <tr className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-4 align-top">
                                                <div className="font-mono text-xs font-bold text-[var(--brand-pink)] mb-1 cursor-pointer hover:underline" onClick={() => toggleExpand(order._id)}>
                                                    #{order._id.substring(order._id.length - 8).toUpperCase()}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-gray-400" /> 
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                                <div className="mt-2">
                                                    <button
                                                        onClick={() => toggleExpand(order._id)}
                                                        className="text-[10px] uppercase font-bold text-gray-500 hover:text-[var(--brand-pink)] transition-colors"
                                                    >
                                                        {expandedOrderId === order._id ? '− Hide Items' : `+ ${order.items.length} Items`}
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
                                                <div className="font-bold text-gray-900 mb-1 text-base">
                                                    ₹{order.totalAmount.toLocaleString('en-IN')}
                                                </div>
                                                <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-100 inline-block px-2 py-1 rounded">
                                                    {order.paymentMethod}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                                    className={`w-full text-xs font-bold border rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--brand-pink)] cursor-pointer transition-colors
                                                        ${order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                                                          order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                                                          order.status === 'Processing' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' :
                                                          order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                                                          'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
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
                                            <tr className="bg-gray-50/80">
                                                <td colSpan={5} className="p-0 border-t border-gray-100">
                                                    <div className="px-6 py-6 border-l-4 border-[var(--brand-pink)]">
                                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                            <Package size={14} /> Items in Order #{order._id.substring(order._id.length - 8).toUpperCase()}
                                                        </h4>
                                                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                                            {order.items.map((item, index) => (
                                                                <div key={index} className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm flex gap-4 items-center hover:border-[var(--brand-pink)] transition-colors">
                                                                    <div className="w-16 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 relative border border-gray-50">
                                                                        {item.product?.images?.[0] ? (
                                                                            <Image 
                                                                                src={item.product.images[0].startsWith('http') ? item.product.images[0] : `${API_BASE.replace('/api', '')}${item.product.images[0]}`} 
                                                                                alt={item.product.title || "Product"} 
                                                                                fill 
                                                                                className="object-cover" 
                                                                            />
                                                                        ) : (
                                                                            <span className="text-[10px] text-gray-400 flex items-center justify-center h-full w-full text-center p-1">No Image</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h5 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2" title={item.product?.title || "Unknown Product"}>
                                                                            {item.product?.title || "Unknown Product"}
                                                                        </h5>
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Qty: <strong className="text-gray-900">{item.quantity}</strong></span>
                                                                            <span className="text-sm font-bold text-[var(--brand-pink)]">₹{item.price.toLocaleString('en-IN')}</span>
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            Showing <span className="font-medium text-gray-900">{(currentPage - 1) * ordersPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * ordersPerPage, filteredOrders.length)}</span> of <span className="font-medium text-gray-900">{filteredOrders.length}</span> entries
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
                                // Only show limited page numbers if there are many pages
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
