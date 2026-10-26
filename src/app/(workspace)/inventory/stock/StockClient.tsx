"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { StockMovementType } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import {
  Boxes,
  Search,
  Warehouse,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  History,
  SlidersHorizontal,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
} from "lucide-react";

export interface StockItemRecord {
  id: string;
  productId: string;
  warehouseId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  incomingStock: number;
  damagedStock: number;
  stockValue: number;
  health: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    unitOfMeasure: string;
    costPrice: number;
    sellingPrice: number;
    minStockLevel: number;
    reorderLevel: number;
    categoryName: string;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
}

export interface StockMovementRecord {
  id: string;
  movementType: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    unitOfMeasure: string;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

const MOVEMENT_TYPE_BADGES: Record<
  StockMovementType,
  { label: string; style: string }
> = {
  OPENING_BALANCE: {
    label: "Opening Balance",
    style: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  PURCHASE_RECEIPT: {
    label: "Purchase Receipt",
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  SALE: {
    label: "Sales Order",
    style: "bg-blue-50 text-blue-700 border-blue-200",
  },
  RETURN: {
    label: "Customer Return",
    style: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  TRANSFER_OUT: {
    label: "Transfer Out",
    style: "bg-amber-50 text-amber-700 border-amber-200",
  },
  TRANSFER_IN: {
    label: "Transfer In",
    style: "bg-teal-50 text-teal-700 border-teal-200",
  },
  ADJUSTMENT: {
    label: "Stock Adjustment",
    style: "bg-purple-50 text-purple-700 border-purple-200",
  },
  DAMAGE: {
    label: "Damaged Stock",
    style: "bg-red-50 text-red-700 border-red-200",
  },
  LOSS: {
    label: "Stock Loss",
    style: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export function StockClient({
  stockItems,
  movements,
  warehouses,
  currency,
  canAdjust,
  initialWarehouseFilter = "ALL",
}: {
  stockItems: StockItemRecord[];
  movements: StockMovementRecord[];
  warehouses: Array<{ id: string; name: string; code: string }>;
  currency: string;
  canAdjust: boolean;
  initialWarehouseFilter?: string;
}) {
  const [activeTab, setActiveTab] = useState<"STOCK" | "MOVEMENTS">("STOCK");
  const [warehouseFilter, setWarehouseFilter] = useState(initialWarehouseFilter);
  const [healthFilter, setHealthFilter] = useState<
    "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"
  >("ALL");
  const [movementTypeFilter, setMovementTypeFilter] = useState<
    "ALL" | StockMovementType
  >("ALL");
  const [search, setSearch] = useState("");

  const filteredStock = useMemo(() => {
    const q = search.toLowerCase().trim();
    return stockItems.filter((item) => {
      const matchesWarehouse =
        warehouseFilter === "ALL" || item.warehouseId === warehouseFilter;
      const matchesHealth =
        healthFilter === "ALL" || item.health === healthFilter;
      const matchesSearch =
        !q ||
        item.product.name.toLowerCase().includes(q) ||
        item.product.sku.toLowerCase().includes(q) ||
        item.product.categoryName.toLowerCase().includes(q) ||
        item.warehouse.name.toLowerCase().includes(q);
      return matchesWarehouse && matchesHealth && matchesSearch;
    });
  }, [stockItems, warehouseFilter, healthFilter, search]);

  const filteredMovements = useMemo(() => {
    const q = search.toLowerCase().trim();
    return movements.filter((m) => {
      const matchesWarehouse =
        warehouseFilter === "ALL" || m.warehouse.id === warehouseFilter;
      const matchesType =
        movementTypeFilter === "ALL" || m.movementType === movementTypeFilter;
      const matchesSearch =
        !q ||
        m.product.name.toLowerCase().includes(q) ||
        m.product.sku.toLowerCase().includes(q) ||
        (m.reference && m.reference.toLowerCase().includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q));
      return matchesWarehouse && matchesType && matchesSearch;
    });
  }, [movements, warehouseFilter, movementTypeFilter, search]);

  // Summary KPIs for selected warehouse filter
  const summary = useMemo(() => {
    const scoped = stockItems.filter(
      (i) => warehouseFilter === "ALL" || i.warehouseId === warehouseFilter
    );
    return {
      totalValuation: scoped.reduce((s, i) => s + i.stockValue, 0),
      totalCurrent: scoped.reduce((s, i) => s + i.currentStock, 0),
      totalReserved: scoped.reduce((s, i) => s + i.reservedStock, 0),
      totalAvailable: scoped.reduce((s, i) => s + i.availableStock, 0),
      lowStockCount: scoped.filter((i) => i.health === "LOW_STOCK").length,
      outOfStockCount: scoped.filter((i) => i.health === "OUT_OF_STOCK").length,
    };
  }, [stockItems, warehouseFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <Boxes className="h-4 w-4" />
            Real-Time Inventory & Immutable Stock Ledger
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Warehouse Stock & Movement Ledger
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Track Current, Reserved, and Available Stock (
            <code className="text-xs font-semibold text-indigo-600">
              Available = Current − Reserved
            </code>
            ) across all locations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/inventory/warehouses"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Warehouse className="h-4 w-4 text-slate-500" />
            Warehouses ({warehouses.length})
          </Link>
          {canAdjust && (
            <Link
              href="/inventory/adjustments"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              New Stock Adjustment
            </Link>
          )}
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Stock Valuation
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(summary.totalValuation, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Average Cost Basis</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Current On-Hand
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {summary.totalCurrent.toLocaleString()} Units
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Reserved: {summary.totalReserved.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Available Stock
          </p>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {summary.totalAvailable.toLocaleString()} Units
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Ready for Sales Orders
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Low Stock Alerts
          </p>
          <p className="text-xl font-bold text-amber-600 mt-1">
            {summary.lowStockCount} Records
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            At or below reorder point
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Out of Stock
          </p>
          <p className="text-xl font-bold text-red-600 mt-1">
            {summary.outOfStockCount} Records
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Requires replenishment
          </p>
        </div>
      </div>

      {/* Tabs & Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("STOCK")}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "STOCK"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Boxes className="h-3.5 w-3.5" />
              Current Warehouse Stock ({filteredStock.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("MOVEMENTS")}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "MOVEMENTS"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Immutable Stock Movement Ledger ({filteredMovements.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Warehouse:</span>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Warehouses ({warehouses.length})</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === "STOCK"
                  ? "Search by product name, SKU, category, or warehouse..."
                  : "Search ledger by SKU, reference number, or notes..."
              }
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {activeTab === "STOCK" ? (
            <select
              value={healthFilter}
              onChange={(e) =>
                setHealthFilter(
                  e.target.value as
                    | "ALL"
                    | "IN_STOCK"
                    | "LOW_STOCK"
                    | "OUT_OF_STOCK"
                )
              }
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
            >
              <option value="ALL">All Stock Health Levels</option>
              <option value="IN_STOCK">Healthy Stock</option>
              <option value="LOW_STOCK">Low Stock (≤ Reorder Point)</option>
              <option value="OUT_OF_STOCK">Out of Stock (0 Available)</option>
            </select>
          ) : (
            <select
              value={movementTypeFilter}
              onChange={(e) =>
                setMovementTypeFilter(
                  e.target.value as "ALL" | StockMovementType
                )
              }
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
            >
              <option value="ALL">All Movement Types</option>
              <option value="OPENING_BALANCE">Opening Balance</option>
              <option value="PURCHASE_RECEIPT">Purchase Receipt</option>
              <option value="SALE">Sale</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="DAMAGE">Damage</option>
              <option value="LOSS">Loss</option>
              <option value="TRANSFER_IN">Transfer In</option>
              <option value="TRANSFER_OUT">Transfer Out</option>
            </select>
          )}
        </div>
      </div>

      {/* Tab 1: Current Warehouse Stock Table */}
      {activeTab === "STOCK" ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Product & SKU</th>
                  <th className="py-3.5 px-4">Warehouse</th>
                  <th className="py-3.5 px-4 text-right">Current Stock</th>
                  <th className="py-3.5 px-4 text-right">Reserved</th>
                  <th className="py-3.5 px-4 text-right">Available Stock</th>
                  <th className="py-3.5 px-4 text-right">Incoming</th>
                  <th className="py-3.5 px-4 text-right">Damaged</th>
                  <th className="py-3.5 px-4 text-right">Stock Value</th>
                  <th className="py-3.5 px-4">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-16 text-center"
                    >
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                          <Boxes className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">
                          No stock records found
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">
                          {search || warehouseFilter !== "ALL" || healthFilter !== "ALL"
                            ? "No inventory matches your active search or filters. Try resetting your criteria."
                            : "No inventory stock levels recorded yet. Receive stock through purchase orders or add initial balances."}
                        </p>
                        {search || warehouseFilter !== "ALL" || healthFilter !== "ALL" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSearch("");
                              setWarehouseFilter("ALL");
                              setHealthFilter("ALL");
                            }}
                            className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                          >
                            Reset all filters
                          </button>
                        ) : canAdjust ? (
                          <Link
                            href="/inventory/adjustments"
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                          >
                            Record Stock Adjustment
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {item.product.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.product.sku}
                          </span>
                          <span>• {item.product.categoryName}</span>
                          <span>• {item.product.unitOfMeasure}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">
                          {item.warehouse.name}
                        </span>
                        <span className="block font-mono text-[10px] text-slate-400">
                          {item.warehouse.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                        {item.currentStock.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-amber-700">
                        {item.reservedStock > 0
                          ? item.reservedStock.toLocaleString()
                          : "0"}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-slate-900">
                        {item.availableStock.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-indigo-600">
                        {item.incomingStock > 0
                          ? `+${item.incomingStock.toLocaleString()}`
                          : "0"}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-red-600">
                        {item.damagedStock > 0
                          ? item.damagedStock.toLocaleString()
                          : "0"}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(item.stockValue, currency)}
                      </td>

                      <td className="py-3.5 px-4">
                        {item.health === "IN_STOCK" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Healthy
                          </span>
                        )}
                        {item.health === "LOW_STOCK" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="h-3 w-3" />
                            Low (≤{item.product.reorderLevel})
                          </span>
                        )}
                        {item.health === "OUT_OF_STOCK" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <XCircle className="h-3 w-3" />
                            Out of Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 2: Immutable Stock Movement Ledger */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Movement Type</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Warehouse</th>
                  <th className="py-3.5 px-4 text-right">Quantity Delta</th>
                  <th className="py-3.5 px-4 text-right">Balance Transition</th>
                  <th className="py-3.5 px-4">Reference & Notes</th>
                  <th className="py-3.5 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-16 text-center"
                    >
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                          <History className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">
                          No movement logs found
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">
                          {search || warehouseFilter !== "ALL" || movementTypeFilter !== "ALL"
                            ? "No ledger movements match your active search or filters."
                            : "All stock ins, outs, sales, and transfers will be logged here automatically."}
                        </p>
                        {(search || warehouseFilter !== "ALL" || movementTypeFilter !== "ALL") && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearch("");
                              setWarehouseFilter("ALL");
                              setMovementTypeFilter("ALL");
                            }}
                            className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                          >
                            Reset all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m) => {
                    const badge = MOVEMENT_TYPE_BADGES[m.movementType];
                    const isPositive = m.quantity > 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {new Date(m.createdAt).toLocaleString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.style}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {m.product.name}
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">
                            {m.product.sku}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800">
                            {m.warehouse.name}
                          </span>
                          <span className="block font-mono text-[10px] text-slate-400">
                            {m.warehouse.code}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold">
                          <span
                            className={`inline-flex items-center gap-0.5 ${
                              isPositive ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {isPositive ? (
                              <ArrowDownLeft className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            )}
                            {isPositive ? `+${m.quantity}` : m.quantity}{" "}
                            {m.product.unitOfMeasure}s
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                          {m.previousQuantity} →{" "}
                          <strong className="text-slate-900">
                            {m.newQuantity}
                          </strong>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          {m.reference && (
                            <span className="font-mono font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mr-1.5">
                              {m.reference}
                            </span>
                          )}
                          <span className="text-slate-600">
                            {m.notes || "—"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {m.user?.name || "System"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
