import { useState, useRef, useEffect } from "react";

interface Option {
    label: string;
    value: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (val: string) => void;
    options: Option[];
    placeholder?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
}

export default function CustomSelect({ value, onChange, options, placeholder = "Select", style, disabled = false }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.value === value);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ position: "relative", width: "100%", ...style }}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                    background: disabled ? "#f1f5f9" : "#fff",
                    color: selectedOption ? "#1e293b" : "#94a3b8",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: disabled ? "not-allowed" : "pointer",
                    boxSizing: "border-box",
                    outline: "none",
                }}
            >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            {isOpen && (
                <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                    zIndex: 50,
                    maxHeight: 250,
                    overflowY: "auto",
                    padding: 4
                }}>
                    {options.length === 0 ? (
                        <div style={{ padding: "8px 12px", fontSize: 13, color: "#94a3b8", textAlign: "center" }}>No options available</div>
                    ) : options.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            style={{
                                padding: "8px 12px",
                                fontSize: 14,
                                color: "#1e293b",
                                cursor: "pointer",
                                borderRadius: 4,
                                background: value === opt.value ? "#f8fafc" : "transparent",
                                fontWeight: value === opt.value ? 600 : 400,
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
