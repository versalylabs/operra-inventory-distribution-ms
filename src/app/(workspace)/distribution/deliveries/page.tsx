"use client";

import { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Truck,
  Plus,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck2,
  UserCheck,
  Navigation,
  PenTool,
  Eye,
  X,
} from "lucide-react";

type DeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

interface DeliveryLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitOfMeasure: string;
  orderedQuantity: number;
  dispatchedQuantity: number;
  deliveredQuantity: number;
  returnedQuantity: number;
}

interface ProofOfDeliveryRecord {
  id: string;
  recipientName: string;
  recipientRole: string | null;
  recipientPhone: string | null;
  signatureData: string;
  gpsCoordinates: string | null;
  deliveryNotes: string | null;
  capturedAt: string;
  capturedBy: { id: string; name: string } | null;
}

interface DeliveryItemRecord {
  id: string;
  deliveryNumber: string;
  salesOrderId: string;
  salesOrder: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
  };
  customerId: string;
  customer: {
    id: string;
    code: string;
    businessName: string;
    contactPerson: string | null;
    phone: string | null;
    city: string | null;
  };
  warehouse: {
    id: string;
    code: string;
    name: string;
  };
  driverId: string | null;
  driver: {
    id: string;
    code: string;
    fullName: string;
    phone: string;
  } | null;
  vehicleId: string | null;
  vehicle: {
    id: string;
    registrationNumber: string;
    makeModel: string;
    vehicleType: string;
  } | null;
  deliveryAddress: string;
  scheduledDate: string;
  status: DeliveryStatus;
  dispatchNotes: string | null;
  failureReason: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  totalDispatchedUnits: number;
  totalDeliveredUnits: number;
  items: DeliveryLineItem[];
  proofOfDelivery: ProofOfDeliveryRecord | null;
}

interface DriverOption {
  id: string;
  code: string;
  fullName: string;
  defaultVehicleId: string | null;
  status: string;
}

interface VehicleOption {
  id: string;
  registrationNumber: string;
  makeModel: string;
  status: string;
}

interface DispatchableOrderOption {
  id: string;
  orderNumber: string;
  totalAmount: number;
  deliveryAddress: string | null;
  customer: {
    businessName: string;
    contactPerson?: string | null;
    phone?: string | null;
    city: string | null;
  };
  warehouse: {
    name: string;
  };
  totalOrderedUnits: number;
}

const DELIVERY_STATUS_CONFIG: Record<
  DeliveryStatus,
  { label: string; style: string; step: number }
