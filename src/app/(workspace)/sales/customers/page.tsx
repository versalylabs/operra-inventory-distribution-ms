"use client";

import { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Edit3,
  X,
  CheckCircle2,
  UserCheck,
  ShoppingBag,
  FileText,
} from "lucide-react";

type CustomerType =
  | "RETAIL"
  | "WHOLESALE"
  | "DISTRIBUTOR"
  | "CORPORATE"
  | "INDIVIDUAL";

type CustomerStatus = "ACTIVE" | "ON_HOLD" | "INACTIVE";

interface SalesRep {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface CustomerItem {
  id: string;
  code: string;
  businessName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  deliveryAddress: string | null;
  customerType: CustomerType;
  taxNumber: string | null;
  paymentTermsDays: number;
  creditLimit: number;
  totalPurchases: number;
  outstandingBalance: number;
  creditUtilizationPct: number;
  salesRepId: string | null;
  salesRep: SalesRep | null;
  status: CustomerStatus;
  notes: string | null;
  orderCount: number;
}

const CUSTOMER_TYPE_BADGES: Record<
  CustomerType,
  { label: string; style: string; priceTier: string }
> = {
  WHOLESALE: {
    label: "Wholesale",
    style: "bg-indigo-50 text-indigo-700 border-indigo-200",
    priceTier: "Wholesale Pricing",
  },
  DISTRIBUTOR: {
    label: "Distributor",
    style: "bg-purple-50 text-purple-700 border-purple-200",
    priceTier: "Wholesale Pricing",
  },
  CORPORATE: {
    label: "Corporate",
    style: "bg-blue-50 text-blue-700 border-blue-200",
    priceTier: "Wholesale Pricing",
  },
  RETAIL: {
    label: "Retail",
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
    priceTier: "Standard Retail",
  },
  INDIVIDUAL: {
    label: "Individual",
    style: "bg-slate-100 text-slate-700 border-slate-200",
    priceTier: "Standard Retail",
  },
};

const STATUS_BADGES: Record<
  CustomerStatus,
  { label: string; style: string }
> = {
  ACTIVE: {
    label: "Active",
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  ON_HOLD: {
    label: "Credit Hold",
    style: "bg-amber-50 text-amber-700 border-amber-200",
  },
  INACTIVE: {
    label: "Inactive",
    style: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: "",
    code: "",
    contactPerson: "",
    phone: "",
    email: "",
    city: "Nairobi",
    address: "",
    deliveryAddress: "",
    customerType: "WHOLESALE" as CustomerType,
    taxNumber: "",
    paymentTermsDays: "14",
    creditLimit: "500000",
    salesRepId: "",
    status: "ACTIVE" as CustomerStatus,
    notes: "",
  });

  async function fetchCustomers() {
    setLoading(true);
    try {
      const res = await fetch("/api/sales/customers");
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers || []);
        setSalesReps(data.salesReps || []);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesType =
        typeFilter === "ALL" || c.customerType === typeFilter;
      const matchesStatus =
        statusFilter === "ALL" || c.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.businessName.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.taxNumber && c.taxNumber.toLowerCase().includes(q));
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [customers, typeFilter, statusFilter, search]);

  const metrics = useMemo(() => {
    const activeCount = customers.filter((c) => c.status === "ACTIVE").length;
    const wholesaleOrDistCount = customers.filter(
      (c) =>
        c.customerType === "WHOLESALE" ||
        c.customerType === "DISTRIBUTOR" ||
        c.customerType === "CORPORATE"
    ).length;
    const totalReceivables = customers.reduce(
      (sum, c) => sum + c.outstandingBalance,
      0
    );
    const totalSalesVolume = customers.reduce(
      (sum, c) => sum + c.totalPurchases,
      0
    );
    return {
      activeCount,
      wholesaleOrDistCount,
      totalReceivables,
      totalSalesVolume,
    };
  }, [customers]);

  function openCreateModal() {
    setEditingCustomer(null);
    setErrorMsg(null);
    setFormData({
      businessName: "",
      code: "",
      contactPerson: "",
      phone: "+254 7",
      email: "",
      city: "Nairobi",
      address: "",
      deliveryAddress: "",
      customerType: "WHOLESALE",
      taxNumber: "",
      paymentTermsDays: "14",
      creditLimit: "500000",
      salesRepId: salesReps[0]?.id || "",
      status: "ACTIVE",
      notes: "",
    });
    setModalOpen(true);
  }

