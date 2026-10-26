import Link from "next/link";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Boxes,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  PackageCheck,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Operra Distributors — Precision FMCG Wholesale & Logistics",
  description:
    "East Africa's leading FMCG wholesale and supply chain network, fulfilling over 2,800 essential consumer goods with 24-hour delivery powered by Operra.",
};

const METRICS = [
  { value: "99.4%", label: "On-Time In-Full (OTIF) Fulfillment Rate", sub: "Audited across 5 depots" },
  { value: "2,800+", label: "Active FMCG Brand SKUs in Stock", sub: "Beverages, Food, Home & Personal" },
  { value: "45,000+", label: "Retail & Wholesale Accounts Supplied", sub: "Supermarkets, Dukas & Institutions" },
  { value: "24 Hours", label: "Regional Order-to-Delivery SLA", sub: "Automated route dispatch" },
];

const BRAND_PARTNERS = [
  "UNILEVER",
  "EAST AFRICAN BREWERIES",
  "BROOKSIDE DAIRY",
  "BIDCO AFRICA",
  "NESTLÉ EAST AFRICA",
  "PZ CUSSONS",
  "KAPA OIL REFINERIES",
  "FARMER'S CHOICE",
];

const PRODUCT_CATEGORIES = [
  {
    title: "Beverages & Dairy",
    count: "480+ SKUs",
    description: "Premium mineral waters, carbonated sodas, natural fruit juices, energy drinks, and long-life UHT dairy milk crates.",
    examples: ["Sparkling Water", "UHT Milk 500ml", "Soda Crates", "Natural Juices"],
    href: "/products?category=beverages",
  },
  {
    title: "Packaged Staples & Grains",
    count: "620+ SKUs",
    description: "Grade 1 fortified maize meal, long-grain basmati & pishori rice, premium wheat flour, pasta, and table salt bales.",
    examples: ["Maize Flour Bales", "Basmati Rice 25kg", "Pasta 400g x 20", "Wheat Flour"],
    href: "/products?category=food",
  },
  {
    title: "Edible Cooking Oils",
    count: "240+ SKUs",
    description: "Triple-refined pure vegetable oils, fortified sunflower oils, and bulk commercial baking and frying fats.",
    examples: ["Vegetable Oil 5L x 4", "Cooking Oil 20L Jerrycan", "Baking Fat 10kg"],
    href: "/products?category=edible-oils",
  },
  {
    title: "Personal Care & Hygiene",
    count: "590+ SKUs",
    description: "Antiseptic bathing soaps, fluoride toothpaste, baby care diapers, sanitizers, and body lotions for high-volume retail.",
    examples: ["Bathing Soap 100g x 72", "Toothpaste 140g x 48", "Baby Diapers Jumbo"],
    href: "/products?category=personal-care",
  },
  {
    title: "Home & Laundry Cleaning",
    count: "510+ SKUs",
    description: "Multi-action washing powders, dishwashing pastes, surface disinfectants, chlorine bleaches, and paper products.",
    examples: ["Detergent Powder 1kg x 12", "Disinfectant 5L", "Bleach 750ml x 12"],
    href: "/products?category=cleaning",
  },
  {
    title: "Snacks & Confectionery",
    count: "360+ SKUs",
    description: "Glucose & cream biscuits, chocolates, savoury potato crisps, chewing gums, and children's sweet assortments.",
    examples: ["Glucose Biscuits Cartons", "Crisps 50g x 24", "Assorted Wafers"],
    href: "/products?category=confectionery",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Operra has transformed our stock turnaround. We receive daily pallet deliveries before 8:00 AM with zero stockouts on key beverage and cooking oil lines.",
    name: "Cyprian Mutua",
    role: "Head of Procurement",
    company: "Apex Supermarkets Chain (18 Branches)",
  },
  {
    quote:
      "Having live stock visibility and accurate digital delivery notes means we reconcile invoices in minutes. Their Operra-backed inventory system eliminates discrepancies.",
    name: "Grace Wanjiku",
    role: "Managing Director",
    company: "Operra Central Wholesale Depot",
  },
  {
    quote:
      "With 5 regional depots and a cold-chain fleet, Operra gives our brand unmatched shelf presence across secondary and rural retail corridors.",
    name: "Farhan Jamal",
    role: "Regional Channel Manager",
    company: "Pan-African FMCG Brand Group",
  },
];

