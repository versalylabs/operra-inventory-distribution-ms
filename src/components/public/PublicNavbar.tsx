"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ArrowRight,
  Boxes,
  Truck,
  ShieldCheck,
  Phone,
  Layers,
  LogIn,
} from "lucide-react";
import { OperraLogo } from "@/components/brand/OperraLogo";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/distribution", label: "Distribution & Fleet" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact & Wholesale" },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#ffffff] border-b border-[#f3f3f7] transition-all">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="group hover:opacity-95 transition-opacity">
          <OperraLogo size="md" subtitle="Distributors Ltd" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium tracking-compressed-sm transition-colors py-1 relative ${
                  active
                    ? "text-[#000000] font-semibold"
                    : "text-[#60646c] hover:text-[#000000]"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff5900] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <Link
            href="/distribution"
            className="text-sm font-medium text-[#60646c] hover:text-[#000000] transition flex items-center gap-1.5"
          >
            <Truck className="w-4 h-4 text-[#8b8d98]" />
            Fleet Tracking
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-[#ff5900] hover:bg-[#e04e00] text-white px-4 py-2 rounded-[12px] text-sm font-semibold tracking-compressed-sm transition shadow-xs active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4" />
            Operra ERP Portal
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 bg-[#ff5900] text-white px-3 py-1.5 rounded-[12px] text-xs font-semibold"
          >
            ERP Login
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-[12px] text-[#000000] hover:bg-[#f3f3f7] transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#f3f3f7] bg-[#ffffff] px-6 py-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-4">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-base py-2 flex items-center justify-between border-b border-[#f3f3f7] ${
                    active
                      ? "text-[#000000] font-semibold"
                      : "text-[#60646c]"
                  }`}
                >
                  <span>{link.label}</span>
                  {active && (
                    <span className="w-2 h-2 rounded-full bg-[#ff5900]" />
                  )}
                </Link>
              );
            })}

            <div className="pt-4 flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#ff5900] text-white py-3 rounded-[12px] text-sm font-semibold tracking-compressed-sm"
              >
                <LogIn className="w-4 h-4" />
                Sign in to Operra Dashboard
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#f3f3f7] text-[#000000] py-3 rounded-[12px] text-sm font-medium"
              >
                Wholesale Account Enquiry
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