  function openEditModal(customer: CustomerItem) {
    setEditingCustomer(customer);
    setErrorMsg(null);
    setFormData({
      businessName: customer.businessName,
      code: customer.code,
      contactPerson: customer.contactPerson || "",
      phone: customer.phone || "",
      email: customer.email || "",
      city: customer.city || "Nairobi",
      address: customer.address || "",
      deliveryAddress: customer.deliveryAddress || "",
      customerType: customer.customerType,
      taxNumber: customer.taxNumber || "",
      paymentTermsDays: String(customer.paymentTermsDays),
      creditLimit: String(customer.creditLimit),
      salesRepId: customer.salesRepId || "",
      status: customer.status,
      notes: customer.notes || "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const method = editingCustomer ? "PATCH" : "POST";
      const payload = {
        ...(editingCustomer ? { id: editingCustomer.id } : {}),
        businessName: formData.businessName,
        code: formData.code || undefined,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        city: formData.city,
        address: formData.address,
        deliveryAddress: formData.deliveryAddress,
        customerType: formData.customerType,
        taxNumber: formData.taxNumber,
        paymentTermsDays: Number(formData.paymentTermsDays),
        creditLimit: Number(formData.creditLimit),
        salesRepId: formData.salesRepId || null,
        status: formData.status,
        notes: formData.notes,
      };

      const res = await fetch("/api/sales/customers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to save customer.");
      } else {
        setModalOpen(false);
        setSuccessMsg(
          editingCustomer
            ? `Updated customer ${data.customer.businessName}`
            : `Created customer ${data.customer.businessName} (${data.customer.code})`
        );
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchCustomers();
      }
    } catch {
      setErrorMsg("Network error while saving customer.");
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
              Customers & Credit Accounts
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Sales CRM
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage wholesale, distributor, retail, and corporate customer accounts, pricing tiers, credit limits, and receivable balances.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Customer Account
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
              Active Customers
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.activeCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Out of {customers.length} total registered accounts
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              B2B / Wholesale Accounts
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.wholesaleOrDistCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Wholesale, Distributor & Corporate tier
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Lifetime Sales Volume
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(metrics.totalSalesVolume)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Cumulative delivered sales across accounts
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Accounts Receivable
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {formatCurrency(metrics.totalReceivables)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Outstanding customer balances owed
          </p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "ALL", label: "All Types" },
            { key: "WHOLESALE", label: "Wholesale" },
            { key: "DISTRIBUTOR", label: "Distributor" },
            { key: "CORPORATE", label: "Corporate" },
            { key: "RETAIL", label: "Retail" },
            { key: "INDIVIDUAL", label: "Individual" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === tab.key
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="ON_HOLD">On Credit Hold</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search business, code, contact, city..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading customer accounts...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              No matching customer accounts
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Try clearing your filters or register a new wholesale, distributor, or retail customer account.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {search || typeFilter !== "ALL" || statusFilter !== "ALL" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("ALL");
                    setStatusFilter("ALL");
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  Reset filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Register Customer
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Customer Account</th>
                  <th className="py-3.5 px-4">Type & Pricing Tier</th>
                  <th className="py-3.5 px-4">Contact & City</th>
                  <th className="py-3.5 px-4">Sales Rep</th>
                  <th className="py-3.5 px-4">Credit Utilization</th>
                  <th className="py-3.5 px-4 text-right">Total Purchases</th>
                  <th className="py-3.5 px-4 text-right">Receivable Balance</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCustomers.map((customer) => {
                  const typeBadge = CUSTOMER_TYPE_BADGES[customer.customerType];
                  const statusBadge = STATUS_BADGES[customer.status];
                  const highCreditWarning = customer.creditUtilizationPct >= 85;

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 mt-0.5">
                            {customer.businessName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              {customer.businessName}
                              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {customer.code}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                              {customer.taxNumber && (
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-slate-400" />
                                  PIN: {customer.taxNumber}
                                </span>
                              )}
                              <span>Net {customer.paymentTermsDays}d</span>
                              <span>• {customer.orderCount} orders</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeBadge.style}`}
                        >
                          {typeBadge.label}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {typeBadge.priceTier}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium text-xs">
                          {customer.contactPerson || "—"}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {customer.phone || "No phone"}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {customer.city || "Nairobi"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {customer.salesRep ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                            {customer.salesRep.name}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 min-w-[165px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500">
                            Limit: {formatCurrency(customer.creditLimit)}
                          </span>
                          <span
                            className={`font-semibold ${
                              highCreditWarning
                                ? "text-amber-600"
                                : "text-slate-700"
                            }`}
                          >
                            {customer.creditUtilizationPct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              customer.creditUtilizationPct >= 90
                                ? "bg-rose-500"
                                : customer.creditUtilizationPct >= 70
                                ? "bg-amber-500"
                                : "bg-indigo-600"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                customer.creditUtilizationPct
                              )}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                        {formatCurrency(customer.totalPurchases)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-semibold ${
                            customer.outstandingBalance > 0
                              ? "text-amber-700"
                              : "text-slate-500"
                          }`}
                        >
                          {formatCurrency(customer.outstandingBalance)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.style}`}
                        >
                          {customer.status === "ON_HOLD" && (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {customer.status === "ACTIVE" && (
                            <ShieldCheck className="w-3 h-3" />
                          )}
                          {statusBadge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openEditModal(customer)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
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

      {/* Create / Edit Customer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingCustomer
                    ? `Manage Customer — ${editingCustomer.businessName}`
                    : "Register New Customer Account"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure customer classification, credit terms, delivery address, and assigned sales representative.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {editingCustomer && (
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-slate-400">
                      Total Purchases
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {formatCurrency(editingCustomer.totalPurchases)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-slate-400">
                      Outstanding Balance
                    </span>
                    <p className="text-sm font-bold text-amber-700 mt-0.5">
                      {formatCurrency(editingCustomer.outstandingBalance)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-slate-400">
                      Available Credit
                    </span>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">
                      {formatCurrency(
                        Math.max(
                          0,
                          editingCustomer.creditLimit -
                            editingCustomer.outstandingBalance
                        )
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business / Account Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData({ ...formData, businessName: e.target.value })
                    }
                    placeholder="e.g., Naivas Supermarkets Ltd"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    disabled={Boolean(editingCustomer)}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="Auto (e.g. CUS-101)"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Type & Pricing Tier
                  </label>
                  <select
                    value={formData.customerType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customerType: e.target.value as CustomerType,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="WHOLESALE">Wholesale (Wholesale Tier)</option>
                    <option value="DISTRIBUTOR">Distributor (Wholesale Tier)</option>
                    <option value="CORPORATE">Corporate (Wholesale Tier)</option>
                    <option value="RETAIL">Retail (Standard Tier)</option>
                    <option value="INDIVIDUAL">Individual (Standard Tier)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactPerson: e.target.value,
                      })
                    }
                    placeholder="e.g., Grace Wanjiku"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+254 722 000 000"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="procurement@business.co.ke"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    KRA PIN / Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData.taxNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, taxNumber: e.target.value })
                    }
                    placeholder="P051..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / Region
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Nairobi, Mombasa, Kisumu..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Billing Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Street, Building, Industrial Area"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Delivery Drop-off Address
                  </label>
                  <input
                    type="text"
                    value={formData.deliveryAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: e.target.value,
                      })
                    }
                    placeholder="Receiving Bay / Branch Location"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Credit Limit (KES)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.creditLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, creditLimit: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={formData.paymentTermsDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentTermsDays: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="0">Cash on Delivery (COD)</option>
                    <option value="7">Net 7 Days</option>
                    <option value="14">Net 14 Days</option>
                    <option value="30">Net 30 Days</option>
                    <option value="60">Net 60 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sales Representative
                  </label>
                  <select
                    value={formData.salesRepId}
                    onChange={(e) =>
                      setFormData({ ...formData, salesRepId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {salesReps.map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as CustomerStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">Credit Hold</option>
                    <option value="INACTIVE">Inactive</option>
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
                    : editingCustomer
                    ? "Save Customer Changes"
                    : "Create Customer Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