export default function PublicHomePage() {
  return (
    <div className="w-full">
      {/* 1. HERO SECTION (Asymmetric split, Paper canvas, tight Inter tracking) */}
      <section className="relative pt-12 sm:pt-16 pb-16 sm:pb-24 border-b border-[#f3f3f7] bg-white overflow-hidden">
        {/* Low-opacity industrial FMCG logistics background image */}
        <div
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.06] mix-blend-multiply filter contrast-125 brightness-95"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=2000&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left 7 Columns */}
            <div className="lg:col-span-7 space-y-6">
              {/* Category chip */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#f3f3f7] border border-[#b9bbc6] text-[#6f737b] text-xs font-semibold tracking-compressed-sm">
                <span className="w-2 h-2 rounded-full bg-[#ff5900]" />
                KENYA &amp; REGIONAL FMCG WHOLESALE LOGISTICS
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-extrabold text-[#000000] tracking-compressed-display leading-[1.02]">
                The precision wholesale network for East Africa.
              </h1>

              {/* Subtext */}
              <p className="text-lg sm:text-xl text-[#60646c] tracking-compressed-sm leading-relaxed max-w-2xl">
                Operra Distributors supplies over 45,000 supermarkets, wholesalers, and retail chains with 2,800+ consumer goods. Guaranteed depot stock, 24-hour fulfillment, and digital proof of delivery.
              </p>

              {/* Form & CTA Pair */}
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-lg">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Enter wholesale store or company name"
                      className="w-full bg-white border border-[#b9bbc6] rounded-[12px] px-4 py-3 text-sm text-[#000000] placeholder:text-[#8b8d98] focus:outline-none focus:border-[#000000] transition"
                    />
                  </div>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 bg-[#ff5900] hover:bg-[#e04e00] text-white px-5 py-3 rounded-[12px] text-sm font-semibold tracking-compressed-sm transition shadow-xs whitespace-nowrap active:scale-[0.98]"
                  >
                    Open Wholesale Account
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs text-[#60646c]">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#ff5900]" />
                    Same-Day Warehouse Dispatch
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#ff5900]" />
                    Flexible 30-Day Credit Accounts
                  </span>
                  <Link
                    href="/products"
                    className="text-[#000000] font-semibold underline underline-offset-4 hover:text-[#ff5900] transition ml-auto hidden sm:inline"
                  >
                    View Product Catalog →
                  </Link>
                </div>
              </div>
            </div>

            {/* Right 5 Columns (Precision B2B Workbench Card Stack) */}
            <div className="lg:col-span-5">
              <div className="bg-[#f3f3f7] rounded-[16px] p-4 sm:p-6 border border-[#b9bbc6]/40 space-y-4 shadow-xs">
                {/* Header of mock card */}
                <div className="flex items-center justify-between border-b border-[#b9bbc6]/30 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5900]" />
                    <span className="text-xs font-bold tracking-compressed-sm text-[#000000]">
                      LIVE FULFILLMENT CONSOLE
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#60646c]">
                    NAIROBI HUB · TRUCK #KDC 819X
                  </span>
                </div>

                {/* Simulated Order Card 1 */}
                <div className="bg-white rounded-[12px] p-4 border border-[#b9bbc6]/30 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-[#8b8d98] font-mono">ORD-2026-0814</span>
                      <h4 className="text-sm font-semibold text-[#000000]">
                        Highland Retail Megastore — Nakuru Branch
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Dispatched
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-xs text-[#60646c] border-t border-[#f3f3f7]">
                    <div>
                      <span className="block text-[10px] text-[#8b8d98]">SKUs</span>
                      <strong className="text-[#000000]">14 Lines</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#8b8d98]">Total Weight</span>
                      <strong className="text-[#000000]">2.8 Tonnes</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#8b8d98]">Est. Delivery</span>
                      <strong className="text-[#000000]">10:30 AM Today</strong>
                    </div>
                  </div>
                </div>

                {/* Simulated Order Card 2 */}
                <div className="bg-white rounded-[12px] p-4 border border-[#b9bbc6]/30 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-[#8b8d98] font-mono">ORD-2026-0819</span>
                      <h4 className="text-sm font-semibold text-[#000000]">
                        Savannah Wholesalers — Mombasa Depot
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Staged for Loading
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-xs text-[#60646c] border-t border-[#f3f3f7]">
                    <div>
                      <span className="block text-[10px] text-[#8b8d98]">Units</span>
                      <strong className="text-[#000000]">420 Cases</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#8b8d98]">Batch Inspection</span>
                      <strong className="text-[#000000]">Passed (100%)</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#8b8d98]">POD Protocol</span>
                      <strong className="text-[#000000]">Biometric Sign</strong>
                    </div>
                  </div>
                </div>

                {/* Operra Enterprise Integration footer notice */}
                <div className="p-3 bg-white rounded-[12px] border border-[#b9bbc6]/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-[6px] bg-[#000000] text-white flex items-center justify-center font-bold text-[10px]">
                      O
                    </div>
                    <span className="text-[#60646c]">
                      ERP Engine: <strong className="text-[#000000]">Operra Inventory MS</strong>
                    </span>
                  </div>
                  <Link
                    href="/login"
                    className="text-[#ff5900] font-semibold hover:underline flex items-center gap-1"
                  >
                    View Portal
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE METRICS BAR (Paper/Fog contrast, 48px gap) */}
      <section className="py-12 bg-white border-b border-[#f3f3f7]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {METRICS.map((metric) => (
              <div key={metric.value} className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#000000] tracking-compressed-md">
                  {metric.value}
                </div>
                <div className="text-sm font-semibold text-[#000000] tracking-compressed-sm">
                  {metric.label}
                </div>
                <div className="text-xs text-[#60646c]">{metric.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. TRUST / BRAND PARTNER BAND (Fog #f3f3f7 section, Monochrome logos) */}
      <section className="py-16 bg-[#f3f3f7] border-b border-[#b9bbc6]/30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#6f737b]">
              Authorized Master Wholesaler &amp; Distribution Partner
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#000000] tracking-compressed-sm mt-1">
              Direct from the world&apos;s most trusted consumer goods manufacturers
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {BRAND_PARTNERS.map((brand) => (
              <div
                key={brand}
                className="bg-white rounded-[12px] p-5 border border-[#b9bbc6]/40 flex items-center justify-center text-center font-bold tracking-tight text-xs sm:text-sm text-[#8b8d98] hover:text-[#000000] transition"
              >
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PRODUCT CATEGORIES (Feature Cards with 12px radius, 32px padding) */}
      <section className="py-20 bg-white border-b border-[#f3f3f7]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#ff5900]">
                WHOLESALE PRODUCT CATALOG
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#000000] tracking-compressed-md">
                Fast-moving inventory, ready for immediate dispatch.
              </h2>
              <p className="text-[#60646c] text-base max-w-2xl">
                Source complete container, pallet, and carton quantities across 6 core everyday consumer product departments.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#000000] hover:text-[#ff5900] transition whitespace-nowrap"
            >
              Browse Complete Catalog
              <ArrowRight className="w-4 h-4 text-[#ff5900]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCT_CATEGORIES.map((category) => (
              <div
                key={category.title}
                className="bg-white rounded-[12px] p-6 sm:p-8 border border-[#b9bbc6]/60 hover:border-[#000000] transition-all flex flex-col justify-between space-y-6 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ff5900] tracking-compressed-sm">
                      {category.count}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#f3f3f7] group-hover:bg-[#ff5900] transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-[#000000] tracking-compressed-sm group-hover:text-[#ff5900] transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-sm text-[#60646c] leading-relaxed">
                    {category.description}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#f3f3f7]">
                  <div className="flex flex-wrap gap-1.5">
                    {category.examples.map((item) => (
                      <span
                        key={item}
                        className="text-[11px] px-2.5 py-1 rounded-[6px] bg-[#f3f3f7] text-[#000000] font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={category.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#000000] group-hover:text-[#ff5900] transition"
                  >
                    View SKUs &amp; Pricing
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. OPERRA PLATFORM SHOWCASE (Clinical Precision Workbench) */}
      <section className="py-20 bg-[#f3f3f7] border-b border-[#b9bbc6]/40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-[16px] p-8 sm:p-12 border border-[#b9bbc6]/50 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-[6px] bg-[#15191e] text-white">
                <Sparkles className="w-3.5 h-3.5 text-[#ff5900]" />
                Powered by Operra ERP
              </span>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#000000] tracking-compressed-md leading-tight">
                Operating with zero inventory blind spots.
              </h2>

              <p className="text-base text-[#60646c] leading-relaxed">
                Operra Distributors leverages our native multi-tenant inventory platform to execute atomic warehouse transactions, automated batch allocations, and live GPS proof of delivery. Every box leaving our depots is verified and reconciled in real-time.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-[#f3f3f7] flex items-center justify-center shrink-0">
                    <Boxes className="w-4 h-4 text-[#ff5900]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#000000]">Automatic Stock Reservation</h4>
                    <p className="text-xs text-[#60646c]">Prevents overselling when retail orders are confirmed.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-[#f3f3f7] flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4 text-[#ff5900]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#000000]">Electronic POD Receipts</h4>
                    <p className="text-xs text-[#60646c]">Digital signature &amp; photo capture on delivery.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-[#000000] hover:bg-[#15191e] text-white px-5 py-2.5 rounded-[12px] text-sm font-semibold tracking-compressed-sm transition"
                >
                  Explore Operra Management System
                  <ArrowRight className="w-4 h-4 text-[#ff5900]" />
                </Link>
                <Link
                  href="/distribution"
                  className="text-sm font-medium text-[#60646c] hover:text-[#000000] transition"
                >
                  Our 5 Depots Network →
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#000710] text-white rounded-[12px] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-mono text-[#8b8d98]">OPERRA INVENTORY CORE</span>
                <span className="text-xs text-emerald-400 font-mono">LIVE / SYNCED</span>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-[#b9bbc6]">Total SKUs Managed</span>
                  <span className="text-white font-bold">2,842</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-[#b9bbc6]">Depots Connected</span>
                  <span className="text-white font-bold">5 Regional Hubs</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-[#b9bbc6]">Active Delivery Vans</span>
                  <span className="text-white font-bold">64 Vehicles</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-[#b9bbc6]">Order-to-Dispatch</span>
                  <span className="text-white font-bold">&lt; 140 Minutes</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-[#b9bbc6]">Daily AR Invoicing</span>
                  <span className="text-white font-bold">KES 18.5M+</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-[#8b8d98] leading-tight">
                Integrated real-time database architecture with immutable ledger entries.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SOCIAL PROOF & TESTIMONIALS */}
      <section className="py-20 bg-white border-b border-[#f3f3f7]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff5900]">
              RELIABLE COMMERCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#000000] tracking-compressed-md">
              Trusted by commercial buyers across Kenya
            </h2>
            <p className="text-base text-[#60646c]">
              Hear how retail chains and regional distributor partners run consistent product supply with Operra.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((item) => (
              <div
                key={item.company}
                className="bg-[#f3f3f7] rounded-[12px] p-6 sm:p-8 flex flex-col justify-between space-y-6 border border-[#b9bbc6]/30"
              >
                <p className="text-sm text-[#000000] leading-relaxed italic">
                  &ldquo;{item.quote}&rdquo;
                </p>

                <div className="pt-4 border-t border-[#b9bbc6]/30">
                  <h4 className="text-sm font-bold text-[#000000]">{item.name}</h4>
                  <div className="text-xs text-[#60646c]">{item.role}</div>
                  <div className="text-xs font-semibold text-[#ff5900] mt-0.5">{item.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CONVERSION CTA BANNER */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="bg-[#15191e] text-white rounded-[16px] p-8 sm:p-14 text-center space-y-6 relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-3 relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-[#ff5900]">
                WHOLESALE &amp; INSTITUTIONAL PARTNERSHIPS
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-compressed-lg leading-tight">
                Ready to optimize your FMCG procurement pipeline?
              </h2>
              <p className="text-base text-[#b9bbc6]">
                Apply for a registered wholesale account today to unlock tier-1 distributor pricing, volume credit facilities, and guaranteed 24-hour deliveries.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 pt-2">
              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#ff5900] hover:bg-[#e04e00] text-white px-6 py-3.5 rounded-[12px] text-sm font-semibold tracking-compressed-sm transition shadow-sm active:scale-[0.98]"
              >
                Open Wholesale Account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-6 py-3.5 rounded-[12px] text-sm font-medium tracking-compressed-sm transition"
              >
                Download Product Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
