"use client";

import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
    const { formatPrice } = useCurrency();
    const { settings } = useStoreSettings();

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
                        <div key={item.product._id} className="flex gap-4 sm:gap-6 pb-6 border-b border-gray-100">
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
                                            onClick={() => removeFromCart(item.product._id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Category: {item.product.categoryId?.name || 'Apparel'}</p>
                                </div>

                                <div className="flex items-end justify-between mt-4">
                                    <div className="flex items-center border border-gray-200 rounded-md bg-white">
                                        <button
                                            onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                                            className="px-3 py-1 text-gray-500 hover:text-[var(--brand-pink)] hover:bg-gray-50 transition-colors"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="px-3 py-1 font-medium text-sm w-10 text-center">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                                            className="px-3 py-1 text-gray-500 hover:text-[var(--brand-pink)] hover:bg-gray-50 transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-bold text-lg text-[var(--text-primary)]">
                                            {formatPrice(item.product.price * item.quantity)}
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

                        <div className="space-y-4 mb-6 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-medium text-[var(--text-primary)]">{formatPrice(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping estimate</span>
                                <span className="text-green-600 font-medium">Free</span>
                            </div>
                            <div className="flex justify-between text-gray-600 border-b border-gray-200 pb-4">
                                <span>Tax estimate</span>
                                <span className="font-medium text-[var(--text-primary)]">Calculated at checkout</span>
                            </div>
                            <div className="flex justify-between items-end pt-2">
                                <span className="text-base font-bold text-[var(--text-primary)]">Order Total</span>
                                <span className="text-2xl font-bold text-[var(--brand-pink)]">{formatPrice(cartTotal)}</span>
                            </div>
                        </div>

                        {settings.whatsappCheckoutEnabled ? (
                            <button
                                onClick={() => {
                                    const itemsList = cart.map(item => `- ${item.quantity}x ${item.product.title} (${formatPrice(item.product.price * item.quantity)})`).join('%0A');
                                    const message = `Hello Shubhlaxmi, I would like to place an order:%0A%0A*Items:*%0A${itemsList}%0A%0A*Total Amount:* ${formatPrice(cartTotal)}%0A%0APlease let me know how to proceed with payment and shipping.`;
                                    
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
                                Secure checkout with encrypted payment processing
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
