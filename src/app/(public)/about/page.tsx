import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Building2,
  Users,
  TrendingUp,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Layers,
} from "lucide-react";

export const metadata = {
  title: "About Us",
  description:
    "Learn about Operra Distributors' history, mission, regional supply network, and how Operra ERP powers our FMCG wholesale operations.",
};

const PILLARS = [
  {
    title: "Supply Chain Reliability",
    description:
      "We operate under a strict 99.4% On-Time In-Full (OTIF) fulfillment benchmark. Retail stores and supermarkets count on our scheduled morning delivery windows to maintain consistent shelf presence.",
  },
  {
    title: "Direct-from-Source Authenticity",
    description:
      "Every single carton in our warehouses is sourced directly from certified brand manufacturers, backed by strict batch tracing, verified expiry dates, and anti-counterfeit standards.",
  },
  {
    title: "Technology-First Precision",
    description:
      "Powered by Operra MS, our depot staff, route planners, and wholesale accounts operate on a unified digital ledger with live stock reservations and automated accounting.",
  },
  {
    title: "Regional Economic Impact",
    description:
      "By linking international brands and local producers to over 45,000 community retailers, we keep food, beverages, and hygiene goods accessible and reasonably priced.",
  },
];

const TIMELINE = [
  {
    year: "2018",
    title: "Depot Genesis in the Rift Valley",
    detail: "Operra founded in Nakuru with a 5,000 sq. ft. warehouse supplying beverage and cooking oil wholesalers across the South Rift corridor.",
  },
  {
    year: "2020",
    title: "Nairobi Central Hub Launch",
    detail: "Opened our 45,000 sq. ft. central distribution hub in Nairobi's Industrial Area, establishing direct wholesale agreements with Tier-1 manufacturers.",
  },
  {
    year: "2022",
    title: "Coastal & Western Regional Network",
    detail: "Commissioned the Mombasa Coastal Terminal and Kisumu Western Hub to service retail demand across Lake Victoria and Indian Ocean ports.",
  },
  {
    year: "2024",
    title: "Operra ERP Digital Modernization",
    detail: "Deployed Operra Multi-Tenant Inventory & Distribution MS across all depots, eliminating inventory shrinkage and enabling digital Proof of Delivery.",
  },
  {
    year: "2026",
    title: "Nationwide Supply Infrastructure",
    detail: "Operating 5 strategic hubs, a dedicated commercial fleet of 60+ trucks and cold-chain vans, and fulfilling over 2,800 consumer product lines.",
  },
];

const LEADERSHIP = [
  {
    name: "Dr. Evans Kiprono",
    role: "Chief Executive Officer & Co-Founder",
    bio: "Over 20 years in East African FMCG supply chains, former Logistics Vice President for regional beverage conglomerates.",
  },
  {
    name: "Faith Njeri Mwangi",
    role: "Chief Operating Officer",
    bio: "Supply chain systems specialist who spearheaded Operra's multi-depot distribution architecture and Operra ERP integration.",
  },
  {
    name: "Mohamed Noor",
    role: "Head of Commercial & Wholesale Accounts",
    bio: "Leads national sales operations and credit facilities for 45,000+ supermarkets, wholesalers, and retail cooperative societies.",
  },
  {
    name: "Brenda Chepkoech",
    role: "Director of Quality & Compliance",
    bio: "Food safety auditor ensuring cold-chain integrity, ISO 9001 compliance, and direct-from-manufacturer product authenticity.",
  },
];

