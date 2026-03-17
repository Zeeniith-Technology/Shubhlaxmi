"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";
import { CreditCard, CheckCircle2, ShieldCheck } from "lucide-react";

const API_BASE = "http://localhost:5000/api";

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, cartTotal, clearCart } = useCart();
    const { formatPrice } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);

    // Form State
    const [address, setAddress] = useState({
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "India"
    });

    useEffect(() => {
        // Must be logged in
        const token = localStorage.getItem("customer_token");
        if (!token) {
            router.push("/login");
            return;
        }

        // Must have items in cart unless order just completed
        if (cart.length === 0 && !orderComplete) {
            router.push("/cart");
            return;
        }

        // Pre-fill address if available
        const userDataStr = localStorage.getItem("customer_data");
        if (userDataStr) {
            try {
                const user = JSON.parse(userDataStr);
                if (user.addresses && user.addresses.length > 0) {
                    const defaultAddr = user.addresses.find((a: any) => a.isDefault) || user.addresses[0];
                    setAddress({
                        street: defaultAddr.street || "",
                        city: defaultAddr.city || "",
                        state: defaultAddr.state || "",
                        zipCode: defaultAddr.zipCode || "",
                        country: defaultAddr.country || "India"
                    });
                }
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }

        setLoading(false);
    }, [cart.length, orderComplete, router]);

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const token = localStorage.getItem("customer_token");

        try {
            // 1. Prepare Cart Data
            const orderPayload = {
                items: cart.map(item => ({
                    productId: item.product._id,
                    quantity: item.quantity,
                    price: item.product.price
                })),
                totalAmount: cartTotal,
                shippingAddress: address,
                currency: "INR" 
            };

            // 2. Call backend to create Razorpay Order
            const res = await fetch(`${API_BASE}/customer/order/create-razorpay-order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(orderPayload)
            });

            const data = await res.json();

            if (!data.success) {
                alert("Failed to initiate payment: " + data.message);
                setSubmitting(false);
                return;
            }

            const { orderId, razorpayOrderId, amount, currency, keyId } = data.data;

            // 3. Initialize Razorpay Checkout
            const options = {
                key: keyId, 
                amount: amount, 
                currency: currency,
                name: "Shubhlaxmi",
                description: "Purchase from Shubhlaxmi Store",
                image: "/logo.png", // Recommended: add a logo to your public folder
                order_id: razorpayOrderId, 
                handler: async function (response: any) {
                    // 4. Payment Success Callback - Verify Signature on Backend
                    try {
                        const verifyRes = await fetch(`${API_BASE}/customer/order/verify-payment`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                orderId: orderId
                            })
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyData.success) {
                            clearCart();
                            setOrderComplete(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                            alert("Payment verification failed! Please contact support if amount was deducted.");
                        }
                    } catch (err) {
                        alert("Network error verifying payment. Please check your orders page.");
                    }
                },
                prefill: {
                    name: "", // You could pull from user profile
                    email: "",
                    contact: ""
                },
                theme: {
                    color: "#ec268f" // Brand Pink
                },
                modal: {
                    ondismiss: function() {
                        // User closed the popup
                        setSubmitting(false);
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response: any) {
                alert(`Payment failed! Reason: ${response.error.description}`);
            });
            
            razorpay.open();

        } catch (error) {
            alert("Network error. Please try again.");
            console.error(error);
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (orderComplete) {
        return (
            <div className="max-w-[1400px] mx-auto px-4 py-20 text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} className="text-green-600" />
                </div>
                <h1 className="text-3xl font-[var(--font-heading)] mb-4 text-green-700">Order Confirmed!</h1>
                <p className="text-[var(--text-muted)] mb-8 max-w-md mx-auto text-lg">
                    Thank you for shopping with Shubhlaxmi. We have received your order and are currently processing it.
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => router.push("/profile")}
                        className="px-8 py-3 bg-[var(--brand-pink)] text-white font-semibold rounded hover:bg-[var(--brand-pink-hover)] transition-colors"
                    >
                        View Orders
                    </button>
                    <button
                        onClick={() => router.push("/")}
                        className="px-8 py-3 border border-[var(--brand-pink)] text-[var(--brand-pink)] font-semibold rounded hover:bg-pink-50 transition-colors"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <h1 className="text-2xl sm:text-3xl font-[var(--font-heading)] mb-8 tracking-wide">Checkout</h1>

            <div className="flex flex-col lg:flex-row gap-10">
                {/* Checkout Form */}
                <div className="flex-1">
                    <form onSubmit={handlePlaceOrder} className="space-y-8">
                        {/* Shipping Address */}
                        <div className="bg-white p-6 sm:p-8 border border-gray-100 rounded-xl shadow-sm">
                            <h2 className="text-xl font-[var(--font-heading)] font-semibold mb-6 flex items-center gap-2">
                                <span className="bg-[var(--brand-pink)] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                Shipping Address
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                                    <input
                                        type="text" required
                                        value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--brand-pink)] outline-none"
                                        placeholder="123 Shopping Street"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <input
                                            type="text" required
                                            value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--brand-pink)] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                        <input
                                            type="text" required
                                            value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--brand-pink)] outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">PIN / Zip Code</label>
                                        <input
                                            type="text" required
                                            value={address.zipCode} onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--brand-pink)] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                        <input
                                            type="text" required
                                            value={address.country} readOnly
                                            className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white p-6 sm:p-8 border border-gray-100 rounded-xl shadow-sm">
                            <h2 className="text-xl font-[var(--font-heading)] font-semibold mb-6 flex items-center gap-2">
                                <span className="bg-[var(--brand-pink)] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                Secure Payment
                            </h2>

                            <div className="border-2 border-[var(--brand-pink)] bg-pink-50 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 text-[var(--brand-pink)] opacity-10">
                                    <ShieldCheck size={100} />
                                </div>
                                
                                <input type="radio" checked readOnly className="w-5 h-5 text-[var(--brand-pink)] mt-1 sm:mt-0 z-10" />
                                <div className="flex-1 z-10">
                                    <h3 className="font-semibold text-pink-900 text-lg">Razorpay Secure Checkout</h3>
                                    <p className="text-sm text-pink-800/80 mt-1">Pay easily using UPI, Credit/Debit Cards, NetBanking, or Wallets.</p>
                                    
                                    <div className="flex items-center gap-2 mt-4">
                                        <span className="bg-white border text-[10px] font-bold px-2 py-1 rounded text-gray-500 uppercase">UPI</span>
                                        <span className="bg-white border text-[10px] font-bold px-2 py-1 rounded text-gray-500 uppercase">Cards</span>
                                        <span className="bg-white border text-[10px] font-bold px-2 py-1 rounded text-gray-500 uppercase">NetBanking</span>
                                        <span className="bg-white border text-[10px] font-bold px-2 py-1 rounded text-gray-500 uppercase">Wallets</span>
                                        <span className="bg-white border text-[10px] font-bold px-2 py-1 rounded text-gray-500 uppercase">Intl</span>
                                    </div>
                                </div>
                                <div className="hidden sm:block opacity-50 z-10">
                                    <CreditCard size={32} />
                                </div>
                            </div>
                        </div>

                        {/* Mobile Submit Button */}
                        <div className="lg:hidden">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-[var(--brand-pink)] text-white rounded-md text-lg font-bold tracking-widest uppercase disabled:opacity-70"
                            >
                                {submitting ? "Placing Order..." : `Place Order (${formatPrice(cartTotal)})`}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Vertical Order Summary Sidebar */}
                <div className="w-full lg:w-[400px]">
                    <div className="bg-gray-50 rounded-xl p-6 sm:p-8 sticky top-28 border border-gray-100">
                        <h2 className="text-lg font-[var(--font-heading)] font-bold mb-6 border-b border-gray-200 pb-4">Order Review</h2>

                        <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                            {cart.map((item) => (
                                <div key={item.product._id} className="flex gap-4">
                                    <div className="w-16 h-20 bg-white rounded border border-gray-100 overflow-hidden flex-shrink-0">
                                        <img src={item.product.images?.[0]?.url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 text-sm">
                                        <p className="font-semibold text-gray-800 line-clamp-2">{item.product.title}</p>
                                        <p className="text-gray-500 mt-1">Qty: {item.quantity}</p>
                                        <p className="font-semibold text-[var(--brand-pink)] mt-1">{formatPrice(item.product.price * item.quantity)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 mb-6 text-sm border-t border-gray-200 pt-4">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatPrice(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping</span>
                                <span className="text-green-600">Free</span>
                            </div>
                            <div className="flex justify-between items-end pt-3 border-t border-gray-200 border-dashed">
                                <span className="text-base font-bold text-gray-800">Total</span>
                                <span className="text-2xl font-bold text-[var(--brand-pink)]">{formatPrice(cartTotal)}</span>
                            </div>
                        </div>

                        {/* Desktop Submit Button */}
                        <div className="hidden lg:block">
                            <button
                                onClick={(e) => handlePlaceOrder(e as any)}
                                disabled={submitting}
                                className="w-full py-4 bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink-hover)] rounded-md text-sm font-bold tracking-widest uppercase transition-colors shadow-md disabled:opacity-70"
                            >
                                {submitting ? "Placing Order..." : "Place Order"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
