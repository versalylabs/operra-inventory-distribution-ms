"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Receipt,
  Plus,
  Search,
  Fuel,
  Truck,
  Warehouse,
  Wrench,
  X,
} from "lucide-react";

interface ExpenseRecord {
  id: string;
  expenseNumber: string;
  category:
    | "TRANSPORT"
    | "FUEL"
    | "WAREHOUSE"
    | "PACKAGING"
    | "REPAIRS"
    | "UTILITIES"
    | "STAFF"
    | "MISCELLANEOUS";
  amount: number;
  expenseDate: string;
  description: string;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  warehouse: { id: string; name: string; code: string } | null;
  recordedBy: { id: string; name: string; email: string };
}

interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

const CATEGORY_BADGES: Record<string, string> = {
  FUEL: "bg-amber-50 text-amber-700 border-amber-200",
  TRANSPORT: "bg-blue-50 text-blue-700 border-blue-200",
  WAREHOUSE: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PACKAGING: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REPAIRS: "bg-red-50 text-red-700 border-red-200",
  UTILITIES: "bg-cyan-50 text-cyan-700 border-cyan-200",
  STAFF: "bg-purple-50 text-purple-700 border-purple-200",
  MISCELLANEOUS: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [currency, setCurrency] = useState("KES");
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Create Expense Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState("FUEL");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("MPESA");
  const [reference, setReference] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finance/expenses");
      const data = await res.json();
      if (res.ok) {
        setExpenses(data.expenses || []);
        setWarehouses(data.warehouses || []);
        setCurrency(data.currency || "KES");
        setCanManage(Boolean(data.canManage));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          amount: Number(amount),
          description,
          paymentMethod,
          reference,
          warehouseId: warehouseId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: data.error || "Failed to record expense",
        });
      } else {
        setFeedback({
          type: "success",
          message: `Expense ${data.expense.expenseNumber} recorded in ledger.`,
        });
        setModalOpen(false);
        setAmount("");
        setDescription("");
        setReference("");
        await loadData();
      }
    } catch {
      setFeedback({ type: "error", message: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const fuelAndTransport = expenses
    .filter((e) => e.category === "FUEL" || e.category === "TRANSPORT")
    .reduce((s, e) => s + e.amount, 0);
  const warehouseAndPackaging = expenses
    .filter(
      (e) =>
        e.category === "WAREHOUSE" ||
        e.category === "PACKAGING" ||
        e.category === "UTILITIES"
    )
    .reduce((s, e) => s + e.amount, 0);
  const repairsTotal = expenses
    .filter((e) => e.category === "REPAIRS")
    .reduce((s, e) => s + e.amount, 0);

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.expenseNumber.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.reference || "").toLowerCase().includes(search.toLowerCase());

    if (categoryFilter === "ALL") return matchesSearch;
    return matchesSearch && e.category === categoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Receipt className="h-4 w-4" />
            Distribution & Depot Cost Control
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Operational Expenses Ledger
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track fleet diesel fuel, highway transport tolls, warehouse
            utilities, shrink-wrap packaging, and truck maintenance.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Record Operational Expense
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Operational Expenses
            </span>
            <Receipt className="h-4 w-4 text-slate-700" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(totalExpenses, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {expenses.length} Logged Vouchers
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fleet Fuel & Transport
            </span>
            <Fuel className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(fuelAndTransport, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Diesel & Route Dispatch Costs
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Depot, Utilities & Packaging
            </span>
            <Warehouse className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(warehouseAndPackaging, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Warehouse Overheads & Pallet Wrap
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fleet Service & Repairs
            </span>
            <Wrench className="h-4 w-4 text-red-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(repairsTotal, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Tyres, Brakes & Scheduled Service
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search voucher #, description, or M-Pesa ref..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            "ALL",
            "FUEL",
            "TRANSPORT",
            "WAREHOUSE",
            "PACKAGING",
            "REPAIRS",
            "UTILITIES",
          ].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer ${
                categoryFilter === cat
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Voucher #</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Depot / Cost Center</th>
                <th className="py-3.5 px-4">Method & Ref</th>
                <th className="py-3.5 px-4">Date & Logged By</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading operational expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-1">
                        No expense vouchers found
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">
                        {search || categoryFilter !== "ALL"
                          ? "No expense vouchers match your search or filter criteria."
                          : "No operational expenses recorded yet. Log fuel, maintenance, or depot costs."}
                      </p>
                      {search || categoryFilter !== "ALL" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            setCategoryFilter("ALL");
                          }}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                        >
                          Reset filters
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setModalOpen(true)}
                          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                        >
                          Record Expense
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {e.expenseNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          CATEGORY_BADGES[e.category] ||
                          CATEGORY_BADGES.MISCELLANEOUS
                        }`}
                      >
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {e.description}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {e.warehouse ? (
                        <span>
                          {e.warehouse.name} ({e.warehouse.code})
                        </span>
                      ) : (
                        <span className="text-slate-400">HQ / Fleet-wide</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {e.paymentMethod.replace("_", " ")}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {e.reference || "N/A"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800">
                        {new Date(e.expenseDate).toLocaleDateString("en-KE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        By {e.recordedBy.name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(e.amount, currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Record Operational Expense
                </h2>
                <p className="text-xs text-slate-500">
                  Log fleet fuel, warehouse utilities, packaging, or repairs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  >
                    <option value="FUEL">Fleet Fuel (Diesel)</option>
                    <option value="TRANSPORT">Transport & Route Tolls</option>
                    <option value="WAREHOUSE">Warehouse Operations</option>
                    <option value="PACKAGING">Packaging & Shrink Wrap</option>
                    <option value="REPAIRS">Vehicle Service & Repairs</option>
                    <option value="UTILITIES">Power, Water & Internet</option>
                    <option value="STAFF">Driver & Crew Allowances</option>
                    <option value="MISCELLANEOUS">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 18500"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 120L Diesel refill for Isuzu FVR (KDA 703Z) at TotalEnergies"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warehouse / Cost Center
                  </label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  >
                    <option value="">HQ / Fleet-wide</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  >
                    <option value="MPESA">M-Pesa Till / Paybill</option>
                    <option value="BANK_TRANSFER">Bank EFT</option>
                    <option value="CASH">Petty Cash</option>
                    <option value="CARD">Fuel Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Receipt / M-Pesa Reference
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. SHK9921LPA or ETR-88412"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Expense Voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
