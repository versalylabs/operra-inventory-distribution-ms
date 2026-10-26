import Link from "next/link";
import { ArrowUpRight, Phone, Mail, MapPin, ShieldCheck, Truck, Layers } from "lucide-react";
import { OperraLogo } from "@/components/brand/OperraLogo";

export function PublicFooter() {
  return (
    <footer className="w-full bg-[#000710] text-white pt-16 pb-12 border-t border-[#15191e]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <OperraLogo inverted size="md" />

            <p className="text-sm text-[#b9bbc6] leading-relaxed max-w-sm">
              Operra Distributors Ltd is East Africa&apos;s leading FMCG supply chain and wholesale distribution partner, connecting world-class manufacturers to over 45,000 retail storefronts, supermarkets, and institutions.
            </p>

            <div className="pt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-[6px] bg-[#15191e] text-white/90 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-[#ff5900]" />
                Powered by Operra MS
              </span>
              <span className="text-xs text-[#8b8d98]">ISO 9001:2015 Certified Supply Chain</span>
            </div>
          </div>

          {/* FMCG Product Categories */}
          <div>
            <h4 className="text-sm font-semibold tracking-compressed-sm text-white mb-4">
              Wholesale Catalog
            </h4>
            <ul className="space-y-2.5 text-sm text-[#b9bbc6]">
              <li>
                <Link href="/products?category=beverages" className="hover:text-white transition">
                  Beverages & Juices
                </Link>
              </li>
              <li>
                <Link href="/products?category=food" className="hover:text-white transition">
                  Packaged Foods & Flour
                </Link>
              </li>
              <li>
                <Link href="/products?category=edible-oils" className="hover:text-white transition">
                  Edible Cooking Oils
                </Link>
              </li>
              <li>
                <Link href="/products?category=personal-care" className="hover:text-white transition">
                  Personal Care & Hygiene
                </Link>
              </li>
              <li>
                <Link href="/products?category=cleaning" className="hover:text-white transition">
                  Home & Cleaning Supplies
                </Link>
              </li>
              <li>
                <Link href="/products?category=confectionery" className="hover:text-white transition">
                  Snacks & Confectionery
                </Link>
              </li>
            </ul>
          </div>

          {/* Regional Hubs & Logistics */}
          <div>
            <h4 className="text-sm font-semibold tracking-compressed-sm text-white mb-4">
              Distribution Hubs
            </h4>
            <ul className="space-y-2.5 text-sm text-[#b9bbc6]">
              <li>
                <Link href="/distribution#nairobi" className="hover:text-white transition">
                  Nairobi Main Distribution Hub
                </Link>
              </li>
              <li>
                <Link href="/distribution#nakuru" className="hover:text-white transition">
                  Nakuru Rift Valley Depot
                </Link>
              </li>
              <li>
                <Link href="/distribution#mombasa" className="hover:text-white transition">
                  Mombasa Coastal Terminal
                </Link>
              </li>
              <li>
                <Link href="/distribution#kisumu" className="hover:text-white transition">
                  Kisumu Lake Region Hub
                </Link>
              </li>
              <li>
                <Link href="/distribution#eldoret" className="hover:text-white transition">
                  Eldoret North Rift Depot
                </Link>
              </li>
              <li>
                <Link href="/distribution#fleet" className="hover:text-white transition">
                  Cold-Chain Fleet Logistics
                </Link>
              </li>
            </ul>
          </div>

          {/* Wholesale & Operra Portal */}
          <div>
            <h4 className="text-sm font-semibold tracking-compressed-sm text-white mb-4">
              B2B Portal & Enterprise
            </h4>
            <ul className="space-y-2.5 text-sm text-[#b9bbc6]">
              <li>
                <Link href="/login" className="hover:text-white transition flex items-center gap-1 text-[#ff5900] font-semibold">
                  Operra ERP Login
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Apply for Credit Terms
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About Operra
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Bulk Purchasing Desk
                </Link>
              </li>
              <li>
                <Link href="/distribution" className="hover:text-white transition">
                  Delivery SLA & Dispatch
                </Link>
              </li>
              <li>
                <span className="text-[#8b8d98] text-xs block pt-2">
                  Emergency Order Desk: <br />
                  <strong className="text-white font-mono">+254 700 890 120</strong>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8b8d98]">
          <p>
            © {new Date().getFullYear()} Operra Distributors Limited. All rights reserved. Registered in Kenya.
          </p>

          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-white transition">
              Supply Chain Code of Conduct
            </Link>
            <Link href="/contact" className="hover:text-white transition">
              Wholesale Trading Terms
            </Link>
            <Link href="/login" className="hover:text-[#ff5900] transition flex items-center gap-1">
              Operra Staff Access
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
