"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WarehouseStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import {
  Warehouse as WarehouseIcon,
  Plus,
  MapPin,
  Phone,
  Mail,
  User,
  Edit3,
  CheckCircle2,
  Wrench,
  XCircle,
  Boxes,
  ArrowRight,
  Loader2,
  AlertCircle,
  Star,
} from "lucide-react";

export interface WarehouseRecord {
  id: string;
  name: string;
  code: string;
  location: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  managerId: string | null;
  manager: { id: string; name: string; email: string } | null;
  isDefault: boolean;
  status: WarehouseStatus;
  skuCount: number;
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  damagedUnits: number;
  totalValue: number;
}

export interface ManagerOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function WarehousesClient({
  initialWarehouses,
  managers,
  currency,
  canManage,
}: {
  initialWarehouses: WarehouseRecord[];
  managers: ManagerOption[];
  currency: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [warehouses, setWarehouses] =
    useState<WarehouseRecord[]>(initialWarehouses);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    location: "",
    address: "",
    phone: "",
    email: "",
    managerId: "",
    isDefault: false,
    status: "ACTIVE" as WarehouseStatus,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openCreateModal() {
    setEditingId(null);
    setForm({
      name: "",
      code: `WH-0${warehouses.length + 1}`,
      location: "Nairobi",
      address: "",
      phone: "",
      email: "",
      managerId: managers[0]?.id || "",
      isDefault: warehouses.length === 0,
      status: "ACTIVE",
    });
    setError("");
    setShowModal(true);
  }

  function openEditModal(wh: WarehouseRecord) {
    setEditingId(wh.id);
    setForm({
      name: wh.name,
      code: wh.code,
      location: wh.location,
      address: wh.address || "",
      phone: wh.phone || "",
      email: wh.email || "",
      managerId: wh.managerId || "",
      isDefault: wh.isDefault,
      status: wh.status,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch("/api/inventory/warehouses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          ...form,
          managerId: form.managerId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save warehouse.");
        setLoading(false);
        return;
      }

      if (editingId) {
        setWarehouses((prev) =>
          prev.map((w) => {
            if (w.id === editingId) {
              return { ...w, ...data.warehouse };
            }
            return form.isDefault ? { ...w, isDefault: false } : w;
          })
        );
      } else {
        setWarehouses((prev) => [
          ...(form.isDefault
            ? prev.map((w) => ({ ...w, isDefault: false }))
            : prev),
          data.warehouse,
        ]);
      }

      setShowModal(false);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Network error while saving warehouse.");
      setLoading(false);
    }
  }

  const totalCombinedValue = warehouses.reduce((s, w) => s + w.totalValue, 0);
  const totalCombinedUnits = warehouses.reduce((s, w) => s + w.totalUnits, 0);
  const totalAvailableUnits = warehouses.reduce(
    (s, w) => s + w.availableUnits,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <WarehouseIcon className="h-4 w-4" />
            Multi-Location Distribution Network
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Warehouses & Regional Depots
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Manage physical warehouses, depot managers, stock valuation, and per-location availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/inventory/stock"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Boxes className="h-4 w-4 text-slate-500" />
            Stock & Ledger
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {canManage && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Warehouse
            </button>
          )}
        </div>
      </div>

      {/* Network KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Active Warehouses
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {warehouses.filter((w) => w.status === "ACTIVE").length} /{" "}
            {warehouses.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total Network Valuation
          </p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {formatCurrency(totalCombinedValue, currency)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total On-Hand Units
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {totalCombinedUnits.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Net Available Stock
          </p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {totalAvailableUnits.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-indigo-500/40 transition-all"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {wh.code}
                    </span>
                    {wh.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Star className="h-2.5 w-2.5 fill-indigo-600" />
                        Primary Hub
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1.5">
                    {wh.name}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {wh.location}
                    {wh.address ? ` • ${wh.address}` : ""}
                  </p>
                </div>

                <div>
                  {wh.status === "ACTIVE" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  )}
                  {wh.status === "MAINTENANCE" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      <Wrench className="h-3 w-3" />
                      Maintenance
                    </span>
                  )}
                  {wh.status === "INACTIVE" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                      <XCircle className="h-3 w-3" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {/* Warehouse Stock Metrics */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Stock Valuation</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {formatCurrency(wh.totalValue, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Stocked SKUs</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {wh.skuCount} Products
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Available Units</span>
                  <span className="text-sm font-bold text-emerald-600 mt-0.5 block">
                    {wh.availableUnits.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">
                    Reserved / Damaged
                  </span>
                  <span className="text-sm font-semibold text-slate-700 mt-0.5 block">
                    {wh.reservedUnits} /{" "}
                    <span className="text-red-600">{wh.damagedUnits}</span>
                  </span>
                </div>
              </div>

              {/* Contact & Manager */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Manager:{" "}
                    <strong className="text-slate-800">
                      {wh.manager?.name || "Unassigned"}
                    </strong>
                  </span>
                </div>
                {wh.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{wh.phone}</span>
                  </div>
                )}
                {wh.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{wh.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href={`/inventory/stock?warehouseId=${wh.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Inspect Warehouse Stock
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              {canManage && (
                <button
                  type="button"
                  onClick={() => openEditModal(wh)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-md hover:bg-slate-100 cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? "Edit Warehouse" : "Create New Warehouse"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warehouse Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Nairobi Main Distribution Hub"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="NBO-MAIN"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / Region *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    placeholder="Nairobi / Mombasa"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street / Industrial Area Address
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="Mombasa Road, Godown #14"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warehouse Manager
                  </label>
                  <select
                    value={form.managerId}
                    onChange={(e) =>
                      setForm({ ...form, managerId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="">Unassigned</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as WarehouseStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="+254 7..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Depot Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="depot@company.co.ke"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) =>
                    setForm({ ...form, isDefault: e.target.checked })
                  }
                  className="h-4 w-4 accent-indigo-600 rounded"
                />
                <span className="font-medium text-slate-800">
                  Set as primary default warehouse for new orders and receipts
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingId ? "Save Changes" : "Create Warehouse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
