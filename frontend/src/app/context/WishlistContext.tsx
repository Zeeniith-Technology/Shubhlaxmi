"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type WishlistContextType = {
    wishlistIds: string[];
    wishlistProducts: any[];
    toggleWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    isLoading: boolean;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [wishlistIds, setWishlistIds] = useState<string[]>([]);
    const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch wishlist on mount if logged in
    useEffect(() => {
        const fetchWishlist = async () => {
            const token = localStorage.getItem("customer_token");
            if (!token) {
                // If not logged in, we could load from local storage if we wanted an anonymous wishlist
                const localWishlist = localStorage.getItem("local_wishlist");
                if (localWishlist) {
                    try {
                        setWishlistIds(JSON.parse(localWishlist));
                    } catch (e) {
                        console.error("Local wishlist parse error");
                    }
                }
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/customer/wishlist/get`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({})
                });
                const data = await res.json();
                if (data.success && data.wishlist) {
                    setWishlistProducts(data.wishlist);
                    setWishlistIds(data.wishlist.map((p: any) => p._id));
                }
            } catch (error) {
                console.error("Failed to fetch wishlist", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWishlist();
    }, []);

    const toggleWishlist = async (productId: string) => {
        const token = localStorage.getItem("customer_token");
        
        // Optimistic UI Update completely handles "isInWishlist" checks instantly
        const isCurrentlyInWishlist = wishlistIds.includes(productId);
        const newWishlistIds = isCurrentlyInWishlist 
            ? wishlistIds.filter(id => id !== productId)
            : [...wishlistIds, productId];
        
        setWishlistIds(newWishlistIds);

        // If not logged in, persist to local storage securely
        if (!token) {
            localStorage.setItem("local_wishlist", JSON.stringify(newWishlistIds));
            // We can't fetch full products without hitting a public API for batch fetching,
            // so we skip updating wishlistProducts for unauth guests for now.
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/customer/wishlist/toggle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ productId })
            });
            const data = await res.json();
            
            if (data.success) {
                // Background sync full wishlist products
                const syncRes = await fetch(`${API_BASE}/customer/wishlist/get`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({})
                });
                const syncData = await syncRes.json();
                if (syncData.success) {
                    setWishlistProducts(syncData.wishlist);
                    setWishlistIds(syncData.wishlist.map((p: any) => p._id));
                }
            } else {
                // Revert optimistic update gracefully
                setWishlistIds(wishlistIds); 
                console.error("Failed to toggle server wishlist:", data.message);
            }
        } catch (error) {
            setWishlistIds(wishlistIds); // Revert
            console.error("Network error toggling wishlist:", error);
        }
    };

    const isInWishlist = (productId: string) => wishlistIds.includes(productId);

    return (
        <WishlistContext.Provider
            value={{
                wishlistIds,
                wishlistProducts,
                toggleWishlist,
                isInWishlist,
                isLoading
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error("useWishlist must be used within a WishlistProvider");
    }
    return context;
}
