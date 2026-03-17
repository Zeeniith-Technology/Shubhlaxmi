"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Option {
    label: string;
    value: string;
}

interface StorefrontCustomSelectProps {
    value: string;
    onChange: (val: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
}

export default function StorefrontCustomSelect({ value, onChange, options, placeholder = "--- Select ---", className = "" }: StorefrontCustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.value === value || o.label === value);

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
        <div ref={containerRef} className={`relative w-full ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-3.5 border border-gray-800 focus:outline-none focus:border-black text-[13px] font-[var(--font-body)] text-gray-800 bg-white cursor-pointer flex justify-between items-center tracking-wide"
            >
                <span className="truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </button>

            {isOpen && (
                <div className="absolute top-[100%] left-0 right-0 bg-white border border-t-0 border-gray-800 z-50 max-h-64 overflow-y-auto">
                    {/* The placeholder as an unselectable option at the top matching the screenshot style */}
                    <div
                        onClick={() => { onChange(""); setIsOpen(false); }}
                        className={`px-4 py-2 text-[13px] font-[var(--font-body)] cursor-pointer transition-colors ${!value ? "bg-[#1f73dd] text-white" : "text-gray-800 hover:bg-[#1f73dd] hover:text-white"}`}
                    >
                        {placeholder}
                    </div>
                    {options.map((opt, idx) => {
                        const isSelected = value === opt.value;
                        return (
                            <div
                                key={`${opt.value}-${idx}`}
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                className={`px-4 py-2 text-[13px] font-[var(--font-body)] cursor-pointer transition-colors ${isSelected ? "bg-[#1f73dd] text-white" : "text-gray-800 hover:bg-[#1f73dd] hover:text-white"}`}
                            >
                                {opt.label}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
