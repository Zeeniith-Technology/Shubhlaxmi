"use client";

import { useState, useEffect, useRef } from "react";
import CustomSelect from "../components/CustomSelect";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [name, setName] = useState("");
    const [sectionId, setSectionId] = useState("");
    const [parentCategoryId, setParentCategoryId] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editSectionId, setEditSectionId] = useState("");
    const [editParentId, setEditParentId] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<"categories" | "subcategories">("categories");
    const [filterSectionId, setFilterSectionId] = useState<string>("");
    const [categoryImage, setCategoryImage] = useState<File | null>(null);
    const [editImage, setEditImage] = useState<File | null>(null);
    const [addDragActive, setAddDragActive] = useState(false);
    const [editDragActive, setEditDragActive] = useState(false);
    const addFileRef = useRef<HTMLInputElement>(null);
    const editFileRef = useRef<HTMLInputElement>(null);

    // Bulk modals
    const [bulkAddOpen, setBulkAddOpen] = useState(false);
    const [bulkAddItems, setBulkAddItems] = useState<{ name: string; sectionId: string; parentCategoryId: string; image?: File | null }[]>([{ name: "", sectionId: "", parentCategoryId: "", image: null }]);
    const [bulkEditOpen, setBulkEditOpen] = useState(false);
    const [bulkEditItems, setBulkEditItems] = useState<{ id: string; name: string; image?: File | null }[]>([]);

    // Delete Confirmation Modals
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

    const getToken = () => localStorage.getItem("admin_token") || "";
    const headers = () => ({ "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` });

    const showMsg = (text: string, type: "success" | "error" = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_BASE}/category/list`, { method: "POST", headers: headers(), body: JSON.stringify({}) });
            const data = await res.json();
            if (data.success) setCategories(data.data);
        } catch { showMsg("Failed to load", "error"); }
    };

    const fetchSections = async () => {
        try {
            const res = await fetch(`${API_BASE}/section/list`, { method: "POST", headers: headers(), body: JSON.stringify({}) });
            const data = await res.json();
            if (data.success) setSections(data.data);
        } catch { }
    };

    useEffect(() => { fetchCategories(); fetchSections(); }, []);

    const mainCategories = categories.filter(c => !c.parentCategoryId);
    const subCategories = categories.filter(c => c.parentCategoryId);
    const baseDisplay = activeTab === "categories" ? mainCategories : subCategories;
    const displayCategories = filterSectionId
        ? baseDisplay.filter((c: any) => String(c.sectionId) === filterSectionId)
        : baseDisplay;
    const parentCategories = mainCategories;

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !sectionId) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('sectionId', sectionId);
        if (parentCategoryId) formData.append('parentCategoryId', parentCategoryId);
        if (categoryImage) formData.append('image', categoryImage);
        try {
            const res = await fetch(`${API_BASE}/category/add`, { method: "POST", headers: { "Authorization": `Bearer ${getToken()}` }, body: formData });
            const data = await res.json();
            if (data.success) { setName(""); setSectionId(""); setParentCategoryId(""); setCategoryImage(null); fetchCategories(); showMsg("Category created"); }
            else showMsg(data.message, "error");
        } catch { showMsg("Network error", "error"); }
        finally { setLoading(false); }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editName.trim() || !editId) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('id', editId);
        formData.append('name', editName);
        if (editSectionId) formData.append('sectionId', editSectionId);
        if (editParentId) formData.append('parentCategoryId', editParentId);
        if (editImage) formData.append('image', editImage);
        try {
            const res = await fetch(`${API_BASE}/category/update`, { method: "POST", headers: { "Authorization": `Bearer ${getToken()}` }, body: formData });
            const data = await res.json();
            if (data.success) { setEditId(null); setEditImage(null); fetchCategories(); showMsg("Category updated"); }
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
            const res = await fetch(`${API_BASE}/category/delete`, { method: "POST", headers: headers(), body: JSON.stringify({ id: itemToDelete }) });
            const data = await res.json();
            if (data.success) { fetchCategories(); showMsg("Category deleted"); } else showMsg(data.message, "error");
        } catch { showMsg("Network error", "error"); }
        finally { setItemToDelete(null); }
    };

    // Bulk Add
    const handleBulkAdd = async () => {
        const valid = bulkAddItems.filter(i => {
            if (!i.name.trim() || !i.sectionId) return false;
            if (activeTab === "subcategories" && !i.parentCategoryId) return false;
            return true;
        });
        if (valid.length === 0) { showMsg(activeTab === "subcategories" ? "Fill Name, Section, and Parent for at least one row" : "Fill Name and Section for at least one row", "error"); return; }
        setLoading(true);
        try {
            const formData = new FormData();
            const itemsData = valid.map(i => ({ name: i.name, sectionId: i.sectionId, ...(i.parentCategoryId ? { parentCategoryId: i.parentCategoryId } : {}) }));
            formData.append('items', JSON.stringify(itemsData));
            valid.forEach((item, i) => {
                if (item.image) formData.append(`image_${i}`, item.image);
            });

            const res = await fetch(`${API_BASE}/category/bulkadd`, {
                method: "POST", headers: { "Authorization": `Bearer ${getToken()}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) { setBulkAddOpen(false); setBulkAddItems([{ name: "", sectionId: "", parentCategoryId: "", image: null }]); fetchCategories(); showMsg(data.message); }
            else showMsg(data.message, "error");
        } catch { showMsg("Bulk add failed", "error"); }
        finally { setLoading(false); }
    };

    const openBulkEdit = () => {
        if (selected.length === 0) { showMsg("Select categories first", "error"); return; }
        setBulkEditItems(categories.filter(c => selected.includes(c._id)).map(c => ({ id: c._id, name: c.name, image: null })));
        setBulkEditOpen(true);
    };

    const handleBulkUpdate = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            const itemsData = bulkEditItems.map(i => ({ id: i.id, name: i.name }));
            formData.append('items', JSON.stringify(itemsData));
            bulkEditItems.forEach((item, i) => {
                if (item.image) formData.append(`image_${i}`, item.image);
            });

            const res = await fetch(`${API_BASE}/category/bulkupdate`, { method: "POST", headers: { "Authorization": `Bearer ${getToken()}` }, body: formData });
            const data = await res.json();
            if (data.success) { setBulkEditOpen(false); setSelected([]); fetchCategories(); showMsg(data.message); }
            else showMsg(data.message, "error");
        } catch { showMsg("Bulk update failed", "error"); }
        finally { setLoading(false); }
    };

    const confirmBulkDelete = () => {
        if (selected.length === 0) { showMsg("Select categories first", "error"); return; }
        setBulkDeleteConfirmOpen(true);
    };

    const handleBulkDelete = async () => {
        setBulkDeleteConfirmOpen(false);
        try {
            const res = await fetch(`${API_BASE}/category/bulkdelete`, { method: "POST", headers: headers(), body: JSON.stringify({ ids: selected }) });
            const data = await res.json();
            if (data.success) { setSelected([]); fetchCategories(); showMsg(data.message); } else showMsg(data.message, "error");
        } catch { showMsg("Bulk delete failed", "error"); }
    };

    const toggleSelect = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const toggleAll = () => setSelected(selected.length === displayCategories.length ? [] : displayCategories.map(c => c._id));
    const getSectionName = (id: string) => sections.find(s => s._id === id)?.name || "—";
    const getParentName = (id: string) => categories.find(c => c._id === id)?.name || "—";

    const inputStyle = { padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, outline: "none", color: "#1e293b", width: "100%", boxSizing: "border-box" as const };
    const selectStyle = { ...inputStyle, background: "#fff" };

    return (
        <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>Categories & Subcategories</h1>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>{displayCategories.length} total in this view</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => setBulkAddOpen(true)} style={{ padding: "8px 16px", fontSize: 13, background: "#0f172a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>Bulk Add</button>
                    <button onClick={openBulkEdit} disabled={selected.length === 0}
                        style={{ padding: "8px 16px", fontSize: 13, background: selected.length > 0 ? "#3b82f6" : "#e2e8f0", color: selected.length > 0 ? "#fff" : "#94a3b8", border: "none", borderRadius: 6, cursor: selected.length > 0 ? "pointer" : "default" }}>Bulk Edit ({selected.length})</button>
                    <button onClick={confirmBulkDelete} disabled={selected.length === 0}
                        style={{ padding: "8px 16px", fontSize: 13, background: selected.length > 0 ? "#ef4444" : "#e2e8f0", color: selected.length > 0 ? "#fff" : "#94a3b8", border: "none", borderRadius: 6, cursor: selected.length > 0 ? "pointer" : "default" }}>Bulk Delete ({selected.length})</button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 24, paddingBottom: 1, borderBottom: "1px solid #e2e8f0" }}>
                <button onClick={() => { setActiveTab("categories"); setSelected([]); }}
                    style={{ padding: "10px 20px", background: "none", border: "none", fontSize: 14, fontWeight: 600, color: activeTab === "categories" ? "#ec268f" : "#64748b", borderBottom: activeTab === "categories" ? "2px solid #ec268f" : "2px solid transparent", cursor: "pointer", transition: "all .2s" }}>
                    Main Categories
                </button>
                <button onClick={() => { setActiveTab("subcategories"); setSelected([]); }}
                    style={{ padding: "10px 20px", background: "none", border: "none", fontSize: 14, fontWeight: 600, color: activeTab === "subcategories" ? "#ec268f" : "#64748b", borderBottom: activeTab === "subcategories" ? "2px solid #ec268f" : "2px solid transparent", cursor: "pointer", transition: "all .2s" }}>
                    Subcategories
                </button>
            </div>

            {/* Section Filter Pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, marginTop: 4 }}>
                <button
                    onClick={() => setFilterSectionId('')}
                    style={{ padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: filterSectionId === '' ? '#ec268f' : '#e2e8f0', background: filterSectionId === '' ? '#ec268f' : '#fff', color: filterSectionId === '' ? '#fff' : '#64748b', transition: 'all .15s' }}
                >All</button>
                {sections.map(s => (
                    <button
                        key={s._id}
                        onClick={() => setFilterSectionId(filterSectionId === s._id ? '' : s._id)}
                        style={{ padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: filterSectionId === s._id ? '#ec268f' : '#e2e8f0', background: filterSectionId === s._id ? '#ec268f' : '#fff', color: filterSectionId === s._id ? '#fff' : '#64748b', transition: 'all .15s' }}
                    >{s.name}</button>
                ))}
                {filterSectionId && (
                    <span style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center', marginLeft: 4 }}>
                        {displayCategories.length} result{displayCategories.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {message && (
                <div style={{ padding: "10px 16px", borderRadius: 6, marginBottom: 16, fontSize: 13, fontWeight: 500, background: message.type === "success" ? "#dcfce7" : "#fee2e2", color: message.type === "success" ? "#166534" : "#991b1b", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>{message.text}</div>
            )}

            {/* Quick Add */}
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: 20, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: "0 0 16px" }}>{activeTab === "categories" ? "Add New Main Category" : "Add New Subcategory"}</h3>
                <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: activeTab === "subcategories" ? "1fr 1fr 1fr auto" : "1fr 1fr auto", gap: 10, alignItems: "end" }}>
                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder={activeTab === "categories" ? "e.g. Menswear" : "e.g. Shirts"} style={inputStyle} />
                    </div>
                    <div style={{ zIndex: 60 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Section</label>
                        <CustomSelect
                            value={sectionId}
                            onChange={(val) => { setSectionId(val); setParentCategoryId(""); }}
                            options={sections.map(s => ({ value: s._id, label: s.name }))}
                            placeholder="Select Section"
                        />
                    </div>
                    {activeTab === "subcategories" && (
                        <div style={{ zIndex: 50 }}>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Parent Category</label>
                            <CustomSelect
                                value={parentCategoryId}
                                onChange={setParentCategoryId}
                                options={parentCategories.filter(c => c.sectionId === sectionId).map(c => ({ value: c._id, label: c.name }))}
                                placeholder={!sectionId ? "Select Section First" : "Select Parent"}
                                disabled={!sectionId}
                            />
                        </div>
                    )}
                    <button type="submit" disabled={loading} style={{ padding: "10px 20px", background: "#ec268f", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer", height: 42 }}>{loading ? "..." : "Add"}</button>
                </form>
                {/* ── Image Uploader (Add) ── */}
                <div style={{ marginTop: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Category Image</label>
                    {categoryImage ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid #d1fae5', borderRadius: 8, background: '#f0fdf4' }}>
                            <img src={URL.createObjectURL(categoryImage)} alt="preview" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, border: '1px solid #bbf7d0' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{categoryImage.name}</p>
                                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#4ade80' }}>{(categoryImage.size / 1024).toFixed(1)} KB · Ready to upload</p>
                            </div>
                            <button type="button" onClick={() => setCategoryImage(null)}
                                style={{ background: '#fee2e2', border: 'none', borderRadius: 6, color: '#ef4444', padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                        </div>
                    ) : (
                        <div
                            onClick={() => addFileRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setAddDragActive(true); }}
                            onDragLeave={() => setAddDragActive(false)}
                            onDrop={e => { e.preventDefault(); setAddDragActive(false); const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith('image/')) setCategoryImage(f); }}
                            style={{ border: `2px dashed ${addDragActive ? '#ec268f' : '#d1d5db'}`, borderRadius: 8, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', background: addDragActive ? '#fdf2f8' : '#fafafa', transition: 'all .2s' }}>
                            <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>Drop image here or <span style={{ color: '#ec268f' }}>click to browse</span></p>
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>JPG, PNG, WebP, AVIF — max 5 MB</p>
                        </div>
                    )}
                    <input ref={addFileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" style={{ display: 'none' }} onChange={e => setCategoryImage(e.target.files?.[0] || null)} />
                </div>
            </div>

            {/* Inline Edit */}
            {editId && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 20, marginBottom: 20 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Editing</p>
                    <form onSubmit={handleUpdate} style={{ display: "grid", gridTemplateColumns: activeTab === "subcategories" ? "1fr 1fr 1fr auto auto" : "1fr 1fr auto auto", gap: 10, alignItems: "end" }}>
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required style={inputStyle} />
                        <div style={{ width: 150, zIndex: 50 }}>
                            <CustomSelect
                                value={editSectionId}
                                onChange={setEditSectionId}
                                options={sections.map(s => ({ value: s._id, label: s.name }))}
                                placeholder="Keep current"
                            />
                        </div>
                        {activeTab === "subcategories" && (
                            <div style={{ width: 150, zIndex: 50 }}>
                                <CustomSelect
                                    value={editParentId}
                                    onChange={setEditParentId}
                                    options={[{ value: "", label: "None" }, ...parentCategories.filter(c => c._id !== editId).map(c => ({ value: c._id, label: c.name }))]}
                                    placeholder="None"
                                />
                            </div>
                        )}
                        <button type="submit" style={{ padding: "10px 16px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Save</button>
                        <button type="button" onClick={() => { setEditId(null); setEditImage(null); }} style={{ padding: "10px 16px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: 6, fontWeight: 500, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                    </form>
                    {/* ── Image Uploader (Edit) ── */}
                    <div style={{ marginTop: 14 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 6 }}>Update Image</label>
                        {editImage ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid #d1fae5', borderRadius: 8, background: '#f0fdf4' }}>
                                <img src={URL.createObjectURL(editImage)} alt="preview" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, border: '1px solid #bbf7d0' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{editImage.name}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#4ade80' }}>{(editImage.size / 1024).toFixed(1)} KB · Will replace current</p>
                                </div>
                                <button type="button" onClick={() => setEditImage(null)}
                                    style={{ background: '#fee2e2', border: 'none', borderRadius: 6, color: '#ef4444', padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                {categories.find(c => c._id === editId)?.image?.url && (
                                    <div style={{ position: 'relative' }}>
                                        <img src={categories.find(c => c._id === editId)?.image?.url} alt="current" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '2px solid #fde68a' }} />
                                        <span style={{ position: 'absolute', bottom: -18, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: '#92400e', fontWeight: 600 }}>Current</span>
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 200 }}
                                    onClick={() => editFileRef.current?.click()}
                                    onDragOver={e => { e.preventDefault(); setEditDragActive(true); }}
                                    onDragLeave={() => setEditDragActive(false)}
                                    onDrop={e => { e.preventDefault(); setEditDragActive(false); const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith('image/')) setEditImage(f); }}>
                                    <div style={{ border: `2px dashed ${editDragActive ? '#ec268f' : '#d97706'}`, borderRadius: 8, padding: '16px', textAlign: 'center', cursor: 'pointer', background: editDragActive ? '#fdf2f8' : '#fffbeb', transition: 'all .2s' }}>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>Drop new image or <span style={{ color: '#ec268f' }}>click to browse</span></p>
                                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>Replaces the current image</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <input ref={editFileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" style={{ display: 'none' }} onChange={e => setEditImage(e.target.files?.[0] || null)} />
                    </div>
                </div>
            )}

            {/* Table */}
            {displayCategories.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 10, border: "1px dashed #cbd5e1", padding: "80px 20px", textAlign: "center" }}>
                    <div style={{ width: 64, height: 64, background: "#f1f5f9", borderRadius: 32, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", margin: "0 0 8px" }}>No {activeTab === "categories" ? "Main Categories" : "Subcategories"} Found</h3>
                    <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", maxWidth: 400, marginInline: "auto" }}>Get started by creating your first {activeTab === "categories" ? "category" : "subcategory"} using the form above.</p>
                </div>
            ) : (
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc" }}>
                                <th style={{ padding: "12px 16px", textAlign: "left", width: 40 }}>
                                    <input type="checkbox" checked={selected.length === displayCategories.length && displayCategories.length > 0} onChange={toggleAll} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#ec268f" }} />
                                </th>
                                {(activeTab === "categories" ? ["Image", "Name", "Section", "Status", ""] : ["Image", "Name", "Section", "Parent", "Status", ""]).map(h => (
                                    <th key={h} style={{ padding: "12px 16px", textAlign: h === "" ? "right" : "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {displayCategories.map(cat => (
                                <tr key={cat._id} style={{ borderTop: "1px solid #f1f5f9" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                    <td style={{ padding: "14px 16px" }}>
                                        <input type="checkbox" checked={selected.includes(cat._id)} onChange={() => toggleSelect(cat._id)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#ec268f" }} />
                                    </td>
                                    <td style={{ padding: "10px 16px", width: 60 }}>
                                        {cat.image?.url ? (
                                            <img src={cat.image.url} alt={cat.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} />
                                        ) : (
                                            <span style={{ fontSize: 11, color: '#94a3b8' }}>No Image</span>
                                        )}
                                    </td>
                                    <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 500, color: "#1e293b" }}>
                                        {cat.name}
                                    </td>
                                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748b" }}>{getSectionName(cat.sectionId)}</td>
                                    {activeTab === "subcategories" && <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748b" }}>{getParentName(cat.parentCategoryId)}</td>}
                                    <td style={{ padding: "14px 16px" }}>
                                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: cat.isActive ? "#dcfce7" : "#fee2e2", color: cat.isActive ? "#166534" : "#991b1b" }}>{cat.isActive ? "Active" : "Inactive"}</span>
                                    </td>
                                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                        <button onClick={() => { setEditId(cat._id); setEditName(cat.name); setEditSectionId(cat.sectionId); setEditParentId(cat.parentCategoryId || ""); }}
                                            style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, fontWeight: 500, cursor: "pointer", marginRight: 12 }}>Edit</button>
                                        <button onClick={() => confirmDelete(cat._id)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Bulk Add Modal */}
            {bulkAddOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setBulkAddOpen(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 28, width: 680, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,.15)", maxHeight: "80vh", overflowY: "auto" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Bulk Add {activeTab === "categories" ? "Categories" : "Subcategories"}</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {bulkAddItems.map((item, idx) => (
                                <div key={idx} style={{ display: "grid", gridTemplateColumns: activeTab === "subcategories" ? "1fr 1fr 1fr 80px 32px" : "1fr 1fr 80px 32px", gap: 8, alignItems: "center" }}>
                                    <input placeholder="Name" value={item.name} onChange={e => { const c = [...bulkAddItems]; c[idx] = { ...c[idx], name: e.target.value }; setBulkAddItems(c); }} style={inputStyle} />
                                    <div style={{ zIndex: 100 - idx }}>
                                        <CustomSelect
                                            value={item.sectionId}
                                            onChange={(val: string) => { const c = [...bulkAddItems]; c[idx] = { ...c[idx], sectionId: val, parentCategoryId: "" }; setBulkAddItems(c); }}
                                            options={sections.map(s => ({ value: s._id, label: s.name }))}
                                            placeholder="Section"
                                        />
                                    </div>
                                    {activeTab === "subcategories" && (
                                        <div style={{ zIndex: 100 - idx }}>
                                            <CustomSelect
                                                value={item.parentCategoryId}
                                                onChange={(val: string) => { const c = [...bulkAddItems]; c[idx] = { ...c[idx], parentCategoryId: val }; setBulkAddItems(c); }}
                                                options={parentCategories.filter(c => c.sectionId === item.sectionId).map(c => ({ value: c._id, label: c.name }))}
                                                placeholder={!item.sectionId ? "Select Section" : "Parent Category"}
                                                disabled={!item.sectionId}
                                            />
                                        </div>
                                    )}
                                    <div style={{ position: "relative" }}>
                                        <input type="file" accept="image/*" id={`bulk-add-img-${idx}`} style={{ display: "none" }}
                                            onChange={e => { const c = [...bulkAddItems]; c[idx].image = e.target.files?.[0] || null; setBulkAddItems(c); }} />
                                        <label htmlFor={`bulk-add-img-${idx}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 42, background: item.image ? "#dcfce7" : "#f1f5f9", color: item.image ? "#166534" : "#475569", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, border: item.image ? "1px solid #bbf7d0" : "1px solid #cbd5e1" }}>
                                            {item.image ? "Img ✓" : "+ Img"}
                                        </label>
                                    </div>
                                    {bulkAddItems.length > 1 ? (
                                        <button onClick={() => setBulkAddItems(bulkAddItems.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 18, cursor: "pointer", padding: 0 }}>×</button>
                                    ) : <div />}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setBulkAddItems([...bulkAddItems, { name: "", sectionId: "", parentCategoryId: "", image: null }])}
                            style={{ marginTop: 10, background: "none", border: "1px dashed #d1d5db", color: "#64748b", fontSize: 13, padding: "8px 14px", borderRadius: 6, cursor: "pointer", width: "100%" }}>+ Add another row</button>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                            <button onClick={() => setBulkAddOpen(false)} style={{ padding: "8px 18px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                            <button onClick={handleBulkAdd} disabled={loading} style={{ padding: "8px 18px", background: "#ec268f", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{loading ? "Adding..." : "Add All"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Edit Modal */}
            {bulkEditOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setBulkEditOpen(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 28, width: 500, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Bulk Edit Categories</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 400, overflowY: "auto" }}>
                            {bulkEditItems.map((item, idx) => (
                                <div key={item.id} style={{ display: "flex", gap: 8 }}>
                                    <input type="text" value={item.name}
                                        onChange={e => { const c = [...bulkEditItems]; c[idx] = { ...c[idx], name: e.target.value }; setBulkEditItems(c); }}
                                        style={{ ...inputStyle, flex: 1 }} />
                                    <div style={{ position: "relative" }}>
                                        <input type="file" accept="image/*" id={`bulk-edit-img-${idx}`} style={{ display: "none" }}
                                            onChange={e => { const c = [...bulkEditItems]; c[idx].image = e.target.files?.[0] || null; setBulkEditItems(c); }} />
                                        <label htmlFor={`bulk-edit-img-${idx}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 42, width: 80, background: item.image ? "#dcfce7" : "#f1f5f9", color: item.image ? "#166534" : "#475569", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, border: item.image ? "1px solid #bbf7d0" : "1px solid #cbd5e1" }}>
                                            {item.image ? "Img ✓" : "New Img"}
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                            <button onClick={() => setBulkEditOpen(false)} style={{ padding: "8px 18px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                            <button onClick={handleBulkUpdate} disabled={loading} style={{ padding: "8px 18px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{loading ? "Saving..." : "Save All"}</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setDeleteConfirmOpen(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 28, width: 400, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,.15)", textAlign: "center" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 24, background: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>!</div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Delete Category?</h3>
                        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Are you sure you want to delete this category? This action cannot be undone.</p>
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
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Delete {selected.length} Categories?</h3>
                        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Are you sure you want to delete the selected categories? This action cannot be undone.</p>
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

