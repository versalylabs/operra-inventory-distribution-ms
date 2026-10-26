"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdjustmentReason, AdjustmentStatus } from "@prisma/client";
import {
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Boxes,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";

export interface AdjustmentRecord {
  id: string;
  adjustmentNumber: string;
  quantityDelta: number;
  previousQuantity: number;
  newQuantity: number;
  reason: AdjustmentReason;
  status: AdjustmentStatus;
  notes: string | null;
  createdAt: string;
  approvedAt: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
    unitOfMeasure: string;
    costPrice: number;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  approvedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
}

const REASON_LABELS: Record<AdjustmentReason, string> = {
  DAMAGED_GOODS: "Damaged Goods",
  LOST_GOODS: "Lost / Missing Goods",
  EXPIRED_GOODS: "Expired Goods",
  STOCK_COUNT_CORRECTION: "Physical Stock Count Correction",
  OPENING_BALANCE: "Opening Balance Entry",
  DATA_CORRECTION: "System Data Correction",
};

export function AdjustmentsClient({
  initialAdjustments,
  products,
  warehouses,
  canAdjust,
  isManagerOrOwner,
}: {
  initialAdjustments: AdjustmentRecord[];
  products: Array<{
    id: string;
    name: string;
    sku: string;
    unitOfMeasure: string;
  }>;
  warehouses: Array<{ id: string; name: string; code: string }>;
  canAdjust: boolean;
  isManagerOrOwner: boolean;
}) {
  const router = useRouter();
  const [adjustments, setAdjustments] =
    useState<AdjustmentRecord[]>(initialAdjustments);
  const [statusFilter, setStatusFilter] = useState<"ALL" | AdjustmentStatus>(
    "ALL"
  );
  const [showModal, setShowModal] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "");
  const [adjustmentDirection, setAdjustmentDirection] = useState<
    "ADD" | "DEDUCT"
  >("DEDUCT");
  const [quantity, setQuantity] = useState("5");
  const [reason, setReason] = useState<AdjustmentReason>(
    "STOCK_COUNT_CORRECTION"
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateAdjustment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const rawQty = Math.abs(parseInt(quantity, 10) || 0);
    const quantityDelta = adjustmentDirection === "ADD" ? rawQty : -rawQty;

    try {
      const res = await fetch("/api/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          warehouseId,
          quantityDelta,
          reason,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit stock adjustment.");
        setLoading(false);
        return;
      }

      setAdjustments((prev) => [data.adjustment, ...prev]);
      setShowModal(false);
      setNotes("");
      setLoading(false);
      router.refresh();
    } catch {
      setError("Network error while submitting stock adjustment.");
      setLoading(false);
    }
  }

  async function handleReview(
    adjustmentId: string,
    decision: "APPROVED" | "REJECTED"
  ) {
    const res = await fetch("/api/inventory/adjustments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adjustmentId, decision }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to review adjustment.");
      return;
    }

    setAdjustments((prev) =>
      prev.map((a) => (a.id === adjustmentId ? data.adjustment : a))
    );
    router.refresh();
  }

  const filtered = adjustments.filter(
    (a) => statusFilter === "ALL" || a.status === statusFilter
  );

  const pendingCount = adjustments.filter(
    (a) => a.status === "PENDING_APPROVAL"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <SlidersHorizontal className="h-4 w-4" />
            Controlled Inventory Reconciliation
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Stock Adjustments & Approvals
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Record physical count corrections, damaged items, and opening balances with immutable ledger tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/inventory/stock"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Boxes className="h-4 w-4 text-slate-500" />
            View Stock Ledger
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {canAdjust && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Record Adjustment
            </button>
          )}
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-900">
              <span className="font-bold">
                {pendingCount} Sensitive Stock Adjustment(s) Pending Approval.
              </span>{" "}
              {isManagerOrOwner
                ? "Review and approve or reject them below to update warehouse stock."
                : "An Operations Manager or Organization Owner must approve these adjustments before stock is modified."}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("PENDING_APPROVAL")}
            className="text-xs font-semibold text-amber-800 underline shrink-0 cursor-pointer"
          >
            Filter Pending
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          {(["ALL", "APPROVED", "PENDING_APPROVAL", "REJECTED"] as const).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st === "ALL"
                  ? `All (${adjustments.length})`
                  : st === "PENDING_APPROVAL"
                  ? `Pending Approval (${pendingCount})`
                  : st === "APPROVED"
                  ? "Approved"
                  : "Rejected"}
              </button>
            )
          )}
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Ref # & Date</th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4 text-right">Delta</th>
                <th className="py-3.5 px-4 text-right">Stock Impact</th>
                <th className="py-3.5 px-4">Requested By</th>
                <th className="py-3.5 px-4">Status</th>
                {isManagerOrOwner && (
                  <th className="py-3.5 px-4 text-right">Review</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={isManagerOrOwner ? 9 : 8}
                    className="py-12 text-center text-slate-500"
                  >
                    No stock adjustments found.
                  </td>
                </tr>
              ) : (
                filtered.map((adj) => {
                  const isPositive = adj.quantityDelta > 0;
                  return (
                    <tr key={adj.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {adj.adjustmentNumber}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {new Date(adj.createdAt).toLocaleString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {adj.product.name}
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">
                          {adj.product.sku}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">
                          {adj.warehouse.name}
                        </span>
                        <span className="block font-mono text-[10px] text-slate-400">
                          {adj.warehouse.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">
                          {REASON_LABELS[adj.reason]}
                        </span>
                        {adj.notes && (
                          <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate">
                            {adj.notes}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            isPositive ? "text-emerald-600" : "text-red-600"
                          }
                        >
                          {isPositive
                            ? `+${adj.quantityDelta}`
                            : adj.quantityDelta}{" "}
                          {adj.product.unitOfMeasure}s
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {adj.previousQuantity} →{" "}
                        <strong className="text-slate-900">
                          {adj.newQuantity}
                        </strong>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">
                          {adj.createdBy.name}
                        </div>
                        {adj.approvedBy && (
                          <div className="text-[10px] text-slate-400">
                            Reviewed by {adj.approvedBy.name}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {adj.status === "APPROVED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Approved
                          </span>
                        )}
                        {adj.status === "PENDING_APPROVAL" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Clock className="h-3 w-3" />
                            Pending Approval
                          </span>
                        )}
                        {adj.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <XCircle className="h-3 w-3" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {isManagerOrOwner && (
                        <td className="py-3.5 px-4 text-right">
                          {adj.status === "PENDING_APPROVAL" ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleReview(adj.id, "APPROVED")
                                }
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleReview(adj.id, "REJECTED")
                                }
                                className="px-2.5 py-1 rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-semibold cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Record Stock Adjustment
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

            <form onSubmit={handleCreateAdjustment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Warehouse *
                </label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product SKU *
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.name} ({p.unitOfMeasure})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adjustment Direction *
                  </label>
                  <select
                    value={adjustmentDirection}
                    onChange={(e) =>
                      setAdjustmentDirection(
                        e.target.value as "ADD" | "DEDUCT"
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="DEDUCT">
                      Deduct Stock (− Damage / Loss / Shortage)
                    </option>
                    <option value="ADD">
                      Add Stock (+ Surplus / Opening Balance)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjustment Reason *
                </label>
                <select
                  value={reason}
                  onChange={(e) =>
                    setReason(e.target.value as AdjustmentReason)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  {Object.entries(REASON_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audit Notes / Explanation
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide details for the audit log (e.g., Broken cartons during forklift offloading)..."
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
                  Submit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
