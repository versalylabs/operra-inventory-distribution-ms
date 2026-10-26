"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileText,
  Boxes,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface OrgSettingsData {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  taxNumber: string | null;
  currency: string;
  timezone: string;
  allowNegativeStock: boolean;
  valuationMethod: string;
  invoicePrefix: string;
  orderPrefix: string;
  purchasePrefix: string;
  deliveryPrefix: string;
  transferPrefix: string;
  defaultPaymentTerms: number;
  defaultTaxRate: number;
}

export function SettingsClient({
  organization,
  canEdit,
}: {
  organization: OrgSettingsData;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(organization);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      const res = await fetch("/api/organization/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update settings.");
        setSaving(false);
        return;
      }

      setSuccess("Organization settings saved and logged to audit trail.");
      setSaving(false);
      router.refresh();
    } catch {
      setError("Network error while saving settings.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Organization Profile & Operational Settings
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Configure business details, inventory valuation rules, and document numbering for{" "}
          <span className="font-semibold text-slate-800">{organization.name}</span>.
        </p>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {success}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Profile */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Business Identity & Tax Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                KRA PIN / Tax Registration Number
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.taxNumber || ""}
                onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                placeholder="P05..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Email
              </label>
              <input
                type="email"
                disabled={!canEdit}
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Phone
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Physical Address / Head Office
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Inventory & Financial Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Boxes className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Inventory & Financial Rules
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Currency
              </label>
              <select
                disabled={!canEdit}
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50"
              >
                <option value="KES">KES (KSh)</option>
                <option value="USD">USD ($)</option>
                <option value="UGX">UGX</option>
                <option value="TZS">TZS</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default VAT / Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                disabled={!canEdit}
                value={form.defaultTaxRate}
                onChange={(e) =>
                  setForm({ ...form, defaultTaxRate: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Payment Terms (Days)
              </label>
              <input
                type="number"
                disabled={!canEdit}
                value={form.defaultPaymentTerms}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultPaymentTerms: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-semibold text-slate-900">
                Allow Negative Stock on Sales Orders
              </p>
              <p className="text-xs text-slate-500">
                When disabled (recommended), sales orders cannot reserve more stock than available in the warehouse.
              </p>
            </div>
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={form.allowNegativeStock}
              onChange={(e) =>
                setForm({ ...form, allowNegativeStock: e.target.checked })
              }
              className="h-4 w-4 accent-indigo-600 rounded"
            />
          </div>
        </div>

        {/* Document Numbering */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Document Prefixes
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sales Order
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.orderPrefix}
                onChange={(e) =>
                  setForm({ ...form, orderPrefix: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.invoicePrefix}
                onChange={(e) =>
                  setForm({ ...form, invoicePrefix: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Order
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.purchasePrefix}
                onChange={(e) =>
                  setForm({ ...form, purchasePrefix: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Delivery Note
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.deliveryPrefix}
                onChange={(e) =>
                  setForm({ ...form, deliveryPrefix: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stock Transfer
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.transferPrefix}
                onChange={(e) =>
                  setForm({ ...form, transferPrefix: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Organization Settings
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
