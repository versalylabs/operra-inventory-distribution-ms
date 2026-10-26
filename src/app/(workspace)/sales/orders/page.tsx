"use client";

import { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingCart,
  Plus,
  Search,
  Lock,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  AlertTriangle,
  Building2,
  Warehouse,
  Trash2,
  Eye,
  X,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

type SalesOrderStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_FOR_DELIVERY"
  | "PARTIALLY_DELIVERED"
  | "DELIVERED"
  | "CANCELLED";

interface OrderLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitOfMeasure: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  lineTotal: number;
}

interface SalesOrderItem {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: {
    id: string;
    code: string;
    businessName: string;
    customerType: string;
    phone: string | null;
    city: string | null;
    creditLimit: number;
    outstandingBalance: number;
  };
  warehouseId: string;
  warehouse: {
    id: string;
    code: string;
    name: string;
  };
  salesPerson: {
    id: string;
    name: string;
  };
  status: SalesOrderStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  deliveryAddress: string | null;
  expectedDeliveryAt: string | null;
  notes: string | null;
  stockReserved: boolean;
  confirmedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  totalOrderedUnits: number;
  totalDeliveredUnits: number;
  fulfillmentPct: number;
  items: OrderLineItem[];
}

interface CustomerOption {
  id: string;
  code: string;
  businessName: string;
  customerType: string;
  address: string | null;
  deliveryAddress: string | null;
  city: string | null;
  creditLimit: number;
  outstandingBalance: number;
  status: string;
}

interface WarehouseOption {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unitOfMeasure: string;
  sellingPrice: number;
  wholesalePrice: number;
  taxRate: number;
  stockByWarehouse: {
    warehouseId: string;
    currentStock: number;
    reservedStock: number;
    availableStock: number;
  }[];
}

const ORDER_STATUS_CONFIG: Record<
  SalesOrderStatus,
  { label: string; style: string; step: number }
