"use client";

import { useState, useEffect } from "react";
import { Instagram } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Reel {
    _id: string;
    title?: string;
    type: "video" | "instagram";
    thumbnailImage?: { url: string };
    video?: { url: string };
    instagramLink?: string;
}

export default function ReelsSection() {
    const [reels, setReels] = useState<Reel[]>([]);

    useEffect(() => {
        fetch(`${API_BASE}/public/reels`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        })
            .then(r => r.json())
            .then(d => { if (d.success && Array.isArray(d.data)) setReels(d.data); })
            .catch(() => { });
    }, []);

    if (reels.length === 0) return null;

    return (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <h2 className="text-2xl lg:text-3xl font-[var(--font-heading)] text-center mb-8 text-gray-900 font-medium">
                Watch & Shop
            </h2>

            <div
                className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {reels.map((reel) => (
                    <div
                        key={reel._id}
                        className="relative flex-shrink-0 w-[160px] sm:w-[200px] aspect-[9/16] rounded-xl overflow-hidden bg-gray-100 shadow-sm group"
                    >
                        {reel.type === "video" ? (
                            <video
                                src={reel.video?.url}
                                poster={reel.thumbnailImage?.url}
                                className="w-full h-full object-cover pointer-events-none"
                                autoPlay
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                disablePictureInPicture
                                controlsList="nodownload noremoteplayback noplaybackrate"
                            />
                        ) : (
                            <a
                                href={reel.instagramLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 w-full h-full"
                            >
                                <img
                                    src={reel.thumbnailImage?.url}
                                    alt={reel.title || "Instagram reel"}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                <span className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                                    <Instagram size={16} className="text-[#d62976]" />
                                </span>
                            </a>
                        )}

                        {reel.title && (
                            <p className="absolute bottom-0 inset-x-0 p-2.5 text-white text-[11px] font-medium bg-gradient-to-t from-black/60 to-transparent line-clamp-2 pointer-events-none">
                                {reel.title}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        </section>
    );
}
