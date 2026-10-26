import Link from "next/link";
import {
  Truck,
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Boxes,
  FileCheck2,
  Workflow,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Distribution & Fleet Logistics",
  description:
    "Comprehensive FMCG warehousing, cold-chain logistics, and nationwide 24-hour delivery services across Kenya powered by Operra.",
};

const DEPOTS = [
  {
    name: "Nairobi Central Distribution Hub",
    location: "Industrial Area, Enterprise Road, Nairobi",
    capacity: "45,000 sq. ft. · 3,200 Pallet Positions",
    capabilities: "Dry Ambient Storage, Bonded Holding, High-Throughput Cross-Docking",
    manager: "Samuel Kiprop (Hub Logistics Director)",
    leadTime: "Same-Day Dispatch for Nairobi Metro & Environs",
  },
  {
    name: "Nakuru Rift Valley Regional Depot",
    location: "Commercial Zone, Old Nairobi Road, Nakuru",
    capacity: "25,000 sq. ft. · 1,800 Pallet Positions",
    capabilities: "Dairy & Beverage Staging, Grain Bulk Handling, South Rift Dispatch",
    manager: "Eunice Chebet (Depot Operations Lead)",
    leadTime: "Daily Scheduled Routes to Naivasha, Kericho & Bomet",
  },
  {
    name: "Mombasa Coastal Terminal",
    location: "Changamwe Logistics Corridor, Mombasa",
    capacity: "22,000 sq. ft. · 1,500 Pallet Positions",
    capabilities: "Import Port Receiving, Temperature-Controlled Ambient, Coastal Transit",
    manager: "Hassan Omar (Coastal Hub Manager)",
    leadTime: "Next-Day Delivery to Kilifi, Kwale, Malindi & Voi",
  },
  {
    name: "Kisumu Lake Region Depot",
    location: "Obote Road Industrial Area, Kisumu",
    capacity: "16,000 sq. ft. · 1,100 Pallet Positions",
    capabilities: "Western Kenya Distribution, Edible Oils Bulk, Retail Replenishment",
    manager: "Brian Ochieng (Western Regional Head)",
    leadTime: "Daily Routes across Kakamega, Siaya, Homa Bay & Kisii",
  },
  {
    name: "Eldoret North Rift Hub",
    location: "Logistics Way, Off Uganda Road, Eldoret",
    capacity: "14,000 sq. ft. · 950 Pallet Positions",
    capabilities: "North Rift & Western Highlands Staging, Transit Depot for Cross-Border",
    manager: "Daniel Koech (Dispatch Supervisor)",
    leadTime: "Next-Day Delivery to Kitale, Kapsabet & Bungoma",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Order Placement & Reservation",
    description:
      "When a wholesale order is submitted, Operra ERP automatically reserves live inventory at the nearest regional depot, guaranteeing zero stockouts.",
  },
  {
    step: "02",
    title: "Pick, Pack & Barcode Verification",
    description:
      "Warehouse pickers receive digitized picking lists grouped by pallet layout. Every batch number, expiry date, and SKU is barcode-verified.",
  },
  {
    step: "03",
    title: "Route Optimization & Staging",
    description:
      "Orders are staged at dispatch bays and scheduled into optimal vehicle delivery routes based on geographical delivery clusters.",
  },
  {
    step: "04",
    title: "Tracked Delivery & Electronic POD",
    description:
      "Drivers deliver orders to retail receiving bays. Electronic Proof of Delivery (recipient signature and photo) instantly updates the invoice ledger.",
  },
];

const FLEET_TYPES = [
  {
    type: "Refrigerated Cold-Chain Vans",
    units: "18 Units",
    capacity: "3.5 to 5.0 Tonnes",
    useCase: "Temperature-sensitive dairy products, natural fresh juices, and specialty confectioneries.",
  },
  {
    type: "Heavy Multi-Pallet Distribution Trucks",
    units: "26 Units",
    capacity: "10.0 to 18.0 Tonnes",
    useCase: "Bulk container transfers and inter-depot line-hauls of flour, rice, and cooking oils.",
  },
  {
    type: "Agile Last-Mile Urban Delivery Trucks",
    units: "20 Units",
    capacity: "2.0 to 4.0 Tonnes",
    useCase: "High-density retail delivery runs to supermarkets, wholesalers, and fast-paced city centers.",
  },
];

