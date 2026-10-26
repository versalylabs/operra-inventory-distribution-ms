"use client";

import { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeftRight,
  Plus,
  Search,
  Warehouse,
  Truck,
  PackageCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Eye,
  X,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

type StockTransferStatus =
  | "DRAFT"
  | "REQUESTED"
  | "APPROVED"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "RECEIVED"
  | "CANCELLED";

interface TransferLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitOfMeasure: string;
  requestedQuantity: number;
  dispatchedQuantity: number;
  receivedQuantity: number;
  damagedQuantity: number;
  unitCost: number;
  lineValue: number;
}

interface StockTransferRecord {
  id: string;
  transferNumber: string;
  sourceWarehouseId: string;
  sourceWarehouse: {
    id: string;
    code: string;
    name: string;
    location: string;
  };
  destinationWarehouseId: string;
  destinationWarehouse: {
    id: string;
    code: string;
    name: string;
    location: string;
  };
  status: StockTransferStatus;
  driverName: string | null;
  vehicleRef: string | null;
  notes: string | null;
  requestedBy: { id: string; name: string };
  approvedBy: { id: string; name: string } | null;
  dispatchedBy: { id: string; name: string } | null;
  receivedBy: { id: string; name: string } | null;
  approvedAt: string | null;
  dispatchedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  totalRequestedUnits: number;
  totalDispatchedUnits: number;
  totalReceivedUnits: number;
  totalDamagedUnits: number;
  totalValue: number;
  items: TransferLineItem[];
}

interface WarehouseOption {
  id: string;
  code: string;
  name: string;
  location: string;
  isDefault: boolean;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unitOfMeasure: string;
  costPrice: number;
  stockByWarehouse: {
    warehouseId: string;
    currentStock: number;
    reservedStock: number;
    incomingStock: number;
    availableStock: number;
  }[];
}

const TRANSFER_STATUS_CONFIG: Record<
  StockTransferStatus,
  { label: string; style: string; step: number }
