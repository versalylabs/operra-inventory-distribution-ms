"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PurchaseOrderStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  Plus,
  Search,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  PackageCheck,
  Loader2,
  AlertCircle,
  ArrowRight,
  X,
} from "lucide-react";

export interface PurchaseOrderItemRecord {
  id: string;
  productId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  damagedQuantity: number;
  unitCost: number;
  taxRate: number;
  lineTotal: number;
  product: {
    id: string;
    name: string;
    sku: string;
    unitOfMeasure: string;
  };
}

export interface PurchaseOrderRecord {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  expectedDeliveryAt: string | null;
  notes: string | null;
  createdAt: string;
  approvedAt: string | null;
  orderedAt: string | null;
  receivedAt: string | null;
  supplier: {
    id: string;
    code: string;
    companyName: string;
    phone: string | null;
  };
  warehouse: {
    id: string;
    code: string;
    name: string;
  };
  createdBy: { id: string; name: string };
  approvedBy: { id: string; name: string } | null;
  items: PurchaseOrderItemRecord[];
}

const PO_STATUS_BADGES: Record<
  PurchaseOrderStatus,
  { label: string; style: string }
> = {
  DRAFT: {
    label: "Draft",
    style: "bg-slate-100 text-slate-700 border-slate-200",
  },
  PENDING_APPROVAL: {
    label: "Pending Approval",
    style: "bg-amber-50 text-amber-700 border-amber-200",
  },
  APPROVED: {
    label: "Approved",
    style: "bg-blue-50 text-blue-700 border-blue-200",
  },
  ORDERED: {
    label: "Ordered (In Transit)",
    style: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  PARTIALLY_RECEIVED: {
    label: "Partially Received",
    style: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  RECEIVED: {
    label: "Received",
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  CANCELLED: {
    label: "Cancelled",
    style: "bg-red-50 text-red-700 border-red-200",
  },
};

export function PurchaseOrdersClient({
  initialOrders,
  suppliers,
  warehouses,
  products,
  currency,
  canCreate,
  canApprove,
  canReceive,
}: {
  initialOrders: PurchaseOrderRecord[];
  suppliers: Array<{ id: string; code: string; companyName: string }>;
  warehouses: Array<{ id: string; code: string; name: string }>;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    unitOfMeasure: string;
    costPrice: number;
    taxRate: number;
  }>;
  currency: string;
  canCreate: boolean;
  canApprove: boolean;
  canReceive: boolean;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | PurchaseOrderStatus
  >("ALL");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderRecord | null>(
    null
  );

  // Create PO Modal
  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "");
  const [expectedDeliveryAt, setExpectedDeliveryAt] = useState("");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<
    Array<{ productId: string; orderedQuantity: number; unitCost: number }>
  >([
    {
      productId: products[0]?.id || "",
      orderedQuantity: 50,
      unitCost: products[0]?.costPrice || 1000,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((po) => {
      const matchesStatus =
        statusFilter === "ALL" || po.status === statusFilter;
      const matchesSearch =
        !q ||
        po.poNumber.toLowerCase().includes(q) ||
        po.supplier.companyName.toLowerCase().includes(q) ||
        po.warehouse.name.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  function handleAddLine() {
    const nextProd = products[lines.length % products.length] || products[0];
    if (!nextProd) return;
    setLines((prev) => [
      ...prev,
      {
        productId: nextProd.id,
        orderedQuantity: 25,
        unitCost: nextProd.costPrice,
      },
    ]);
  }

  function handleRemoveLine(idx: number) {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleLineProductChange(idx: number, newProdId: string) {
    const prod = products.find((p) => p.id === newProdId);
    setLines((prev) =>
      prev.map((l, i) =>
        i === idx
          ? {
              ...l,
              productId: newProdId,
              unitCost: prod ? prod.costPrice : l.unitCost,
            }
          : l
      )
    );
  }

  async function handleCreatePO(submitForApproval: boolean) {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/purchasing/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          warehouseId,
          expectedDeliveryAt: expectedDeliveryAt || null,
          discountAmount: parseFloat(discountAmount) || 0,
          notes,
          submitForApproval,
          items: lines,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create purchase order.");
        setLoading(false);
        return;
      }

      setOrders((prev) => [data.order, ...prev]);
      setShowModal(false);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Network error while creating purchase order.");
      setLoading(false);
    }
  }

  async function handleStatusTransition(
    poId: string,
    targetStatus: PurchaseOrderStatus
  ) {
    const res = await fetch("/api/purchasing/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseOrderId: poId, status: targetStatus }),
    });

    if (res.ok) {
      const data = await res.json();
      setOrders((prev) =>
        prev.map((po) => (po.id === poId ? data.order : po))
      );
      if (selectedPO?.id === poId) {
        setSelectedPO(data.order);
      }
      router.refresh();
    }
  }

  const draftSubtotal = lines.reduce(
    (s, l) => s + l.orderedQuantity * l.unitCost,
    0
  );
  const draftTax = draftSubtotal * 0.16;
  const draftDiscount = parseFloat(discountAmount) || 0;
  const draftTotal = Math.max(0, draftSubtotal - draftDiscount + draftTax);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <ShoppingBag className="h-4 w-4" />
            Procurement & Inbound Replenishment
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Purchase Orders (PO)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Create supplier purchase orders, approve replenishment requests, and track goods arrival.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/purchasing/receiving"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <PackageCheck className="h-4 w-4 text-emerald-600" />
            Goods Receiving (GRN)
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Purchase Order
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by PO number, supplier, or destination warehouse..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "ALL" | PurchaseOrderStatus)
          }
          className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
        >
          <option value="ALL">All PO Statuses ({orders.length})</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="ORDERED">Ordered (In Transit)</option>
          <option value="PARTIALLY_RECEIVED">Partially Received</option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">PO Number & Date</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Destination Warehouse</th>
                <th className="py-3.5 px-4 text-center">Line Items</th>
                <th className="py-3.5 px-4 text-right">Total Value (Inc. Tax)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredOrders.map((po) => {
                const badge = PO_STATUS_BADGES[po.status];
                const totalOrderedUnits = po.items.reduce(
                  (s, i) => s + i.orderedQuantity,
                  0
                );
                const totalReceivedUnits = po.items.reduce(
                  (s, i) => s + i.receivedQuantity,
                  0
                );

                return (
                  <tr key={po.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => setSelectedPO(po)}
                        className="font-mono font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        {po.poNumber}
                      </button>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(po.createdAt).toLocaleDateString()} • By{" "}
                        {po.createdBy.name}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {po.supplier.companyName}
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">
                        {po.supplier.code}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">
                        {po.warehouse.name}
                      </span>
                      <span className="block font-mono text-[10px] text-slate-400">
                        {po.warehouse.code}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-slate-900">
                        {po.items.length} SKUs
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        Rec: {totalReceivedUnits} / {totalOrderedUnits} units
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(po.totalAmount, currency)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.style}`}
                      >
                        {badge.label}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {canApprove &&
                          (po.status === "DRAFT" ||
                            po.status === "PENDING_APPROVAL") && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusTransition(po.id, "ORDERED")
                              }
                              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold cursor-pointer"
                            >
                              Approve & Order
                            </button>
                          )}
                        {canReceive &&
                          (po.status === "ORDERED" ||
                            po.status === "APPROVED" ||
                            po.status === "PARTIALLY_RECEIVED") && (
                            <Link
                              href={`/purchasing/receiving?poId=${po.id}`}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold"
                            >
                              Receive Goods
                            </Link>
                          )}
                        <button
                          type="button"
                          onClick={() => setSelectedPO(po)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                          title="Inspect PO"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Detail Drawer */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded">
                      {selectedPO.poNumber}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        PO_STATUS_BADGES[selectedPO.status].style
                      }`}
                    >
                      {PO_STATUS_BADGES[selectedPO.status].label}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1.5">
                    {selectedPO.supplier.companyName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Delivering to {selectedPO.warehouse.name} (
                    {selectedPO.warehouse.code})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPO(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Line Items Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Purchase Order Line Items
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold uppercase text-slate-500">
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3 text-right">Ordered</th>
                        <th className="py-2.5 px-3 text-right">Received</th>
                        <th className="py-2.5 px-3 text-right">Damaged</th>
                        <th className="py-2.5 px-3 text-right">Unit Cost</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedPO.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">
                              {item.product.name}
                            </div>
                            <span className="font-mono text-[10px] text-slate-500">
                              {item.product.sku} • {item.product.unitOfMeasure}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">
                            {item.orderedQuantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">
                            {item.receivedQuantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-red-600">
                            {item.damagedQuantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {formatCurrency(item.unitCost, currency)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            {formatCurrency(item.lineTotal, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-slate-900 text-white rounded-xl p-5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal (Excl. Tax):</span>
                  <span className="font-mono">
                    {formatCurrency(selectedPO.subtotal, currency)}
                  </span>
                </div>
                {selectedPO.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Supplier Discount:</span>
                    <span className="font-mono">
                      -{formatCurrency(selectedPO.discountAmount, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span>VAT / Tax Amount:</span>
                  <span className="font-mono">
                    {formatCurrency(selectedPO.taxAmount, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-800">
                  <span>Total Purchase Order Value:</span>
                  <span className="font-mono text-indigo-400">
                    {formatCurrency(selectedPO.totalAmount, currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
              <div>
                {canApprove &&
                  selectedPO.status !== "RECEIVED" &&
                  selectedPO.status !== "CANCELLED" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusTransition(selectedPO.id, "CANCELLED")
                      }
                      className="text-xs font-medium text-red-600 hover:underline cursor-pointer"
                    >
                      Cancel PO
                    </button>
                  )}
              </div>
              <div className="flex gap-2">
                {canReceive &&
                  (selectedPO.status === "ORDERED" ||
                    selectedPO.status === "PARTIALLY_RECEIVED") && (
                    <Link
                      href={`/purchasing/receiving?poId=${selectedPO.id}`}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      Receive Goods Now
                    </Link>
                  )}
                <button
                  type="button"
                  onClick={() => setSelectedPO(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Create Purchase Order
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

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier *
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Warehouse *
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
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDeliveryAt}
                    onChange={(e) => setExpectedDeliveryAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Order Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer"
                  >
                    + Add Product Line
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {lines.map((line, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                    >
                      <div className="col-span-6">
                        <select
                          value={line.productId}
                          onChange={(e) =>
                            handleLineProductChange(idx, e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.sku}] {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          value={line.orderedQuantity}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((l, i) =>
                                i === idx
                                  ? {
                                      ...l,
                                      orderedQuantity:
                                        parseInt(e.target.value, 10) || 1,
                                    }
                                  : l
                              )
                            )
                          }
                          placeholder="Qty"
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          value={line.unitCost}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((l, i) =>
                                i === idx
                                  ? {
                                      ...l,
                                      unitCost: parseFloat(e.target.value) || 0,
                                    }
                                  : l
                              )
                            )
                          }
                          placeholder="Unit Cost"
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white font-mono"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier Instructions / Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Deliver before 2:00 PM at Loading Bay A"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discount ({currency})
                  </label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">
                    Subtotal: {formatCurrency(draftSubtotal, currency)} + 16%
                    VAT: {formatCurrency(draftTax, currency)}
                  </span>
                </div>
                <div className="text-sm font-bold">
                  Est. Total: {formatCurrency(draftTotal, currency)}
                </div>
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
                  type="button"
                  disabled={loading}
                  onClick={() => handleCreatePO(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleCreatePO(true)}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm & Place Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
