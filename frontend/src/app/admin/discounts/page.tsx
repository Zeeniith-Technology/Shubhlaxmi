"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function DiscountsPage() {
    const [discounts, setDiscounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Form fields
    const [name, setName] = useState("");
    const [targetType, setTargetType] = useState("All");
    const [targetIds, setTargetIds] = useState<string[]>([]);
    const [discountType, setDiscountType] = useState("Percentage");
    const [value, setValue] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isActive, setIsActive] = useState(true);

    const [msg, setMsg] = useState({ text: "", type: "success" });

    const showMsg = (text: string, type = "success") => {
        setMsg({ text, type });
        setTimeout(() => setMsg({ text: "", type: "success" }), 3000);
    };

    const getToken = () => localStorage.getItem("admin_token") || "";

    const headers = () => ({
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
    });

    const fetchData = async () => {
        try {
            const bodyStr = JSON.stringify({});
            const opts = { method: "POST", headers: headers(), body: bodyStr };

            // We fetch individually so if one fails (like discount/list when server not restarted), others still load
            try {
                const discRes = await fetch(`${API_BASE}/discount/list`, opts);
                const discData = await discRes.json();
                if (discData.success) setDiscounts(discData.data || []);
            } catch (e) { console.error("Discount fetch error", e); }

            try {
                const catRes = await fetch(`${API_BASE}/category/list`, opts);
                const catData = await catRes.json();
                if (catData.success) setCategories(catData.data || []);
            } catch (e) { console.error("Category fetch error", e); }

            try {
                const secRes = await fetch(`${API_BASE}/section/list`, opts);
                const secData = await secRes.json();
                if (secData.success) setSections(secData.data || []);
            } catch (e) { console.error("Section fetch error", e); }

            try {
                const prodRes = await fetch(`${API_BASE}/product/list`, opts);
                const prodData = await prodRes.json();
                if (prodData.success) setProducts(prodData.data || []);
            } catch (e) { console.error("Product fetch error", e); }

        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setName("");
        setTargetType("All");
        setTargetIds([]);
        setDiscountType("Percentage");
        setValue("");
        setStartDate("");
        setEndDate("");
        setIsActive(true);
        setEditId(null);
        setShowForm(false);
    };

    const openEdit = (d: any) => {
        setName(d.name);
        setTargetType(d.targetType);
        setTargetIds(d.targetIds || []);
        setDiscountType(d.discountType);
        setValue(String(d.value));
        setStartDate(new Date(d.startDate).toISOString().slice(0, 16));
        setEndDate(new Date(d.endDate).toISOString().slice(0, 16));
        setIsActive(d.isActive);
        setEditId(d._id);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const url = editId ? `${API_BASE}/discount/update` : `${API_BASE}/discount/add`;
        const body = {
            id: editId,
            name,
            targetType,
            targetIds,
            discountType,
            value: Number(value),
            startDate,
            endDate,
            isActive
        };

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: headers(),
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                showMsg(data.message || "Saved successfully");
                fetchData();
                resetForm();
            } else {
                showMsg(data.message || "Failed to save", "error");
            }
        } catch (err) {
            showMsg("Network error", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this discount?")) return;
        try {
            const res = await fetch(`${API_BASE}/discount/delete`, {
                method: "POST",
                headers: headers(),
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.success) {
                showMsg("Deleted successfully");
                fetchData();
            } else {
                showMsg(data.message, "error");
            }
        } catch (err) {
            showMsg("Network error", "error");
        }
    };

    const toggleTargetId = (id: string) => {
        setTargetIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                    <div>
                        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px 0" }}>Discounts & Offers</h1>
                        <p style={{ color: "#64748b", margin: 0 }}>Create sales, discounts, and limited-time offers.</p>
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            style={{ display: "flex", alignItems: "center", gap: "8px", background: "#3b82f6", color: "white", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", border: "none", cursor: "pointer" }}
                        >
                            <Plus size={18} /> Create Discount
                        </button>
                    )}
                </div>

                {msg.text && (
                    <div style={{ padding: "12px 20px", marginBottom: "20px", borderRadius: "8px", background: msg.type === "error" ? "#fee2e2" : "#dcfce7", color: msg.type === "error" ? "#b91c1c" : "#15803d", fontWeight: "500" }}>
                        {msg.text}
                    </div>
                )}

                {showForm && (
                    <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", marginBottom: "30px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>{editId ? "Edit Discount" : "New Discount"}</h2>
                            <button onClick={resetForm} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>Offer Name</label>
                                    <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Diwali Sale" style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>Status</label>
                                    <select value={isActive ? "true" : "false"} onChange={e => setIsActive(e.target.value === "true")} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "white" }}>
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>Discount Type</label>
                                    <select value={discountType} onChange={e => setDiscountType(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "white" }}>
                                        <option value="Percentage">Percentage (%)</option>
                                        <option value="Flat">Flat Amount (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>Discount Value</label>
                                    <input type="number" required min="1" value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. 20" style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>Start Date & Time</label>
                                    <input type="datetime-local" required value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>End Date & Time</label>
                                    <input type="datetime-local" required value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                                </div>
                            </div>

                            <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                <label style={{ display: "block", marginBottom: "15px", fontWeight: "600", fontSize: "15px" }}>Applies To</label>
                                <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
                                    {['All', 'Category', 'Section', 'Product'].map(t => (
                                        <label key={t} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                            <input type="radio" name="targetType" checked={targetType === t} onChange={() => { setTargetType(t); setTargetIds([]); }} />
                                            {t === 'All' ? 'All Products' : `Specific ${t}`}
                                        </label>
                                    ))}
                                </div>

                                {targetType !== 'All' && (
                                    <div style={{ maxHeight: "200px", overflowY: "auto", background: "white", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                                        {targetType === 'Category' && categories.map(c => (
                                            <label key={c._id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}>
                                                <input type="checkbox" checked={targetIds.includes(c._id)} onChange={() => toggleTargetId(c._id)} />
                                                {c.name}
                                            </label>
                                        ))}
                                        {targetType === 'Section' && sections.map(s => (
                                            <label key={s._id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}>
                                                <input type="checkbox" checked={targetIds.includes(s._id)} onChange={() => toggleTargetId(s._id)} />
                                                {s.name}
                                            </label>
                                        ))}
                                        {targetType === 'Product' && products.map(p => (
                                            <label key={p._id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}>
                                                <input type="checkbox" checked={targetIds.includes(p._id)} onChange={() => toggleTargetId(p._id)} />
                                                {p.title}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button type="submit" disabled={loading} style={{ background: "#1e293b", color: "white", padding: "14px", borderRadius: "8px", fontWeight: "600", border: "none", cursor: loading ? "not-allowed" : "pointer", marginTop: "10px" }}>
                                {loading ? "Saving..." : "Save Discount"}
                            </button>
                        </form>
                    </div>
                )}

                <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "14px" }}>
                                <th style={{ padding: "16px 20px", fontWeight: "600" }}>Offer Name</th>
                                <th style={{ padding: "16px 20px", fontWeight: "600" }}>Discount</th>
                                <th style={{ padding: "16px 20px", fontWeight: "600" }}>Applies To</th>
                                <th style={{ padding: "16px 20px", fontWeight: "600" }}>Status</th>
                                <th style={{ padding: "16px 20px", fontWeight: "600", textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discounts.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>No discounts found.</td></tr>
                            ) : discounts.map((d: any) => {
                                const isExpired = new Date(d.endDate) < new Date();
                                const statusText = isExpired ? "Discount over" : (d.isActive ? "Active" : "Inactive");
                                const statusBg = isExpired ? "#fee2e2" : (d.isActive ? "#dcfce7" : "#f1f5f9");
                                const statusColor = isExpired ? "#b91c1c" : (d.isActive ? "#15803d" : "#64748b");
                                
                                return (
                                <tr key={d._id} style={{ borderBottom: "1px solid #e2e8f0", fontSize: "15px" }}>
                                    <td style={{ padding: "16px 20px", fontWeight: "500", color: "#1e293b" }}>
                                        {d.name}
                                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                            {new Date(d.startDate).toLocaleDateString()} - {new Date(d.endDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td style={{ padding: "16px 20px" }}>
                                        {d.discountType === 'Percentage' ? `${d.value}% OFF` : `₹${d.value} OFF`}
                                    </td>
                                    <td style={{ padding: "16px 20px" }}>
                                        {d.targetType === 'All' ? 'All Products' : `${d.targetIds.length} ${d.targetType}(s)`}
                                    </td>
                                    <td style={{ padding: "16px 20px" }}>
                                        <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", background: statusBg, color: statusColor }}>
                                            {statusText}
                                        </span>
                                    </td>
                                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                                        <button onClick={() => openEdit(d)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", marginRight: "15px" }}><Edit2 size={18} /></button>
                                        <button onClick={() => handleDelete(d._id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
    );
}
