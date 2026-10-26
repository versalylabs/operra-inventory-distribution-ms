import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Operra Distributors — Premier FMCG Wholesale & Logistics",
    template: "%s | Operra",
  },
  description:
    "East Africa's leading FMCG wholesale and supply chain network. Fulfilling 2,800+ food, beverage, personal care, and household SKUs with 24-hour nationwide delivery powered by Operra ERP.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/apple-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased bg-white text-black selection:bg-[#ff5900] selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
