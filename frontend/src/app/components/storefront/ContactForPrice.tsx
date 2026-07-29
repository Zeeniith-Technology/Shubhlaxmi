"use client";

import { useStoreSettings } from "../../context/StoreSettingsContext";

interface ContactForPriceProps {
    size?: "sm" | "md" | "lg";
    className?: string;
    productName?: string;
    selectedOptions?: Record<string, string>;
}

const sizeClasses = {
    sm: "text-[10px] px-2 py-1 gap-1",
    md: "text-[11px] sm:text-xs px-2.5 py-1.5 gap-1.5",
    lg: "text-sm px-4 py-2 gap-2",
};

// Shown in place of a price for India-based visitors (see LocationContext).
// Links out to WhatsApp (with a pre-filled inquiry) or the Contact page.
export default function ContactForPrice({ size = "md", className = "", productName, selectedOptions }: ContactForPriceProps) {
    const { settings } = useStoreSettings();

    const optsText = selectedOptions && Object.keys(selectedOptions).length > 0
        ? ` [${Object.entries(selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}]`
        : '';

    const message = productName
        ? `Hello Shubhlaxmi, I would like to know the price for: ${productName}${optsText}`
        : `Hello Shubhlaxmi, I would like to know the price for this product.`;

    const href = settings.whatsappNumber
        ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
        : "/pages/contact";

    // Rendered as a <button>, not an <a> — this component is often used inside
    // product cards that are themselves wrapped in a <Link>, and nesting an
    // <a> inside an <a> is invalid HTML that breaks React hydration.
    return (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(href, "_blank", "noopener,noreferrer");
            }}
            className={`inline-flex items-center font-semibold text-[var(--brand-pink)] border border-[var(--brand-pink)] rounded-full hover:bg-[var(--brand-pink)] hover:text-white transition-colors whitespace-nowrap ${sizeClasses[size]} ${className}`}
        >
            Contact for Price
        </button>
    );
}
