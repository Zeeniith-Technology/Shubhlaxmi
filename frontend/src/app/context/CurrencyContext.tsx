"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Using a free open API for exchange rates. Fallback rates are provided just in case.
const EXCHANGE_API_URL = "https://open.er-api.com/v6/latest/INR";

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AUD" | "CAD";

type CurrencyContextType = {
    currency: CurrencyCode;
    setCurrency: (currency: CurrencyCode) => void;
    exchangeRate: number;
    formatPrice: (priceInINR: number | string) => string;
    isLoading: boolean;
};

const defaultRates: Record<CurrencyCode, number> = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0094,
    AUD: 0.018,
    CAD: 0.016,
};

const currencySymbols: Record<CurrencyCode, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    AUD: "A$",
    CAD: "C$",
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState<CurrencyCode>("INR");
    const [rates, setRates] = useState<Record<string, number>>(defaultRates);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load saved currency from localStorage if available
        const savedCurrency = localStorage.getItem("preferred_currency") as CurrencyCode;
        if (savedCurrency && currencySymbols[savedCurrency]) {
            setCurrencyState(savedCurrency);
        }

        // Fetch real-time exchange rates
        const fetchRates = async () => {
            try {
                const response = await fetch(EXCHANGE_API_URL);
                const data = await response.json();
                if (data && data.rates) {
                    setRates(data.rates);
                }
            } catch (error) {
                console.error("Failed to fetch exchange rates, using fallbacks:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRates();
    }, []);

    const setCurrency = (newCurrency: CurrencyCode) => {
        setCurrencyState(newCurrency);
        localStorage.setItem("preferred_currency", newCurrency);
    };

    const formatPrice = (priceInINR: number | string): string => {
        const numPrice = typeof priceInINR === "string" ? parseFloat(priceInINR) : priceInINR;
        if (isNaN(numPrice)) return "₹0";

        const rate = rates[currency] || defaultRates[currency] || 1;
        
        // Add a 5% markup to all foreign currencies to cover payment gateway forex fees and spread.
        // This prevents business losses when capturing international payments.
        const markup = currency === "INR" ? 1 : 1.05;
        const converted = numPrice * rate * markup;

        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
            maximumFractionDigits: currency === "INR" ? 0 : 2,
        }).format(converted);
    };

    return (
        <CurrencyContext.Provider
            value={{
                currency,
                setCurrency,
                exchangeRate: rates[currency] || defaultRates[currency],
                formatPrice,
                isLoading,
            }}
        >
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error("useCurrency must be used within a CurrencyProvider");
    }
    return context;
}