export default function PublicDistributionPage() {
  return (
    <div className="w-full bg-white">
      {/* 1. HEADER */}
      <section className="relative pt-12 pb-14 border-b border-[#f3f3f7] bg-white overflow-hidden">
        {/* Low-opacity warehousing and fleet logistics background image */}
        <div
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.08] mix-blend-multiply filter contrast-125"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#f3f3f7] border border-[#b9bbc6] text-[#6f737b] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#ff5900]" />
            NATIONWIDE FMCG LOGISTICS INFRASTRUCTURE
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-[#000000] tracking-compressed-lg leading-tight">
                Warehousing, Fulfillment &amp; Fleet Logistics
              </h1>
              <p className="text-base text-[#60646c]">
                Over 120,000 square feet of modern warehousing across 5 strategic hubs, powered by an agile commercial delivery fleet and real-time Operra ERP route control.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-[#ff5900] hover:bg-[#e04e00] text-white px-5 py-2.5 rounded-[12px] text-sm font-semibold tracking-compressed-sm transition shadow-xs"
              >
                Schedule Depot Delivery
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REGIONAL DEPOT DIRECTORY (5 Strategic Hubs) */}
      <section className="py-16 bg-white border-b border-[#f3f3f7]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff5900]">
              STRATEGIC STORAGE ASSETS
            </span>
            <h2 className="text-3xl font-extrabold text-[#000000] tracking-compressed-md mt-1">
              5 Regional Distribution Hubs
            </h2>
            <p className="text-sm text-[#60646c] mt-1 max-w-xl">
              Strategically positioned along Kenya&apos;s primary commercial transport corridors to guarantee 24-hour shelf replenishment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEPOTS.map((depot) => (
              <div
                key={depot.name}
                className="bg-white rounded-[12px] p-6 border border-[#b9bbc6]/60 hover:border-[#000000] transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#ff5900]">
                    <Building2 className="w-4 h-4" />
                    <span>REGIONAL DEPOT</span>
                  </div>

                  <h3 className="text-lg font-bold text-[#000000] tracking-compressed-sm leading-snug">
                    {depot.name}
                  </h3>

                  <div className="text-xs text-[#60646c] flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#8b8d98] shrink-0 mt-0.5" />
                    <span>{depot.location}</span>
                  </div>

                  <div className="p-3 bg-[#f3f3f7] rounded-[10px] space-y-1.5 text-xs text-[#60646c]">
                    <div>
                      <span className="text-[#8b8d98] block text-[10px]">Total Floor Capacity</span>
                      <strong className="text-[#000000]">{depot.capacity}</strong>
                    </div>
                    <div>
                      <span className="text-[#8b8d98] block text-[10px]">Operations &amp; Storage</span>
                      <span className="text-[#000000] font-medium">{depot.capabilities}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#f3f3f7] space-y-1">
                  <div className="text-[11px] text-[#8b8d98]">Fulfillment Lead Time:</div>
                  <div className="text-xs font-bold text-[#000000] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#ff5900]" />
                    {depot.leadTime}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. ORDER-TO-DELIVERY WORKFLOW (4-Step Clinical Process) */}
      <section className="py-20 bg-[#f3f3f7] border-b border-[#b9bbc6]/30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff5900]">
              PRECISION FULFILLMENT PROTOCOL
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#000000] tracking-compressed-md">
              From wholesale order confirmation to retail dock receipt.
            </h2>
            <p className="text-base text-[#60646c]">
              Every step is managed atomically through Operra, ensuring zero stock shrinkage, accurate batch dating, and electronic proof of delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW_STEPS.map((wf) => (
              <div
                key={wf.step}
                className="bg-white rounded-[12px] p-6 border border-[#b9bbc6]/50 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <span className="font-mono text-2xl font-extrabold text-[#ff5900]">
                    {wf.step}
                  </span>
                  <h3 className="text-base font-bold text-[#000000] tracking-compressed-sm">
                    {wf.title}
                  </h3>
                  <p className="text-xs text-[#60646c] leading-relaxed">
                    {wf.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#f3f3f7] flex items-center gap-1.5 text-[11px] text-[#8b8d98]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Operra ERP Validated
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FLEET & DELIVERY CAPABILITIES */}
      <section className="py-20 bg-white border-b border-[#f3f3f7]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-[#ff5900]">
                DELIVERY FLEET CAPABILITIES
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#000000] tracking-compressed-md">
                60+ Commercial Vehicles Dedicated to FMCG Dispatch
              </h2>
              <p className="text-sm text-[#60646c]">
                Engineered for maximum payload security, temperature integrity, and swift turnaround across regional routes.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-[8px] bg-[#f3f3f7] text-[#000000]">
              <ShieldCheck className="w-4 h-4 text-[#ff5900]" />
              Real-time GPS Tracking on All Units
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FLEET_TYPES.map((fleet) => (
              <div
                key={fleet.type}
                className="bg-white rounded-[12px] p-6 sm:p-8 border border-[#b9bbc6]/60 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ff5900] tracking-compressed-sm">
                      {fleet.units}
                    </span>
                    <span className="text-xs font-mono text-[#8b8d98]">{fleet.capacity}</span>
                  </div>

                  <h3 className="text-lg font-bold text-[#000000] tracking-compressed-sm">
                    {fleet.type}
                  </h3>

                  <p className="text-sm text-[#60646c] leading-relaxed">
                    {fleet.useCase}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#f3f3f7] flex items-center justify-between text-xs text-[#60646c]">
                  <span>Telemetry: Integrated</span>
                  <span className="text-[#000000] font-semibold">Active Daily</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="py-16 bg-[#15191e] text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-compressed-md">
              Need dedicated contract distribution for your brand?
            </h3>
            <p className="text-sm text-[#b9bbc6]">
              Partner with Operra to leverage our warehousing footprint, FMCG retail relationships, and 24-hour fulfillment engine across Kenya.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-[#ff5900] hover:bg-[#e04e00] text-white px-6 py-3 rounded-[12px] text-sm font-semibold tracking-compressed-sm transition shadow-xs"
            >
              Contact Logistics Operations
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-6 py-3 rounded-[12px] text-sm font-medium tracking-compressed-sm transition"
            >
              Operra Fleet Portal Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
