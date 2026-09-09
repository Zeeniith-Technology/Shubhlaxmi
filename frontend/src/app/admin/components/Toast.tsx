"use client";

// A fixed, high-z-index toast so success/error messages are always visible —
// even while a modal (bulk add/edit, delete confirm, etc.) is open. Every
// admin page previously rendered its message banner inline in the normal
// page flow, which put it visually underneath any `position: fixed` modal
// overlay (those use z-[100]), making errors invisible whenever a modal
// was open. This renders above everything instead.
export default function Toast({ text, type }: { text: string; type: string }) {
    return (
        <div
            role="alert"
            style={{
                position: "fixed",
                top: 20,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 9999,
                minWidth: 280,
                maxWidth: "min(90vw, 560px)",
                padding: "12px 20px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                background: type === "success" ? "#dcfce7" : "#fee2e2",
                color: type === "success" ? "#166534" : "#991b1b",
                border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
            }}
        >
            {text}
        </div>
    );
}
