"use client";

import { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function BannersPage() {
    const [banners, setBanners] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [title, setTitle] = useState("");
    const [link, setLink] = useState("");
    const [linkType, setLinkType] = useState<"custom" | "category">("custom");
    const [order, setOrder] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [desktopImage, setDesktopImage] = useState<File | null>(null);
    const [mobileImage, setMobileImage] = useState<File | null>(null);
    const [existingDesktop, setExistingDesktop] = useState<string | null>(null);
    const [existingMobile, setExistingMobile] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    // Delete Confirmation
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const getToken = () => localStorage.getItem("admin_token") || "";

    const showMsg = (text: string, type: "success" | "error" = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const fetchBanners = async () => {
        try {
            const res = await fetch(`${API_BASE}/banner/list`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
                body: JSON.stringify({ sort: { order: 1 } })
            });
            const data = await res.json();
            if (data.success) {
                // simple client-side sort just in case API didn't sort
                const sorted = data.data.sort((a: any, b: any) => a.order - b.order);
                setBanners(sorted);
            }
        } catch {
            showMsg("Failed to load banners", "error");
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_BASE}/category/list`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.success) setCategories(data.data);
        } catch {}
    };

    useEffect(() => {
        fetchBanners();
        fetchCategories();
    }, []);

    const resetForm = () => {
        setTitle("");
        setLink("");
        setLinkType("custom");
        setOrder("");
        setIsActive(true);
        setDesktopImage(null);
        setMobileImage(null);
        setExistingDesktop(null);
        setExistingMobile(null);
        setEditId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation on create
        if (!editId && (!desktopImage || !mobileImage)) {
            showMsg("Both desktop and mobile images are required for new banners", "error");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("title", title);
        formData.append("link", link);
        formData.append("order", order || "0");
        formData.append("isActive", String(isActive));

        try {
            const compressionOptions = {
                maxSizeMB: 0.5, // 500kb max
                maxWidthOrHeight: 1920,
                useWebWorker: true
            };

            let compressedDesktop = desktopImage;
            if (desktopImage && !editId) {
                try { compressedDesktop = await imageCompression(desktopImage, compressionOptions); } catch (e) { console.error("Desktop compression failed", e); }
            }

            let compressedMobile = mobileImage;
            if (mobileImage && !editId) {
                try { compressedMobile = await imageCompression(mobileImage, { ...compressionOptions, maxWidthOrHeight: 1200 }); } catch (e) { console.error("Mobile compression failed", e); }
            }

            if (compressedDesktop) formData.append("desktopImage", compressedDesktop);
            if (compressedMobile) formData.append("mobileImage", compressedMobile);
            if (editId) formData.append("id", editId);

            const url = editId ? `${API_BASE}/banner/update` : `${API_BASE}/banner/add`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Authorization": `Bearer ${getToken()}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                resetForm();
                fetchBanners();
                showMsg(editId ? "Banner updated!" : "Banner created!");
            } else {
                showMsg(data.message, "error");
            }
        } catch {
            showMsg("Network error", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (b: any) => {
        setEditId(b._id);
        setTitle(b.title || "");
        setLink(b.link || "");
        if (b.link && b.link.startsWith("/collections/")) {
            setLinkType("category");
        } else {
            setLinkType("custom");
        }
        setOrder(String(b.order || 0));
        setIsActive(b.isActive);
        setExistingDesktop(b.desktopImage?.url || null);
        setExistingMobile(b.mobileImage?.url || null);
        setDesktopImage(null);
        setMobileImage(null);
        setShowForm(true);
    };

    const confirmDelete = (id: string) => {
        setItemToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        setDeleteConfirmOpen(false);
        try {
            const res = await fetch(`${API_BASE}/banner/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
                body: JSON.stringify({ id: itemToDelete })
            });
            const data = await res.json();
            if (data.success) {
                fetchBanners();
                showMsg("Banner deleted");
            } else {
                showMsg(data.message, "error");
            }
        } catch {
            showMsg("Network error", "error");
        } finally {
            setItemToDelete(null);
        }
    };

    const inputStyle = { padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, outline: "none", color: "#1e293b", width: "100%", boxSizing: "border-box" as const };
    const labelStyle = { display: "block" as const, fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 };

    return (
        <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>Hero Banners</h1>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>Manage dual-layout (desktop/mobile) promotional banners.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm); }}
                    style={{ padding: "8px 16px", fontSize: 13, background: "#ec268f", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}
                >
                    {showForm ? "Close Form" : "+ Add Banner"}
                </button>
            </div>

            {message && (
                <div style={{ padding: "10px 16px", borderRadius: 6, marginBottom: 16, fontSize: 13, fontWeight: 500, background: message.type === "success" ? "#dcfce7" : "#fee2e2", color: message.type === "success" ? "#166534" : "#991b1b", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
                    {message.text}
                </div>
            )}

            {showForm && (
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 24, marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", marginBottom: 16 }}>{editId ? "Edit Banner" : "Create New Banner"}</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <label style={labelStyle}>Banner Title (Internal Ref)</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Summer Sale" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Link Type</label>
                                <select
                                    value={linkType}
                                    onChange={e => {
                                        setLinkType(e.target.value as "custom" | "category");
                                        setLink("");
                                    }}
                                    style={inputStyle}
                                >
                                    <option value="custom">Custom / External URL</option>
                                    <option value="category">Collection / Category</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>{linkType === "custom" ? "Link URL (Optional)" : "Select Category Target"}</label>
                                {linkType === "custom" ? (
                                    <input type="text" value={link} onChange={e => setLink(e.target.value)} placeholder="e.g. /pages/about or https://..." style={inputStyle} />
                                ) : (
                                    <select
                                        value={link}
                                        onChange={e => setLink(e.target.value)}
                                        style={inputStyle}
                                    >
                                        <option value="" disabled>Select a Category...</option>
                                        {categories.map(c => (
                                            <option key={c._id} value={`/collections/${c.slug}`}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label style={labelStyle}>Display Order / Sequence (1-5)</label>
                                <select
                                    value={order}
                                    onChange={e => setOrder(e.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="" disabled>Select Order</option>
                                    {[1, 2, 3, 4, 5].map(num => {
                                        const isUsed = banners.some(b => Number(b.order) === num && b._id !== editId);
                                        return (
                                            <option key={num} value={num} disabled={isUsed}>
                                                {num} {isUsed ? "(Already Used)" : ""}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 22, gridColumn: "1 / -1" }}>
                                <input type="checkbox" id="active" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#ec268f" }} />
                                <label htmlFor="active" style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>Active (Visible on Site)</label>
                            </div>

                            {/* Dual Image Uploads */}
                            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                <label style={labelStyle}>Desktop Image Banner <span style={{color: "#ec268f"}}>*</span></label>
                                <div style={{ border: "2px dashed #cbd5e1", borderRadius: 8, padding: 20, textAlign: "center", background: "#fff", marginBottom: 12 }}>
                                    <input type="file" id="desktopImage" accept="image/*" onChange={e => setDesktopImage(e.target.files?.[0] || null)} style={{ display: "none" }} />
                                    <label htmlFor="desktopImage" style={{ display: "inline-block", background: "#f1f5f9", border: "1px solid #d1d5db", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#374151", marginBottom: 8 }}>
                                        Choose Desktop Image
                                    </label>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", margin: "0 0 4px" }}>Recommended: 1920x600 pixels</p>
                                    <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Required ratio: 3:1 (Landscape)</p>
                                </div>
                                {(existingDesktop || desktopImage) && (
                                    <div style={{ width: "100%", height: 60, borderRadius: 6, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                                        <img src={desktopImage ? URL.createObjectURL(desktopImage) : existingDesktop!} alt="Desktop Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </div>
                                )}
                            </div>

                            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                <label style={labelStyle}>Mobile Image Banner <span style={{color: "#ec268f"}}>*</span></label>
                                <div style={{ border: "2px dashed #cbd5e1", borderRadius: 8, padding: 20, textAlign: "center", background: "#fff", marginBottom: 12 }}>
                                    <input type="file" id="mobileImage" accept="image/*" onChange={e => setMobileImage(e.target.files?.[0] || null)} style={{ display: "none" }} />
                                    <label htmlFor="mobileImage" style={{ display: "inline-block", background: "#f1f5f9", border: "1px solid #d1d5db", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#374151", marginBottom: 8 }}>
                                        Choose Mobile Image
                                    </label>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", margin: "0 0 4px" }}>Recommended: 800x1200 pixels</p>
                                    <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Required ratio: 2:3 (Portrait)</p>
                                </div>
                                {(existingMobile || mobileImage) && (
                                    <div style={{ width: 80, height: 120, margin: "0 auto", borderRadius: 6, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                                        <img src={mobileImage ? URL.createObjectURL(mobileImage) : existingMobile!} alt="Mobile Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
                            <button type="submit" disabled={loading} style={{ padding: "10px 24px", background: "#ec268f", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                                {loading ? "Saving..." : editId ? "Update Banner" : "Save Banner"}
                            </button>
                            <button type="button" onClick={resetForm} style={{ padding: "10px 20px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: 6, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Banners List */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                {banners.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", background: "#fff", padding: "60px 20px", textAlign: "center", borderRadius: 10, border: "1px dashed #cbd5e1" }}>
                        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>No banners created yet. Create one to display on the homepage.</p>
                    </div>
                ) : (
                    banners.map(b => (
                        <div key={b._id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", height: 140, background: "#f1f5f9" }}>
                                {/* Desktop Preview */}
                                <div style={{ flex: 2, borderRight: "1px solid #e2e8f0", position: "relative" }}>
                                    <img src={b.desktopImage?.url} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 4 }}>Desktop</div>
                                </div>
                                {/* Mobile Preview */}
                                <div style={{ flex: 1, position: "relative" }}>
                                    <img src={b.mobileImage?.url} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 4 }}>Mobile</div>
                                </div>
                            </div>
                            <div style={{ padding: 16, display: "flex", flexDirection: "column", flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", margin: 0 }}>{b.title || "Untitled Banner"}</h3>
                                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 10, background: b.isActive ? "#dcfce7" : "#f1f5f9", color: b.isActive ? "#166534" : "#64748b" }}>
                                        {b.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>
                                <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 4px" }}>Order: <span style={{ fontWeight: 600 }}>{b.order}</span></p>
                                {b.link && <p style={{ fontSize: 12, color: "#3b82f6", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.link}</p>}

                                <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 16 }}>
                                    <button onClick={() => handleEdit(b)} style={{ flex: 1, padding: "6px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Edit</button>
                                    <button onClick={() => confirmDelete(b._id)} style={{ flex: 1, padding: "6px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
                    <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 400, padding: 24, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", margin: "0 0 12px" }}>Delete Banner?</h3>
                        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px" }}>Are you sure you want to delete this banner? This action will permanently remove the images from Cloudinary.</p>
                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button onClick={() => setDeleteConfirmOpen(false)} style={{ padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>Cancel</button>
                            <button onClick={handleDelete} style={{ padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

