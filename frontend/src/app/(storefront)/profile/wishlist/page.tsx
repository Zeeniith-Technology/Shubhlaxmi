"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWishlist } from "../../../context/WishlistContext";
import { useCurrency } from "../../../context/CurrencyContext";
import { useCart } from "../../../context/CartContext";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";

export default function WishlistPage() {
    const router = useRouter();
    const { wishlistProducts, wishlistIds, toggleWishlist, isLoading } = useWishlist();
    const { formatPrice } = useCurrency();
    const { addToCart } = useCart();

    useEffect(() => {
        const token = localStorage.getItem("customer_token");
        if (!token) {
            router.push("/login?redirect=/profile/wishlist");
        }
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-[var(--brand-pink)] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <h1 className="text-2xl sm:text-3xl font-[var(--font-heading)] mb-8 tracking-wide">My Wishlist</h1>

            {wishlistProducts.length === 0 ? (
                <div className="bg-white p-12 text-center border border-gray-100 rounded-xl shadow-sm">
                    <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart size={32} className="text-[var(--brand-pink)] stroke-[1.5px]" />
                    </div>
                    <h2 className="text-xl font-semibold font-[var(--font-heading)] text-gray-800 mb-2">Your wishlist is empty</h2>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto font-[var(--font-body)]">
                        Explore our collections and tap the heart icon to save your favorite items for later.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-8 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors tracking-wide uppercase text-sm"
                    >
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 lg:gap-x-8">
                    {wishlistProducts.map((product: any) => {
                        const mainImage = product.images?.[0]?.url || 'https://placehold.co/400x530/f3f4f6/a1a1aa?text=No+Image';
                        return (
                            <div key={product._id} className="group flex flex-col relative">
                                {/* Remove Button */}
                                <button
                                    onClick={() => toggleWishlist(product._id)}
                                    className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                                    title="Remove from wishlist"
                                >
                                    <Trash2 size={15} />
                                </button>

                                {/* Product Image */}
                                <Link href={`/product/${product.slug}`} className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-4 block">
                                    <img
                                        src={mainImage}
                                        alt={product.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    {!product.isActive && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                            <span className="bg-black text-white text-xs font-bold px-3 py-1.5 uppercase tracking-widest">
                                                Currently Unavailable
                                            </span>
                                        </div>
                                    )}
                                    {product.isActive && product.stock <= 0 && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                            <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 uppercase tracking-widest">
                                                Out of Stock
                                            </span>
                                        </div>
                                    )}
                                </Link>

                                {/* Product Details */}
                                <Link href={`/product/${product.slug}`}>
                                    <h3 className="text-[13px] text-gray-800 font-[var(--font-body)] group-hover:text-[#ea2083] transition-colors leading-[1.6] mb-1 line-clamp-2">
                                        {product.title}
                                    </h3>
                                </Link>

                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-[14px] font-[var(--font-body)] text-gray-900">
                                            {formatPrice(product.price)}
                                        </span>
                                    </div>
                                    
                                    {/* Action purely to add to cart quickly if active and in stock */}
                                    {product.isActive && product.stock > 0 && (
                                        <button
                                            onClick={() => addToCart(product, 1)}
                                            className="text-[var(--brand-pink)] hover:bg-pink-50 p-2 rounded-full transition-colors"
                                            title="Add to Cart"
                                        >
                                            <ShoppingBag size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
