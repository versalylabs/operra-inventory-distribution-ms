"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Wallet,
  Printer,
  Eye,
  X,
  CreditCard,
  ShieldAlert,
  Building2,
  ArrowUpRight,
} from "lucide-react";

interface InvoiceItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  lineTotal: number;
  product: {
    id: string;
    name: string;
    sku: string;
    unitOfMeasure: string;
  };
}

interface PaymentRecord {
  id: string;
  paymentNumber: string;
  amount: number;
  method: string;
  reference: string | null;
  paymentDate: string;
  recordedBy: { id: string; name: string };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status:
    | "DRAFT"
    | "ISSUED"
    | "PARTIALLY_PAID"
    | "PAID"
    | "OVERDUE"
    | "CANCELLED";
  issueDate: string;
  dueDate: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  taxReference: string | null;
  notes: string | null;
  isPastDue: boolean;
  daysOverdue: number;
  customer: {
    id: string;
    code: string;
    businessName: string;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
    city: string | null;
    taxNumber: string | null;
    customerType: string;
    paymentTermsDays: number;
    creditLimit: number;
    outstandingBalance: number;
    status: string;
  };
  salesOrder: {
    id: string;
    orderNumber: string;
    status: string;
    warehouse: { id: string; name: string; code: string };
  } | null;
  issuedBy: { id: string; name: string; email: string };
  items: InvoiceItem[];
  payments: PaymentRecord[];
}