> = {
  DRAFT: {
    label: "Draft",
    style: "bg-slate-100 text-slate-700 border-slate-200",
    step: 1,
  },
  REQUESTED: {
    label: "Requested (Reserved)",
    style: "bg-amber-50 text-amber-700 border-amber-200",
    step: 1,
  },
  APPROVED: {
    label: "Approved (Ready to Load)",
    style: "bg-indigo-50 text-indigo-700 border-indigo-200",
    step: 2,
  },
  DISPATCHED: {
    label: "Dispatched",
    style: "bg-blue-50 text-blue-700 border-blue-200",
    step: 3,
  },
  IN_TRANSIT: {
    label: "In Transit",
    style: "bg-blue-50 text-blue-700 border-blue-200",
    step: 3,
  },
  RECEIVED: {
    label: "Received at Destination",
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
    step: 4,
  },
  CANCELLED: {
    label: "Cancelled",
    style: "bg-rose-50 text-rose-700 border-rose-200",
    step: 0,
  },
};

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState<StockTransferRecord[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Create Transfer Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [vehicleRef, setVehicleRef] = useState("");
  const [notes, setNotes] = useState("");
  const [dispatchImmediately, setDispatchImmediately] = useState(true);
  const [lineItems, setLineItems] = useState<
    { productId: string; requestedQuantity: number }[]
  >([]);

  // Inspect / Process Modal state
  const [activeTransfer, setActiveTransfer] =
    useState<StockTransferRecord | null>(null);
  const [receivingQuantities, setReceivingQuantities] = useState<
    Record<string, { receivedQuantity: number; damagedQuantity: number }>
  >({});

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function fetchTransfersData() {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/transfers");
      const data = await res.json();
      if (res.ok) {
        setTransfers(data.transfers || []);
        setWarehouses(data.warehouses || []);
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Failed to fetch stock transfers:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransfersData();
  }, []);

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        t.status === statusFilter ||
        (statusFilter === "IN_TRANSIT" && t.status === "DISPATCHED");
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.transferNumber.toLowerCase().includes(q) ||
        t.sourceWarehouse.name.toLowerCase().includes(q) ||
        t.destinationWarehouse.name.toLowerCase().includes(q) ||
        (t.driverName && t.driverName.toLowerCase().includes(q)) ||
        (t.vehicleRef && t.vehicleRef.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [transfers, statusFilter, search]);

  const metrics = useMemo(() => {
    const inTransitList = transfers.filter(
      (t) => t.status === "IN_TRANSIT" || t.status === "DISPATCHED"
    );
    const inTransitValue = inTransitList.reduce(
      (sum, t) => sum + t.totalValue,
      0
    );
    const inTransitUnits = inTransitList.reduce(
      (sum, t) => sum + t.totalDispatchedUnits,
      0
    );
    const pendingApprovalOrDispatch = transfers.filter(
      (t) => t.status === "REQUESTED" || t.status === "APPROVED"
    ).length;
    const completedCount = transfers.filter(
      (t) => t.status === "RECEIVED"
    ).length;

    return {
      inTransitCount: inTransitList.length,
      inTransitValue,
      inTransitUnits,
      pendingApprovalOrDispatch,
      completedCount,
    };
  }, [transfers]);

  function getWarehouseStock(productId: string, warehouseId: string) {
    const prod = products.find((p) => p.id === productId);
    if (!prod)
      return {
        currentStock: 0,
        reservedStock: 0,
        incomingStock: 0,
        availableStock: 0,
      };
    const entry = prod.stockByWarehouse.find(
      (s) => s.warehouseId === warehouseId
    );
    return (
      entry || {
        currentStock: 0,
        reservedStock: 0,
        incomingStock: 0,
        availableStock: 0,
      }
    );
  }

  function openCreateModal() {
    setErrorMsg(null);
    const firstWh = warehouses[0]?.id || "";
    const secondWh = warehouses[1]?.id || warehouses[0]?.id || "";
    const firstProd = products[0];

    setSourceWarehouseId(firstWh);
    setDestinationWarehouseId(secondWh);
    setDriverName("John Kamau");
    setVehicleRef("KDD 412P — Isuzu FRR");
    setNotes("");
    setDispatchImmediately(true);
    setLineItems(
      firstProd
        ? [{ productId: firstProd.id, requestedQuantity: 20 }]
        : []
    );
    setCreateOpen(true);
  }

  function addLineItem() {
    const used = new Set(lineItems.map((l) => l.productId));
    const nextProd = products.find((p) => !used.has(p.id)) || products[0];
    if (!nextProd) return;
    setLineItems([
      ...lineItems,
      { productId: nextProd.id, requestedQuantity: 10 },
    ]);
  }

  function removeLineItem(index: number) {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  function openInspectModal(transfer: StockTransferRecord) {
    setErrorMsg(null);
    const initialMap: Record<
      string,
      { receivedQuantity: number; damagedQuantity: number }
    > = {};
    for (const item of transfer.items) {
      const expected =
        item.dispatchedQuantity > 0
          ? item.dispatchedQuantity
          : item.requestedQuantity;
      initialMap[item.productId] = {
        receivedQuantity:
          transfer.status === "RECEIVED" ? item.receivedQuantity : expected,
        damagedQuantity:
          transfer.status === "RECEIVED" ? item.damagedQuantity : 0,
      };
    }
    setReceivingQuantities(initialMap);
    setActiveTransfer(transfer);
  }

  const totalDraftValue = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const prod = products.find((p) => p.id === item.productId);
      return sum + (prod ? prod.costPrice * item.requestedQuantity : 0);
    }, 0);
  }, [lineItems, products]);

  async function handleCreateTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (sourceWarehouseId === destinationWarehouseId) {
      setErrorMsg(
        "Source warehouse and destination warehouse must be different."
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/inventory/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceWarehouseId,
          destinationWarehouseId,
          driverName,
          vehicleRef,
          notes,
          dispatchImmediately,
          items: lineItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to create stock transfer.");
      } else {
        setCreateOpen(false);
        setSuccessMsg(
          dispatchImmediately
            ? `Transfer ${data.transfer.transferNumber} dispatched! Source stock deducted & destination incoming stock updated.`
            : `Transfer ${data.transfer.transferNumber} created & source stock reserved.`
        );
        setTimeout(() => setSuccessMsg(null), 4500);
        fetchTransfersData();
      }
    } catch {
      setErrorMsg("Network error while creating stock transfer.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTransferAction(
    transferId: string,
    action: "APPROVE" | "DISPATCH" | "RECEIVE" | "CANCEL"
  ) {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const receivedItems =
        action === "RECEIVE" && activeTransfer
          ? activeTransfer.items.map((item) => ({
              productId: item.productId,
              receivedQuantity:
                receivingQuantities[item.productId]?.receivedQuantity ??
                item.dispatchedQuantity,
              damagedQuantity:
                receivingQuantities[item.productId]?.damagedQuantity ?? 0,
            }))
          : undefined;

      const res = await fetch("/api/inventory/transfers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transferId,
          action,
          receivedItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to process stock transfer action.");
      } else {
        const actionLabels = {
          APPROVE: "Transfer approved and ready for loading.",
          DISPATCH:
            "Consignment dispatched! Source stock deducted & destination incoming stock incremented.",
          RECEIVE:
            "Consignment received at destination warehouse! Stock ledger updated.",
          CANCEL: "Transfer cancelled and reserved stock released.",
        };
        setSuccessMsg(actionLabels[action]);
        setTimeout(() => setSuccessMsg(null), 4500);
        setActiveTransfer(null);
        fetchTransfersData();
      }
    } catch {
      setErrorMsg("Network error while updating stock transfer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Inter-Warehouse Stock Transfers
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Multi-Depot Logistics
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Move inventory between regional depots with full request, approval, in-transit tracking, and destination receiving verification.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Stock Transfer
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Consignments In Transit
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.inTransitCount} Active
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {metrics.inTransitUnits.toLocaleString()} units currently moving between depots
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Value In Transit
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-700 mt-2">
            {formatCurrency(metrics.inTransitValue)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Cost valuation of dispatched inter-depot stock
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Awaiting Dispatch
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {metrics.pendingApprovalOrDispatch}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Requested or approved transfers staged at source
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Completed Transfers
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {metrics.completedCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Verified & received into destination warehouses
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "ALL", label: `All Transfers (${transfers.length})` },
            {
              key: "REQUESTED",
              label: `Requested (${transfers.filter((t) => t.status === "REQUESTED").length})`,
            },
            {
              key: "APPROVED",
              label: `Approved (${transfers.filter((t) => t.status === "APPROVED").length})`,
            },
            {
              key: "IN_TRANSIT",
              label: `In Transit (${transfers.filter((t) => t.status === "IN_TRANSIT" || t.status === "DISPATCHED").length})`,
            },
            {
              key: "RECEIVED",
              label: `Received (${transfers.filter((t) => t.status === "RECEIVED").length})`,
            },
            {
              key: "CANCELLED",
              label: `Cancelled (${transfers.filter((t) => t.status === "CANCELLED").length})`,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transfer #, depot, vehicle, driver..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading inter-warehouse transfers...
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowLeftRight className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              No stock transfers found
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Create a stock transfer to move inventory between Nairobi Main, Industrial Area Depot, or Mombasa Warehouse.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Transfer # & Date</th>
                  <th className="py-3.5 px-4">Source → Destination Route</th>
                  <th className="py-3.5 px-4">Transit Vehicle & Driver</th>
                  <th className="py-3.5 px-4">Items & Units</th>
                  <th className="py-3.5 px-4 text-right">Stock Valuation</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTransfers.map((transfer) => {
                  const statusCfg = TRANSFER_STATUS_CONFIG[transfer.status];
                  return (
                    <tr
                      key={transfer.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">
                          {transfer.transferNumber}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(transfer.createdAt).toLocaleDateString(
                            "en-KE",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          By: {transfer.requestedBy.name}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-semibold text-slate-900 text-xs">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-800">
                            <Warehouse className="w-3 h-3 text-slate-500" />
                            {transfer.sourceWarehouse.name}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 text-indigo-800 border border-indigo-100">
                            <Warehouse className="w-3 h-3 text-indigo-600" />
                            {transfer.destinationWarehouse.name}
                          </span>
                        </div>
                        {transfer.notes && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {transfer.notes}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {transfer.vehicleRef || transfer.driverName ? (
                          <div>
                            <div className="text-xs font-medium text-slate-800 flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-slate-400" />
                              {transfer.vehicleRef || "Assigned Vehicle"}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Driver: {transfer.driverName || "—"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Pending vehicle assignment
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-semibold text-slate-800">
                          {transfer.items.length} SKU
                          {transfer.items.length > 1 ? "s" : ""} (
                          {transfer.totalRequestedUnits} units)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {transfer.status === "RECEIVED" ? (
                            <span className="text-emerald-700 font-medium">
                              {transfer.totalReceivedUnits} received
                              {transfer.totalDamagedUnits > 0
                                ? ` • ${transfer.totalDamagedUnits} damaged`
                                : ""}
                            </span>
                          ) : transfer.status === "IN_TRANSIT" ||
                            transfer.status === "DISPATCHED" ? (
                            <span className="text-blue-700 font-medium">
                              {transfer.totalDispatchedUnits} units in transit
                            </span>
                          ) : (
                            <span>Staged at {transfer.sourceWarehouse.code}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        {formatCurrency(transfer.totalValue)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.style}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openInspectModal(transfer)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {transfer.status === "IN_TRANSIT" ||
                          transfer.status === "DISPATCHED"
                            ? "Receive Stock"
                            : "Manage"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Stock Transfer Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Initiate Inter-Warehouse Stock Transfer
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compare live depot stock levels side-by-side and dispatch or reserve inventory for transfer.
                </p>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-6 space-y-5">
              {errorMsg && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Source & Destination Warehouse Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Source Warehouse (Dispatch From) *
                  </label>
                  <select
                    required
                    value={sourceWarehouseId}
                    onChange={(e) => setSourceWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-medium text-slate-900"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1 flex justify-center pb-1">
                  <button
                    type="button"
                    title="Swap Source and Destination"
                    onClick={() => {
                      const temp = sourceWarehouseId;
                      setSourceWarehouseId(destinationWarehouseId);
                      setDestinationWarehouseId(temp);
                    }}
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Warehouse (Receive At) *
                  </label>
                  <select
                    required
                    value={destinationWarehouseId}
                    onChange={(e) => setDestinationWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-medium text-slate-900"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Transit Vehicle & Driver Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Driver Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g., John Kamau"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vehicle Registration & Type
                  </label>
                  <input
                    type="text"
                    value={vehicleRef}
                    onChange={(e) => setVehicleRef(e.target.value)}
                    placeholder="e.g., KDD 412P — Isuzu FRR"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transfer Reason / Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Weekly branch stock rebalancing"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Products to Transfer
                  </label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Product Line
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-x-auto">
                  <table className="w-full min-w-[550px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                        <th className="py-2.5 px-3">Product & SKU</th>
                        <th className="py-2.5 px-3">Source Available</th>
                        <th className="py-2.5 px-3">Destination On-Hand</th>
                        <th className="py-2.5 px-3 w-28">Transfer Qty</th>
                        <th className="py-2.5 px-3 text-right">Valuation</th>
                        <th className="py-2.5 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {lineItems.map((line, index) => {
                        const prod = products.find(
                          (p) => p.id === line.productId
                        );
                        const sourceStock = getWarehouseStock(
                          line.productId,
                          sourceWarehouseId
                        );
                        const destStock = getWarehouseStock(
                          line.productId,
                          destinationWarehouseId
                        );
                        const exceedsSource =
                          line.requestedQuantity > sourceStock.availableStock;
                        const lineVal =
                          (prod?.costPrice || 0) * line.requestedQuantity;

                        return (
                          <tr key={index}>
                            <td className="py-2.5 px-3">
                              <select
                                value={line.productId}
                                onChange={(e) => {
                                  const copy = [...lineItems];
                                  copy[index].productId = e.target.value;
                                  setLineItems(copy);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-800"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.sku})
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${
                                  exceedsSource
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {sourceStock.availableStock} avail
                              </span>
                              <span className="text-[11px] text-slate-400 ml-1.5">
                                ({sourceStock.currentStock} total)
                              </span>
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="font-medium text-slate-700">
                                {destStock.currentStock} on hand
                              </span>
                              {destStock.incomingStock > 0 && (
                                <span className="text-[11px] text-blue-600 ml-1.5">
                                  (+{destStock.incomingStock} incoming)
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="1"
                                required
                                value={line.requestedQuantity}
                                onChange={(e) => {
                                  const copy = [...lineItems];
                                  copy[index].requestedQuantity = Math.max(
                                    1,
                                    Number(e.target.value)
                                  );
                                  setLineItems(copy);
                                }}
                                className={`w-full px-2.5 py-1.5 rounded-lg border font-semibold ${
                                  exceedsSource
                                    ? "border-rose-300 bg-rose-50/40 text-rose-800"
                                    : "border-slate-200 text-slate-900"
                                }`}
                              />
                            </td>

                            <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                              {formatCurrency(lineVal)}
                            </td>

                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeLineItem(index)}
                                disabled={lineItems.length <= 1}
                                className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 cursor-pointer max-w-xl">
                  <input
                    type="checkbox"
                    checked={dispatchImmediately}
                    onChange={(e) =>
                      setDispatchImmediately(e.target.checked)
                    }
                    className="mt-0.5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-indigo-950">
                      Approve & Dispatch Consignment Immediately (Mark In-Transit)
                    </span>
                    <span className="block text-[11px] text-indigo-700 mt-0.5">
                      Immediately deducts stock from the source warehouse (`TRANSFER_OUT`) and adds it to destination `incomingStock`. Uncheck to stage as Approved/Requested without deducting physical stock yet.
                    </span>
                  </div>
                </label>

                <div className="text-right">
                  <span className="text-xs uppercase font-semibold text-slate-400 block">
                    Total Transfer Valuation
                  </span>
                  <span className="text-xl font-bold text-slate-900">
                    {formatCurrency(totalDraftValue)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium shadow-xs cursor-pointer"
                >
                  {submitting
                    ? "Processing..."
                    : dispatchImmediately
                    ? "Dispatch Stock Transfer Now"
                    : "Create Transfer & Reserve Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect / Dispatch / Receive Transfer Modal */}
      {activeTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-slate-900 font-mono">
                    {activeTransfer.transferNumber}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      TRANSFER_STATUS_CONFIG[activeTransfer.status].style
                    }`}
                  >
                    {TRANSFER_STATUS_CONFIG[activeTransfer.status].label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Route: <strong>{activeTransfer.sourceWarehouse.name}</strong>{" "}
                  → <strong>{activeTransfer.destinationWarehouse.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setActiveTransfer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Visual Progress Stepper */}
              {activeTransfer.status !== "CANCELLED" && (
                <div className="grid grid-cols-4 gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  {[
                    { step: 1, label: "1. Requested" },
                    { step: 2, label: "2. Approved" },
                    { step: 3, label: "3. Dispatched / In Transit" },
                    { step: 4, label: "4. Received at Destination" },
                  ].map((s) => {
                    const currentStep =
                      TRANSFER_STATUS_CONFIG[activeTransfer.status].step;
                    const active = currentStep >= s.step;
                    return (
                      <div key={s.step} className="space-y-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            active ? "bg-indigo-600" : "bg-slate-200"
                          }`}
                        />
                        <span
                          className={`block text-[11px] font-semibold ${
                            active ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Route & Logistics Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">
                    Source → Destination
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {activeTransfer.sourceWarehouse.name} →{" "}
                    {activeTransfer.destinationWarehouse.name}
                  </p>
                  <p className="text-slate-500">
                    Requested by: {activeTransfer.requestedBy.name}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">
                    Transit Logistics
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {activeTransfer.vehicleRef || "Standard Fleet Truck"}
                  </p>
                  <p className="text-slate-500">
                    Driver: {activeTransfer.driverName || "Assigned Driver"}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">
                    Valuation & Audit
                  </span>
                  <p className="font-bold text-indigo-700 text-sm mt-0.5">
                    {formatCurrency(activeTransfer.totalValue)}
                  </p>
                  <p className="text-slate-500 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    {activeTransfer.receivedBy
                      ? `Received by ${activeTransfer.receivedBy.name}`
                      : activeTransfer.dispatchedBy
                      ? `Dispatched by ${activeTransfer.dispatchedBy.name}`
                      : "Pending dispatch"}
                  </p>
                </div>
              </div>

              {/* Items & Destination Receiving Verification Table */}
              <div className="rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full min-w-[550px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                      <th className="py-2.5 px-4">Product & SKU</th>
                      <th className="py-2.5 px-4 text-center">Requested</th>
                      <th className="py-2.5 px-4 text-center">Dispatched</th>
                      {(activeTransfer.status === "IN_TRANSIT" ||
                        activeTransfer.status === "DISPATCHED" ||
                        activeTransfer.status === "RECEIVED") && (
                        <>
                          <th className="py-2.5 px-4 text-center">
                            Good Received Qty
                          </th>
                          <th className="py-2.5 px-4 text-center">
                            Damaged in Transit
                          </th>
                        </>
                      )}
                      <th className="py-2.5 px-4 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {activeTransfer.items.map((item) => {
                      const isEditableReceive =
                        activeTransfer.status === "IN_TRANSIT" ||
                        activeTransfer.status === "DISPATCHED";
                      const recState = receivingQuantities[item.productId] || {
                        receivedQuantity: item.dispatchedQuantity,
                        damagedQuantity: 0,
                      };

                      return (
                        <tr key={item.id}>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">
                              {item.productName}
                            </div>
                            <div className="text-slate-400 font-mono text-[11px]">
                              {item.sku}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-slate-700">
                            {item.requestedQuantity} {item.unitOfMeasure}s
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-blue-700">
                            {item.dispatchedQuantity}
                          </td>

                          {(isEditableReceive ||
                            activeTransfer.status === "RECEIVED") && (
                            <>
                              <td className="py-3 px-4 text-center">
                                {isEditableReceive ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max={item.dispatchedQuantity}
                                    value={recState.receivedQuantity}
                                    onChange={(e) => {
                                      const val = Math.max(
                                        0,
                                        Number(e.target.value)
                                      );
                                      setReceivingQuantities({
                                        ...receivingQuantities,
                                        [item.productId]: {
                                          ...recState,
                                          receivedQuantity: val,
                                        },
                                      });
                                    }}
                                    className="w-20 px-2 py-1 text-center rounded border border-emerald-300 bg-emerald-50/40 font-bold text-emerald-900"
                                  />
                                ) : (
                                  <span className="font-bold text-emerald-700">
                                    {item.receivedQuantity}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {isEditableReceive ? (
                                  <input
                                    type="number"
                                    min="0"
                                    value={recState.damagedQuantity}
                                    onChange={(e) => {
                                      const val = Math.max(
                                        0,
                                        Number(e.target.value)
                                      );
                                      setReceivingQuantities({
                                        ...receivingQuantities,
                                        [item.productId]: {
                                          ...recState,
                                          damagedQuantity: val,
                                        },
                                      });
                                    }}
                                    className="w-20 px-2 py-1 text-center rounded border border-amber-300 bg-amber-50/40 font-semibold text-amber-900"
                                  />
                                ) : (
                                  <span className="font-medium text-amber-700">
                                    {item.damagedQuantity}
                                  </span>
                                )}
                              </td>
                            </>
                          )}

                          <td className="py-3 px-4 text-right font-semibold text-slate-900">
                            {formatCurrency(item.lineValue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div>
                  {(activeTransfer.status === "REQUESTED" ||
                    activeTransfer.status === "APPROVED") && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        handleTransferAction(activeTransfer.id, "CANCEL")
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel & Release Source Reservation
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {activeTransfer.status === "REQUESTED" && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        handleTransferAction(activeTransfer.id, "APPROVE")
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve Transfer Request
                    </button>
                  )}

                  {(activeTransfer.status === "REQUESTED" ||
                    activeTransfer.status === "APPROVED") && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        handleTransferAction(activeTransfer.id, "DISPATCH")
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Dispatch Consignment (Deduct Source Stock)
                    </button>
                  )}

                  {(activeTransfer.status === "IN_TRANSIT" ||
                    activeTransfer.status === "DISPATCHED") && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        handleTransferAction(activeTransfer.id, "RECEIVE")
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      Confirm Receipt at {activeTransfer.destinationWarehouse.name}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTransfer(null)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
