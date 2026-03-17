"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    user: any | null;
    token: string | null;
    isLoginOpen: boolean;
    setIsLoginOpen: (open: boolean) => void;
    login: (token: string, userData: any) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('customer_token');
        const storedUser = localStorage.getItem('customer_data');
        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }
        setIsLoaded(true);
    }, []);

    const login = (newToken: string, userData: any) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('customer_token', newToken);
        localStorage.setItem('customer_data', JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer_data');
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoginOpen, setIsLoginOpen, login, logout }}>
            {isLoaded ? children : null}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
