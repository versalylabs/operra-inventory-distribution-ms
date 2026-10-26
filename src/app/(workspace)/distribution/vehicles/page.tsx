"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Truck,
  Plus,
  Search,
  Warehouse,
  ShieldCheck,
  Wrench,
  Calendar,
  Edit3,
  X,
  CheckCircle2,
  UserCheck,
} from "lucide-react";

type VehicleStatus = "AVAILABLE" | "ON_ROUTE" | "MAINTENANCE" | "INACTIVE";

interface VehicleItem {
  id: string;
  registrationNumber: string;
  makeModel: string;
  vehicleType: string;
  capacityKg: number;
  assignedDepotId: string | null;
  assignedDepot: { id: string; code: string; name: string } | null;
  defaultDriver: { id: string; code: string; fullName: string } | null;
  insuranceExpiry: string | null;
  inspectionExpiry: string | null;
  status: VehicleStatus;
  notes: string | null;
  deliveryCount: number;
}

interface WarehouseOption {
  id: string;
  code: string;
  name: string;
}

const VEHICLE_STATUS_BADGES: Record<
  VehicleStatus,
  { label: string; style: string }
> = {
  AVAILABLE: {
    label: "Available at Depot",
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  ON_ROUTE: {
    label: "On Delivery Route",
    style: "bg-blue-50 text-blue-700 border-blue-200",
  },
  MAINTENANCE: {
    label: "In Workshop / Service",
    style: "bg-amber-50 text-amber-700 border-amber-200",
  },
  INACTIVE: {
    label: "Decommissioned",
    style: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export default function FleetVehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleItem | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    registrationNumber: "",
    makeModel: "",
    vehicleType: "Box Truck",
    capacityKg: "5000",
    assignedDepotId: "",
    insuranceExpiry: "",
    inspectionExpiry: "",
    status: "AVAILABLE" as VehicleStatus,
    notes: "",
  });

  async function fetchFleetData() {
    setLoading(true);
    try {
      const res = await fetch("/api/distribution/vehicles");
      const data = await res.json();
      if (res.ok) {
        setVehicles(data.vehicles || []);
        setWarehouses(data.warehouses || []);
      }
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFleetData();
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesStatus =
        statusFilter === "ALL" || v.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        v.registrationNumber.toLowerCase().includes(q) ||
        v.makeModel.toLowerCase().includes(q) ||
        v.vehicleType.toLowerCase().includes(q) ||
        (v.assignedDepot &&
          v.assignedDepot.name.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [vehicles, statusFilter, search]);

  const metrics = useMemo(() => {
    const availableCount = vehicles.filter(
      (v) => v.status === "AVAILABLE"
    ).length;
    const onRouteCount = vehicles.filter(
      (v) => v.status === "ON_ROUTE"
    ).length;
    const maintenanceCount = vehicles.filter(
      (v) => v.status === "MAINTENANCE"
    ).length;
    const totalPayloadTonnes =
      vehicles.reduce((sum, v) => sum + v.capacityKg, 0) / 1000;

    return {
      availableCount,
      onRouteCount,
      maintenanceCount,
      totalPayloadTonnes,
    };
  }, [vehicles]);

  function openCreateModal() {
    setEditingVehicle(null);
    setErrorMsg(null);
    const nextYear = new Date(Date.now() + 86400000 * 300)
      .toISOString()
      .slice(0, 10);
    setFormData({
      registrationNumber: "KDG ",
      makeModel: "Isuzu FRR 90N",
      vehicleType: "Box Truck",
      capacityKg: "5000",
      assignedDepotId: warehouses[0]?.id || "",
      insuranceExpiry: nextYear,
      inspectionExpiry: nextYear,
      status: "AVAILABLE",
      notes: "",
    });
    setModalOpen(true);
  }

  function openEditModal(vehicle: VehicleItem) {
    setEditingVehicle(vehicle);
    setErrorMsg(null);
    setFormData({
      registrationNumber: vehicle.registrationNumber,
      makeModel: vehicle.makeModel,
      vehicleType: vehicle.vehicleType,
      capacityKg: String(vehicle.capacityKg),
      assignedDepotId: vehicle.assignedDepotId || "",
      insuranceExpiry: vehicle.insuranceExpiry
        ? vehicle.insuranceExpiry.slice(0, 10)
        : "",
      inspectionExpiry: vehicle.inspectionExpiry
        ? vehicle.inspectionExpiry.slice(0, 10)
        : "",
      status: vehicle.status,
      notes: vehicle.notes || "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const method = editingVehicle ? "PATCH" : "POST";
      const res = await fetch("/api/distribution/vehicles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingVehicle ? { id: editingVehicle.id } : {}),
          ...formData,
          capacityKg: Number(formData.capacityKg),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to save vehicle.");
      } else {
        setModalOpen(false);
        setSuccessMsg(
          editingVehicle
            ? `Updated vehicle ${data.vehicle.registrationNumber}`
            : `Registered fleet vehicle ${data.vehicle.registrationNumber}`
        );
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchFleetData();
      }
    } catch {
      setErrorMsg("Network error while saving vehicle.");
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
              Fleet Vehicles & Trucks
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Fleet Registry
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage delivery trucks, vans, payload capacities, depot assignments, and NTSA/insurance compliance.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Register Vehicle
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
              Available at Depot
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {metrics.availableCount} Trucks
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Ready for immediate dispatch assignment
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active on Route
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-2">
            {metrics.onRouteCount} Dispatched
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Currently executing customer deliveries
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fleet Payload Capacity
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.totalPayloadTonnes.toFixed(1)} Tonnes
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Combined carrying capacity across {vehicles.length} vehicles
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              In Workshop / Service
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {metrics.maintenanceCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Scheduled maintenance or inspection
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "ALL", label: `All Fleet (${vehicles.length})` },
            { key: "AVAILABLE", label: "Available" },
            { key: "ON_ROUTE", label: "On Route" },
            { key: "MAINTENANCE", label: "In Maintenance" },
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
            placeholder="Search registration plate, make, depot..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Fleet Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading fleet vehicles...
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              No fleet vehicles found
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Registration & Model</th>
                  <th className="py-3.5 px-4">Body Type & Capacity</th>
                  <th className="py-3.5 px-4">Home Depot</th>
                  <th className="py-3.5 px-4">Primary Driver</th>
                  <th className="py-3.5 px-4">Compliance Dates</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredVehicles.map((vehicle) => {
                  const badge = VEHICLE_STATUS_BADGES[vehicle.status];
                  return (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-amber-100 text-slate-900 border border-amber-300">
                            {vehicle.registrationNumber}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {vehicle.makeModel}
                            </div>
                            <div className="text-xs text-slate-400">
                              {vehicle.deliveryCount} completed trips
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 text-xs">
                          {vehicle.vehicleType}
                        </div>
                        <div className="text-xs text-slate-500">
                          {(vehicle.capacityKg / 1000).toFixed(1)} Tonnes (
                          {vehicle.capacityKg.toLocaleString()} kg)
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {vehicle.assignedDepot ? (
                          <div className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                            <Warehouse className="w-3.5 h-3.5 text-indigo-500" />
                            {vehicle.assignedDepot.name}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Roaming / Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {vehicle.defaultDriver ? (
                          <div className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {vehicle.defaultDriver.fullName}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Pool Vehicle
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Ins:{" "}
                          {vehicle.insuranceExpiry
                            ? new Date(
                                vehicle.insuranceExpiry
                              ).toLocaleDateString("en-KE", {
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          NTSA:{" "}
                          {vehicle.inspectionExpiry
                            ? new Date(
                                vehicle.inspectionExpiry
                              ).toLocaleDateString("en-KE", {
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openEditModal(vehicle)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200/80 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          Manage
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

      {/* Create / Edit Vehicle Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingVehicle
                    ? `Manage Vehicle — ${editingVehicle.registrationNumber}`
                    : "Register New Fleet Vehicle"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure registration plate, tonnage capacity, home warehouse, and status.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Number (Plate) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.registrationNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationNumber: e.target.value,
                      })
                    }
                    placeholder="KDD 412P"
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Make & Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.makeModel}
                    onChange={(e) =>
                      setFormData({ ...formData, makeModel: e.target.value })
                    }
                    placeholder="Isuzu FRR 90N"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicleType: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Box Truck">Box Truck</option>
                    <option value="Medium Canter">Medium Canter</option>
                    <option value="Heavy Hauler">Heavy Hauler</option>
                    <option value="Refrigerated Van">Refrigerated Van</option>
                    <option value="Pickup / Light Utility">
                      Pickup / Light Utility
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Capacity (kg)
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={formData.capacityKg}
                    onChange={(e) =>
                      setFormData({ ...formData, capacityKg: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fleet Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as VehicleStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ON_ROUTE">On Route</option>
                    <option value="MAINTENANCE">In Maintenance</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Home Depot
                  </label>
                  <select
                    value={formData.assignedDepotId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assignedDepotId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">Roaming / All Depots</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Insurance Expiry
                  </label>
                  <input
                    type="date"
                    value={formData.insuranceExpiry}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        insuranceExpiry: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NTSA Inspection Expiry
                  </label>
                  <input
                    type="date"
                    value={formData.inspectionExpiry}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inspectionExpiry: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
                    ? "Saving..."
                    : editingVehicle
                    ? "Save Vehicle Changes"
                    : "Register Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
