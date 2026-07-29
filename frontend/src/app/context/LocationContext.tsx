"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Free, unlimited IP geolocation API (HTTPS-supported) used only to decide
// whether to show or hide prices based on visitor country — no PII stored.
const GEO_API_URL = "https://ipwho.is/";

type LocationContextType = {
    isIndia: boolean;
    loading: boolean;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
    // Fail open: default to showing prices (isIndia = false) so a slow/blocked
    // geo lookup never accidentally hides prices from a real customer.
    const [isIndia, setIsIndia] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cached = sessionStorage.getItem("visitor_country_code");
        if (cached) {
            setIsIndia(cached === "IN");
            setLoading(false);
            return;
        }

        const detectCountry = async () => {
            try {
                const res = await fetch(GEO_API_URL);
                const data = await res.json();
                const countryCode = data?.country_code;
                if (countryCode) {
                    sessionStorage.setItem("visitor_country_code", countryCode);
                    setIsIndia(countryCode === "IN");
                }
            } catch (e) {
                console.error("Failed to detect visitor location, defaulting to showing prices:", e);
            } finally {
                setLoading(false);
            }
        };

        detectCountry();
    }, []);

    return (
        <LocationContext.Provider value={{ isIndia, loading }}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
}
