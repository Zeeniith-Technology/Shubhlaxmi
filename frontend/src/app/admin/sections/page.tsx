"use client";

import { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";

export default function SectionsPage() {
    const [sections, setSections] = useState<any[]>([]);
    const [name, setName] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [selected, setSelected] = useState<string[]>([]);

    // Bulk modals
    const [bulkAddOpen, setBulkAddOpen] = useState(false);
    const [bulkAddText, setBulkAddText] = useState("");
    const [bulkEditOpen, setBulkEditOpen] = useState(false);
    const [bulkEditItems, setBulkEditItems] = useState<{ id: string; name: string }[]>([]);

    // Delete Confirmation Modals
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

    const getToken = () => localStorage.getItem("admin_token") || "";
    const headers = (json = true) => {
        const h: any = { "Authorization": `Bearer ${getToken()}` };
        if (json) h["Content-Type"] = "application/json";
        return h;
    };

    const showMsg = (text: string, type: "success" | "error" = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const fetchSections = async () => {
        try {
            const res = await fetch(`${API_BASE}/section/list`, { method: "POST", headers: headers(), body: JSON.stringify({}) });
            const data = await res.json();
            if (data.success) setSections(data.data);
        } catch { showMsg("Failed to load sections", "error"); }
    };

    useEffect(() => { fetchSections(); }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/section/add`, { method: "POST", headers: headers(), body: JSON.stringify({ name }) });
            const data = await res.json();
            if (data.success) { setName(""); fetchSections(); showMsg("Section created"); }
            else showMsg(data.message, "error");
        } catch { showMsg("Network error", "error"); }
        finally { setLoading(false); }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editName.trim() || !editId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/section/update`, { method: "POST", headers: headers(), body: JSON.stringify({ id: editId, name: editName }) });
            const data = await res.json();
            if (data.success) { setEditId(null); setEditName(""); fetchSections(); showMsg("Section updated"); }
            else showMsg(data.message, "error");
        } catch { showMsg("Network error", "error"); }
        finally { setLoading(false); }
    };

    const confirmDelete = (id: string) => {
        setItemToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        setDeleteConfirmOpen(false);
        try {
            const res = await fetch(`${API_BASE}/section/delete`, { method: "POST", headers: headers(), body: JSON.stringify({ id: itemToDelete }) });
            const data = await res.json();
            if (data.success) { fetchSections(); showMsg("Section deleted"); }
            else showMsg(data.message, "error");
        } catch { showMsg("Network error", "error"); }
        finally { setItemToDelete(null); }
    };

    // Bulk Add — comma or newline separated names
    const handleBulkAdd = async () => {
        const names = bulkAddText.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
        if (names.length === 0) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/section/bulkadd`, {
                method: "POST", headers: headers(),
                body: JSON.stringify({ items: names.map(n => ({ name: n })) })
            });
            const data = await res.json();
            if (data.success) { setBulkAddOpen(false); setBulkAddText(""); fetchSections(); showMsg(data.message); }
            else showMsg(data.message, "error");
        } catch { showMsg("Bulk add failed", "error"); }
        finally { setLoading(false); }
    };

    // Bulk Update
    const openBulkEdit = () => {
        if (selected.length === 0) { showMsg("Select sections to edit first", "error"); return; }
        setBulkEditItems(sections.filter(s => selected.includes(s._id)).map(s => ({ id: s._id, name: s.name })));
        setBulkEditOpen(true);
    };

    const handleBulkUpdate = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/section/bulkupdate`, {
                method: "POST", headers: headers(),
                body: JSON.stringify({ items: bulkEditItems })
            });
            const data = await res.json();
            if (data.success) { setBulkEditOpen(false); setSelected([]); fetchSections(); showMsg(data.message); }
            else showMsg(data.message, "error");
        } catch { showMsg("Bulk update failed", "error"); }
        finally { setLoading(false); }
    };

    // Bulk Delete
    const confirmBulkDelete = () => {
        if (selected.length === 0) { showMsg("Select sections to delete first", "error"); return; }
        setBulkDeleteConfirmOpen(true);
    };

    const handleBulkDelete = async () => {
        setBulkDeleteConfirmOpen(false);
        try {
            const res = await fetch(`${API_BASE}/section/bulkdelete`, {
                method: "POST", headers: headers(),
                body: JSON.stringify({ ids: selected })
            });
            const data = await res.json();
            if (data.success) { setSelected([]); fetchSections(); showMsg(data.message); }
            else showMsg(data.message, "error");
        } catch { showMsg("Bulk delete failed", "error"); }
    };

    const toggleSelect = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const toggleAll = () => setSelected(selected.length === sections.length ? [] : sections.map(s => s._id));

    return (
        <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>Sections</h1>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>{sections.length} total section{sections.length !== 1 ? "s" : ""}</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setBulkAddOpen(true)}
                        style={{ padding: "8px 16px", fontSize: 13, background: "#0f172a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
                        Bulk Add
                    </button>
                    <button onClick={openBulkEdit} disabled={selected.length === 0}
                        style={{ padding: "8px 16px", fontSize: 13, background: selected.length > 0 ? "#3b82f6" : "#e2e8f0", color: selected.length > 0 ? "#fff" : "#94a3b8", border: "none", borderRadius: 6, cursor: selected.length > 0 ? "pointer" : "default" }}>
                        Bulk Edit ({selected.length})
                    </button>
                    <button onClick={confirmBulkDelete} disabled={selected.length === 0}
                        style={{ padding: "8px 16px", fontSize: 13, background: selected.length > 0 ? "#ef4444" : "#e2e8f0", color: selected.length > 0 ? "#fff" : "#94a3b8", border: "none", borderRadius: 6, cursor: selected.length > 0 ? "pointer" : "default" }}>
                        Bulk Delete ({selected.length})
                    </button>
                </div>
            </div>

            {/* Toast */}
            {message && (
                <div style={{
                    padding: "10px 16px", borderRadius: 6, marginBottom: 16, fontSize: 13, fontWeight: 500,
                    background: message.type === "success" ? "#dcfce7" : "#fee2e2",
                    color: message.type === "success" ? "#166534" : "#991b1b",
                    border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`
                }}>{message.text}</div>
            )}

            {/* Quick Add */}
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: 20, marginBottom: 20 }}>
                <form onSubmit={handleAdd} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required
                        placeholder="New section name..."
                        style={{ flex: 1, padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, outline: "none", color: "#1e293b" }} />
                    <button type="submit" disabled={loading}
                        style={{ padding: "10px 20px", background: "#ec268f", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                        {loading ? "..." : "Add"}
                    </button>
                </form>
            </div>

            {/* Inline Edit */}
            {editId && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 20, marginBottom: 20 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Editing</p>
                    <form onSubmit={handleUpdate} style={{ display: "flex", gap: 10 }}>
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required
                            style={{ flex: 1, padding: "10px 14px", border: "1px solid #fde68a", borderRadius: 6, fontSize: 14, outline: "none", color: "#1e293b" }} />
                        <button type="submit" disabled={loading}
                            style={{ padding: "10px 16px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                            Save
                        </button>
                        <button type="button" onClick={() => { setEditId(null); setEditName(""); }}
                            style={{ padding: "10px 16px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: 6, fontWeight: 500, fontSize: 13, cursor: "pointer" }}>
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            {/* Table */}
            {sections.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 10, border: "1px dashed #cbd5e1", padding: "80px 20px", textAlign: "center" }}>
                    <div style={{ width: 64, height: 64, background: "#f1f5f9", borderRadius: 32, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", margin: "0 0 8px" }}>No Sections Found</h3>
                    <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", maxWidth: 400, marginInline: "auto" }}>Get started by creating your first section. Sections help you organize your categories.</p>
                </div>
            ) : (
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc" }}>
                                <th style={{ padding: "12px 16px", textAlign: "left", width: 40 }}>
                                    <input type="checkbox" checked={selected.length === sections.length && sections.length > 0} onChange={toggleAll}
                                        style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#ec268f" }} />
                                </th>
                                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}>Name</th>
                                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}>Slug</th>
                                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}>Status</th>
                                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sections.map((sec) => (
                                <tr key={sec._id} style={{ borderTop: "1px solid #f1f5f9", transition: "background .15s" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                    <td style={{ padding: "14px 16px" }}>
                                        <input type="checkbox" checked={selected.includes(sec._id)} onChange={() => toggleSelect(sec._id)}
                                            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#ec268f" }} />
                                    </td>
                                    <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 500, color: "#1e293b" }}>{sec.name}</td>
                                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748b", fontFamily: "monospace" }}>{sec.slug}</td>
                                    <td style={{ padding: "14px 16px" }}>
                                        <span style={{
                                            display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                            background: sec.isActive ? "#dcfce7" : "#fee2e2",
                                            color: sec.isActive ? "#166534" : "#991b1b"
                                        }}>{sec.isActive ? "Active" : "Inactive"}</span>
                                    </td>
                                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                        <button onClick={() => { setEditId(sec._id); setEditName(sec.name); }}
                                            style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, fontWeight: 500, cursor: "pointer", marginRight: 12 }}>Edit</button>
                                        <button onClick={() => confirmDelete(sec._id)}
                                            style={{ background: "none", border: "none", color: "#ef4444", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Bulk Add Modal */}
            {bulkAddOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
                    onClick={() => setBulkAddOpen(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 28, width: 460, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Bulk Add Sections</h3>
                        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Enter section names separated by commas or new lines</p>
                        <textarea value={bulkAddText} onChange={e => setBulkAddText(e.target.value)} rows={5}
                            placeholder="Mens, Womens, Kids&#10;Accessories"
                            style={{ width: "100%", padding: "12px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit", color: "#1e293b", boxSizing: "border-box" }} />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                            <button onClick={() => setBulkAddOpen(false)}
                                style={{ padding: "8px 18px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                            <button onClick={handleBulkAdd} disabled={loading}
                                style={{ padding: "8px 18px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                {loading ? "Adding..." : "Add All"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Edit Modal */}
            {bulkEditOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
                    onClick={() => setBulkEditOpen(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 28, width: 500, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Bulk Edit Sections</h3>
                        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Edit names for {bulkEditItems.length} selected section{bulkEditItems.length > 1 ? "s" : ""}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflowY: "auto" }}>
                            {bulkEditItems.map((item, idx) => (
                                <input key={item.id} type="text" value={item.name}
                                    onChange={e => { const copy = [...bulkEditItems]; copy[idx] = { ...copy[idx], name: e.target.value }; setBulkEditItems(copy); }}
                                    style={{ padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, outline: "none", color: "#1e293b" }} />
                            ))}
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                            <button onClick={() => setBulkEditOpen(false)}
                                style={{ padding: "8px 18px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                            <button onClick={handleBulkUpdate} disabled={loading}
                                style={{ padding: "8px 18px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                {loading ? "Saving..." : "Save All"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setDeleteConfirmOpen(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 28, width: 400, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,.15)", textAlign: "center" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 24, background: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>!</div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Delete Section?</h3>
                        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Are you sure you want to delete this section? This action cannot be undone.</p>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setDeleteConfirmOpen(false)} style={{ flex: 1, padding: "10px 0", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                            <button onClick={handleDelete} style={{ flex: 1, padding: "10px 0", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirm Modal */}
            {bulkDeleteConfirmOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setBulkDeleteConfirmOpen(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 28, width: 400, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,.15)", textAlign: "center" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 24, background: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>!</div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Delete {selected.length} Sections?</h3>
                        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Are you sure you want to delete the selected sections? This action cannot be undone.</p>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setBulkDeleteConfirmOpen(false)} style={{ flex: 1, padding: "10px 0", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                            <button onClick={handleBulkDelete} style={{ flex: 1, padding: "10px 0", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Delete All</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