> = {
  PENDING: {
    label: "Pending Assignment",
    style: "bg-slate-100 text-slate-700 border-slate-200",
    step: 1,
  },
  ASSIGNED: {
    label: "Driver & Truck Assigned",
    style: "bg-indigo-50 text-indigo-700 border-indigo-200",
    step: 2,
  },
  DISPATCHED: {
    label: "Dispatched from Depot",
    style: "bg-blue-50 text-blue-700 border-blue-200",
    step: 3,
  },
  IN_TRANSIT: {
    label: "In Transit to Customer",
    style: "bg-blue-50 text-blue-700 border-blue-200",
    step: 3,
  },
  DELIVERED: {
    label: "Delivered (POD Verified)",
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
    step: 4,
  },
  FAILED: {
    label: "Delivery Failed",
    style: "bg-rose-50 text-rose-700 border-rose-200",
    step: 0,
  },
  CANCELLED: {
    label: "Cancelled",
    style: "bg-slate-100 text-slate-500 border-slate-200",
    step: 0,
  },
};

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryItemRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [dispatchableOrders, setDispatchableOrders] = useState<
    DispatchableOrderOption[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Create Delivery Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [dispatchImmediately, setDispatchImmediately] = useState(true);

  // Inspect / Capture POD Modal state
  const [activeDelivery, setActiveDelivery] =
    useState<DeliveryItemRecord | null>(null);
  const [podForm, setPodForm] = useState({
    recipientName: "",
    recipientRole: "Receiving Officer / Storekeeper",
    recipientPhone: "",
    signatureData: "",
    gpsCoordinates: "-1.2647, 36.8021 (Nairobi Metropolitan)",
    deliveryNotes: "All cartons received intact and verified against packing slip.",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function fetchDeliveriesData() {
    setLoading(true);
    try {
      const res = await fetch("/api/distribution/deliveries");
      const data = await res.json();
      if (res.ok) {
        setDeliveries(data.deliveries || []);
        setDrivers(data.drivers || []);
        setVehicles(data.vehicles || []);
        setDispatchableOrders(data.dispatchableOrders || []);
      }
    } catch (err) {
      console.error("Failed to fetch deliveries:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDeliveriesData();
  }, []);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        d.status === statusFilter ||
        (statusFilter === "IN_TRANSIT" && d.status === "DISPATCHED");
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        d.deliveryNumber.toLowerCase().includes(q) ||
        d.salesOrder.orderNumber.toLowerCase().includes(q) ||
        d.customer.businessName.toLowerCase().includes(q) ||
        d.deliveryAddress.toLowerCase().includes(q) ||
        (d.driver && d.driver.fullName.toLowerCase().includes(q)) ||
        (d.vehicle &&
          d.vehicle.registrationNumber.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [deliveries, statusFilter, search]);

  const metrics = useMemo(() => {
    const inTransitCount = deliveries.filter(
      (d) => d.status === "IN_TRANSIT" || d.status === "DISPATCHED"
    ).length;
    const assignedOrPending = deliveries.filter(
      (d) => d.status === "PENDING" || d.status === "ASSIGNED"
    ).length;
    const deliveredWithPod = deliveries.filter(
      (d) => d.status === "DELIVERED"
    ).length;
    const totalDispatchedValue = deliveries
      .filter((d) => d.status !== "CANCELLED")
      .reduce((sum, d) => sum + d.salesOrder.totalAmount, 0);

    return {
      inTransitCount,
      assignedOrPending,
      deliveredWithPod,
      totalDispatchedValue,
    };
  }, [deliveries]);

  function openCreateModal() {
    setErrorMsg(null);
    const firstOrder = dispatchableOrders[0];
    const firstDriver =
      drivers.find((d) => d.status === "AVAILABLE") || drivers[0];
    const pairedVehicleId =
      firstDriver?.defaultVehicleId ||
      vehicles.find((v) => v.status === "AVAILABLE")?.id ||
      vehicles[0]?.id ||
      "";

    setSelectedOrderId(firstOrder?.id || "");
    setSelectedDriverId(firstDriver?.id || "");
    setSelectedVehicleId(pairedVehicleId);
    setDeliveryAddress(firstOrder?.deliveryAddress || "");
    setScheduledDate(new Date().toISOString().slice(0, 10));
    setDispatchNotes("Verify customer stamp & capture recipient signature on POD.");
    setDispatchImmediately(true);
    setCreateOpen(true);
  }

  function openInspectOrPodModal(delivery: DeliveryItemRecord) {
    setErrorMsg(null);
    setPodForm({
      recipientName:
        delivery.proofOfDelivery?.recipientName ||
        delivery.customer.contactPerson ||
        "Grace Wanjiku (Receiving Clerk)",
      recipientRole:
        delivery.proofOfDelivery?.recipientRole ||
        "Receiving Officer / Storekeeper",
      recipientPhone:
        delivery.proofOfDelivery?.recipientPhone ||
        delivery.customer.phone ||
        "+254 722 310 400",
      signatureData:
        delivery.proofOfDelivery?.signatureData ||
        `SIG-ACK-${delivery.deliveryNumber}-${new Date().getFullYear()}`,
      gpsCoordinates:
        delivery.proofOfDelivery?.gpsCoordinates ||
        `-1.2647, 36.8021 (${delivery.customer.city || "Nairobi"})`,
      deliveryNotes:
        delivery.proofOfDelivery?.deliveryNotes ||
        "Delivered in full and signed at customer receiving bay.",
    });
    setActiveDelivery(delivery);
  }

  async function handleCreateDelivery(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/distribution/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesOrderId: selectedOrderId,
          driverId: selectedDriverId || null,
          vehicleId: selectedVehicleId || null,
          deliveryAddress,
          scheduledDate,
          dispatchNotes,
          dispatchImmediately,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to create delivery dispatch.");
      } else {
        setCreateOpen(false);
        setSuccessMsg(
          `Delivery ${data.delivery.deliveryNumber} created & assigned!`
        );
        setTimeout(() => setSuccessMsg(null), 4500);
        fetchDeliveriesData();
      }
    } catch {
      setErrorMsg("Network error while creating delivery.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeliveryTransition(
    deliveryId: string,
    targetStatus: DeliveryStatus
  ) {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/distribution/deliveries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryId,
          status: targetStatus,
          ...(targetStatus === "DELIVERED" ? { pod: podForm } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update delivery status.");
      } else {
        setSuccessMsg(
          targetStatus === "DELIVERED"
            ? "Delivery completed! Proof of Delivery recorded & warehouse stock deducted."
            : `Delivery updated to ${DELIVERY_STATUS_CONFIG[targetStatus].label}`
        );
        setTimeout(() => setSuccessMsg(null), 4500);
        setActiveDelivery(null);
        fetchDeliveriesData();
      }
    } catch {
      setErrorMsg("Network error while updating delivery.");
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
              Distribution & Proof of Delivery (POD)
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Last-Mile Logistics
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Assign drivers and trucks to sales orders, track live dispatches, and capture digital Proof of Delivery (POD) signatures.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Schedule Delivery Dispatch
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
              Active Fleet Dispatches
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-2">
            {metrics.inTransitCount} In Transit
          </p>
          <p className="text-xs text-slate-500 mt-1">
            En route to customer drop-off locations
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Staged / Assigned Runs
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.assignedOrPending}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Awaiting loading bay departure
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Verified POD Deliveries
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {metrics.deliveredWithPod} Signed
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Digital Proof of Delivery captured
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Cargo Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(metrics.totalDispatchedValue)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Order value across active & completed runs
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "ALL", label: `All Runs (${deliveries.length})` },
            {
              key: "ASSIGNED",
              label: `Assigned (${deliveries.filter((d) => d.status === "ASSIGNED" || d.status === "PENDING").length})`,
            },
            {
              key: "IN_TRANSIT",
              label: `In Transit (${deliveries.filter((d) => d.status === "IN_TRANSIT" || d.status === "DISPATCHED").length})`,
            },
            {
              key: "DELIVERED",
              label: `Delivered & POD (${deliveries.filter((d) => d.status === "DELIVERED").length})`,
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
            placeholder="Search delivery #, order #, customer, driver..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading distribution dispatches...
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              No delivery dispatches found
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Schedule a delivery from any confirmed sales order to assign a driver and capture Proof of Delivery.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Delivery # & Order</th>
                  <th className="py-3.5 px-4">Customer & Drop-Off</th>
                  <th className="py-3.5 px-4">Assigned Driver & Vehicle</th>
                  <th className="py-3.5 px-4">Cargo & POD Status</th>
                  <th className="py-3.5 px-4 text-center">Stage</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDeliveries.map((del) => {
                  const cfg = DELIVERY_STATUS_CONFIG[del.status];
                  return (
                    <tr
                      key={del.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">
                          {del.deliveryNumber}
                        </div>
                        <div className="text-xs text-indigo-600 font-mono mt-0.5">
                          Order: {del.salesOrder.orderNumber}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          From: {del.warehouse.name}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {del.customer.businessName}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">
                            {del.deliveryAddress}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {del.driver ? (
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                            {del.driver.fullName}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            No driver assigned
                          </span>
                        )}
                        {del.vehicle && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-slate-900 border border-amber-300">
                              {del.vehicle.registrationNumber}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {del.vehicle.makeModel}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-800">
                          {del.items.length} SKU
                          {del.items.length > 1 ? "s" : ""} (
                          {del.totalDispatchedUnits} units) •{" "}
                          {formatCurrency(del.salesOrder.totalAmount)}
                        </div>
                        <div className="mt-1">
                          {del.proofOfDelivery ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <FileCheck2 className="w-3 h-3" />
                              POD Signed: {del.proofOfDelivery.recipientName}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Awaiting customer POD signature
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.style}`}
                        >
                          {cfg.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openInspectOrPodModal(del)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors cursor-pointer"
                        >
                          {del.status === "DELIVERED" ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              View POD
                            </>
                          ) : (
                            <>
                              <PenTool className="w-3.5 h-3.5" />
                              Capture POD
                            </>
                          )}
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

      {/* Create Delivery Dispatch Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Schedule Customer Delivery Dispatch
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign a commercial driver and fleet truck to a confirmed sales order.
                </p>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sales Order to Dispatch *
                </label>
                <select
                  required
                  value={selectedOrderId}
                  onChange={(e) => {
                    setSelectedOrderId(e.target.value);
                    const ord = dispatchableOrders.find(
                      (o) => o.id === e.target.value
                    );
                    if (ord) {
                      setDeliveryAddress(ord.deliveryAddress || "");
                    }
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-medium text-slate-900"
                >
                  {dispatchableOrders.length === 0 ? (
                    <option value="">
                      No pending confirmed orders available
                    </option>
                  ) : (
                    dispatchableOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} — {o.customer.businessName} (
                        {o.totalOrderedUnits} units •{" "}
                        {formatCurrency(o.totalAmount)})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Driver
                  </label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => {
                      setSelectedDriverId(e.target.value);
                      const drv = drivers.find(
                        (d) => d.id === e.target.value
                      );
                      if (drv?.defaultVehicleId) {
                        setSelectedVehicleId(drv.defaultVehicleId);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">Assign Later</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Fleet Vehicle
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">Assign Later</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber} — {v.makeModel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Drop-Off Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Receiving Bay / Street / Landmark"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driver Dispatch Instructions
                </label>
                <input
                  type="text"
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dispatchImmediately}
                  onChange={(e) => setDispatchImmediately(e.target.checked)}
                  className="mt-0.5 rounded border-indigo-300 text-indigo-600"
                />
                <div>
                  <span className="block text-xs font-bold text-indigo-950">
                    Dispatch Vehicle Immediately (Mark In-Transit)
                  </span>
                  <span className="block text-[11px] text-indigo-700 mt-0.5">
                    Updates the assigned driver to `ON_DELIVERY` and vehicle to `ON_ROUTE`.
                  </span>
                </div>
              </label>

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
                  disabled={submitting || !selectedOrderId}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium shadow-xs cursor-pointer"
                >
                  {submitting ? "Creating..." : "Create & Dispatch Run"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect / Proof of Delivery (POD) Capture Modal */}
      {activeDelivery && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-slate-900 font-mono">
                    {activeDelivery.deliveryNumber}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      DELIVERY_STATUS_CONFIG[activeDelivery.status].style
                    }`}
                  >
                    {DELIVERY_STATUS_CONFIG[activeDelivery.status].label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Sales Order:{" "}
                  <strong>{activeDelivery.salesOrder.orderNumber}</strong> •
                  Customer:{" "}
                  <strong>{activeDelivery.customer.businessName}</strong>
                </p>
              </div>
              <button
                onClick={() => setActiveDelivery(null)}
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

              {/* Cargo Manifest */}
              <div className="rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full min-w-[400px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                      <th className="py-2.5 px-4">Product & SKU</th>
                      <th className="py-2.5 px-4 text-center">Dispatched Qty</th>
                      <th className="py-2.5 px-4 text-center">Delivered Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {activeDelivery.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-slate-900">
                            {item.productName}
                          </span>{" "}
                          <span className="font-mono text-slate-400">
                            ({item.sku})
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-semibold text-slate-800">
                          {item.dispatchedQuantity} {item.unitOfMeasure}s
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-emerald-700">
                          {activeDelivery.status === "DELIVERED"
                            ? item.deliveredQuantity
                            : item.dispatchedQuantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Proof of Delivery Section */}
              {activeDelivery.status === "DELIVERED" &&
              activeDelivery.proofOfDelivery ? (
                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <FileCheck2 className="w-5 h-5 text-emerald-600" />
                      Verified Proof of Delivery (POD) Certificate
                    </div>
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-white text-emerald-800 border border-emerald-200 font-semibold">
                      {activeDelivery.proofOfDelivery.signatureData}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                    <div>
                      <span className="text-emerald-700 font-semibold uppercase text-[10px]">
                        Received & Signed By
                      </span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {activeDelivery.proofOfDelivery.recipientName}
                      </p>
                      <p className="text-slate-600">
                        {activeDelivery.proofOfDelivery.recipientRole} •{" "}
                        {activeDelivery.proofOfDelivery.recipientPhone || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-semibold uppercase text-[10px]">
                        GPS & Timestamp
                      </span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {activeDelivery.proofOfDelivery.gpsCoordinates || "—"}
                      </p>
                      <p className="text-slate-600">
                        {new Date(
                          activeDelivery.proofOfDelivery.capturedAt
                        ).toLocaleString("en-KE")}
                      </p>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-semibold uppercase text-[10px]">
                        Receiving Notes
                      </span>
                      <p className="text-slate-800 mt-0.5">
                        {activeDelivery.proofOfDelivery.deliveryNotes ||
                          "Goods received in good condition."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                activeDelivery.status !== "CANCELLED" &&
                activeDelivery.status !== "FAILED" && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <PenTool className="w-4 h-4 text-indigo-600" />
                      Capture Customer Proof of Delivery (POD)
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Recipient Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={podForm.recipientName}
                          onChange={(e) =>
                            setPodForm({
                              ...podForm,
                              recipientName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Recipient Role / Title
                        </label>
                        <input
                          type="text"
                          value={podForm.recipientRole}
                          onChange={(e) =>
                            setPodForm({
                              ...podForm,
                              recipientRole: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Recipient Phone
                        </label>
                        <input
                          type="text"
                          value={podForm.recipientPhone}
                          onChange={(e) =>
                            setPodForm({
                              ...podForm,
                              recipientPhone: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Digital Signature / Stamp Reference *
                        </label>
                        <input
                          type="text"
                          required
                          value={podForm.signatureData}
                          onChange={(e) =>
                            setPodForm({
                              ...podForm,
                              signatureData: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-indigo-200 bg-indigo-50/40 text-indigo-950 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Drop-Off GPS Coordinates
                        </label>
                        <input
                          type="text"
                          value={podForm.gpsCoordinates}
                          onChange={(e) =>
                            setPodForm({
                              ...podForm,
                              gpsCoordinates: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Delivery Handover Notes
                      </label>
                      <input
                        type="text"
                        value={podForm.deliveryNotes}
                        onChange={(e) =>
                          setPodForm({
                            ...podForm,
                            deliveryNotes: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                )
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div>
                  {activeDelivery.status !== "DELIVERED" &&
                    activeDelivery.status !== "CANCELLED" &&
                    activeDelivery.status !== "FAILED" && (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          handleDeliveryTransition(
                            activeDelivery.id,
                            "FAILED"
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        Mark Delivery Failed
                      </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {(activeDelivery.status === "PENDING" ||
                    activeDelivery.status === "ASSIGNED") && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        handleDeliveryTransition(
                          activeDelivery.id,
                          "IN_TRANSIT"
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Dispatch Vehicle from Depot
                    </button>
                  )}

                  {activeDelivery.status !== "DELIVERED" &&
                    activeDelivery.status !== "CANCELLED" &&
                    activeDelivery.status !== "FAILED" && (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          handleDeliveryTransition(
                            activeDelivery.id,
                            "DELIVERED"
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        Complete Delivery & Save Signed POD
                      </button>
                    )}

                  <button
                    type="button"
                    onClick={() => setActiveDelivery(null)}
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