> = {
  DRAFT: {
    label: "Draft Quote",
    style: "bg-slate-100 text-slate-700 border-slate-200",
    step: 1,
  },
  CONFIRMED: {
    label: "Confirmed (Reserved)",
    style: "bg-indigo-50 text-indigo-700 border-indigo-200",
    step: 2,
  },
  PROCESSING: {
    label: "Picking & Packing",
    style: "bg-amber-50 text-amber-700 border-amber-200",
    step: 3,
  },
  READY_FOR_DELIVERY: {
    label: "Ready for Dispatch",
    style: "bg-blue-50 text-blue-700 border-blue-200",
    step: 4,
  },
  PARTIALLY_DELIVERED: {
    label: "Partially Delivered",
    style: "bg-purple-50 text-purple-700 border-purple-200",
    step: 4,
  },
  DELIVERED: {
    label: "Delivered",
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
    step: 5,
  },
  CANCELLED: {
    label: "Cancelled",
    style: "bg-rose-50 text-rose-700 border-rose-200",
    step: 0,
  },
};

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrderItem[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Create Order Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [expectedDeliveryAt, setExpectedDeliveryAt] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmImmediately, setConfirmImmediately] = useState(true);
  const [lineItems, setLineItems] = useState<
    {
      productId: string;
      orderedQuantity: number;
      unitPrice: number;
      discountAmount: number;
      taxRate: number;
    }[]
  >([]);

  // Inspect / Workflow Drawer state
  const [activeOrder, setActiveOrder] = useState<SalesOrderItem | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function fetchPipelineData() {
    setLoading(true);
    try {
      const res = await fetch("/api/sales/orders");
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
        setCustomers(data.customers || []);
        setWarehouses(data.warehouses || []);
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Failed to fetch sales orders:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus =
        statusFilter === "ALL" || o.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.businessName.toLowerCase().includes(q) ||
        o.customer.code.toLowerCase().includes(q) ||
        o.warehouse.name.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, search]);

  const metrics = useMemo(() => {
    const activeOrders = orders.filter(
      (o) =>
        o.status === "CONFIRMED" ||
        o.status === "PROCESSING" ||
        o.status === "READY_FOR_DELIVERY"
    );
    const pipelineValue = activeOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );
    const reservedUnits = orders
      .filter((o) => o.stockReserved)
      .reduce(
        (sum, o) => sum + (o.totalOrderedUnits - o.totalDeliveredUnits),
        0
      );
    const deliveredRevenue = orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      activeCount: activeOrders.length,
      pipelineValue,
      reservedUnits,
      deliveredRevenue,
    };
  }, [orders]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const isWholesaleTier = useMemo(() => {
    if (!selectedCustomer) return true;
    return (
      selectedCustomer.customerType === "WHOLESALE" ||
      selectedCustomer.customerType === "DISTRIBUTOR" ||
      selectedCustomer.customerType === "CORPORATE"
    );
  }, [selectedCustomer]);

  function getRecommendedPrice(product: ProductOption, wholesale: boolean) {
    return wholesale ? product.wholesalePrice : product.sellingPrice;
  }

  function getAvailableStock(productId: string, warehouseId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return { currentStock: 0, reservedStock: 0, availableStock: 0 };
    const entry = product.stockByWarehouse.find(
      (s) => s.warehouseId === warehouseId
    );
    return (
      entry || { currentStock: 0, reservedStock: 0, availableStock: 0 }
    );
  }

  function openCreateOrderModal() {
    setErrorMsg(null);
    const defaultCust =
      customers.find((c) => c.status === "ACTIVE") || customers[0];
    const defaultWh =
      warehouses.find((w) => w.isDefault) || warehouses[0];
    const firstProd = products[0];

    const wholesale =
      !defaultCust ||
      defaultCust.customerType === "WHOLESALE" ||
      defaultCust.customerType === "DISTRIBUTOR" ||
      defaultCust.customerType === "CORPORATE";

    setSelectedCustomerId(defaultCust?.id || "");
    setSelectedWarehouseId(defaultWh?.id || "");
    setDeliveryAddress(
      defaultCust?.deliveryAddress || defaultCust?.address || ""
    );
    const tomorrow = new Date(Date.now() + 86400000 * 2)
      .toISOString()
      .slice(0, 10);
    setExpectedDeliveryAt(tomorrow);
    setNotes("");
    setConfirmImmediately(true);

    if (firstProd) {
      setLineItems([
        {
          productId: firstProd.id,
          orderedQuantity: 10,
          unitPrice: getRecommendedPrice(firstProd, wholesale),
          discountAmount: 0,
          taxRate: firstProd.taxRate,
        },
      ]);
    } else {
      setLineItems([]);
    }

    setCreateOpen(true);
  }

  function handleCustomerChange(newCustomerId: string) {
    setSelectedCustomerId(newCustomerId);
    const cust = customers.find((c) => c.id === newCustomerId);
    if (cust) {
      setDeliveryAddress(cust.deliveryAddress || cust.address || "");
      const wholesale =
        cust.customerType === "WHOLESALE" ||
        cust.customerType === "DISTRIBUTOR" ||
        cust.customerType === "CORPORATE";

      // Update unit prices to match customer's tier
      setLineItems((prev) =>
        prev.map((line) => {
          const prod = products.find((p) => p.id === line.productId);
          if (!prod) return line;
          return {
            ...line,
            unitPrice: getRecommendedPrice(prod, wholesale),
          };
        })
      );
    }
  }

  function addLineItem() {
    const usedIds = new Set(lineItems.map((l) => l.productId));
    const nextProd =
      products.find((p) => !usedIds.has(p.id)) || products[0];
    if (!nextProd) return;

    setLineItems([
      ...lineItems,
      {
        productId: nextProd.id,
        orderedQuantity: 5,
        unitPrice: getRecommendedPrice(nextProd, isWholesaleTier),
        discountAmount: 0,
        taxRate: nextProd.taxRate,
      },
    ]);
  }

  function updateLineProduct(index: number, newProductId: string) {
    const prod = products.find((p) => p.id === newProductId);
    if (!prod) return;
    const copy = [...lineItems];
    copy[index] = {
      ...copy[index],
      productId: prod.id,
      unitPrice: getRecommendedPrice(prod, isWholesaleTier),
      taxRate: prod.taxRate,
    };
    setLineItems(copy);
  }

  function removeLineItem(index: number) {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  const orderTotals = useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;

    for (const item of lineItems) {
      const net = Math.max(
        0,
        item.orderedQuantity * item.unitPrice - (item.discountAmount || 0)
      );
      const tax = (net * item.taxRate) / 100;
      subtotal += net;
      taxAmount += tax;
    }

    return {
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
    };
  }, [lineItems]);

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/sales/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          warehouseId: selectedWarehouseId,
          deliveryAddress,
          expectedDeliveryAt,
          notes,
          confirmImmediately,
          items: lineItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to create sales order.");
      } else {
        setCreateOpen(false);
        setSuccessMsg(
          confirmImmediately
            ? `Sales Order ${data.order.orderNumber} confirmed & stock reserved!`
            : `Sales Order ${data.order.orderNumber} saved as Draft.`
        );
        setTimeout(() => setSuccessMsg(null), 4500);
        fetchPipelineData();
      }
    } catch {
      setErrorMsg("Network error while creating sales order.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusTransition(
    salesOrderId: string,
    targetStatus: SalesOrderStatus
  ) {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/sales/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesOrderId,
          status: targetStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update order status.");
      } else {
        setSuccessMsg(
          `Order updated to ${ORDER_STATUS_CONFIG[targetStatus].label}`
        );
        setTimeout(() => setSuccessMsg(null), 4000);
        setActiveOrder(null);
        fetchPipelineData();
      }
    } catch {
      setErrorMsg("Network error while updating order status.");
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
              Sales Order Pipeline
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Stock Reservation Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Create customer sales orders, reserve warehouse stock to prevent overselling, and track picking, packing, and delivery fulfillment.
          </p>
        </div>

        <button
          onClick={openCreateOrderModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Sales Order
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
              Active Pipeline Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(metrics.pipelineValue)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Across {metrics.activeCount} orders in fulfillment
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Reserved Stock Units
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {metrics.reservedUnits.toLocaleString()} units
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Locked for confirmed orders awaiting dispatch
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ready for Delivery
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {
              orders.filter((o) => o.status === "READY_FOR_DELIVERY")
                .length
            }
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Picked, packed & staged at loading bay
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Delivered Order Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {formatCurrency(metrics.deliveredRevenue)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Completed & deducted from physical stock
          </p>
        </div>
      </div>

      {/* Pipeline Stage Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "ALL", label: `All Orders (${orders.length})` },
            {
              key: "DRAFT",
              label: `Draft (${orders.filter((o) => o.status === "DRAFT").length})`,
            },
            {
              key: "CONFIRMED",
              label: `Confirmed (${orders.filter((o) => o.status === "CONFIRMED").length})`,
            },
            {
              key: "PROCESSING",
              label: `Picking & Packing (${orders.filter((o) => o.status === "PROCESSING").length})`,
            },
            {
              key: "READY_FOR_DELIVERY",
              label: `Ready for Dispatch (${orders.filter((o) => o.status === "READY_FOR_DELIVERY").length})`,
            },
            {
              key: "DELIVERED",
              label: `Delivered (${orders.filter((o) => o.status === "DELIVERED").length})`,
            },
            {
              key: "CANCELLED",
              label: `Cancelled (${orders.filter((o) => o.status === "CANCELLED").length})`,
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
            placeholder="Search order #, customer, warehouse..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading sales order pipeline...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              No sales orders found
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Create a new sales order to reserve stock and initiate warehouse fulfillment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Order # & Date</th>
                  <th className="py-3.5 px-4">Customer Account</th>
                  <th className="py-3.5 px-4">Dispatch Warehouse</th>
                  <th className="py-3.5 px-4">Items & Stock Reservation</th>
                  <th className="py-3.5 px-4 text-right">Order Total (Inc. VAT)</th>
                  <th className="py-3.5 px-4 text-center">Pipeline Stage</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.map((order) => {
                  const statusCfg = ORDER_STATUS_CONFIG[order.status];
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-KE",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Rep: {order.salesPerson.name}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {order.customer.businessName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {order.customer.code} • {order.customer.customerType} •{" "}
                          {order.customer.city || "Nairobi"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5 text-xs">
                          <Warehouse className="w-3.5 h-3.5 text-indigo-500" />
                          {order.warehouse.name}
                        </div>
                        {order.expectedDeliveryAt && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Target:{" "}
                            {new Date(
                              order.expectedDeliveryAt
                            ).toLocaleDateString("en-KE", {
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-800">
                          {order.items.length} SKU
                          {order.items.length > 1 ? "s" : ""} (
                          {order.totalOrderedUnits} units)
                        </div>
                        <div className="mt-1">
                          {order.stockReserved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <Lock className="w-3 h-3" />
                              {order.totalOrderedUnits -
                                order.totalDeliveredUnits}{" "}
                              Units Reserved
                            </span>
                          ) : order.status === "DELIVERED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Dispatched & Deducted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                              Unreserved
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          VAT: {formatCurrency(order.taxAmount)}
                        </div>
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
                          onClick={() => {
                            setErrorMsg(null);
                            setActiveOrder(order);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Process / View
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

      {/* Create Sales Order Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Create New Sales Order
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select customer and dispatch warehouse. Confirming the order immediately reserves stock so it cannot be oversold.
                </p>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-5">
              {errorMsg && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Account *
                  </label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.businessName} ({c.code} — {c.customerType})
                      </option>
                    ))}
                  </select>
                  {selectedCustomer && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span className="font-medium text-indigo-700">
                        Tier:{" "}
                        {isWholesaleTier
                          ? "Wholesale Pricing Applied"
                          : "Standard Retail Pricing"}
                      </span>
                      <span>
                        Available Credit:{" "}
                        <strong className="text-slate-800">
                          {formatCurrency(
                            Math.max(
                              0,
                              selectedCustomer.creditLimit -
                                selectedCustomer.outstandingBalance
                            )
                          )}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dispatch Warehouse *
                  </label>
                  <select
                    required
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Live available stock below is calculated for this warehouse.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Customer branch / drop-off location"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDeliveryAt}
                    onChange={(e) => setExpectedDeliveryAt(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Order Line Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Order Line Items & Stock Reservation Check
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
                  <table className="w-full min-w-[650px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Warehouse Availability</th>
                        <th className="py-2.5 px-3 w-24">Qty</th>
                        <th className="py-2.5 px-3 w-32">Unit Price (KES)</th>
                        <th className="py-2.5 px-3 w-28">Discount</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                        <th className="py-2.5 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {lineItems.map((line, index) => {
                        const stock = getAvailableStock(
                          line.productId,
                          selectedWarehouseId
                        );
                        const exceedsAvailable =
                          line.orderedQuantity > stock.availableStock;
                        const net = Math.max(
                          0,
                          line.orderedQuantity * line.unitPrice -
                            (line.discountAmount || 0)
                        );
                        const totalWithTax = net + (net * line.taxRate) / 100;

                        return (
                          <tr key={index}>
                            <td className="py-2.5 px-3">
                              <select
                                value={line.productId}
                                onChange={(e) =>
                                  updateLineProduct(index, e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.sku})
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${
                                    exceedsAvailable
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  }`}
                                >
                                  {stock.availableStock} avail
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  ({stock.currentStock} on hand,{" "}
                                  {stock.reservedStock} res)
                                </span>
                              </div>
                            </td>

                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="1"
                                required
                                value={line.orderedQuantity}
                                onChange={(e) => {
                                  const copy = [...lineItems];
                                  copy[index].orderedQuantity = Math.max(
                                    1,
                                    Number(e.target.value)
                                  );
                                  setLineItems(copy);
                                }}
                                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                                  exceedsAvailable
                                    ? "border-rose-300 bg-rose-50/40 text-rose-800"
                                    : "border-slate-200 text-slate-900"
                                }`}
                              />
                            </td>

                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={line.unitPrice}
                                onChange={(e) => {
                                  const copy = [...lineItems];
                                  copy[index].unitPrice = Number(
                                    e.target.value
                                  );
                                  setLineItems(copy);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                              />
                            </td>

                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={line.discountAmount}
                                onChange={(e) => {
                                  const copy = [...lineItems];
                                  copy[index].discountAmount = Number(
                                    e.target.value
                                  );
                                  setLineItems(copy);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                              />
                            </td>

                            <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                              {formatCurrency(totalWithTax)}
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

              {/* Notes & Immediate Stock Reservation Toggle + Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Order & Dispatch Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special packing, loading bay instructions, or customer LPO reference..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmImmediately}
                      onChange={(e) =>
                        setConfirmImmediately(e.target.checked)
                      }
                      className="mt-0.5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="block text-xs font-bold text-indigo-950">
                        Confirm Order & Reserve Stock Immediately
                      </span>
                      <span className="block text-[11px] text-indigo-700 mt-0.5">
                        Locks requested quantities in the selected warehouse so other sales reps cannot oversell them. Uncheck to save as a Draft Quote.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col justify-between space-y-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Net Subtotal (Excl. Tax)</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(orderTotals.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>VAT (16%)</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(orderTotals.taxAmount)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2.5 flex justify-between items-baseline">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Order Total
                    </span>
                    <span className="text-xl font-bold text-indigo-700">
                      {formatCurrency(orderTotals.totalAmount)}
                    </span>
                  </div>
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
                    : confirmImmediately
                    ? "Confirm Order & Reserve Stock"
                    : "Save as Draft Quote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect / Process Order Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-slate-900 font-mono">
                    {activeOrder.orderNumber}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      ORDER_STATUS_CONFIG[activeOrder.status].style
                    }`}
                  >
                    {ORDER_STATUS_CONFIG[activeOrder.status].label}
                  </span>
                  {activeOrder.stockReserved && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Lock className="w-3 h-3" />
                      Stock Reserved
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Customer: <strong>{activeOrder.customer.businessName}</strong>{" "}
                  • Dispatch Warehouse:{" "}
                  <strong>{activeOrder.warehouse.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
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

              {/* Visual Pipeline Progress Stepper */}
              {activeOrder.status !== "CANCELLED" && (
                <div className="grid grid-cols-4 gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  {[
                    { step: 1, label: "1. Draft Quote" },
                    { step: 2, label: "2. Confirmed & Reserved" },
                    { step: 3, label: "3. Picking & Packing" },
                    { step: 4, label: "4. Ready / Delivered" },
                  ].map((s) => {
                    const currentStep =
                      ORDER_STATUS_CONFIG[activeOrder.status].step;
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

              {/* Customer & Delivery Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">
                    Customer & Tier
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {activeOrder.customer.businessName}
                  </p>
                  <p className="text-slate-500">
                    {activeOrder.customer.customerType} •{" "}
                    {activeOrder.customer.phone || "No phone"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">
                    Delivery Destination
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {activeOrder.deliveryAddress ||
                      activeOrder.customer.city ||
                      "Customer Premises"}
                  </p>
                  <p className="text-slate-500">
                    Sales Rep: {activeOrder.salesPerson.name}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">
                    Financial Summary
                  </span>
                  <p className="font-bold text-indigo-700 text-sm mt-0.5">
                    {formatCurrency(activeOrder.totalAmount)}
                  </p>
                  <p className="text-slate-500">
                    Subtotal: {formatCurrency(activeOrder.subtotal)} + VAT:{" "}
                    {formatCurrency(activeOrder.taxAmount)}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full min-w-[550px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                      <th className="py-2.5 px-4">Product & SKU</th>
                      <th className="py-2.5 px-4 text-center">Ordered Qty</th>
                      <th className="py-2.5 px-4 text-center">Delivered Qty</th>
                      <th className="py-2.5 px-4 text-right">Unit Price</th>
                      <th className="py-2.5 px-4 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {activeOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {item.productName}
                          </div>
                          <div className="text-slate-400 font-mono text-[11px]">
                            {item.sku}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-800">
                          {item.orderedQuantity} {item.unitOfMeasure}s
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${
                              item.deliveredQuantity >= item.orderedQuantity
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.deliveredQuantity} / {item.orderedQuantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Workflow Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div>
                  {activeOrder.status !== "DELIVERED" &&
                    activeOrder.status !== "CANCELLED" && (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          handleStatusTransition(activeOrder.id, "CANCELLED")
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        {activeOrder.stockReserved
                          ? "Cancel Order & Release Reserved Stock"
                          : "Cancel Order"}
                      </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {activeOrder.status === "DRAFT" && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        handleStatusTransition(activeOrder.id, "CONFIRMED")
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Confirm & Reserve Stock
                    </button>
                  )}

                  {activeOrder.status === "CONFIRMED" && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        handleStatusTransition(activeOrder.id, "PROCESSING")
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Start Warehouse Picking & Packing
                    </button>
                  )}

                  {activeOrder.status === "PROCESSING" && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        handleStatusTransition(
                          activeOrder.id,
                          "READY_FOR_DELIVERY"
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Mark Ready for Delivery
                    </button>
                  )}

                  {(activeOrder.status === "CONFIRMED" ||
                    activeOrder.status === "PROCESSING" ||
                    activeOrder.status === "READY_FOR_DELIVERY") && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        handleStatusTransition(activeOrder.id, "DELIVERED")
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      Complete Delivery & Deduct Stock
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveOrder(null)}
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
