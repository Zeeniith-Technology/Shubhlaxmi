import AnnouncementBar from "../components/storefront/AnnouncementBar";
import Header from "../components/storefront/Header";
import Footer from "../components/storefront/Footer";
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import { CurrencyProvider } from "../context/CurrencyContext";
import { WishlistProvider } from "../context/WishlistContext";
import CartDrawer from "../components/storefront/CartDrawer";
import LoginModal from "../components/storefront/LoginModal";
import LiveChatWidget from "../components/storefront/LiveChatWidget";
import { MessageCircle } from "lucide-react";
import SmoothScrolling from "../components/SmoothScrolling";

import { StoreSettingsProvider } from "../context/StoreSettingsContext";

export default function StorefrontLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SmoothScrolling>
            <StoreSettingsProvider>
                <AuthProvider>
                <CurrencyProvider>
                    <CartProvider>
                        <WishlistProvider>
                            <div className="min-h-screen flex flex-col bg-[var(--bg-white)] text-[var(--text-primary)] font-[var(--font-body)] antialiased">
                                <AnnouncementBar />
                                <Header />
                            <main className="flex-1">{children}</main>
                            <Footer />
                            <CartDrawer />
                            <LoginModal />

                            {/* Persistent Live Chat Button */}
                            <LiveChatWidget />
                        </div>
                        </WishlistProvider>
                    </CartProvider>
                </CurrencyProvider>
            </AuthProvider>
            </StoreSettingsProvider>
        </SmoothScrolling>
    );
}
