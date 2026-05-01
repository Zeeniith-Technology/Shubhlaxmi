"use client";

import { useState, useEffect } from "react";
import CustomSelect from "../components/CustomSelect";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [availableAttributes, setAvailableAttributes] = useState<any[]>([]);

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [filterSectionId, setFilterSectionId] = useState("All");
    const [filterCategoryId, setFilterCategoryId] = useState("All");

    // Form fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [compareAtPrice, setCompareAtPrice] = useState("");
    const [sku, setSku] = useState("");
    const [stock, setStock] = useState("");
    const [sectionId, setSectionId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [isFeatured, setIsFeatured] = useState(false);
    const [images, setImages] = useState<FileList | null>(null);
    const [existingImages, setExistingImages] = useState<any[]>([]);

    // Advanced Amrut-Style Fields
    const [variants, setVariants] = useState<any[]>([]);
    const [attributes, setAttributes] = useState<{ key: string, value: string }[]>([]);
    const [customizations, setCustomizations] = useState<any[]>([]);
    const [seo, setSeo] = useState({ metaTitle: "", metaDescription: "", keywords: "" });

    // Bulk modals
    const [bulkAddOpen, setBulkAddOpen] = useState(false);
    const [bulkAddItems, setBulkAddItems] = useState<{ title: string; price: string; stock: string; sectionId: string; categoryId: string }[]>([]);
    const [bulkEditOpen, setBulkEditOpen] = useState(false);
    const [bulkEditItems, setBulkEditItems] = useState<{ id: string; title: string; price: string }[]>([]);

    // Delete Confirmation Modals
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

    const getToken = () => localStorage.getItem("admin_token") || "";
    const hdrs = () => ({ "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` });

    const showMsg = (text: string, type: "success" | "error" = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_BASE}/product/list`, { method: "POST", headers: hdrs(), body: JSON.stringify({}) });
            const data = await res.json();
            if (data.success) setProducts(data.data);
        } catch { showMsg("Failed to load products", "error"); }
    };

    const fetchSections = async () => {
        try {
            const res = await fetch(`${API_BASE}/section/list`, { method: "POST", headers: hdrs(), body: JSON.stringify({}) });
            const data = await res.json();
            if (data.success) setSections(data.data);
        } catch { }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_BASE}/category/list`, { method: "POST", headers: hdrs(), body: JSON.stringify({}) });
            const data = await res.json();
            if (data.success) setCategories(data.data);
        } catch { }
    };

    const fetchAttributes = async () => {
        try {
            const res = await fetch(`${API_BASE}/attribute/list`, { method: "POST", headers: hdrs(), body: JSON.stringify({}) });
            const data = await res.json();
            if (data.success) setAvailableAttributes(data.data);
        } catch { }
    };

    useEffect(() => { fetchProducts(); fetchSections(); fetchCategories(); fetchAttributes(); }, []);

    const filteredCategories = sectionId ? categories.filter(c => c.sectionId === sectionId) : categories;

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const pSectionId = typeof p.sectionId === 'object' && p.sectionId ? p.sectionId._id : p.sectionId;
        const matchesSection = filterSectionId === "All" || pSectionId === filterSectionId;
        
        const pCategoryId = typeof p.categoryId === 'object' && p.categoryId ? p.categoryId._id : p.categoryId;
        const matchesCategory = filterCategoryId === "All" || pCategoryId === filterCategoryId;
        
        return matchesSearch && matchesSection && matchesCategory;
    });

    const resetForm = () => {
        setTitle(""); setDescription(""); setPrice(""); setCompareAtPrice(""); setSku(""); setStock(""); setSectionId(""); setCategoryId(""); setIsFeatured(false); setImages(null); setEditId(null); setShowForm(false);
        setVariants([]); setAttributes([]); setCustomizations([]); setSeo({ metaTitle: "", metaDescription: "", keywords: "" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("price", price);
        if (compareAtPrice) formData.append("compareAtPrice", compareAtPrice);
        if (sku) formData.append("sku", sku);
        if (stock) formData.append("stock", stock);
        formData.append("sectionId", sectionId);
        formData.append("categoryId", categoryId);
        formData.append("isFeatured", String(isFeatured));

        // Append Advanced Fields
        formData.append("variants", JSON.stringify(variants));
        formData.append("attributes", JSON.stringify(attributes));
        formData.append("customizationOptions", JSON.stringify(customizations));
        formData.append("seo", JSON.stringify(seo));

        if (editId) formData.append("id", editId);
        if (images) { for (let i = 0; i < images.length; i++) formData.append("images", images[i]); }
        try {
            const url = editId ? `${API_BASE}/product/update` : `${API_BASE}/product/add`;
            const res = await fetch(url, { method: "POST", headers: { "Authorization": `Bearer ${getToken()}` }, body: formData });
            const data = await res.json();
            if (data.success) { resetForm(); fetchProducts(); showMsg(editId ? "Product updated" : "Product created"); }
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
            const res = await fetch(`${API_BASE}/product/delete`, { method: "POST", headers: hdrs(), body: JSON.stringify({ id: itemToDelete }) });
            const data = await res.json();
            if (data.success) { fetchProducts(); showMsg("Product deleted"); } else showMsg(data.message, "error");
        } catch { showMsg("Network error", "error"); }
        finally { setItemToDelete(null); }
    };

    const handleEdit = (p: any) => {
        setEditId(p._id); setTitle(p.title); setDescription(p.description || ""); setPrice(String(p.price));
        setCompareAtPrice(p.compareAtPrice ? String(p.compareAtPrice) : ""); setSku(p.sku || "");
        setStock(String(p.stock || 0));
        // sectionId and categoryId may be populated objects or plain strings
        setSectionId(typeof p.sectionId === "object" ? p.sectionId?._id || "" : p.sectionId || "");
        setCategoryId(typeof p.categoryId === "object" ? p.categoryId?._id || "" : p.categoryId || "");
        setIsFeatured(p.isFeatured || false); setExistingImages(p.images || []); setImages(null);

        // Advanced Fields
        setVariants(p.variants || []);
        setAttributes(p.attributes || []);
        setCustomizations(p.customizationOptions || []);
        setSeo(p.seo || { metaTitle: "", metaDescription: "", keywords: "" });

        setShowForm(true);
    };

    // Bulk Add
    const openBulkAdd = () => {
        setBulkAddItems(Array(5).fill({ title: "", price: "", stock: "", sectionId: "", categoryId: "" }));
        setBulkAddOpen(true);
    };

    const handleBulkAdd = async () => {
        const validItems = bulkAddItems.filter(i => i.title.trim() && i.price && i.sectionId && i.categoryId);
        if (validItems.length === 0) { showMsg("Please fill at least one product completely (Title, Price, Section, Category)", "error"); return; }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/product/bulkadd`, {
                method: "POST", headers: hdrs(),
                body: JSON.stringify({ items: validItems })
            });
            const data = await res.json();
            if (data.success) { setBulkAddOpen(false); fetchProducts(); showMsg(data.message); }
            else showMsg(data.message, "error");
        } catch { showMsg("Bulk add failed", "error"); }
        finally { setLoading(false); }
    };

    // Bulk Edit
    const openBulkEdit = () => {
        if (selected.length === 0) { showMsg("Select products first", "error"); return; }
        setBulkEditItems(products.filter(p => selected.includes(p._id)).map(p => ({ id: p._id, title: p.title, price: String(p.price) })));
        setBulkEditOpen(true);
    };

    const handleBulkUpdate = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/product/bulkupdate`, {
                method: "POST", headers: hdrs(),
                body: JSON.stringify({ items: bulkEditItems.map(i => ({ id: i.id, title: i.title, price: Number(i.price) })) })
            });
            const data = await res.json();
            if (data.success) { setBulkEditOpen(false); setSelected([]); fetchProducts(); showMsg(data.message); }
            else showMsg(data.message, "error");
        } catch { showMsg("Bulk update failed", "error"); }
        finally { setLoading(false); }
    };

    const confirmBulkDelete = () => {
        if (selected.length === 0) { showMsg("Select products first", "error"); return; }
        setBulkDeleteConfirmOpen(true);
    };

    const handleBulkDelete = async () => {
        setBulkDeleteConfirmOpen(false);
        try {
            const res = await fetch(`${API_BASE}/product/bulkdelete`, { method: "POST", headers: hdrs(), body: JSON.stringify({ ids: selected }) });
            const data = await res.json();
            if (data.success) { setSelected([]); fetchProducts(); showMsg(data.message); } else showMsg(data.message, "error");
        } catch { showMsg("Bulk delete failed", "error"); }
    };

    const toggleSelect = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const toggleAll = () => setSelected(selected.length === products.length ? [] : products.map(p => p._id));
    // categoryId and sectionId may be populated objects (from $lookup) or plain ID strings
    const getSectionName = (val: any) => {
        if (!val) return "—";
        if (typeof val === "object" && val.name) return val.name;
        return sections.find(s => s._id === String(val))?.name || String(val).slice(-6);
    };
    const getCategoryName = (val: any) => {
        if (!val) return "—";
        if (typeof val === "object" && val.name) return val.name;
        return categories.find(c => c._id === String(val))?.name || String(val).slice(-6);
    };

    const inputStyle = { padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, outline: "none", color: "#1e293b", width: "100%", boxSizing: "border-box" as const };
    const selectStyle = { ...inputStyle, background: "#fff" };
    const labelStyle = { display: "block" as const, fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 };

    return (
        <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>Products</h1>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>{products.length} total</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={openBulkAdd}
                        style={{ padding: "8px 16px", fontSize: 13, background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>
                        Bulk Add
                    </button>
                    <button onClick={() => { resetForm(); setShowForm(!showForm); }}
                        style={{ padding: "8px 16px", fontSize: 13, background: "#ec268f", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>
                        {showForm ? "Close Form" : "+ New Product"}
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

            {message && (
                <div style={{ padding: "10px 16px", borderRadius: 6, marginBottom: 16, fontSize: 13, fontWeight: 500, background: message.type === "success" ? "#dcfce7" : "#fee2e2", color: message.type === "success" ? "#166534" : "#991b1b", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>{message.text}</div>
            )}

            {/* Product Form */}
            {showForm && (
                <div style={{ background: editId ? "#fffbeb" : "#fff", border: `1px solid ${editId ? "#fde68a" : "#e2e8f0"}`, borderRadius: 10, padding: 24, marginBottom: 20 }}>
                    {editId && <p style={{ fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Editing Product</p>}
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <label style={labelStyle}>Title *</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Product title" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>SKU</label>
                                <input type="text" value={sku} onChange={e => setSku(e.target.value)} placeholder="Optional" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Price *</label>
                                <input type="number" value={price} onChange={e => setPrice(e.target.value)} required placeholder="₹999" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Compare At Price (MRP)</label>
                                <input type="number" value={compareAtPrice} onChange={e => setCompareAtPrice(e.target.value)} placeholder="₹1499" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Stock</label>
                                <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" style={inputStyle} />
                            </div>
                            <div style={{ zIndex: 60 }}>
                                <label style={labelStyle}>Section *</label>
                                <CustomSelect
                                    value={sectionId}
                                    onChange={(val) => { setSectionId(val); setCategoryId(""); }}
                                    options={sections.map(s => ({ value: s._id, label: s.name }))}
                                    placeholder="Select Section"
                                />
                            </div>
                            <div style={{ zIndex: 50 }}>
                                <label style={labelStyle}>Category *</label>
                                <CustomSelect
                                    value={categoryId}
                                    onChange={setCategoryId}
                                    options={filteredCategories.map(c => ({ value: c._id, label: c.name }))}
                                    placeholder="Select Category"
                                />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 22 }}>
                                <input type="checkbox" id="featured" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#ec268f" }} />
                                <label htmlFor="featured" style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>Featured</label>
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={labelStyle}>Description</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Product description..." style={{ ...inputStyle, resize: "vertical" as const, fontFamily: "inherit" }} />
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={labelStyle}>Images</label>
                                <div style={{ border: "2px dashed #cbd5e1", borderRadius: 8, padding: 20, textAlign: "center", background: "#f8fafc" }}>
                                    <input type="file" id="productImages" accept="image/*" multiple onChange={e => setImages(e.target.files)} style={{ display: "none" }} />
                                    <label htmlFor="productImages" style={{ display: "inline-block", background: "#fff", border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#374151", marginBottom: 8 }}>
                                        Choose Images
                                    </label>
                                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>JPG, PNG, WEBP — up to 10 files. Note: newly uploaded images will be added to the product.</p>
                                </div>
                                {(existingImages.length > 0 || (images && images.length > 0)) && (
                                    <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                                        {existingImages.map((img: any, idx: number) => (
                                            <div key={`ex-${idx}`} style={{ position: "relative", width: 70, height: 70, borderRadius: 6, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                                                <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 9, textAlign: "center", padding: "2px 0" }}>Existing</div>
                                            </div>
                                        ))}
                                        {images && Array.from(images).map((file, idx) => (
                                            <div key={`new-${idx}`} style={{ position: "relative", width: 70, height: 70, borderRadius: 6, border: "2px solid #ec268f", overflow: "hidden" }}>
                                                <img src={URL.createObjectURL(file)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#ec268f", color: "#fff", fontSize: 9, textAlign: "center", padding: "2px 0" }}>New</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* --- ADVANCED AMRUT FIELDS --- */}

                            {/* Attributes */}
                            <div style={{ gridColumn: "1 / -1", background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                    <label style={{ ...labelStyle, margin: 0 }}>Product Attributes (Fabric, Work, Occasion, etc)</label>
                                    <button type="button" onClick={() => setAttributes([...attributes, { key: "", value: "" }])} style={{ background: "none", border: "1px dashed #cbd5e1", color: "#64748b", fontSize: 12, padding: "4px 10px", borderRadius: 4, cursor: "pointer" }}>+ Add Attribute</button>
                                </div>
                                {attributes.map((attr, idx) => {
                                    const selectedGlobalAttr = availableAttributes.find(a => a.name === attr.key);
                                    return (
                                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 32px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                                            <div style={{ zIndex: 100 - idx }}>
                                                <CustomSelect
                                                    value={attr.key}
                                                    onChange={val => { const a = [...attributes]; a[idx].key = val; a[idx].value = ""; setAttributes(a); }}
                                                    options={availableAttributes.map(a => ({ value: a.name, label: a.name }))}
                                                    placeholder="Select Attribute Group"
                                                />
                                            </div>
                                            <div style={{ zIndex: 100 - idx }}>
                                                {selectedGlobalAttr && selectedGlobalAttr.values.length > 0 ? (
                                                    <CustomSelect
                                                        value={attr.value}
                                                        onChange={val => { const a = [...attributes]; a[idx].value = val; setAttributes(a); }}
                                                        options={selectedGlobalAttr.values.map((v: string) => ({ value: v, label: v }))}
                                                        placeholder={`Select ${attr.key}`}
                                                    />
                                                ) : (
                                                    <input placeholder="Type a value" value={attr.value} onChange={e => { const a = [...attributes]; a[idx].value = e.target.value; setAttributes(a); }} style={inputStyle} />
                                                )}
                                            </div>
                                            <button type="button" onClick={() => setAttributes(attributes.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 18, cursor: "pointer" }}>×</button>
                                        </div>
                                    );
                                })}
                                {attributes.length === 0 && <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>No attributes added yet. Use these for filtering.</p>}
                            </div>

                            {/* Variants */}
                            <div style={{ gridColumn: "1 / -1", background: "#fff", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                    <label style={{ ...labelStyle, margin: 0 }}>Product Variants (Sizes, Colors)</label>
                                    <button type="button" onClick={() => setVariants([...variants, { sku: "", price: "", stock: 0, options: [{ name: "Size", value: "" }] }])} style={{ background: "none", border: "1px dashed #cbd5e1", color: "#64748b", fontSize: 12, padding: "4px 10px", borderRadius: 4, cursor: "pointer" }}>+ Add Variant</button>
                                </div>
                                {variants.map((variant, idx) => (
                                    <div key={idx} style={{ background: "#f8fafc", padding: 12, borderRadius: 6, marginBottom: 8, border: "1px solid #e2e8f0" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Variant {idx + 1}</span>
                                            <button type="button" onClick={() => setVariants(variants.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>Remove</button>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 8 }}>
                                            <input placeholder="SKU *" value={variant.sku} onChange={e => { const v = [...variants]; v[idx].sku = e.target.value; setVariants(v); }} style={inputStyle} required={variants.length > 0} />
                                            <input type="number" placeholder="Price *" value={variant.price} onChange={e => { const v = [...variants]; v[idx].price = e.target.value; setVariants(v); }} style={inputStyle} required={variants.length > 0} />
                                            <input type="number" placeholder="Stock" value={variant.stock} onChange={e => { const v = [...variants]; v[idx].stock = e.target.value; setVariants(v); }} style={inputStyle} />
                                        </div>
                                        <div style={{ display: "flex", gap: 10 }}>
                                            {variant.options.map((opt: any, optIdx: number) => (
                                                <div key={optIdx} style={{ display: "flex", gap: 4, flex: 1 }}>
                                                    <input placeholder="Option (Size, Color)" value={opt.name} onChange={e => { const v = [...variants]; v[idx].options[optIdx].name = e.target.value; setVariants(v); }} style={{ ...inputStyle, padding: "6px 10px", width: "40%" }} />
                                                    <input placeholder="Value (M, Red)" value={opt.value} onChange={e => { const v = [...variants]; v[idx].options[optIdx].value = e.target.value; setVariants(v); }} style={{ ...inputStyle, padding: "6px 10px", width: "60%" }} />
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => { const v = [...variants]; v[idx].options.push({ name: "", value: "" }); setVariants(v); }} style={{ background: "#e2e8f0", border: "none", borderRadius: 4, width: 30, cursor: "pointer", color: "#475569", fontWeight: 700 }}>+</button>
                                        </div>
                                    </div>
                                ))}
                                {variants.length === 0 && <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Basic stock/price above will apply if no variants are set.</p>}
                            </div>

                            {/* SEO */}
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={labelStyle}>SEO Meta Title & Keywords</label>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <input placeholder="Meta Title" value={seo.metaTitle} onChange={e => setSeo({ ...seo, metaTitle: e.target.value })} style={inputStyle} />
                                    <input placeholder="Keywords (comma separated)" value={seo.keywords} onChange={e => setSeo({ ...seo, keywords: e.target.value })} style={inputStyle} />
                                </div>
                            </div>

                        </div>
                        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                            <button type="submit" disabled={loading}
                                style={{ padding: "10px 24px", background: "#ec268f", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                                {loading ? "Saving..." : editId ? "Update Product" : "Add Product"}
                            </button>
                            <button type="button" onClick={resetForm}
                                style={{ padding: "10px 20px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: 6, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Toolbar: Search and Filters */}
            {!showForm && products.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 items-stretch sm:items-center">
                    <div className="flex-1 min-w-[200px]">
                        <input 
                            type="text" 
                            placeholder="Search by title or SKU..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent transition-all"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <select 
                            value={filterSectionId} 
                            onChange={e => setFilterSectionId(e.target.value)}
                            className="w-full sm:w-[160px] px-4 py-2.5 border border-slate-300 rounded-lg outline-none text-sm bg-white cursor-pointer focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent"
                        >
                            <option value="All">All Sections</option>
                            {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                        <select 
                            value={filterCategoryId} 
                            onChange={e => setFilterCategoryId(e.target.value)}
                            className="w-full sm:w-[160px] px-4 py-2.5 border border-slate-300 rounded-lg outline-none text-sm bg-white cursor-pointer focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-transparent"
                        >
                            <option value="All">All Categories</option>
                            {categories.filter(c => filterSectionId === "All" || c.sectionId === filterSectionId).map(c => 
                                <option key={c._id} value={c._id}>{c.name}</option>
                            )}
                        </select>
                    </div>
                </div>
            )}

            {/* Products Table */}
            {products.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 10, border: "1px dashed #cbd5e1", padding: "80px 20px", textAlign: "center" }}>
                    <div style={{ width: 64, height: 64, background: "#f1f5f9", borderRadius: 32, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", margin: "0 0 8px" }}>No Products Found</h3>
                    <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", maxWidth: 400, marginInline: "auto" }}>Get started by creating your first product. Products will appear here once added to your catalog.</p>
                    <button onClick={() => { resetForm(); setShowForm(true); }} style={{ padding: "10px 24px", background: "#ec268f", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>
                        + Add Your First Product
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc" }}>
                                <th style={{ padding: "12px 14px", textAlign: "left", width: 40 }}>
                                    <input type="checkbox" checked={selected.length === products.length && products.length > 0} onChange={toggleAll} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#ec268f" }} />
                                </th>
                                <th style={{ padding: "12px 14px", width: 50 }}></th>
                                {["Title", "Price", "Stock", "Section", "Category", "Status"].map((h, i) => (
                                    <th key={i} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</th>
                                ))}
                                <th style={{ padding: "12px 14px", width: 100 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                                        No products match your search/filter criteria.
                                    </td>
                                </tr>
                            ) : filteredProducts.map(p => (
                                <tr key={p._id} style={{ borderTop: "1px solid #f1f5f9" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                    <td style={{ padding: "12px 14px" }}>
                                        <input type="checkbox" checked={selected.includes(p._id)} onChange={() => toggleSelect(p._id)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#ec268f" }} />
                                    </td>
                                    <td style={{ padding: "12px 14px" }}>
                                        {p.images?.[0]?.url ? (
                                            <img src={p.images[0].url} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid #e2e8f0" }} />
                                        ) : (
                                            <div style={{ width: 40, height: 40, background: "#f1f5f9", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#94a3b8" }}>—</div>
                                        )}
                                    </td>
                                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 500, color: "#1e293b" }}>
                                        {p.title}
                                        {p.isFeatured && <span style={{ marginLeft: 6, padding: "2px 8px", fontSize: 10, background: "#fef3c7", color: "#92400e", borderRadius: 10, fontWeight: 600 }}>★</span>}
                                    </td>
                                    <td style={{ padding: "12px 14px", fontSize: 14, color: "#1e293b" }}>
                                        ₹{p.price}
                                        {p.compareAtPrice && <span style={{ marginLeft: 4, textDecoration: "line-through", color: "#94a3b8", fontSize: 12 }}>₹{p.compareAtPrice}</span>}
                                    </td>
                                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#64748b" }}>{p.stock}</td>
                                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#64748b" }}>{getSectionName(p.sectionId)}</td>
                                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#64748b" }}>{getCategoryName(p.categoryId)}</td>
                                    <td style={{ padding: "12px 14px" }}>
                                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.isActive ? "#dcfce7" : "#fee2e2", color: p.isActive ? "#166534" : "#991b1b" }}>{p.isActive ? "Active" : "Inactive"}</span>
                                    </td>
                                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                                        <button onClick={() => handleEdit(p)} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, fontWeight: 500, cursor: "pointer", marginRight: 12 }}>Edit</button>
                                        <button onClick={() => confirmDelete(p._id)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {/* Bulk Add Modal */}
            {bulkAddOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[100]" onClick={() => setBulkAddOpen(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-[1000px] max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
                            <h3 className="m-0 text-lg font-bold text-slate-800">Bulk Add Products</h3>
                            <button onClick={() => setBulkAddOpen(false)} className="bg-transparent border-none text-2xl cursor-pointer text-slate-500 hover:text-slate-800">&times;</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3">
                            {bulkAddItems.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1.5fr_1.5fr_36px] gap-3 items-center bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-200">
                                    <input placeholder="Title *" value={item.title} onChange={e => { const c = [...bulkAddItems]; c[idx] = { ...c[idx], title: e.target.value }; setBulkAddItems(c); }} style={inputStyle} className="w-full" />
                                    <div className="flex gap-3 sm:contents">
                                        <input type="number" placeholder="Price *" value={item.price} onChange={e => { const c = [...bulkAddItems]; c[idx] = { ...c[idx], price: e.target.value }; setBulkAddItems(c); }} style={inputStyle} className="flex-1 sm:w-full" />
                                        <input type="number" placeholder="Stock" value={item.stock} onChange={e => { const c = [...bulkAddItems]; c[idx] = { ...c[idx], stock: e.target.value }; setBulkAddItems(c); }} style={inputStyle} className="flex-1 sm:w-full" />
                                    </div>
                                    <div style={{ zIndex: 100 - idx }} className="w-full">
                                        <CustomSelect
                                            value={item.sectionId}
                                            onChange={(val: string) => { const c = [...bulkAddItems]; c[idx] = { ...c[idx], sectionId: val, categoryId: "" }; setBulkAddItems(c); }}
                                            options={sections.map(s => ({ value: s._id, label: s.name }))}
                                            placeholder="Section *"
                                        />
                                    </div>
                                    <div style={{ zIndex: 100 - idx }} className="w-full">
                                        <CustomSelect
                                            value={item.categoryId}
                                            onChange={(val: string) => { const c = [...bulkAddItems]; c[idx] = { ...c[idx], categoryId: val }; setBulkAddItems(c); }}
                                            options={categories.filter(c => c.sectionId === item.sectionId).map(c => ({ value: c._id, label: c.name }))}
                                            placeholder="Category *"
                                            disabled={!item.sectionId}
                                        />
                                    </div>
                                    {bulkAddItems.length > 1 ? (
                                        <button onClick={() => setBulkAddItems(bulkAddItems.filter((_, i) => i !== idx))} className="bg-red-100 text-red-500 border-none w-7 h-7 rounded-full cursor-pointer flex items-center justify-center mx-auto sm:mx-0">&times;</button>
                                    ) : <div className="hidden sm:block" />}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center p-5 border-t border-slate-200 bg-white gap-4">
                            <button type="button" onClick={() => { if (bulkAddItems.length < 20) setBulkAddItems([...bulkAddItems, { title: "", price: "", stock: "", sectionId: "", categoryId: "" }]) }}
                                disabled={bulkAddItems.length >= 20}
                                className={`px-4 py-2 bg-slate-50 text-blue-500 border border-dashed border-slate-300 rounded-md font-semibold text-sm ${bulkAddItems.length >= 20 ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-slate-100"}`}>
                                + Add another row (Max 20)
                            </button>
                            <div className="flex gap-3">
                                <button onClick={() => setBulkAddOpen(false)} className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-200 text-slate-700 border-none rounded-md font-medium text-sm cursor-pointer hover:bg-slate-300">Cancel</button>
                                <button onClick={handleBulkAdd} disabled={loading} className={`flex-1 sm:flex-none px-6 py-2.5 bg-[var(--brand-pink)] text-white border-none rounded-md font-semibold text-sm cursor-pointer ${loading ? "opacity-60" : "hover:opacity-90"}`}>{loading ? "Saving..." : "Save Products"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Edit Modal */}
            {bulkEditOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[100]" onClick={() => setBulkEditOpen(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-[560px] max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200">
                            <h3 className="text-base font-bold text-slate-800 m-0">Bulk Edit Products</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                            {bulkEditItems.map((item, idx) => (
                                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
                                    <input type="text" value={item.title} onChange={e => { const c = [...bulkEditItems]; c[idx] = { ...c[idx], title: e.target.value }; setBulkEditItems(c); }}
                                        placeholder="Title" style={inputStyle} className="w-full" />
                                    <input type="number" value={item.price} onChange={e => { const c = [...bulkEditItems]; c[idx] = { ...c[idx], price: e.target.value }; setBulkEditItems(c); }}
                                        placeholder="Price" style={inputStyle} className="w-full" />
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
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Delete Product?</h3>
                        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Are you sure you want to delete this product? This will also remove the images from Cloudinary.</p>
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
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Delete {selected.length} Products?</h3>
                        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Are you sure you want to delete the selected products? This will also remove their images from Cloudinary.</p>
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

