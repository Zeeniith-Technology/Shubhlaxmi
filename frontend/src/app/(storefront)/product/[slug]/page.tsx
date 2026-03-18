"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Globe, ShieldCheck, CreditCard, Truck, MessageCircle, Minus, Plus, ChevronDown, ChevronUp } from "lucide-react";
import StorefrontCustomSelect from "../../../components/storefront/StorefrontCustomSelect";
import { useCart } from "../../../context/CartContext";
import { useCurrency } from "../../../context/CurrencyContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ProductDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { addToCart } = useCart();
    const { formatPrice } = useCurrency();
    const [product, setProduct] = useState<any>(null);
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // UI States
    const [selectedImage, setSelectedImage] = useState<string>("");
    const [quantity, setQuantity] = useState(1);
    const [openAccordion, setOpenAccordion] = useState<string | null>("details");
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [sectionName, setSectionName] = useState<string>("");

    useEffect(() => {
        const fetchProduct = async () => {
            if (!params.slug) return;
            setLoading(true);
            try {
                // Fetch main product
                const res = await fetch(`${API_BASE}/public/products`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ slug: params.slug })
                });
                const data = await res.json();

                if (data.success && data.data && data.data.length > 0) {
                    const foundProduct = data.data[0];
                    setProduct(foundProduct);
                    if (foundProduct.images && foundProduct.images.length > 0) {
                        setSelectedImage(foundProduct.images[0].url);
                    }

                    // Fetch related products from same category
                    const relatedRes = await fetch(`${API_BASE}/public/products`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ categoryId: foundProduct.categoryId })
                    });
                    const relatedData = await relatedRes.json();
                    if (relatedData.success && relatedData.data) {
                        // Exclude current product and take up to 4
                        setRelatedProducts(relatedData.data.filter((p: any) => p._id !== foundProduct._id).slice(0, 5));
                    }
                }
            } catch (err) {
                console.error("Error fetching product:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [params.slug]);

    // Fetch section name for sizing fields once product is loaded
    useEffect(() => {
        if (!product?.sectionId) return;
        fetch(`${API_BASE}/public/sections`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ _id: product.sectionId })
        })
            .then(r => r.json())
            .then(d => { if (d.success && d.data?.length > 0) setSectionName(d.data[0].name?.toLowerCase() || ""); })
            .catch(() => { });
    }, [product?.sectionId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[var(--brand-pink)] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-20">
                <h1 className="text-2xl font-bold mb-4 font-[var(--font-heading)] text-gray-800">Product Not Found</h1>
                <Link href="/" className="px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors tracking-wider uppercase text-sm">
                    Back to Home
                </Link>
            </div>
        );
    }

    const handleAddToCart = () => {
        const productToAdd = { ...product, selectedOptions };
        addToCart(productToAdd, quantity);
    };

    const handleBuyNow = () => {
        handleAddToCart();
        router.push("/checkout");
    };

    const toggleAccordion = (id: string) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };

    // Safely parse attributes if they are strangely formatted
    let parsedAttributes = product.attributes || [];
    if (typeof parsedAttributes === 'string') {
        try { parsedAttributes = JSON.parse(parsedAttributes); } catch (e) { parsedAttributes = []; }
    }

    let parsedCustomizationOptions = product.customizationOptions || [];
    if (typeof parsedCustomizationOptions === 'string') {
        try { parsedCustomizationOptions = JSON.parse(parsedCustomizationOptions); } catch (e) { parsedCustomizationOptions = []; }
    }


    const renderSizingFields = () => {
        const isMens = sectionName.includes("men") && !sectionName.includes("women");
        const isKids = sectionName.includes("kid") || sectionName.includes("child") || sectionName.includes("boy") || sectionName.includes("girl");

        const sizeOpt = (label: string, key: string, opts: string[]) => (
            <div key={key} className="flex flex-col gap-2">
                <label className="text-[11px] font-bold tracking-[0.15em] text-gray-600 uppercase font-[var(--font-body)]">{label}</label>
                <StorefrontCustomSelect
                    value={selectedOptions[key] || ""}
                    onChange={(val) => setSelectedOptions(prev => ({ ...prev, [key]: val }))}
                    options={opts.map(o => ({ label: o, value: o }))}
                    placeholder="--- Select ---"
                />
            </div>
        );

        if (isMens) return (
            <div className="space-y-5 mb-8">
                {sizeOpt("Chest Size", "Chest Size", ["36 Inch", "38 Inch", "40 Inch", "42 Inch", "44 Inch", "46 Inch", "48 Inch", "Custom Size (Our Tailor Master will contact you)"])}
                {sizeOpt("Waist Size", "Waist Size", ["28 Inch", "30 Inch", "32 Inch", "34 Inch", "36 Inch", "38 Inch", "40 Inch", "42 Inch", "Custom Size (Our Tailor Master will contact you)"])}
                {sizeOpt("Kurta Length", "Kurta Length", ["38 Inch", "40 Inch", "42 Inch", "44 Inch", "46 Inch", "Custom Size (Our Tailor Master will contact you)"])}
            </div>
        );

        if (isKids) return (
            <div className="space-y-5 mb-8">
                {sizeOpt("Age Group", "Age Group", ["1–2 Years", "3–4 Years", "5–6 Years", "7–8 Years", "9–10 Years", "11–12 Years", "13–14 Years", "Custom Size (Our Tailor Master will contact you)"])}
                {sizeOpt("Height (Approx.)", "Height", ["Up to 85 cm", "86–95 cm", "96–105 cm", "106–115 cm", "116–125 cm", "126–135 cm", "136–145 cm", "Custom Size (Our Tailor Master will contact you)"])}
                {sizeOpt("Shirt / Kurta Length", "Shirt Length", ["20 Inch", "22 Inch", "24 Inch", "26 Inch", "28 Inch", "Custom Size (Our Tailor Master will contact you)"])}
            </div>
        );

        // Default: Women / Lehenga
        return (
            <div className="space-y-5 mb-8">
                {sizeOpt("Lehenga Waist", "Lehenga Waist", ["28 Inch", "30 Inch", "32 Inch", "34 Inch", "36 Inch", "38 Inch", "40 Inch", "42 Inch", "Custom Size (Our Tailor Master will contact you)"])}
                {sizeOpt("Lehenga Length (Waist to Floor)", "Lehenga Length", ["39 Inch", "40 Inch", "41 Inch", "42 Inch", "43 Inch", "44 Inch", "Custom Size (Our Tailor Master will contact you)"])}
                {sizeOpt("Sleeves", "Sleeves", ["Sleeveless", "Capsleeves", "Halfsleeves", "Fullsleeves", "Same as Image"])}
            </div>
        );
    };
    // ─────────────────────────────────────────────────────────────────────

    return (
        <div className="bg-white min-h-screen">
            {/* Main Product Section */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-14">

                {/* Left: Image Gallery */}
                <div className="w-full lg:w-[55%] flex flex-col-reverse lg:flex-row gap-4">
                    {/* Thumbnails */}
                    <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:w-24 shrink-0 no-scrollbar pb-2 lg:pb-0">
                        {product.images && product.images.map((img: any, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedImage(img.url)}
                                className={`w-20 lg:w-full aspect-[3/4] shrink-0 rounded-sm overflow-hidden border-2 transition-all cursor-pointer ${selectedImage === img.url ? 'border-black' : 'border-transparent hover:border-gray-300'}`}
                            >
                                <img src={img.url} alt={`${product.title} view ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                    {/* Main Image */}
                    <div className="flex-1 rounded-sm overflow-hidden bg-gray-50 aspect-[3/4]">
                        {selectedImage ? (
                            <img src={selectedImage} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 font-[var(--font-body)]">No Image Available</div>
                        )}
                    </div>
                </div>

                {/* Right: Product Details */}
                <div className="w-full lg:w-[45%] flex flex-col pt-2 lg:pt-0">
                    <h1 className="text-2xl sm:text-3xl lg:text-[40px] font-medium text-gray-900 mb-6 leading-[1.2] font-serif">
                        {product.title}
                    </h1>

                    <div className="mb-8">
                        <div className="flex items-center gap-3">
                            <span className="text-xl sm:text-2xl text-gray-900 font-[var(--font-body)] font-medium">
                                {formatPrice(product.price)}
                            </span>
                            {product.compareAtPrice && product.compareAtPrice > product.price && (
                                <span className="text-base text-gray-400 line-through font-[var(--font-body)]">
                                    {formatPrice(product.compareAtPrice)}
                                </span>
                            )}
                        </div>
                        <p className="text-[13px] text-gray-600 mt-2 font-[var(--font-body)]">(Inclusive of all Taxes)</p>
                    </div>

                    {/* Dynamic Variant / Customization Selectors purely from backend data */}
                    {parsedCustomizationOptions && parsedCustomizationOptions.length > 0 && (
                        <div className="space-y-5 mb-8">
                            {parsedCustomizationOptions.map((opt: any, idx: number) => (
                                <div key={idx} className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold tracking-[0.15em] text-gray-600 uppercase font-[var(--font-body)]">{opt.title}</label>
                                    {opt.type === 'select' && opt.options && (
                                        <StorefrontCustomSelect
                                            value={selectedOptions[opt.title] || ""}
                                            onChange={(val) => setSelectedOptions({ ...selectedOptions, [opt.title]: val })}
                                            options={(opt.options || []).map((o: any) => ({ label: o.label, value: o.value || o.label }))}
                                            placeholder="--- Select ---"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Size / Customization Fields (section-aware) */}
                    {renderSizingFields()}
                    {/* Trust Badges */}
                    <div className="space-y-4 mb-8 text-[13px] text-[#001000] font-medium font-[var(--font-body)]">
                        <div className="flex items-center gap-3"><Globe size={18} strokeWidth={1.5} className="text-gray-600" /> <span>Shipping Worldwide</span></div>
                        <div className="flex items-center gap-3"><ShieldCheck size={18} strokeWidth={1.5} className="text-gray-600" /> <span>Assured Quality</span></div>
                        <div className="flex items-center gap-3"><CreditCard size={18} strokeWidth={1.5} className="text-gray-600" /> <span>100% Payment Protection</span></div>
                        <div className="flex items-center gap-3"><Truck size={18} strokeWidth={1.5} className="text-gray-600" /> <span>Free Delivery</span></div>
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? "bg-[#34A853]" : "bg-red-500"}`}></div>
                            <span className="text-gray-600">{product.stock > 0 ? "In stock, ready to ship" : "Out of stock"}</span>
                        </div>
                    </div>

                    {/* Actions: Quantity + Add to Cart */}
                    <div className="mb-10">
                        <p className="text-[11px] font-bold tracking-[0.15em] text-gray-600 uppercase font-[var(--font-body)] mb-3">QUANTITY</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center border border-gray-300 w-fit h-12">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="px-4 h-full text-gray-500 hover:bg-gray-50 flex items-center justify-center transition-colors"
                                >
                                    <Minus size={14} />
                                </button>
                                <span className="w-8 text-center text-sm font-medium font-[var(--font-body)]">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="px-4 h-full text-gray-500 hover:bg-gray-50 flex items-center justify-center transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3">
                            {/* Wait, the mockup has Size Chart in the UI? Let's add a dummy line for Size Chart just above add to cart if needed, but keeping it simple for now */}
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock <= 0}
                                className="w-full py-[18px] border border-black text-black font-semibold tracking-[0.2em] uppercase text-xs hover:bg-black hover:text-white transition-all disabled:opacity-50"
                            >
                                Add to Cart
                            </button>
                            <button
                                onClick={handleBuyNow}
                                disabled={product.stock <= 0}
                                className="w-full py-[18px] bg-[var(--brand-pink)] text-white font-semibold tracking-[0.2em] uppercase text-xs hover:bg-[#d61b7f] transition-all disabled:opacity-50"
                            >
                                Buy It Now
                            </button>
                            <div className="flex flex-col items-center mt-6">
                                <div className="flex items-center gap-5">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg" className="h-[18px] object-contain" alt="Mastercard" />
                                    <img src="https://cdn-icons-png.flaticon.com/512/196/196578.png" className="h-[18px] object-contain" alt="Visa" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-[18px] object-contain" alt="Stripe" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Accordions - Bordered Box Style */}
                    <div className="mt-12 font-[var(--font-body)] space-y-0">

                        {/* Description Accordion */}
                        {product.description && (
                            <div className="border border-b-0 border-gray-300 rounded-md overflow-hidden">
                                <button
                                    onClick={() => toggleAccordion('description')}
                                    className="w-full py-4 px-6 flex items-center justify-center gap-4 text-center focus:outline-none hover:bg-gray-50 transition-colors"
                                >
                                    <span className="text-[12px] font-bold tracking-[0.25em] uppercase text-[#0f172a]">Description</span>
                                    <ChevronDown size={16} className={`text-gray-500 transition-transform duration-300 ${openAccordion === 'description' ? 'rotate-180' : ''}`} />
                                </button>
                                <div
                                    className={`grid transition-all duration-300 ease-in-out ${openAccordion === 'description' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="px-6 pb-6 text-sm text-gray-600 leading-[1.8] max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Product Details Accordion */}
                        {parsedAttributes && parsedAttributes.length > 0 && (
                            <div className="border border-b-0 border-gray-300 rounded-md overflow-hidden">
                                <button
                                    onClick={() => toggleAccordion('details')}
                                    className="w-full py-4 px-6 flex items-center justify-center gap-4 text-center focus:outline-none hover:bg-gray-50 transition-colors"
                                >
                                    <span className="text-[12px] font-bold tracking-[0.25em] uppercase text-[#0f172a]">Product Details</span>
                                    <ChevronDown size={16} className={`text-gray-500 transition-transform duration-300 ${openAccordion === 'details' ? 'rotate-180' : ''}`} />
                                </button>
                                <div
                                    className={`grid transition-all duration-300 ease-in-out ${openAccordion === 'details' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="px-6 pb-6 text-sm text-black leading-[1.8]">
                                            <ul className="space-y-1">
                                                {parsedAttributes.map((attr: any, i: number) => (
                                                    <li key={i} className="flex">
                                                        <span className="font-semibold text-gray-900">• {attr.key}:</span>
                                                        <span className="ml-1 text-gray-700">{attr.value}</span>
                                                    </li>
                                                ))}
                                                <li className="flex">
                                                    <span className="font-semibold text-gray-900">• Care Instructions:</span>
                                                    <span className="ml-1 text-gray-700">Dry Clean Only</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Additional Information Accordion */}
                        <div className="border border-b-0 border-gray-300 rounded-md overflow-hidden">
                            <button
                                onClick={() => toggleAccordion('additional')}
                                className="w-full py-4 px-6 flex items-center justify-center gap-4 text-center focus:outline-none hover:bg-gray-50 transition-colors"
                            >
                                <span className="text-[12px] font-bold tracking-[0.25em] uppercase text-[#0f172a]">Additional Information</span>
                                <ChevronDown size={16} className={`text-gray-500 transition-transform duration-300 ${openAccordion === 'additional' ? 'rotate-180' : ''}`} />
                            </button>
                            <div
                                className={`grid transition-all duration-300 ease-in-out ${openAccordion === 'additional' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                            >
                                <div className="overflow-hidden">
                                    <div className="px-6 pb-6 text-[13px] text-gray-600 leading-[1.8] space-y-3">
                                        <p>• Slight Color Variation is Possible Due to Digital Photography.</p>
                                        <p>• Being cited as the Most Trusted Brand Our Customers Too Believe We Deliver the Same Styles as Promised on the Website.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping & Returns Accordion */}
                        <div className="border border-b-0 border-gray-300 rounded-md overflow-hidden">
                            <button
                                onClick={() => toggleAccordion('shipping')}
                                className="w-full py-4 px-6 flex items-center justify-center gap-4 text-center focus:outline-none hover:bg-gray-50 transition-colors"
                            >
                                <span className="text-[12px] font-bold tracking-[0.25em] uppercase text-[#0f172a]">Shipping & Returns</span>
                                <ChevronDown size={16} className={`text-gray-500 transition-transform duration-300 ${openAccordion === 'shipping' ? 'rotate-180' : ''}`} />
                            </button>
                            <div
                                className={`grid transition-all duration-300 ease-in-out ${openAccordion === 'shipping' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                            >
                                <div className="overflow-hidden">
                                    <div className="px-6 pb-6 text-[13px] text-gray-600 leading-[1.8] space-y-3">
                                        <p>• We ship worldwide via trusted courier partners.</p>
                                        <p>• Standard delivery takes 7-14 business days depending on your location.</p>
                                        <p>• Express shipping options are available at checkout.</p>
                                        <p>• Returns are accepted within 7 days of delivery for unused and unaltered items.</p>
                                        <p>• Please contact our support team for return assistance.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Book a Video Call Accordion */}
                        <div className="border border-gray-300 rounded-md overflow-hidden">
                            <button
                                onClick={() => toggleAccordion('videocall')}
                                className="w-full py-4 px-6 flex items-center justify-center gap-4 text-center focus:outline-none hover:bg-gray-50 transition-colors"
                            >
                                <span className="text-[12px] font-bold tracking-[0.25em] uppercase text-[#0f172a]">Book a Video Call</span>
                                <ChevronDown size={16} className={`text-gray-500 transition-transform duration-300 ${openAccordion === 'videocall' ? 'rotate-180' : ''}`} />
                            </button>
                            <div
                                className={`grid transition-all duration-300 ease-in-out ${openAccordion === 'videocall' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                            >
                                <div className="overflow-hidden">
                                    <div className="px-6 pb-6 text-[13px] text-gray-600 leading-[1.8] space-y-3">
                                        <p>• Want to see the product live before purchasing? Book a personal video call with our team.</p>
                                        <p>• Our expert stylists will walk you through the fabric, embroidery, and fit details.</p>
                                        <p>• Available Monday to Saturday, 10 AM - 7 PM IST.</p>
                                        <p>• Contact us via WhatsApp or email to schedule your call.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Related Products Section - Always visible */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                <h2 className="text-2xl lg:text-3xl font-[var(--font-heading)] text-center mb-12 text-gray-900 font-medium">You may also like</h2>
                {relatedProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                        {relatedProducts.map((p: any) => (
                            <Link href={`/product/${p.slug}`} key={p._id} className="group flex flex-col cursor-pointer">
                                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-sm mb-4">
                                    <img
                                        src={p.images?.[0]?.url || 'https://placehold.co/400x500/f3f4f6/a1a1aa?text=No+Image'}
                                        alt={p.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    {p.compareAtPrice > p.price && (
                                        <span className="absolute top-3 left-3 bg-[var(--brand-pink)] text-white text-[10px] sm:text-xs font-bold px-2 py-1 uppercase tracking-widest shadow-sm">
                                            Sale
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-[12px] sm:text-[13px] text-gray-800 text-center font-[var(--font-body)] hover:text-[#ea2083] transition-colors leading-[1.5] px-1 mb-2">
                                    {p.title}
                                </h3>
                                <div className="mt-auto text-center flex flex-wrap items-center justify-center gap-2">
                                    <span className="font-medium text-[13px] sm:text-[14px] font-[var(--font-body)] text-gray-900">
                                        {formatPrice(p.price)}
                                    </span>
                                    {p.compareAtPrice > p.price && (
                                        <span className="text-gray-400 text-[12px] line-through font-[var(--font-body)]">
                                            {formatPrice(p.compareAtPrice)}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-400 text-sm font-[var(--font-body)]">No suggestions available for this product.</p>
                )}
            </div>

        </div>
    );
}
