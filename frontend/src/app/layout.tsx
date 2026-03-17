import type { Metadata } from "next";
import { Tenor_Sans, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const tenorSans = Tenor_Sans({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-tenor",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shubhlaxmi — Designer Ethnic Wear for Women",
  description: "Shop traditional ethnic wear online for women. Explore our latest collection of Indian wedding lehengas, Sarees, Salwar Kameez, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${tenorSans.variable} ${outfit.variable} antialiased`}>
        {children}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
