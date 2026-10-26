"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { PurchaseOrderRecord } from "../orders/PurchaseOrdersClient";
import {
  PackageCheck,
  Plus,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";

export interface GoodsReceiptRecord {
  id: string;
  grnNumber: string;
  deliveryNoteRef: string | null;
  notes: string | null;
  totalAcceptedValue: number;
  receivedAt: string;
  purchaseOrder: { id: string; poNumber: string; status: string };
  supplier: { id: string; companyName: string; code: string };
  warehouse: { id: string; name: string; code: string };
  receivedBy: { id: string; name: string };
  items: Array<{
    id: string;
    productId: string;
    orderedQuantity: number;
    receivedQuantity: number;
    damagedQuantity: number;
    missingQuantity: number;
    unitCost: number;
    product: {
      id: string;
      name: string;
      sku: string;
      unitOfMeasure: string;
    };
  }>;
}

export function ReceivingClient({
  initialReceipts,
  receivableOrders,
  currency,
  canReceive,
  preselectedPoId,
}: {
  initialReceipts: GoodsReceiptRecord[];
  receivableOrders: PurchaseOrderRecord[];
  currency: string;
  canReceive: boolean;
  preselectedPoId?: string;
}) {
  const router = useRouter();
  const [receipts, setReceipts] =
    useState<GoodsReceiptRecord[]>(initialReceipts);

  const initialPo =
    receivableOrders.find((o) => o.id === preselectedPoId) ||
    receivableOrders[0] ||
    null;

  const [showModal, setShowModal] = useState(Boolean(preselectedPoId && initialPo));
  const [selectedPoId, setSelectedPoId] = useState(initialPo?.id || "");
  const [deliveryNoteRef, setDeliveryNoteRef] = useState("");
  const [notes, setNotes] = useState("");
  const [receiveLines, setReceiveLines] = useState<
    Record<
      string,
      {
        receivedQuantity: number;
        damagedQuantity: number;
        missingQuantity: number;
      }
    >
  >(() => buildDefaultLines(initialPo));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function buildDefaultLines(po: PurchaseOrderRecord | null) {
    if (!po) return {};
    const map: Record<
      string,
      {
        receivedQuantity: number;
        damagedQuantity: number;
        missingQuantity: number;
      }
    > = {};
    for (const item of po.items) {
      const remaining = Math.max(
        0,
        item.orderedQuantity - item.receivedQuantity - item.damagedQuantity
      );
      map[item.productId] = {
        receivedQuantity: remaining,
        damagedQuantity: 0,
        missingQuantity: 0,
      };
    }
    return map;
  }

  function handleSelectPo(newPoId: string) {
    setSelectedPoId(newPoId);
    const found = receivableOrders.find((o) => o.id === newPoId) || null;
    setReceiveLines(buildDefaultLines(found));
  }

  const activePo =
    receivableOrders.find((o) => o.id === selectedPoId) || null;

  async function handleRecordGRN(e: React.FormEvent) {
    e.preventDefault();
    if (!activePo) return;
    setError("");
    setLoading(true);

    const payloadItems = activePo.items.map((item) => {
      const entry = receiveLines[item.productId] || {
        receivedQuantity: 0,
        damagedQuantity: 0,
        missingQuantity: 0,
      };
      return {
        productId: item.productId,
        receivedQuantity: entry.receivedQuantity,
        damagedQuantity: entry.damagedQuantity,
        missingQuantity: entry.missingQuantity,
      };
    });

    try {
      const res = await fetch("/api/purchasing/receiving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseOrderId: activePo.id,
          deliveryNoteRef,
          notes,
          items: payloadItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to record goods receipt.");
        setLoading(false);
        return;
      }

      setReceipts((prev) => [data.receipt, ...prev]);
      setShowModal(false);
      setDeliveryNoteRef("");
      setNotes("");
      setLoading(false);
      router.refresh();
    } catch {
      setError("Network error while recording goods receipt.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <PackageCheck className="h-4 w-4" />
            Warehouse Inbound Dock Verification
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Goods Receiving Notes (GRN)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Reconcile Ordered vs. Received, Damaged, and Missing quantities to update stock accurately.
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
          {canReceive && receivableOrders.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Receive Goods Against PO ({receivableOrders.length} Open)
            </button>
          )}
        </div>
      </div>

      {/* Open POs Ready for Receiving Banner */}
      {receivableOrders.length > 0 && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-indigo-950">
              {receivableOrders.length} Purchase Order(s) Awaiting Warehouse Dock Receipt
            </p>
            <p className="text-xs text-indigo-700 mt-0.5">
              Stock is incremented strictly by the actual verified{" "}
              <strong>Received Quantity</strong>, while Damaged units are logged separately.
            </p>
          </div>
          {canReceive && (
            <div className="flex flex-wrap gap-2">
              {receivableOrders.slice(0, 3).map((po) => (
                <button
                  key={po.id}
                  type="button"
                  onClick={() => {
                    handleSelectPo(po.id);
                    setShowModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 hover:border-indigo-400 text-xs font-semibold text-indigo-700 shadow-2xs cursor-pointer"
                >
                  Receive {po.poNumber} ({po.supplier.companyName})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GRN History List */}
      <div className="space-y-4">
        {receipts.map((grn) => (
          <div
            key={grn.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                    {grn.grnNumber}
                  </span>
                  <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {grn.purchaseOrder.poNumber}
                  </span>
                  {grn.deliveryNoteRef && (
                    <span className="text-xs text-slate-500">
                      Supplier D/N: <strong>{grn.deliveryNoteRef}</strong>
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-bold text-slate-900 mt-1">
                  {grn.supplier.companyName} → {grn.warehouse.name} (
                  {grn.warehouse.code})
                </h2>
              </div>

              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">
                  Accepted Value:{" "}
                  {formatCurrency(grn.totalAcceptedValue, currency)}
                </p>
                <p className="text-[11px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  {new Date(grn.receivedAt).toLocaleString()} • Verified by{" "}
                  {grn.receivedBy.name}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-[10px] font-semibold uppercase text-slate-500">
                    <th className="py-2 px-3">Product & SKU</th>
                    <th className="py-2 px-3 text-right">Ordered</th>
                    <th className="py-2 px-3 text-right">
                      Received (Added to Stock)
                    </th>
                    <th className="py-2 px-3 text-right">Damaged</th>
                    <th className="py-2 px-3 text-right">Missing / Short</th>
                    <th className="py-2 px-3 text-right">Reconciliation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grn.items.map((item) => {
                    const hasDiscrepancy =
                      item.damagedQuantity > 0 || item.missingQuantity > 0;
                    return (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900">
                            {item.product.name}
                          </span>{" "}
                          <span className="font-mono text-[10px] text-slate-500">
                            ({item.product.sku})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {item.orderedQuantity} {item.product.unitOfMeasure}s
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          +{item.receivedQuantity} {item.product.unitOfMeasure}s
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-red-600">
                          {item.damagedQuantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                          {item.missingQuantity}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {hasDiscrepancy ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="h-3 w-3" />
                              Discrepancy Logged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3" />
                              100% Match
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {grn.notes && (
              <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                <strong>Dock Notes:</strong> {grn.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Record GRN Modal */}
      {showModal && activePo && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Record Goods Receipt (GRN)
                </h2>
                <p className="text-xs text-slate-500">
                  Verify physical quantities arriving at the warehouse dock.
                </p>
              </div>
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

            <form onSubmit={handleRecordGRN} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Open Purchase Order *
                  </label>
                  <select
                    value={selectedPoId}
                    onChange={(e) => handleSelectPo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-semibold"
                  >
                    {receivableOrders.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.poNumber} — {po.supplier.companyName} (→{" "}
                        {po.warehouse.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier Delivery Note #
                  </label>
                  <input
                    type="text"
                    value={deliveryNoteRef}
                    onChange={(e) => setDeliveryNoteRef(e.target.value)}
                    placeholder="e.g., DN-88412"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Quantities Verification Table (Ordered / Received / Damaged / Missing per Section 17) */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full min-w-[500px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold uppercase text-slate-500">
                      <th className="py-2.5 px-3">Product SKU</th>
                      <th className="py-2.5 px-3 text-center">Ordered</th>
                      <th className="py-2.5 px-3 text-center">
                        Received (Good)
                      </th>
                      <th className="py-2.5 px-3 text-center">Damaged</th>
                      <th className="py-2.5 px-3 text-center">Missing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activePo.items.map((item) => {
                      const entry = receiveLines[item.productId] || {
                        receivedQuantity: 0,
                        damagedQuantity: 0,
                        missingQuantity: 0,
                      };
                      return (
                        <tr key={item.id}>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">
                              {item.product.name}
                            </div>
                            <span className="font-mono text-[10px] text-slate-500">
                              {item.product.sku} ({item.product.unitOfMeasure})
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                            {item.orderedQuantity}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              value={entry.receivedQuantity}
                              onChange={(e) =>
                                setReceiveLines((prev) => ({
                                  ...prev,
                                  [item.productId]: {
                                    ...entry,
                                    receivedQuantity:
                                      parseInt(e.target.value, 10) || 0,
                                  },
                                }))
                              }
                              className="w-20 px-2 py-1 text-center rounded border border-emerald-300 bg-emerald-50/40 font-mono font-bold text-emerald-800"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              value={entry.damagedQuantity}
                              onChange={(e) =>
                                setReceiveLines((prev) => ({
                                  ...prev,
                                  [item.productId]: {
                                    ...entry,
                                    damagedQuantity:
                                      parseInt(e.target.value, 10) || 0,
                                  },
                                }))
                              }
                              className="w-16 px-2 py-1 text-center rounded border border-red-200 bg-red-50/30 font-mono text-red-700"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              value={entry.missingQuantity}
                              onChange={(e) =>
                                setReceiveLines((prev) => ({
                                  ...prev,
                                  [item.productId]: {
                                    ...entry,
                                    missingQuantity:
                                      parseInt(e.target.value, 10) || 0,
                                  },
                                }))
                              }
                              className="w-16 px-2 py-1 text-center rounded border border-amber-200 bg-amber-50/30 font-mono text-amber-800"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inspection / Discrepancy Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Received 95 good units, 3 damaged cartons set aside for supplier credit note, 2 missing."
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
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Receipt & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
