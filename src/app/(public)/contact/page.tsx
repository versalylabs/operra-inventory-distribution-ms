"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Building2,
  ArrowRight,
  ShieldCheck,
  Boxes,
} from "lucide-react";

export default function PublicContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
    depot: "Nairobi Central Distribution Hub",
    monthlyVolume: "KES 500,000 – KES 2,000,000",
    departments: ["Beverages & Dairy"],
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const toggleDept = (dept: string) => {
    if (formData.departments.includes(dept)) {
      setFormData({
        ...formData,
        departments: formData.departments.filter((d) => d !== dept),
      });
    } else {
      setFormData({
        ...formData,
        departments: [...formData.departments, dept],
      });
    }
  };

  return (
    <div className="w-full bg-white">
      {/* 1. HEADER */}
      <section className="relative pt-12 pb-14 border-b border-[#f3f3f7] bg-white overflow-hidden">
        {/* Low-opacity commercial desk & dispatch operations background image */}
        <div
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.06] mix-blend-multiply filter contrast-125"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#f3f3f7] border border-[#b9bbc6] text-[#6f737b] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#ff5900]" />
            COMMERCIAL DESK &amp; DEPOT NETWORK
          </div>

          <div className="space-y-3 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#000000] tracking-compressed-lg leading-tight">
              Contact &amp; Wholesale Enquiries
            </h1>
            <p className="text-base text-[#60646c]">
              Open a new commercial wholesale account, request custom volume pricing, or schedule freight pickups with our regional depot dispatch desks.
            </p>
          </div>
        </div>
      </section>

      {/* 2. FORM & MAIN CONTACT DETAILS */}
      <section className="py-16 bg-white border-b border-[#f3f3f7]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Form Column (7 cols) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-[16px] p-6 sm:p-10 border border-[#b9bbc6]/60 shadow-xs space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#000000] tracking-compressed-sm">
                    Wholesale Account Application
                  </h2>
                  <p className="text-sm text-[#60646c] mt-1">
                    Fill out the form below. A commercial account representative will contact you within 4 business hours to set up your pricing tier and delivery schedule.
                  </p>
                </div>

                {submitted ? (
                  <div className="p-8 bg-[#f3f3f7] rounded-[12px] border border-[#b9bbc6]/40 text-center space-y-4 animate-in fade-in duration-300">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-[#000000]">
                        Wholesale Application Received
                      </h3>
                      <p className="text-sm text-[#60646c] max-w-md mx-auto">
                        Thank you for reaching out, <strong>{formData.contactPerson || "Partner"}</strong>. Your application for <strong>{formData.businessName || "your business"}</strong> has been logged in our Operra ERP pipeline.
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-[10px] border border-[#b9bbc6]/30 text-xs text-left max-w-sm mx-auto space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#8b8d98]">Target Depot:</span>
                        <span className="font-semibold text-[#000000]">{formData.depot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8b8d98]">Est. Volume:</span>
                        <span className="font-semibold text-[#000000]">{formData.monthlyVolume}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8b8d98]">Reference ID:</span>
                        <span className="font-mono font-bold text-[#ff5900]">RFQ-2026-9810</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSubmitted(false)}
                      className="text-xs font-semibold text-[#ff5900] hover:underline"
                    >
                      Submit Another Wholesale Inquiry →
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#000000] mb-1.5">
                          Business / Supermarket Name *
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.businessName}
                          onChange={(e) =>
                            setFormData({ ...formData, businessName: e.target.value })
                          }
                          placeholder="e.g. Apex Hypermarket Ltd"
                          className="w-full bg-[#f3f3f7] border border-[#b9bbc6]/40 rounded-[12px] px-4 py-2.5 text-xs text-[#000000] placeholder:text-[#8b8d98] focus:bg-white focus:outline-none focus:border-[#000000] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#000000] mb-1.5">
                          Contact Person &amp; Title *
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.contactPerson}
                          onChange={(e) =>
                            setFormData({ ...formData, contactPerson: e.target.value })
                          }
                          placeholder="e.g. Samuel Maina, Procurement Lead"
                          className="w-full bg-[#f3f3f7] border border-[#b9bbc6]/40 rounded-[12px] px-4 py-2.5 text-xs text-[#000000] placeholder:text-[#8b8d98] focus:bg-white focus:outline-none focus:border-[#000000] transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#000000] mb-1.5">
                          Official Email Address *
                        </label>
                        <input
                          required
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="samuel@apexretail.co.ke"
                          className="w-full bg-[#f3f3f7] border border-[#b9bbc6]/40 rounded-[12px] px-4 py-2.5 text-xs text-[#000000] placeholder:text-[#8b8d98] focus:bg-white focus:outline-none focus:border-[#000000] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#000000] mb-1.5">
                          Phone Number (M-Pesa / Call) *
                        </label>
                        <input
                          required
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+254 700 000 000"
                          className="w-full bg-[#f3f3f7] border border-[#b9bbc6]/40 rounded-[12px] px-4 py-2.5 text-xs text-[#000000] placeholder:text-[#8b8d98] focus:bg-white focus:outline-none focus:border-[#000000] transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#000000] mb-1.5">
                          Primary Delivery Depot *
                        </label>
                        <select
                          value={formData.depot}
                          onChange={(e) =>
                            setFormData({ ...formData, depot: e.target.value })
                          }
                          className="w-full bg-[#f3f3f7] border border-[#b9bbc6]/40 rounded-[12px] px-4 py-2.5 text-xs text-[#000000] focus:bg-white focus:outline-none focus:border-[#000000] transition"
                        >
                          <option>Nairobi Central Distribution Hub</option>
                          <option>Nakuru Rift Valley Regional Depot</option>
                          <option>Mombasa Coastal Terminal</option>
                          <option>Kisumu Lake Region Depot</option>
                          <option>Eldoret North Rift Hub</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#000000] mb-1.5">
                          Est. Monthly Procurement Volume
                        </label>
                        <select
                          value={formData.monthlyVolume}
                          onChange={(e) =>
                            setFormData({ ...formData, monthlyVolume: e.target.value })
                          }
                          className="w-full bg-[#f3f3f7] border border-[#b9bbc6]/40 rounded-[12px] px-4 py-2.5 text-xs text-[#000000] focus:bg-white focus:outline-none focus:border-[#000000] transition"
                        >
                          <option>Under KES 500,000</option>
                          <option>KES 500,000 – KES 2,000,000</option>
                          <option>KES 2,000,000 – KES 10,000,000</option>
                          <option>KES 10,000,000+ (Institutional / Key Account)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#000000] mb-1.5">
                        Product Departments of Interest
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Beverages & Dairy",
                          "Packaged Staples & Grains",
                          "Edible Cooking Oils",
                          "Personal Care & Hygiene",
                          "Home & Cleaning Supplies",
                          "Snacks & Confectionery",
                        ].map((dept) => {
                          const active = formData.departments.includes(dept);
                          return (
                            <button
                              type="button"
                              key={dept}
                              onClick={() => toggleDept(dept)}
                              className={`text-xs px-3 py-1.5 rounded-[8px] border transition ${
                                active
                                  ? "bg-[#000000] text-white border-[#000000]"
                                  : "bg-[#f3f3f7] text-[#60646c] border-transparent hover:border-[#b9bbc6]"
                              }`}
                            >
                              {dept}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#000000] mb-1.5">
                        Specific SKUs or Delivery Notes
                      </label>
                      <textarea
                        rows={3}
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="List specific brands or quantities required, preferred delivery days, or offloading dock specs..."
                        className="w-full bg-[#f3f3f7] border border-[#b9bbc6]/40 rounded-[12px] p-3 text-xs text-[#000000] placeholder:text-[#8b8d98] focus:bg-white focus:outline-none focus:border-[#000000] transition"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#ff5900] hover:bg-[#e04e00] text-white py-3.5 rounded-[12px] text-sm font-semibold tracking-compressed-sm transition shadow-xs active:scale-[0.98]"
                    >
                      <Send className="w-4 h-4" />
                      Submit Wholesale Account Application
                    </button>

                    <p className="text-[11px] text-[#8b8d98] text-center pt-1">
                      Data processed securely. Wholesale trade subject to standard credit verification.
                    </p>
                  </form>
                )}
              </div>
            </div>

            {/* Contact Details & Headquarters (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#f3f3f7] rounded-[16px] p-6 sm:p-8 border border-[#b9bbc6]/40 space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#ff5900]">
                    HEADQUARTERS &amp; DESK
                  </span>
                  <h3 className="text-xl font-bold text-[#000000] tracking-compressed-sm">
                    Operra Central Commercial Office
                  </h3>
                  <p className="text-xs text-[#60646c]">
                    Enterprise Road Logistics Park, Industrial Area, Nairobi, Kenya.
                  </p>
                </div>

                <div className="space-y-4 text-xs text-[#60646c]">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-white flex items-center justify-center shrink-0 border border-[#b9bbc6]/40">
                      <Phone className="w-4 h-4 text-[#ff5900]" />
                    </div>
                    <div>
                      <span className="text-[#8b8d98] block text-[10px]">Commercial Wholesale Phone</span>
                      <strong className="text-[#000000] font-mono text-sm">+254 700 890 120</strong>
                      <span className="block text-[#8b8d98]">Monday – Saturday, 7:00 AM – 6:00 PM</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-white flex items-center justify-center shrink-0 border border-[#b9bbc6]/40">
                      <Mail className="w-4 h-4 text-[#ff5900]" />
                    </div>
                    <div>
                      <span className="text-[#8b8d98] block text-[10px]">Procurement &amp; Orders Email</span>
                      <strong className="text-[#000000] font-mono text-sm">orders@operradistributors.co.ke</strong>
                      <span className="block text-[#8b8d98]">support@operradistributors.co.ke</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-white flex items-center justify-center shrink-0 border border-[#b9bbc6]/40">
                      <Clock className="w-4 h-4 text-[#ff5900]" />
                    </div>
                    <div>
                      <span className="text-[#8b8d98] block text-[10px]">Warehouse Dispatch Hours</span>
                      <strong className="text-[#000000]">24-Hour Automated Route Dispatch</strong>
                      <span className="block text-[#8b8d98]">Sunday Receiving Bay Open: 8:00 AM – 2:00 PM</span>
                    </div>
                  </div>
                </div>

                {/* Internal Operra Portal Callout */}
                <div className="p-4 bg-white rounded-[12px] border border-[#b9bbc6]/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-[6px] bg-[#000000] text-white flex items-center justify-center font-bold text-[10px]">
                      O
                    </div>
                    <span className="text-xs font-bold text-[#000000]">
                      Existing Operra Wholesale Clients
                    </span>
                  </div>
                  <p className="text-xs text-[#60646c]">
                    If you are an approved commercial account, you can sign in to the Operra management platform to review statements, place reorders, and check invoice status.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff5900] hover:underline pt-1"
                  >
                    Launch Operra ERP Portal →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 5 REGIONAL DEPOTS DIRECTORY */}
      <section className="py-16 bg-[#f3f3f7] border-b border-[#b9bbc6]/30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff5900]">
              LOCALIZED SUPPORT
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#000000] tracking-compressed-sm mt-1">
              Regional Depot Contact Directory
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                city: "Nairobi Central Hub",
                address: "Enterprise Road Logistics Park, Industrial Area",
                phone: "+254 700 890 120",
                email: "nairobi.depot@operra.co.ke",
              },
              {
                city: "Nakuru Rift Valley Depot",
                address: "Commercial Zone, Old Nairobi Road, Nakuru",
                phone: "+254 722 410 990",
                email: "nakuru.depot@operra.co.ke",
              },
              {
                city: "Mombasa Coastal Terminal",
                address: "Changamwe Logistics Corridor, Mombasa",
                phone: "+254 711 380 440",
                email: "mombasa.terminal@operra.co.ke",
              },
              {
                city: "Kisumu Lake Region Hub",
                address: "Obote Road Industrial Area, Kisumu",
                phone: "+254 733 910 220",
                email: "kisumu.depot@operra.co.ke",
              },
              {
                city: "Eldoret North Rift Hub",
                address: "Logistics Way, Off Uganda Road, Eldoret",
                phone: "+254 720 540 880",
                email: "eldoret.depot@operra.co.ke",
              },
            ].map((depot) => (
              <div
                key={depot.city}
                className="bg-white rounded-[12px] p-5 border border-[#b9bbc6]/50 space-y-2 text-xs"
              >
                <div className="font-bold text-sm text-[#000000]">{depot.city}</div>
                <div className="text-[#60646c] flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#8b8d98] shrink-0 mt-0.5" />
                  <span>{depot.address}</span>
                </div>
                <div className="pt-2 border-t border-[#f3f3f7] flex justify-between text-[11px] font-mono">
                  <span className="text-[#000000] font-semibold">{depot.phone}</span>
                  <span className="text-[#8b8d98]">{depot.email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
