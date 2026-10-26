"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Plus,
  Search,
  Truck,
  Phone,
  ShieldCheck,
  Award,
  Edit3,
  X,
  CheckCircle2,
  CreditCard,
} from "lucide-react";

type DriverStatus = "AVAILABLE" | "ON_DELIVERY" | "OFF_DUTY" | "SUSPENDED";

interface DriverItem {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  email: string | null;
  licenseNumber: string;
  licenseClass: string;
  licenseExpiry: string | null;
  defaultVehicleId: string | null;
  defaultVehicle: {
    id: string;
    registrationNumber: string;
    makeModel: string;
    vehicleType: string;
  } | null;
  status: DriverStatus;
  completedDeliveries: number;
  totalAssignedDeliveries: number;
}

interface VehicleOption {
  id: string;
  registrationNumber: string;
  makeModel: string;
}

const DRIVER_STATUS_BADGES: Record<
  DriverStatus,
  { label: string; style: string }
> = {
  AVAILABLE: {
    label: "Available for Dispatch",
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  ON_DELIVERY: {
    label: "On Delivery Route",
    style: "bg-blue-50 text-blue-700 border-blue-200",
  },
  OFF_DUTY: {
    label: "Off Duty / Rest",
    style: "bg-slate-100 text-slate-600 border-slate-200",
  },
  SUSPENDED: {
    label: "Suspended",
    style: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "+254 7",
    email: "",
    licenseNumber: "DL-KE-",
    licenseClass: "BCE",
    licenseExpiry: "",
    defaultVehicleId: "",
    status: "AVAILABLE" as DriverStatus,
  });

  async function fetchDriversData() {
    setLoading(true);
    try {
      const res = await fetch("/api/distribution/drivers");
      const data = await res.json();
      if (res.ok) {
        setDrivers(data.drivers || []);
        setVehicles(data.vehicles || []);
      }
    } catch (err) {
      console.error("Failed to fetch drivers:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDriversData();
  }, []);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const matchesStatus =
        statusFilter === "ALL" || d.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        d.fullName.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        (d.defaultVehicle &&
          d.defaultVehicle.registrationNumber.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [drivers, statusFilter, search]);

  const metrics = useMemo(() => {
    const availableCount = drivers.filter(
      (d) => d.status === "AVAILABLE"
    ).length;
    const onDeliveryCount = drivers.filter(
      (d) => d.status === "ON_DELIVERY"
    ).length;
    const totalCompleted = drivers.reduce(
      (sum, d) => sum + d.completedDeliveries,
      0
    );

    return {
      availableCount,
      onDeliveryCount,
      totalCompleted,
    };
  }, [drivers]);

  function openCreateModal() {
    setEditingDriver(null);
    setErrorMsg(null);
    const nextYear = new Date(Date.now() + 86400000 * 365)
      .toISOString()
      .slice(0, 10);
    setFormData({
      fullName: "",
      phone: "+254 7",
      email: "",
      licenseNumber: "DL-KE-",
      licenseClass: "BCE (Commercial Truck)",
      licenseExpiry: nextYear,
      defaultVehicleId: vehicles[0]?.id || "",
      status: "AVAILABLE",
    });
    setModalOpen(true);
  }

  function openEditModal(driver: DriverItem) {
    setEditingDriver(driver);
    setErrorMsg(null);
    setFormData({
      fullName: driver.fullName,
      phone: driver.phone,
      email: driver.email || "",
      licenseNumber: driver.licenseNumber,
      licenseClass: driver.licenseClass,
      licenseExpiry: driver.licenseExpiry
        ? driver.licenseExpiry.slice(0, 10)
        : "",
      defaultVehicleId: driver.defaultVehicleId || "",
      status: driver.status,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const method = editingDriver ? "PATCH" : "POST";
      const res = await fetch("/api/distribution/drivers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingDriver ? { id: editingDriver.id } : {}),
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to save driver.");
      } else {
        setModalOpen(false);
        setSuccessMsg(
          editingDriver
            ? `Updated driver ${data.driver.fullName}`
            : `Registered driver ${data.driver.fullName} (${data.driver.code})`
        );
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchDriversData();
      }
    } catch {
      setErrorMsg("Network error while saving driver.");
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
              Distribution Drivers & Crew
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Field Personnel
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage licensed commercial drivers, default truck pairings, route availability, and completed POD performance.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Register Driver
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Available Drivers
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {metrics.availableCount} Ready
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Out of {drivers.length} total registered drivers
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Currently On Delivery
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-2">
            {metrics.onDeliveryCount} Active
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Assigned to active customer delivery dispatches
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Completed POD Runs
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.totalCompleted} Deliveries
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Verified customer drop-offs with signed POD
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "ALL", label: `All Drivers (${drivers.length})` },
            { key: "AVAILABLE", label: "Available" },
            { key: "ON_DELIVERY", label: "On Delivery" },
            { key: "OFF_DUTY", label: "Off Duty" },
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
            placeholder="Search driver name, license, truck..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading drivers directory...
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              No drivers found
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Driver Profile</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">License & Class</th>
                  <th className="py-3.5 px-4">Default Assigned Vehicle</th>
                  <th className="py-3.5 px-4 text-center">Completed PODs</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDrivers.map((driver) => {
                  const badge = DRIVER_STATUS_BADGES[driver.status];
                  return (
                    <tr
                      key={driver.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          {driver.fullName}
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {driver.code}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {driver.phone}
                        </div>
                        {driver.email && (
                          <div className="text-[11px] text-slate-400">
                            {driver.email}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-mono font-semibold text-slate-800 flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          {driver.licenseNumber}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Class: {driver.licenseClass}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {driver.defaultVehicle ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-amber-100 text-slate-900 border border-amber-300">
                              {driver.defaultVehicle.registrationNumber}
                            </span>
                            <span className="text-xs text-slate-600">
                              {driver.defaultVehicle.makeModel}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                          {driver.completedDeliveries} Trips
                        </span>
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
                          onClick={() => openEditModal(driver)}
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

      {/* Create / Edit Driver Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingDriver
                    ? `Manage Driver — ${editingDriver.fullName}`
                    : "Register New Commercial Driver"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure NTSA driving license, contact details, and default vehicle assignment.
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
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="e.g., John Kamau"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+254 722 000 000"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Driving License Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        licenseNumber: e.target.value,
                      })
                    }
                    placeholder="DL-KE-789120"
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    License Class
                  </label>
                  <input
                    type="text"
                    value={formData.licenseClass}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        licenseClass: e.target.value,
                      })
                    }
                    placeholder="BCE (Heavy Commercial)"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Assigned Vehicle
                  </label>
                  <select
                    value={formData.defaultVehicleId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultVehicleId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">Unassigned (Pool Driver)</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber} — {v.makeModel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Availability Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as DriverStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ON_DELIVERY">On Delivery</option>
                    <option value="OFF_DUTY">Off Duty</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
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
                    : editingDriver
                    ? "Save Driver Changes"
                    : "Register Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
