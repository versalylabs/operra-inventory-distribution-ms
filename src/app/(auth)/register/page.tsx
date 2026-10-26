"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Boxes,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { OperraLogo } from "@/components/brand/OperraLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Nairobi");
  const [currency, setCurrency] = useState("KES");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName,
          name,
          email,
          phone,
          city,
          currency,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create organization workspace.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error while creating workspace.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#000710] text-slate-100 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-xl bg-[#15191e] border border-white/10 rounded-[16px] p-8 shadow-2xl">
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <OperraLogo inverted size="md" subtitle="Enterprise Operating System" />
          <Link
            href="/login"
            className="text-xs text-[#8b8d98] hover:text-[#ff5900] transition-colors"
          >
            Already have an account? Sign in →
          </Link>
        </div>

        {error && (
          <div className="mt-6 p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-300 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#b9bbc6] mb-2">
              Business / Organization Name *
            </label>
            <div className="relative">
              <Building2 className="h-4 w-4 text-[#8b8d98] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g., Operra Regional Wholesalers Ltd"
                className="w-full pl-10 pr-4 py-2.5 bg-[#000710] border border-white/10 rounded-[10px] text-sm text-white placeholder-[#8b8d98] focus:outline-none focus:ring-2 focus:ring-[#ff5900]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#b9bbc6] mb-2">
                Your Full Name *
              </label>
              <div className="relative">
                <User className="h-4 w-4 text-[#8b8d98] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Kamau"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#000710] border border-white/10 rounded-[10px] text-sm text-white placeholder-[#8b8d98] focus:outline-none focus:ring-2 focus:ring-[#ff5900]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#b9bbc6] mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="h-4 w-4 text-[#8b8d98] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 712 345 678"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#000710] border border-white/10 rounded-[10px] text-sm text-white placeholder-[#8b8d98] focus:outline-none focus:ring-2 focus:ring-[#ff5900]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#b9bbc6] mb-2">
                Work Email *
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-[#8b8d98] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@company.co.ke"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#000710] border border-white/10 rounded-[10px] text-sm text-white placeholder-[#8b8d98] focus:outline-none focus:ring-2 focus:ring-[#ff5900]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#b9bbc6] mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-[#8b8d98] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#000710] border border-white/10 rounded-[10px] text-sm text-white placeholder-[#8b8d98] focus:outline-none focus:ring-2 focus:ring-[#ff5900]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#b9bbc6] mb-2">
                Primary City / Hub
              </label>
              <div className="relative">
                <MapPin className="h-4 w-4 text-[#8b8d98] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Nairobi"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#000710] border border-white/10 rounded-[10px] text-sm text-white placeholder-[#8b8d98] focus:outline-none focus:ring-2 focus:ring-[#ff5900]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#b9bbc6] mb-2">
                Base Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#000710] border border-white/10 rounded-[10px] text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ff5900]"
              >
                <option value="KES">KES — Kenyan Shilling (KSh)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="UGX">UGX — Ugandan Shilling</option>
                <option value="TZS">TZS — Tanzanian Shilling</option>
              </select>
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
                Provisioning Organization Tenant...
              </>
            ) : (
              <>
                Launch Organization Workspace
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
