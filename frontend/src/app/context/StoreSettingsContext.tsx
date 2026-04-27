"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type StoreSettings = {
    whatsappCheckoutEnabled: boolean;
    whatsappNumber: string;
};

type StoreSettingsContextType = {
    settings: StoreSettings;
    isLoading: boolean;
};

const defaultSettings: StoreSettings = {
    whatsappCheckoutEnabled: true,
    whatsappNumber: "919876543210",
};

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/store-settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                if (data.status && data.data) {
                    setSettings({
                        whatsappCheckoutEnabled: data.data.whatsappCheckoutEnabled !== false, // default true
                        whatsappNumber: data.data.whatsappNumber || defaultSettings.whatsappNumber
                    });
                }
            } catch (error) {
                console.error("Failed to fetch global store settings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return (
        <StoreSettingsContext.Provider value={{ settings, isLoading }}>
            {children}
        </StoreSettingsContext.Provider>
    );
}

export function useStoreSettings() {
    const context = useContext(StoreSettingsContext);
    if (context === undefined) {
        throw new Error("useStoreSettings must be used within a StoreSettingsProvider");
    }
    return context;
}
