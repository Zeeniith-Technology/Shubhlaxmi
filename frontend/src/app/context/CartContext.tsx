"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import API_BASE from '../../lib/api';

export interface CartItem {
    lineId: string;
    product: any;
    quantity: number;
    unitPrice: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: any, quantity?: number) => void;
    removeFromCart: (lineId: string) => void;
    updateQuantity: (lineId: string, quantity: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Stable identity for a cart line: same product + same selections = same line.
// Different size/color selections of one product stay as separate lines.
const buildLineId = (product: any): string => {
    const opts = product.selectedOptions || {};
    const sortedOpts = Object.keys(opts).sort().map(k => `${k}=${opts[k]}`).join('|');
    return `${product._id}::${sortedOpts}`;
};

// Unit price = product price + priceModifier of every selected customization option
const computeUnitPrice = (product: any): number => {
    let price = Number(product.price) || 0;
    const selected = product.selectedOptions || {};
    let customizations = product.customizationOptions || [];
    if (typeof customizations === 'string') {
        try { customizations = JSON.parse(customizations); } catch { customizations = []; }
    }
    if (Array.isArray(customizations)) {
        for (const opt of customizations) {
            const chosen = selected[opt.title];
            if (chosen !== undefined && chosen !== null && chosen !== '' && chosen !== false) {
                price += Number(opt.priceModifier) || 0;
            }
        }
    }
    return price;
};

const normalizeItem = (item: any): CartItem => ({
    lineId: item.lineId || buildLineId(item.product),
    product: item.product,
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice !== undefined ? item.unitPrice : computeUnitPrice(item.product)
});

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load from local storage on mount, then refresh product data from the
    // server so stale prices / removed products don't linger in the cart.
    useEffect(() => {
        const savedCart = localStorage.getItem('shubhlaxmi_cart');
        let initial: CartItem[] = [];
        if (savedCart) {
            try {
                initial = JSON.parse(savedCart).map(normalizeItem);
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
        setCart(initial);
        setIsLoaded(true);

        if (initial.length === 0) return;

        const ids = Array.from(new Set(initial.map(item => item.product._id)));
        fetch(`${API_BASE}/public/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
        })
            .then(r => r.json())
            .then(d => {
                if (!d.success || !Array.isArray(d.data)) return;
                const fresh = new Map(d.data.map((p: any) => [p._id, p]));
                setCart(prev => prev
                    // Drop lines whose product was deleted or deactivated
                    .filter(item => fresh.has(item.product._id))
                    .map(item => {
                        const p: any = fresh.get(item.product._id);
                        const product = { ...p, selectedOptions: item.product.selectedOptions || {} };
                        return { ...item, product, unitPrice: computeUnitPrice(product) };
                    })
                );
            })
            .catch(() => { /* offline — keep the cached cart */ });
    }, []);

    // Save to local storage whenever cart changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('shubhlaxmi_cart', JSON.stringify(cart));
        }
    }, [cart, isLoaded]);

    const addToCart = (product: any, quantity: number = 1) => {
        const lineId = buildLineId(product);
        const unitPrice = computeUnitPrice(product);
        setCart((prev) => {
            const existing = prev.find(item => item.lineId === lineId);
            if (existing) {
                return prev.map(item =>
                    item.lineId === lineId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { lineId, product, quantity, unitPrice }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (lineId: string) => {
        setCart(prev => prev.filter(item => item.lineId !== lineId));
    };

    const updateQuantity = (lineId: string, quantity: number) => {
        if (quantity < 1) return;
        setCart(prev => prev.map(item =>
            item.lineId === lineId ? { ...item, quantity } : item
        ));
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, isCartOpen, setIsCartOpen }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
