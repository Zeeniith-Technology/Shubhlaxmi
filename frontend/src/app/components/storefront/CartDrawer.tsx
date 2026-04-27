"use client";

import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import Link from "next/link";
import { Trash2, Plus, Minus, X, ShoppingBag } from "lucide-react";
import { useEffect } from "react";

export default function CartDrawer() {
    const { cart, removeFromCart, updateQuantity, cartTotal, isCartOpen, setIsCartOpen } = useCart();
    const { formatPrice } = useCurrency();
    const { settings } = useStoreSettings();

    // Prevent body scroll when cart is open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isCartOpen]);

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => setIsCartOpen(false)}
            />

            {/* Slide-out Panel */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-[var(--font-heading)] tracking-wide flex items-center gap-2">
                        <ShoppingBag size={20} className="text-[var(--brand-pink)]" />
                        Shopping Cart
                    </h2>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 text-gray-400 hover:text-[var(--brand-pink)] hover:bg-pink-50 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
                            <span className="text-6xl mb-4">🛍️</span>
                            <p className="text-gray-500 font-medium">Your cart is currently empty.</p>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="mt-6 text-[var(--brand-pink)] font-semibold hover:underline"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.product._id} className="flex gap-4 border-b border-gray-50 pb-6 group">
                                <div className="w-20 h-28 bg-gray-50 rounded-md overflow-hidden flex-shrink-0">
                                    <img
                                        src={item.product.images?.[0]?.url || "https://placehold.co/150x200/f8ecef/ec268f?text=Product"}
                                        alt={item.product.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <div className="flex justify-between items-start gap-2">
                                        <Link
                                            href={`/product/${item.product._id}`}
                                            onClick={() => setIsCartOpen(false)}
                                            className="font-medium text-sm text-[var(--text-primary)] line-clamp-2 hover:text-[var(--brand-pink)] transition-colors"
                                        >
                                            {item.product.title}
                                        </Link>
                                        <button
                                            onClick={() => removeFromCart(item.product._id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="mt-auto flex items-end justify-between">
                                        <div className="flex items-center border border-gray-200 rounded">
                                            <button
                                                onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                                                className="px-2 py-1 text-gray-500 hover:text-[var(--brand-pink)] transition-colors"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="px-2 py-1 text-xs font-medium w-8 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                                                className="px-2 py-1 text-gray-500 hover:text-[var(--brand-pink)] transition-colors"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>

                                        <p className="font-semibold text-[var(--brand-pink)]">
                                            {formatPrice(item.product.price * item.quantity)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Checkout */}
                {cart.length > 0 && (
                    <div className="p-6 bg-gray-50 border-t border-gray-100">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-xl font-bold text-[var(--text-primary)]">
                                {formatPrice(cartTotal)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-6 text-center">
                            Shipping & taxes calculated at checkout
                        </p>

                        <div className="space-y-3">
                            <Link
                                href="/cart"
                                onClick={() => setIsCartOpen(false)}
                                className="w-full py-3 border border-[var(--brand-pink)] text-[var(--brand-pink)] rounded text-sm font-semibold tracking-wide flex justify-center hover:bg-pink-50 transition-colors"
                            >
                                View Full Cart
                            </Link>
                            
                            {settings.whatsappCheckoutEnabled ? (
                                <button
                                    onClick={() => {
                                        setIsCartOpen(false);
                                        
                                        const itemsList = cart.map(item => `- ${item.quantity}x ${item.product.title} (${formatPrice(item.product.price * item.quantity)})`).join('%0A');
                                        const message = `Hello Shubhlaxmi, I would like to place an order:%0A%0A*Items:*%0A${itemsList}%0A%0A*Total Amount:* ${formatPrice(cartTotal)}%0A%0APlease let me know how to proceed with payment and shipping.`;
                                        
                                        const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
                                        window.open(whatsappUrl, '_blank');
                                    }}
                                    className="w-full py-3 bg-[#25D366] text-white rounded text-sm font-semibold tracking-wider uppercase flex justify-center hover:bg-[#128C7E] transition-colors shadow-md items-center gap-2"
                                >
                                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                    Order via WhatsApp
                                </button>
                            ) : (
                                <Link
                                    href="/checkout"
                                    onClick={() => setIsCartOpen(false)}
                                    className="w-full py-3 bg-[var(--brand-pink)] text-white rounded text-sm font-semibold tracking-wider uppercase flex justify-center hover:bg-[var(--brand-pink-hover)] transition-colors shadow-md"
                                >
                                    Checkout
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