export default function PublicAboutPage() {
  return (
    <div className="w-full bg-white">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-14 border-b border-[#f3f3f7] bg-white overflow-hidden">
        {/* Low-opacity enterprise headquarters & mission background image */}
        <div
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.06] mix-blend-multiply filter contrast-125"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#f3f3f7] border border-[#b9bbc6] text-[#6f737b] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#ff5900]" />
            COMPANY BACKGROUND &amp; OPERATIONAL MISSION
          </div>

          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#000000] tracking-compressed-lg leading-tight">
              Building East Africa&apos;s most dependable FMCG supply chain.
            </h1>
            <p className="text-lg text-[#60646c] leading-relaxed">
              Founded in Kenya, Operra Distributors connects global manufacturers with over 45,000 retail storefronts. We eliminate supply disruptions so households always find the essential foods, beverages, and hygiene goods they need.
            </p>
          </div>
        </div>
      </section>

      {/* 2. MISSION & CORE PILLARS */}
      <section className="py-20 bg-white border-b border-[#f3f3f7]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff5900]">
              GUIDING PRINCIPLES
            </span>
            <h2 className="text-3xl font-extrabold text-[#000000] tracking-compressed-md">
              Four pillars that govern our daily fulfillment.
            </h2>
            <p className="text-sm text-[#60646c]">
              We treat wholesale logistics not just as warehousing and trucking, but as the critical circulatory system of regional trade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="bg-[#f3f3f7] rounded-[12px] p-8 border border-[#b9bbc6]/40 space-y-3"
              >
                <div className="w-2 h-2 rounded-full bg-[#ff5900]" />
                <h3 className="text-lg font-bold text-[#000000] tracking-compressed-sm">
                  {pillar.title}
                </h3>
                <p className="text-sm text-[#60646c] leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. GROWTH TIMELINE */}
      <section className="py-20 bg-[#f3f3f7] border-b border-[#b9bbc6]/30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff5900]">
              OUR MILESTONES
            </span>
            <h2 className="text-3xl font-extrabold text-[#000000] tracking-compressed-md">
              A decade of disciplined logistics expansion
            </h2>
            <p className="text-sm text-[#60646c]">
              From a single warehouse in Nakuru to 5 strategically positioned high-throughput regional terminals across Kenya.
            </p>
          </div>

          <div className="space-y-4">
            {TIMELINE.map((item) => (
              <div
                key={item.year}
                className="bg-white rounded-[12px] p-6 border border-[#b9bbc6]/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-6">
                  <span className="font-mono text-2xl font-extrabold text-[#ff5900] w-20 shrink-0">
                    {item.year}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#000000] tracking-compressed-sm">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#60646c] mt-0.5 leading-relaxed max-w-2xl">
                      {item.detail}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 text-xs text-[#8b8d98]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Milestone Reached
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. LEADERSHIP TEAM */}
      <section className="py-20 bg-white border-b border-[#f3f3f7]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff5900]">
              EXECUTIVE LEADERSHIP
            </span>
            <h2 className="text-3xl font-extrabold text-[#000000] tracking-compressed-md">
              Led by seasoned supply chain operators
            </h2>
            <p className="text-sm text-[#60646c]">
              Our leadership team brings deep hands-on expertise in manufacturing relations, route-to-market execution, and digital warehouse technology.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {LEADERSHIP.map((leader) => (
              <div
                key={leader.name}
                className="bg-white rounded-[12px] p-6 border border-[#b9bbc6]/60 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-[12px] bg-[#f3f3f7] text-[#000000] flex items-center justify-center font-bold text-base border border-[#b9bbc6]/40">
                    {leader.name.charAt(0)}
                  </div>
                  <h3 className="text-base font-bold text-[#000000] tracking-compressed-sm pt-2">
                    {leader.name}
                  </h3>
                  <div className="text-xs font-semibold text-[#ff5900]">
                    {leader.role}
                  </div>
                  <p className="text-xs text-[#60646c] leading-relaxed pt-1">
                    {leader.bio}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#f3f3f7] text-[11px] text-[#8b8d98]">
                  Operra Executive Committee
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. OPERRA ERP CONNECTION CALLOUT */}
      <section className="py-16 bg-[#15191e] text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#ff5900]">
              ENTERPRISE TECHNOLOGY
            </span>
            <h2 className="text-3xl font-extrabold tracking-compressed-md">
              Powered by Operra Inventory Management
            </h2>
            <p className="text-sm text-[#b9bbc6]">
              Every customer invoice, warehouse dispatch, and delivery receipt shown in our operations is powered directly by Operra&apos;s multi-tenant engine.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-[#ff5900] hover:bg-[#e04e00] text-white px-6 py-3 rounded-[12px] text-sm font-semibold tracking-compressed-sm transition shadow-xs"
            >
              Sign In to Operra Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-6 py-3 rounded-[12px] text-sm font-medium tracking-compressed-sm transition"
            >
              Contact Commercial Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