interface BillableOrder {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  customer: {
    id: string;
    code: string;
    businessName: string;
    paymentTermsDays: number;
    taxNumber: string | null;
  };
  warehouse: { id: string; name: string; code: string };
  items: Array<{
    id: string;
    orderedQuantity: number;
    deliveredQuantity: number;
    unitPrice: number;
    lineTotal: number;
    product: { id: string; name: string; sku: string; unitOfMeasure: string };
  }>;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  ISSUED: "bg-blue-50 text-blue-700 border-blue-200",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billableOrders, setBillableOrders] = useState<BillableOrder[]>([]);
  const [currency, setCurrency] = useState("KES");
  const [orgInfo, setOrgInfo] = useState<{
    name: string;
    taxNumber: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
  } | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Create Invoice Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [customDueDate, setCustomDueDate] = useState("");
  const [taxReference, setTaxReference] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Record Payment Modal
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("MPESA");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Printable Tax Invoice View Modal
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales/invoices");
      const data = await res.json();
      if (res.ok) {
        setInvoices(data.invoices || []);
        setBillableOrders(data.billableOrders || []);
        setCurrency(data.currency || "KES");
        setOrgInfo(data.organization || null);
        setCanManage(Boolean(data.canManage));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedBillableOrder = billableOrders.find(
    (o) => o.id === selectedOrderId
  );

  function handleSelectOrder(orderId: string) {
    setSelectedOrderId(orderId);
    const ord = billableOrders.find((o) => o.id === orderId);
    if (ord) {
      const days = ord.customer.paymentTermsDays || 14;
      const due = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      setCustomDueDate(due.toISOString().split("T")[0]);
      setTaxReference(
        `KRA-CU-2026-${Math.floor(100000 + Math.random() * 900000)}`
      );
      setInvoiceNotes(`Official Tax Invoice for ${ord.orderNumber}`);
    }
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrderId) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/sales/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesOrderId: selectedOrderId,
          dueDate: customDueDate,
          taxReference,
          notes: invoiceNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: data.error || "Failed to generate invoice",
        });
      } else {
        setFeedback({
          type: "success",
          message: `Tax Invoice ${data.invoice.invoiceNumber} generated and issued.`,
        });
        setCreateModalOpen(false);
        setSelectedOrderId("");
        await loadData();
      }
    } catch {
      setFeedback({ type: "error", message: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  function openPaymentModal(inv: Invoice) {
    setPaymentInvoice(inv);
    setPaymentAmount(String(inv.balanceDue));
    setPaymentMethod("MPESA");
    setPaymentRef(
      `SHK${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    );
    setPaymentNotes(`Payment against ${inv.invoiceNumber}`);
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentInvoice) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/finance/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: paymentInvoice.id,
          amount: Number(paymentAmount),
          method: paymentMethod,
          reference: paymentRef,
          notes: paymentNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: data.error || "Failed to record payment",
        });
      } else {
        setFeedback({
          type: "success",
          message: `Payment ${data.payment.paymentNumber} (${formatCurrency(
            Number(paymentAmount),
            currency
          )}) recorded against ${paymentInvoice.invoiceNumber}.`,
        });
        setPaymentInvoice(null);
        await loadData();
      }
    } catch {
      setFeedback({ type: "error", message: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  const activeInvoices = invoices.filter((i) => i.status !== "CANCELLED");
  const totalInvoiced = activeInvoices.reduce(
    (sum, i) => sum + i.totalAmount,
    0
  );
  const totalCollected = activeInvoices.reduce(
    (sum, i) => sum + i.amountPaid,
    0
  );
  const totalBalanceDue = activeInvoices.reduce(
    (sum, i) => sum + i.balanceDue,
    0
  );
  const overdueInvoices = activeInvoices.filter(
    (i) => i.status === "OVERDUE" || i.isPastDue
  );

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer.businessName.toLowerCase().includes(search.toLowerCase()) ||
      (inv.salesOrder?.orderNumber || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (inv.taxReference || "").toLowerCase().includes(search.toLowerCase());

    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "OVERDUE") {
      return matchesSearch && (inv.status === "OVERDUE" || inv.isPastDue);
    }
    return matchesSearch && inv.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <FileText className="h-4 w-4" />
            Sales Billing & Tax Compliance
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Tax Invoices & Accounts Receivable
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Generate KRA eTIMS-ready tax invoices from Sales Orders, track payment
            aging, and collect M-Pesa, Bank EFT, or Cash receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/finance/payments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <Wallet className="h-4 w-4 text-indigo-600" />
            Payments & Credit Control
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setCreateModalOpen(true);
                if (billableOrders.length > 0) {
                  handleSelectOrder(billableOrders[0].id);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Generate Invoice ({billableOrders.length} Ready)
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Billed Revenue
            </span>
            <FileText className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(totalInvoiced, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {activeInvoices.length} Active Tax Invoices
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Collected Receipts
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {formatCurrency(totalCollected, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {totalInvoiced > 0
              ? `${Math.round((totalCollected / totalInvoiced) * 100)}% Collection Rate`
              : "No billed invoices yet"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Open Balance Due (AR)
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(totalBalanceDue, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {billableOrders.length} Unbilled Sales Orders Waiting
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Overdue Invoices
            </span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {overdueInvoices.length} Overdue
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatCurrency(
              overdueInvoices.reduce((s, i) => s + i.balanceDue, 0),
              currency
            )}{" "}
            Past Due Date
          </p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #, customer, order #, or KRA eTIMS ref..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            "ALL",
            "ISSUED",
            "PARTIALLY_PAID",
            "PAID",
            "OVERDUE",
            "CANCELLED",
          ].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Invoice & eTIMS</th>
                <th className="py-3.5 px-4">Customer Account</th>
                <th className="py-3.5 px-4">Order Ref</th>
                <th className="py-3.5 px-4">Issue / Due Date</th>
                <th className="py-3.5 px-4 text-right">Total Billed</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Balance Due</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading tax invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No tax invoices match your current filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const effectiveStatus =
                    inv.isPastDue && inv.status !== "PAID"
                      ? "OVERDUE"
                      : inv.status;

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {inv.taxReference || "KRA-Pending"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {inv.customer.businessName}
                          {inv.customer.status === "ON_HOLD" && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-100 text-red-700 font-bold">
                              HOLD
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {inv.customer.code} • Net{" "}
                          {inv.customer.paymentTermsDays}d
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {inv.salesOrder ? (
                          <div>
                            <span className="font-mono font-semibold text-indigo-600">
                              {inv.salesOrder.orderNumber}
                            </span>
                            <div className="text-[11px] text-slate-500">
                              {inv.salesOrder.warehouse.code}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Direct Billing</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800">
                          Issued:{" "}
                          {new Date(inv.issueDate).toLocaleDateString("en-KE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div
                          className={`text-[11px] font-medium ${
                            inv.isPastDue ? "text-red-600" : "text-slate-500"
                          }`}
                        >
                          Due:{" "}
                          {new Date(inv.dueDate).toLocaleDateString("en-KE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          {inv.isPastDue && ` (${inv.daysOverdue}d overdue)`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        {formatCurrency(inv.totalAmount, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-emerald-700">
                        {formatCurrency(inv.amountPaid, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(inv.balanceDue, currency)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            STATUS_STYLES[effectiveStatus] ||
                            STATUS_STYLES.ISSUED
                          }`}
                        >
                          {effectiveStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingInvoice(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-medium cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Invoice
                          </button>
                          {canManage &&
                            inv.balanceDue > 0 &&
                            inv.status !== "CANCELLED" && (
                              <button
                                type="button"
                                onClick={() => openPaymentModal(inv)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold cursor-pointer"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                                Pay
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Generate Invoice from Sales Order */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Generate Tax Invoice from Sales Order
                </h2>
                <p className="text-xs text-slate-500">
                  Select an unbilled Sales Order to issue an official KRA eTIMS
                  Tax Invoice.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {billableOrders.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-900">
                  All active Sales Orders have already been invoiced!
                </p>
                <p className="text-xs text-slate-500">
                  Create and confirm a new Sales Order under Sales → Orders to
                  generate a new invoice.
                </p>
                <div className="pt-2">
                  <Link
                    href="/sales/orders"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                  >
                    Go to Sales Orders →
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Unbilled Sales Order *
                  </label>
                  <select
                    required
                    value={selectedOrderId}
                    onChange={(e) => handleSelectOrder(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    {billableOrders.map((ord) => (
                      <option key={ord.id} value={ord.id}>
                        {ord.orderNumber} — {ord.customer.businessName} (
                        {formatCurrency(ord.totalAmount, currency)} •{" "}
                        {ord.status})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBillableOrder && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <span className="font-bold text-slate-900">
                          {selectedBillableOrder.customer.businessName}
                        </span>
                        <span className="ml-2 text-slate-500">
                          PIN:{" "}
                          {selectedBillableOrder.customer.taxNumber || "N/A"}
                        </span>
                      </div>
                      <span className="font-semibold text-indigo-600">
                        Terms: Net{" "}
                        {selectedBillableOrder.customer.paymentTermsDays} Days
                      </span>
                    </div>

                    <div className="max-h-36 overflow-y-auto divide-y divide-slate-200/60">
                      {selectedBillableOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className="py-1.5 flex items-center justify-between"
                        >
                          <span>
                            {item.product.name} ({item.orderedQuantity}{" "}
                            {item.product.unitOfMeasure})
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(item.lineTotal, currency)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-slate-900">
                      <span>Total Invoice Amount (Incl. 16% VAT):</span>
                      <span className="text-sm text-indigo-600">
                        {formatCurrency(
                          selectedBillableOrder.totalAmount,
                          currency
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payment Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={customDueDate}
                      onChange={(e) => setCustomDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      KRA eTIMS Control Unit Ref
                    </label>
                    <input
                      type="text"
                      value={taxReference}
                      onChange={(e) => setTaxReference(e.target.value)}
                      placeholder="e.g. KRA-CU-2026-104829"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invoice Billing Notes
                  </label>
                  <input
                    type="text"
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    placeholder="Payment instructions, M-Pesa Paybill 400200, etc."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Generating..." : "Issue Tax Invoice"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Record Customer Payment */}
      {paymentInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Record Payment — {paymentInvoice.invoiceNumber}
                </h2>
                <p className="text-xs text-slate-500">
                  {paymentInvoice.customer.businessName} • Balance Due:{" "}
                  <span className="font-bold text-slate-900">
                    {formatCurrency(paymentInvoice.balanceDue, currency)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Received ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={paymentInvoice.balanceDue}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  >
                    <option value="MPESA">M-Pesa Paybill / Till</option>
                    <option value="BANK_TRANSFER">Bank EFT / RTGS</option>
                    <option value="CHEQUE">Corporate Cheque</option>
                    <option value="CASH">Cash on Delivery</option>
                    <option value="CARD">POS Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction / Receipt Reference *
                </label>
                <input
                  type="text"
                  required
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. M-Pesa Code SHK84M92LP or Bank EFT Ref"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Notes
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentInvoice(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Recording..." : "Confirm Payment Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Printable Tax Invoice Document */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white sticky top-0">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-indigo-400" />
                <div>
                  <h2 className="text-sm font-bold">
                    OFFICIAL TAX INVOICE — {viewingInvoice.invoiceNumber}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    eTIMS Control Ref:{" "}
                    {viewingInvoice.taxReference || "KRA-CU-VERIFIED"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewingInvoice(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 text-xs">
              {/* Seller & Buyer Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-5 border-b border-slate-200">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Issued By (Supplier)
                  </p>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {orgInfo?.name || "Operra Enterprise Distributors"}
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    {orgInfo?.address || "Industrial Area"}, {orgInfo?.city || "Nairobi"}
                  </p>
                  <p className="text-slate-600">
                    KRA PIN:{" "}
                    <span className="font-mono font-semibold text-slate-900">
                      {orgInfo?.taxNumber || "P051889214K"}
                    </span>
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Billed To (Customer)
                  </p>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {viewingInvoice.customer.businessName}
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    {viewingInvoice.customer.contactPerson} •{" "}
                    {viewingInvoice.customer.phone}
                  </p>
                  <p className="text-slate-600">
                    Customer PIN:{" "}
                    <span className="font-mono font-semibold text-slate-900">
                      {viewingInvoice.customer.taxNumber || "P051440291M"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Invoice Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">
                    Invoice Number
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {viewingInvoice.invoiceNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">
                    Sales Order Ref
                  </span>
                  <span className="font-mono font-semibold text-indigo-600">
                    {viewingInvoice.salesOrder?.orderNumber || "Direct"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">
                    Issue Date
                  </span>
                  <span className="font-semibold text-slate-900">
                    {new Date(viewingInvoice.issueDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">
                    Due Date
                  </span>
                  <span className="font-semibold text-slate-900">
                    {new Date(viewingInvoice.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full min-w-[500px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                      <th className="py-2.5 px-3">SKU & Product</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">VAT %</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">
                            {item.product.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {item.product.sku}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {item.quantity} {item.product.unitOfMeasure}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {formatCurrency(item.unitPrice, currency)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {item.taxRate}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                          {formatCurrency(item.lineTotal, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Payment Receipts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                <div className="space-y-2">
                  <p className="font-bold text-slate-800">
                    Recorded Payment Receipts ({viewingInvoice.payments.length})
                  </p>
                  {viewingInvoice.payments.length === 0 ? (
                    <p className="text-slate-400 italic">
                      No payments recorded against this invoice yet.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {viewingInvoice.payments.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-bold text-emerald-900">
                              {p.paymentNumber}
                            </span>{" "}
                            • <span className="font-semibold">{p.method}</span>
                            <div className="text-[10px] text-emerald-700 font-mono">
                              Ref: {p.reference} •{" "}
                              {new Date(p.paymentDate).toLocaleDateString()}
                            </div>
                          </div>
                          <span className="font-bold text-emerald-800">
                            {formatCurrency(p.amount, currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal (Excl. Tax):</span>
                    <span>
                      {formatCurrency(viewingInvoice.subtotal, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>VAT (16%):</span>
                    <span>
                      {formatCurrency(viewingInvoice.taxAmount, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                    <span>Total Invoice Amount:</span>
                    <span>
                      {formatCurrency(viewingInvoice.totalAmount, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Amount Paid:</span>
                    <span>
                      - {formatCurrency(viewingInvoice.amountPaid, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-indigo-700 pt-2 border-t border-slate-200 text-sm">
                    <span>Balance Due:</span>
                    <span>
                      {formatCurrency(viewingInvoice.balanceDue, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
