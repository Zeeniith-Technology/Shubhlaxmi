import AnnouncementBar from "../components/storefront/AnnouncementBar";
import Header from "../components/storefront/Header";
import Footer from "../components/storefront/Footer";
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import { CurrencyProvider } from "../context/CurrencyContext";
import CartDrawer from "../components/storefront/CartDrawer";
import LoginModal from "../components/storefront/LoginModal";
import LiveChatWidget from "../components/storefront/LiveChatWidget";
import { MessageCircle } from "lucide-react";
import SmoothScrolling from "../components/SmoothScrolling";

export default function StorefrontLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SmoothScrolling>
            <AuthProvider>
                <CurrencyProvider>
                    <CartProvider>
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
                    </CartProvider>
                </CurrencyProvider>
            </AuthProvider>
        </SmoothScrolling>
    );
}
