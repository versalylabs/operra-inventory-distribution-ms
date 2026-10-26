"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SupplierStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit3,
  Eye,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

export interface SupplierRecord {
  id: string;
  code: string;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  taxNumber: string | null;
  paymentTermsDays: number;
  creditLimit: number;
  bankDetails: string | null;
  suppliedCategories: string | null;
  totalPurchases: number;
  outstandingBalance: number;
  status: SupplierStatus;
  poCount: number;
  grnCount: number;
}

export function SuppliersClient({
  initialSuppliers,
  currency,
  canManage,
}: {
  initialSuppliers: SupplierRecord[];
  currency: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [suppliers, setSuppliers] =
    useState<SupplierRecord[]>(initialSuppliers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | SupplierStatus>(
    "ALL"
  );
  const [selectedSupplier, setSelectedSupplier] =
    useState<SupplierRecord | null>(null);

  // Create / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "Nairobi",
    taxNumber: "",
    paymentTermsDays: "30",
    creditLimit: "2000000",
    bankDetails: "",
    suppliedCategories: "",
    status: "ACTIVE" as SupplierStatus,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredSuppliers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return suppliers.filter((s) => {
      const matchesStatus =
        statusFilter === "ALL" || s.status === statusFilter;
      const matchesSearch =
        !q ||
        s.companyName.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
        (s.suppliedCategories &&
          s.suppliedCategories.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [suppliers, search, statusFilter]);

  function openCreateModal() {
    setEditingId(null);
    setForm({
      companyName: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      city: "Nairobi",
      taxNumber: "",
      paymentTermsDays: "30",
      creditLimit: "2000000",
      bankDetails: "",
      suppliedCategories: "",
      status: "ACTIVE",
    });
    setError("");
    setShowModal(true);
  }

  function openEditModal(sup: SupplierRecord) {
    setEditingId(sup.id);
    setForm({
      companyName: sup.companyName,
      contactPerson: sup.contactPerson || "",
      phone: sup.phone || "",
      email: sup.email || "",
      address: sup.address || "",
      city: sup.city || "Nairobi",
      taxNumber: sup.taxNumber || "",
      paymentTermsDays: String(sup.paymentTermsDays),
      creditLimit: String(sup.creditLimit),
      bankDetails: sup.bankDetails || "",
      suppliedCategories: sup.suppliedCategories || "",
      status: sup.status,
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
      const res = await fetch("/api/purchasing/suppliers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          ...form,
          paymentTermsDays: parseInt(form.paymentTermsDays, 10) || 30,
          creditLimit: parseFloat(form.creditLimit) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save supplier.");
        setLoading(false);
        return;
      }

      if (editingId) {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === editingId ? data.supplier : s))
        );
        if (selectedSupplier?.id === editingId) {
          setSelectedSupplier(data.supplier);
        }
      } else {
        setSuppliers((prev) => [...prev, data.supplier]);
      }

      setShowModal(false);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Network error while saving supplier.");
      setLoading(false);
    }
  }

  const totalPurchasesSum = suppliers.reduce(
    (s, sup) => s + sup.totalPurchases,
    0
  );
  const totalPayablesSum = suppliers.reduce(
    (s, sup) => s + sup.outstandingBalance,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <Building2 className="h-4 w-4" />
            Upstream Supply Chain & Payables
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Suppliers & Vendor Directory
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Manage manufacturers, distributors, payment terms, credit limits, and outstanding payable balances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/purchasing/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <ShoppingBag className="h-4 w-4 text-slate-500" />
            Purchase Orders
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {canManage && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Supplier
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Active Suppliers
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {suppliers.filter((s) => s.status === "ACTIVE").length} /{" "}
            {suppliers.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Cumulative Purchases
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalPurchasesSum, currency)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Outstanding Payables
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {formatCurrency(totalPayablesSum, currency)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total Purchase Orders
          </p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {suppliers.reduce((s, sup) => s + sup.poCount, 0)} POs
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers by company, code, contact person, or category..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "ALL" | SupplierStatus)
          }
          className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active Only</option>
          <option value="INACTIVE">Inactive Only</option>
        </select>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Supplier & Code</th>
                <th className="py-3.5 px-4">Primary Contact</th>
                <th className="py-3.5 px-4">Supplied Lines</th>
                <th className="py-3.5 px-4">Payment Terms</th>
                <th className="py-3.5 px-4 text-right">Total Purchases</th>
                <th className="py-3.5 px-4 text-right">Outstanding Payable</th>
                <th className="py-3.5 px-4 text-center">POs / GRNs</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-1">
                        No suppliers found
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">
                        {search || statusFilter !== "ALL"
                          ? "No suppliers match your search or filter criteria. Try resetting your search."
                          : "No suppliers registered yet. Add your FMCG manufacturers, importers, and distributors."}
                      </p>
                      {search || statusFilter !== "ALL" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            setStatusFilter("ALL");
                          }}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                        >
                          Reset filters
                        </button>
                      ) : canManage ? (
                        <button
                          type="button"
                          onClick={openCreateModal}
                          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                        >
                          Add New Supplier
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => (
                <tr key={sup.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => setSelectedSupplier(sup)}
                      className="font-bold text-slate-900 hover:text-indigo-600 text-left cursor-pointer"
                    >
                      {sup.companyName}
                    </button>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {sup.code}
                      </span>
                      {sup.city && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {sup.city}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">
                      {sup.contactPerson || "—"}
                    </div>
                    {sup.phone && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        {sup.phone}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                    {sup.suppliedCategories || "General Merchandise"}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800">
                      Net {sup.paymentTermsDays} Days
                    </span>
                    <div className="text-[10px] text-slate-400">
                      Limit: {formatCurrency(sup.creditLimit, currency)}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                    {formatCurrency(sup.totalPurchases, currency)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700">
                    {formatCurrency(sup.outstandingBalance, currency)}
                  </td>

                  <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                    {sup.poCount} / {sup.grnCount}
                  </td>

                  <td className="py-3.5 px-4">
                    {sup.status === "ACTIVE" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedSupplier(sup)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                        title="View Supplier Profile"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => openEditModal(sup)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                          title="Edit Supplier"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Detail Drawer */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-slate-200 p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <div>
                  <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {selectedSupplier.code}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1.5">
                    {selectedSupplier.companyName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedSupplier.suppliedCategories || "Approved Supplier"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSupplier(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-slate-900 text-white rounded-xl p-5 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400">Total Purchases</p>
                  <p className="text-lg font-bold mt-0.5">
                    {formatCurrency(selectedSupplier.totalPurchases, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Outstanding Payable</p>
                  <p className="text-lg font-bold text-amber-400 mt-0.5">
                    {formatCurrency(
                      selectedSupplier.outstandingBalance,
                      currency
                    )}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-xs bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div>
                  <dt className="text-slate-500">Contact Person</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {selectedSupplier.contactPerson || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {selectedSupplier.phone || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {selectedSupplier.email || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">KRA PIN / Tax ID</dt>
                  <dd className="font-mono font-semibold text-slate-900 mt-0.5">
                    {selectedSupplier.taxNumber || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Payment Terms</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    Net {selectedSupplier.paymentTermsDays} Days
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Credit Limit</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {formatCurrency(selectedSupplier.creditLimit, currency)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-500">Bank / Payment Details</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {selectedSupplier.bankDetails || "—"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-500">Physical Address</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {selectedSupplier.address || "—"},{" "}
                    {selectedSupplier.city || ""}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <Link
                href="/purchasing/orders"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Create Purchase Order
              </Link>
              <button
                type="button"
                onClick={() => setSelectedSupplier(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? "Edit Supplier" : "Add New Supplier"}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) =>
                      setForm({ ...form, companyName: e.target.value })
                    }
                    placeholder="e.g., Bidco Africa Ltd"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={(e) =>
                      setForm({ ...form, contactPerson: e.target.value })
                    }
                    placeholder="Account Manager Name"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
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
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="orders@supplier.co.ke"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tax PIN
                  </label>
                  <input
                    type="text"
                    value={form.taxNumber}
                    onChange={(e) =>
                      setForm({ ...form, taxNumber: e.target.value })
                    }
                    placeholder="P05..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Terms (Days)
                  </label>
                  <input
                    type="number"
                    value={form.paymentTermsDays}
                    onChange={(e) =>
                      setForm({ ...form, paymentTermsDays: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Credit Limit ({currency})
                  </label>
                  <input
                    type="number"
                    value={form.creditLimit}
                    onChange={(e) =>
                      setForm({ ...form, creditLimit: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplied Product Categories
                </label>
                <input
                  type="text"
                  value={form.suppliedCategories}
                  onChange={(e) =>
                    setForm({ ...form, suppliedCategories: e.target.value })
                  }
                  placeholder="e.g., Cooking Oils, Laundry Soaps"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank / M-Pesa Paybill Details
                </label>
                <input
                  type="text"
                  value={form.bankDetails}
                  onChange={(e) =>
                    setForm({ ...form, bankDetails: e.target.value })
                  }
                  placeholder="e.g., KCB Bank A/C 1109283741 or Paybill 522522"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

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
                  {editingId ? "Update Supplier" : "Create Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
