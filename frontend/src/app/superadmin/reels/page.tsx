"use client";

import { useState, useEffect } from "react";
import { compressImage } from "../../utils/compressImage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type ReelType = "video" | "instagram";

export default function ReelsPage() {
    const [reels, setReels] = useState<any[]>([]);
    const [title, setTitle] = useState("");
    const [type, setType] = useState<ReelType>("video");
    const [instagramLink, setInstagramLink] = useState("");
    const [order, setOrder] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
    const [existingVideo, setExistingVideo] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const getToken = () => localStorage.getItem("superadmin_token") || "";

    const showMsg = (text: string, type: "success" | "error" = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const fetchReels = async () => {
        try {
            const res = await fetch(`${API_BASE}/reel/list`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.success) {
                const sorted = [...data.data].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                setReels(sorted);
            }
        } catch {
            showMsg("Failed to load reels", "error");
        }
    };

    useEffect(() => { fetchReels(); }, []);

    const resetForm = () => {
        setTitle("");
        setType("video");
        setInstagramLink("");
        setOrder("");
        setIsActive(true);
        setThumbnailImage(null);
        setVideoFile(null);
        setExistingThumbnail(null);
        setExistingVideo(null);
        setEditId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (type === "instagram" && !editId && !thumbnailImage) {
            showMsg("A thumbnail image is required for the Instagram type", "error");
            return;
        }
        if (type === "video" && !editId && !videoFile) {
            showMsg("A video file is required for the Video type", "error");
            return;
        }
        if (type === "instagram" && !instagramLink.trim()) {
            showMsg("An Instagram link is required for the Instagram type", "error");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("title", title);
        formData.append("type", type);
        formData.append("instagramLink", instagramLink);
        formData.append("order", order || "0");
        formData.append("isActive", String(isActive));

        try {
            if (thumbnailImage) {
                const compressed = await compressImage(thumbnailImage);
                formData.append("thumbnailImage", compressed);
            }
            if (videoFile) formData.append("video", videoFile);
            if (editId) formData.append("id", editId);

            const url = editId ? `${API_BASE}/reel/update` : `${API_BASE}/reel/add`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Authorization": `Bearer ${getToken()}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                resetForm();
                fetchReels();
                showMsg(editId ? "Reel updated!" : "Reel created!");
            } else {
                showMsg(data.message, "error");
            }
        } catch {
            showMsg("Network error", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (r: any) => {
        setEditId(r._id);
        setTitle(r.title || "");
        setType(r.type);
        setInstagramLink(r.instagramLink || "");
        setOrder(String(r.order || 0));
        setIsActive(r.isActive);
        setExistingThumbnail(r.thumbnailImage?.url || null);
        setExistingVideo(r.video?.url || null);
        setThumbnailImage(null);
        setVideoFile(null);
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
            const res = await fetch(`${API_BASE}/reel/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
                body: JSON.stringify({ id: itemToDelete })
            });
            const data = await res.json();
            if (data.success) {
                fetchReels();
                showMsg("Reel deleted");
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
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>Reels</h1>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>Manage the "Watch & Shop" reels section shown above the site footer.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm); }}
                    style={{ padding: "8px 16px", fontSize: 13, background: "#ec268f", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}
                >
                    {showForm ? "Close Form" : "+ Add Reel"}
                </button>
            </div>

            {message && (
                <div style={{ padding: "10px 16px", borderRadius: 6, marginBottom: 16, fontSize: 13, fontWeight: 500, background: message.type === "success" ? "#dcfce7" : "#fee2e2", color: message.type === "success" ? "#166534" : "#991b1b", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
                    {message.text}
                </div>
            )}

            {showForm && (
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 24, marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", marginBottom: 16 }}>{editId ? "Edit Reel" : "Create New Reel"}</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <label style={labelStyle}>Title / Caption (Optional)</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New Bridal Collection" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Type</label>
                                <select value={type} onChange={e => setType(e.target.value as ReelType)} style={inputStyle}>
                                    <option value="video">Uploaded Video</option>
                                    <option value="instagram">Instagram Link</option>
                                </select>
                            </div>

                            {type === "instagram" && (
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={labelStyle}>Instagram Post/Reel URL <span style={{ color: "#ec268f" }}>*</span></label>
                                    <input
                                        type="url"
                                        value={instagramLink}
                                        onChange={e => setInstagramLink(e.target.value)}
                                        placeholder="https://www.instagram.com/reel/..."
                                        style={inputStyle}
                                    />
                                </div>
                            )}

                            <div>
                                <label style={labelStyle}>Display Order</label>
                                <input type="number" value={order} onChange={e => setOrder(e.target.value)} placeholder="0" style={inputStyle} />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 22 }}>
                                <input type="checkbox" id="active" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#ec268f" }} />
                                <label htmlFor="active" style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>Active (Visible on Site)</label>
                            </div>

                            {/* Thumbnail Upload — required for Instagram (the only visual for that
                                card); optional for Video (videos autoplay immediately, so this is
                                only used as a poster frame while the clip buffers) */}
                            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                <label style={labelStyle}>
                                    Thumbnail Image {type === "instagram" ? <span style={{ color: "#ec268f" }}>*</span> : <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional — video plays immediately)</span>}
                                </label>
                                <div style={{ border: "2px dashed #cbd5e1", borderRadius: 8, padding: 20, textAlign: "center", background: "#fff", marginBottom: 12 }}>
                                    <input type="file" id="thumbnailImage" accept="image/*" onChange={e => setThumbnailImage(e.target.files?.[0] || null)} style={{ display: "none" }} />
                                    <label htmlFor="thumbnailImage" style={{ display: "inline-block", background: "#f1f5f9", border: "1px solid #d1d5db", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#374151", marginBottom: 8 }}>
                                        Choose Thumbnail
                                    </label>
                                    <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Recommended: 800x1400 (portrait/9:16)</p>
                                </div>
                                {(existingThumbnail || thumbnailImage) && (
                                    <div style={{ width: 80, height: 140, margin: "0 auto", borderRadius: 6, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                                        <img src={thumbnailImage ? URL.createObjectURL(thumbnailImage) : existingThumbnail!} alt="Thumbnail Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </div>
                                )}
                            </div>

                            {/* Video Upload — only for type === 'video' */}
                            {type === "video" && (
                                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                    <label style={labelStyle}>Video File <span style={{ color: "#ec268f" }}>*</span></label>
                                    <div style={{ border: "2px dashed #cbd5e1", borderRadius: 8, padding: 20, textAlign: "center", background: "#fff", marginBottom: 12 }}>
                                        <input type="file" id="video" accept="video/mp4,video/quicktime,video/webm" onChange={e => setVideoFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
                                        <label htmlFor="video" style={{ display: "inline-block", background: "#f1f5f9", border: "1px solid #d1d5db", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#374151", marginBottom: 8 }}>
                                            Choose Video
                                        </label>
                                        <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>MP4/MOV/WebM, up to 50MB</p>
                                    </div>
                                    {(existingVideo || videoFile) && (
                                        <video
                                            src={videoFile ? URL.createObjectURL(videoFile) : existingVideo!}
                                            controls
                                            style={{ width: "100%", maxHeight: 160, borderRadius: 6, border: "1px solid #e2e8f0" }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
                            <button type="submit" disabled={loading} style={{ padding: "10px 24px", background: "#ec268f", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                                {loading ? "Saving..." : editId ? "Update Reel" : "Save Reel"}
                            </button>
                            <button type="button" onClick={resetForm} style={{ padding: "10px 20px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: 6, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Reels List */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 20 }}>
                {reels.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", background: "#fff", padding: "60px 20px", textAlign: "center", borderRadius: 10, border: "1px dashed #cbd5e1" }}>
                        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>No reels created yet. Add one to display it above the site footer.</p>
                    </div>
                ) : (
                    reels.map(r => (
                        <div key={r._id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                            <div style={{ position: "relative", aspectRatio: "9 / 16", background: "#f1f5f9" }}>
                                <img src={r.thumbnailImage?.url} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                <div style={{ position: "absolute", top: 6, left: 6, background: r.type === "video" ? "#0ea5e9" : "linear-gradient(135deg,#feda75,#d62976,#4f5bd5)", color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, textTransform: "uppercase" }}>
                                    {r.type}
                                </div>
                                <div style={{ position: "absolute", bottom: 6, right: 6, background: r.isActive ? "#dcfce7" : "#f1f5f9", color: r.isActive ? "#166534" : "#64748b", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>
                                    {r.isActive ? "Active" : "Inactive"}
                                </div>
                            </div>
                            <div style={{ padding: 12, display: "flex", flexDirection: "column", flex: 1 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title || "Untitled"}</p>
                                <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 8px" }}>Order: <span style={{ fontWeight: 600 }}>{r.order}</span></p>
                                <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                                    <button onClick={() => handleEdit(r)} style={{ flex: 1, padding: "6px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Edit</button>
                                    <button onClick={() => confirmDelete(r._id)} style={{ flex: 1, padding: "6px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {deleteConfirmOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
                    <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 400, padding: 24, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", margin: "0 0 12px" }}>Delete Reel?</h3>
                        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px" }}>Are you sure you want to delete this reel? This will permanently remove the media from Cloudinary.</p>
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
