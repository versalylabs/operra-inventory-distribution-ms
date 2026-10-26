"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Boxes,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  UserCheck,
} from "lucide-react";
import { OperraLogo } from "@/components/brand/OperraLogo";

const DEMO_ACCOUNTS = [
  {
    label: "Owner",
    name: "David Kimani",
    email: "owner@acmedistributors.co.ke",
    badge: "Full Access",
  },
  {
    label: "Manager",
    name: "Sarah Wanjiku",
    email: "manager@acmedistributors.co.ke",
    badge: "Operations",
  },
  {
    label: "Warehouse",
    name: "Peter Ochieng",
    email: "warehouse@acmedistributors.co.ke",
    badge: "Stock & Receiving",
  },
  {
    label: "Sales Rep",
    name: "Grace Mutua",
    email: "sales@acmedistributors.co.ke",
    badge: "Orders & CRM",
  },
  {
    label: "Driver",
    name: "Joseph Kiprop",
    email: "driver@acmedistributors.co.ke",
    badge: "Deliveries & POD",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@acmedistributors.co.ke");
  const [password, setPassword] = useState("operra123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error while connecting to server.");
      setLoading(false);
    }
  }

  function selectDemoRole(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("operra123");
    setError("");
  }

  return (
    <div className="min-h-screen bg-[#000710] text-slate-100 flex flex-col lg:flex-row">
      {/* Left Column: Brand & Operational Value Proposition */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between bg-gradient-to-br from-[#15191e] via-[#0b0f14] to-[#000710] border-b lg:border-b-0 lg:border-r border-white/10">
        <div>
          <OperraLogo inverted size="lg" subtitle="Enterprise Operating System" />

          <div className="mt-12 lg:mt-20 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#ff5900]/10 border border-[#ff5900]/30 text-[#ff5900] text-xs font-semibold mb-6">
              <ShieldCheck className="h-3.5 w-3.5" />
              Enterprise Multi-Tenant Operations Platform
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-compressed-lg text-white leading-tight">
              Know your stock. Control your sales. Move your products.
            </h1>
            <p className="mt-4 text-[#b9bbc6] text-base leading-relaxed">
              The centralized operating system for wholesalers, distributors, and
              product-based businesses. Connect suppliers, purchasing, multi-warehouse
              inventory, sales orders, fleet deliveries, and payments in one platform.
            </p>
          </div>
        </div>

        {/* Operational Flow Footer */}
        <div className="mt-12 pt-8 border-t border-slate-800/80">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
            Connected Operational Cycle
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            {[
              "Suppliers",
              "Purchasing",
              "Warehouses",
              "Inventory",
              "Sales Orders",
              "Delivery",
              "Invoicing & Payments",
            ].map((step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
                  {step}
                </span>
                {i < arr.length - 1 && (
                  <span className="text-slate-600">→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Login Form & Role Switcher */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Sign in to your workspace
            </h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Enter your credentials or select a demo role below to explore Operra.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-300 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Work Email
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.co.ke"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#15191e] border border-white/10 rounded-[10px] text-sm text-white placeholder-[#8b8d98] focus:outline-none focus:ring-2 focus:ring-[#ff5900] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#b9bbc6]">
                  Password
                </label>
                <span className="text-xs text-[#8b8d98]">
                  Default demo: <code className="text-[#ff5900] font-mono">operra123</code>
                </span>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-[#8b8d98] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#15191e] border border-white/10 rounded-[10px] text-sm text-white placeholder-[#8b8d98] focus:outline-none focus:ring-2 focus:ring-[#ff5900] focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#ff5900] hover:bg-[#e04e00] disabled:opacity-60 text-white font-semibold text-sm rounded-[12px] shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Operra
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Role Switcher for Demo Testing */}
          <div className="pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#b9bbc6] flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-[#ff5900]" />
                Operra Distributors — Demo Roles
              </span>
              <span className="text-[11px] text-[#8b8d98]">Click to autofill</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const active = email === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => selectDemoRole(acc.email)}
                    className={`text-left p-2.5 rounded-[10px] border transition-all cursor-pointer ${
                      active
                        ? "bg-[#ff5900]/15 border-[#ff5900]/60 text-white"
                        : "bg-[#15191e] border-white/10 text-[#b9bbc6] hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">
                        {acc.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#000710] text-[#8b8d98] font-mono">
                        {acc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8b8d98] truncate mt-0.5">
                      {acc.name} ({acc.email.split("@")[0]})
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-center text-sm text-[#8b8d98]">
            Setting up a new business tenant?{" "}
            <Link
              href="/register"
              className="text-[#ff5900] hover:text-[#e04e00] font-medium underline-offset-4 hover:underline"
            >
              Create an organization workspace
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
