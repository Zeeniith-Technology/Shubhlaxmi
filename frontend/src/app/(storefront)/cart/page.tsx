"use client";

import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import API_BASE from "../../../lib/api";

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
    const { formatPrice } = useCurrency();
    const { settings } = useStoreSettings();

    // Coupon (works in WhatsApp mode too — validated server-side, folded into the message)
    const [couponInput, setCouponInput] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<{ couponCode: string; discountAmount: number; totalAmount: number } | null>(null);
    const [couponError, setCouponError] = useState("");
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    const cartItemsPayload = () => cart.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
        selectedOptions: item.product.selectedOptions || {}
    }));

    const handleApplyCoupon = async () => {
        const code = couponInput.trim().toUpperCase();
        if (!code) return;
        setApplyingCoupon(true);
        setCouponError("");
        try {
            const res = await fetch(`${API_BASE}/public/coupon/preview`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ couponCode: code, items: cartItemsPayload() })
            });
            const data = await res.json();
            if (data.success) {
                setAppliedCoupon(data.data);
            } else {
                setAppliedCoupon(null);
                setCouponError(data.message || "Invalid coupon code");
            }
        } catch {
            setCouponError("Network error. Please try again.");
        } finally {
            setApplyingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput("");
        setCouponError("");
    };

    const displayTotal = appliedCoupon ? appliedCoupon.totalAmount : cartTotal;

    if (cart.length === 0) {
        return (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🛍️</span>
                </div>
                <h1 className="text-3xl font-[var(--font-heading)] mb-4">Your Cart is Empty</h1>
                <p className="text-[var(--text-muted)] mb-8 max-w-md mx-auto">
                    Looks like you haven't added anything to your cart yet. Discover our latest collections.
                </p>
                <Link
                    href="/collections/all"
                    className="inline-block px-8 py-3 bg-[var(--brand-pink)] text-white rounded-md text-sm font-semibold tracking-wider uppercase hover:bg-[var(--brand-pink-hover)] transition-colors"
                >
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <h1 className="text-2xl sm:text-3xl font-[var(--font-heading)] mb-8 tracking-wide">
                Your Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
            </h1>

            <div className="flex flex-col lg:flex-row gap-10">
                {/* Cart Items */}
                <div className="flex-1 space-y-6">
                    {cart.map((item) => (
                        <div key={item.lineId} className="flex gap-4 sm:gap-6 pb-6 border-b border-gray-100">
                            <div className="w-24 h-32 sm:w-32 sm:h-40 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden">
                                <img
                                    src={item.product.images?.[0]?.url || "https://placehold.co/300x400/f8ecef/ec268f?text=Shopping"}
                                    alt={item.product.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start gap-4">
                                        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2">
                                            {item.product.title}
                                        </h3>
                                        <button
                                            onClick={() => removeFromCart(item.lineId)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Category: {item.product.categoryId?.name || 'Apparel'}</p>
                                    {item.product.selectedOptions && Object.keys(item.product.selectedOptions).length > 0 && (
                                        <div className="mt-1 space-y-0.5">
                                            {Object.entries(item.product.selectedOptions).map(([key, value]) => (
                                                <p key={key} className="text-xs text-gray-500">{key}: <span className="text-gray-700">{String(value)}</span></p>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-end justify-between mt-4">
                                    <div className="flex items-center border border-gray-200 rounded-md bg-white">
                                        <button
                                            onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                                            className="px-3 py-1 text-gray-500 hover:text-[var(--brand-pink)] hover:bg-gray-50 transition-colors"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="px-3 py-1 font-medium text-sm w-10 text-center">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                                            className="px-3 py-1 text-gray-500 hover:text-[var(--brand-pink)] hover:bg-gray-50 transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-bold text-lg text-[var(--text-primary)]">
                                            {formatPrice(item.unitPrice * item.quantity)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="w-full lg:w-[400px]">
                    <div className="bg-gray-50 rounded-xl p-6 sm:p-8 sticky top-28">
                        <h2 className="text-lg font-[var(--font-heading)] font-bold mb-6">Order Summary</h2>

                        {/* Coupon Code */}
                        <div className="mb-5">
                            {appliedCoupon ? (
                                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2.5">
                                    <div className="text-sm">
                                        <span className="font-bold text-green-700">{appliedCoupon.couponCode}</span>
                                        <span className="text-green-600 ml-2">−{formatPrice(appliedCoupon.discountAmount)}</span>
                                    </div>
                                    <button onClick={removeCoupon} className="text-xs text-red-500 hover:text-red-700 font-semibold uppercase">Remove</button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponInput}
                                            onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                                            placeholder="Coupon code"
                                            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md text-sm uppercase tracking-wider bg-white focus:ring-2 focus:ring-[var(--brand-pink)] outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleApplyCoupon}
                                            disabled={applyingCoupon || !couponInput.trim()}
                                            className="px-4 py-2.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                                        >
                                            {applyingCoupon ? "..." : "Apply"}
                                        </button>
                                    </div>
                                    {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
                                </>
                            )}
                        </div>

                        <div className="space-y-4 mb-6 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-medium text-[var(--text-primary)]">{formatPrice(cartTotal)}</span>
                            </div>
                            {appliedCoupon && (
                                <div className="flex justify-between text-green-600">
                                    <span>Coupon ({appliedCoupon.couponCode})</span>
                                    <span>−{formatPrice(appliedCoupon.discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping estimate</span>
                                <span className="text-green-600 font-medium">Free</span>
                            </div>
                            <div className="flex justify-between text-gray-600 border-b border-gray-200 pb-4">
                                <span>Tax estimate</span>
                                <span className="font-medium text-[var(--text-primary)]">Inclusive</span>
                            </div>
                            <div className="flex justify-between items-end pt-2">
                                <span className="text-base font-bold text-[var(--text-primary)]">Order Total</span>
                                <span className="text-2xl font-bold text-[var(--brand-pink)]">{formatPrice(displayTotal)}</span>
                            </div>
                        </div>

                        {settings.whatsappCheckoutEnabled ? (
                            <button
                                onClick={() => {
                                    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://shubhlaxmi.com';
                                    const itemsList = cart.map(item => {
                                        const opts = item.product.selectedOptions || {};
                                        const optsText = Object.keys(opts).length > 0
                                            ? ` [${Object.entries(opts).map(([k, v]) => `${k}: ${v}`).join(', ')}]`
                                            : '';
                                        return `- ${item.quantity}x ${item.product.title}${optsText} (${formatPrice(item.unitPrice * item.quantity)})`;
                                    }).join('%0A');
                                    const couponLine = appliedCoupon
                                        ? `%0A*Coupon (${appliedCoupon.couponCode}):* -${formatPrice(appliedCoupon.discountAmount)}`
                                        : '';
                                    const message = `Hello Shubhlaxmi, I would like to place an order:%0A%0A*Items:*%0A${itemsList}${couponLine}%0A%0A*Total Amount:* ${formatPrice(displayTotal)}%0A%0ACheckout Link: ${siteUrl}/cart%0A%0APlease let me know how to proceed with payment and shipping.`;

                                    const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
                                    window.open(whatsappUrl, '_blank');
                                }}
                                className="w-full py-4 bg-[#25D366] text-white rounded-md text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-[#128C7E] transition-all shadow-md hover:shadow-lg"
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                Order via WhatsApp
                            </button>
                        ) : (
                            <Link
                                href="/checkout"
                                className="w-full py-4 bg-[var(--brand-pink)] text-white rounded-md text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-[var(--brand-pink-hover)] transition-all shadow-md hover:shadow-lg"
                            >
                                Proceed to Checkout <ArrowRight size={18} />
                            </Link>
                        )}

                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                <span className="inline-block w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center">✓</span>
                                {settings.whatsappCheckoutEnabled
                                    ? "Order & pay securely over WhatsApp with our team"
                                    : "Secure checkout with encrypted payment processing"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
