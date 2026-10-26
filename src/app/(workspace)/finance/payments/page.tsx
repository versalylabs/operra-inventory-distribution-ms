"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  Wallet,
  Plus,
  Search,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Smartphone,
  Building2,
  CreditCard,
  Lock,
  Unlock,
  SlidersHorizontal,
  X,
  FileText,
} from "lucide-react";

interface PaymentItem {
  id: string;
  paymentNumber: string;
  amount: number;
  method: "MPESA" | "BANK_TRANSFER" | "CASH" | "CHEQUE" | "CARD" | "OTHER";
  reference: string | null;
  paymentDate: string;
  notes: string | null;
  customer: {
    id: string;
    code: string;
    businessName: string;
    customerType: string;
    phone: string | null;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    balanceDue: number;
    status: string;
    salesOrder: { orderNumber: string } | null;
  };
  recordedBy: { id: string; name: string; email: string };
}

interface OpenInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  balanceDue: number;
  dueDate: string;
  customer: {
    id: string;
    code: string;
    businessName: string;
  };
}

interface CreditAccount {
  id: string;
  code: string;
  businessName: string;
  contactPerson: string | null;
  phone: string | null;
  city: string | null;
  customerType: string;
  paymentTermsDays: number;
  creditLimit: number;
  outstandingBalance: number;
  availableCredit: number;
  totalPurchases: number;
  utilizationPct: number;
  overdueBalance: number;
  overdueInvoicesCount: number;
  maxDaysOverdue: number;
  openInvoicesCount: number;
  status: "ACTIVE" | "ON_HOLD" | "INACTIVE";
  creditRisk: "HEALTHY" | "WARNING" | "EXCEEDED" | "ON_HOLD";
  salesRep: { id: string; name: string } | null;
}

const METHOD_BADGES: Record<string, string> = {
  MPESA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  BANK_TRANSFER: "bg-blue-50 text-blue-700 border-blue-200",
  CHEQUE: "bg-purple-50 text-purple-700 border-purple-200",
  CASH: "bg-amber-50 text-amber-700 border-amber-200",
  CARD: "bg-indigo-50 text-indigo-700 border-indigo-200",
  OTHER: "bg-slate-100 text-slate-700 border-slate-200",
};

const RISK_BADGES: Record<string, string> = {
  HEALTHY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  WARNING: "bg-amber-50 text-amber-700 border-amber-200",
  EXCEEDED: "bg-red-50 text-red-700 border-red-200",
  ON_HOLD: "bg-slate-900 text-white border-slate-900",
};

export default function PaymentsAndCreditPage() {
  const [activeTab, setActiveTab] = useState<"PAYMENTS" | "CREDIT">("PAYMENTS");
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [creditAccounts, setCreditAccounts] = useState<CreditAccount[]>([]);
  const [currency, setCurrency] = useState("KES");
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Record Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("MPESA");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit Credit Policy Modal
  const [editingCustomer, setEditingCustomer] = useState<CreditAccount | null>(
    null
  );
  const [editCreditLimit, setEditCreditLimit] = useState("");
  const [editTermsDays, setEditTermsDays] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "ON_HOLD">("ACTIVE");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finance/payments");
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments || []);
        setOpenInvoices(data.openInvoices || []);
        setCreditAccounts(data.creditAccounts || []);
        setCurrency(data.currency || "KES");
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

  function handleSelectInvoice(invId: string) {
    setSelectedInvoiceId(invId);
    const inv = openInvoices.find((i) => i.id === invId);
    if (inv) {
      setAmount(String(inv.balanceDue));
      setReference(
        method === "MPESA"
          ? `SHK${Math.random().toString(36).substring(2, 9).toUpperCase()}`
          : `EFT-2026-${Math.floor(1000 + Math.random() * 9000)}`
      );
      setNotes(`Customer payment for ${inv.invoiceNumber}`);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInvoiceId) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/finance/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          amount: Number(amount),
          method,
          reference,
          notes,
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
          message: `Receipt ${data.payment.paymentNumber} recorded and customer balance updated.`,
        });
        setPaymentModalOpen(false);
        await loadData();
      }
    } catch {
      setFeedback({ type: "error", message: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleHold(account: CreditAccount) {
    const nextStatus = account.status === "ON_HOLD" ? "ACTIVE" : "ON_HOLD";
    try {
      const res = await fetch("/api/finance/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: account.id,
          status: nextStatus,
          notes: `Toggled credit status to ${nextStatus}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: data.error || "Failed to update credit status",
        });
      } else {
        setFeedback({
          type: "success",
          message: `${account.businessName} is now ${
            nextStatus === "ON_HOLD" ? "placed on CREDIT HOLD" : "ACTIVE"
          }.`,
        });
        await loadData();
      }
    } catch {
      setFeedback({ type: "error", message: "Network error" });
    }
  }

  async function handleSaveCreditPolicy(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCustomer) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/finance/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: editingCustomer.id,
          creditLimit: Number(editCreditLimit),
          paymentTermsDays: Number(editTermsDays),
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: data.error || "Failed to update credit limit",
        });
      } else {
        setFeedback({
          type: "success",
          message: `Updated credit limit & payment terms for ${editingCustomer.businessName}.`,
        });
        setEditingCustomer(null);
        await loadData();
      }
    } catch {
      setFeedback({ type: "error", message: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const mpesaVolume = payments
    .filter((p) => p.method === "MPESA")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalReceivables = creditAccounts.reduce(
    (sum, c) => sum + c.outstandingBalance,
    0
  );
  const holdOrExceededCount = creditAccounts.filter(
    (c) => c.creditRisk === "ON_HOLD" || c.creditRisk === "EXCEEDED"
  ).length;

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.customer.businessName.toLowerCase().includes(search.toLowerCase()) ||
      p.invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (p.reference || "").toLowerCase().includes(search.toLowerCase());

    if (methodFilter === "ALL") return matchesSearch;
    return matchesSearch && p.method === methodFilter;
  });

  const filteredCreditAccounts = creditAccounts.filter(
    (c) =>
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.city || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Wallet className="h-4 w-4" />
            Treasury, Collections & Risk Control
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Customer Payments & Credit Control
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Reconcile M-Pesa Paybill, Bank EFT, and Cash collections while
            enforcing customer credit limits and AR aging holds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/sales/invoices"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <FileText className="h-4 w-4 text-slate-500" />
            View Tax Invoices
          </Link>
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setPaymentModalOpen(true);
                if (openInvoices.length > 0) {
                  handleSelectInvoice(openInvoices[0].id);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Record Customer Payment
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Payments Collected
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(totalCollected, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Across {payments.length} Verified Receipts
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              M-Pesa Paybill / Till
            </span>
            <Smartphone className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {formatCurrency(mpesaVolume, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {payments.filter((p) => p.method === "MPESA").length} M-Pesa
            Transactions
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Customer AR Exposure
            </span>
            <Building2 className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(totalReceivables, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {openInvoices.length} Open Unpaid Invoices
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Credit Hold & Limit Alerts
            </span>
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {holdOrExceededCount} Accounts
          </p>
          <p className="mt-1 text-xs text-slate-500">
            On Credit Hold or Over Limit
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs + Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("PAYMENTS")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "PAYMENTS"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Payment Receipts Ledger ({payments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("CREDIT")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "CREDIT"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Credit Control & AR Aging ({creditAccounts.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 flex-1 md:justify-end">
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === "PAYMENTS"
                  ? "Search receipt #, M-Pesa ref, customer..."
                  : "Search customer, code, city..."
              }
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {activeTab === "PAYMENTS" && (
            <div className="flex items-center gap-1">
              {["ALL", "MPESA", "BANK_TRANSFER", "CHEQUE", "CASH"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethodFilter(m)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer ${
                    methodFilter === m
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {m.replace("_", " ")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: PAYMENT RECEIPTS LEDGER */}
      {activeTab === "PAYMENTS" ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Invoice & Order</th>
                  <th className="py-3.5 px-4">Method & Reference</th>
                  <th className="py-3.5 px-4">Date & Cashier</th>
                  <th className="py-3.5 px-4 text-right">Amount Paid</th>
                  <th className="py-3.5 px-4 text-right">Remaining Invoice Bal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-400"
                    >
                      Loading payment receipts...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-500"
                    >
                      No payment records match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {p.paymentNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {p.customer.businessName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.customer.code} • {p.customer.customerType}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-indigo-600">
                          {p.invoice.invoiceNumber}
                        </div>
                        {p.invoice.salesOrder && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            Order: {p.invoice.salesOrder.orderNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            METHOD_BADGES[p.method] || METHOD_BADGES.OTHER
                          }`}
                        >
                          {p.method.replace("_", " ")}
                        </span>
                        <div className="text-[11px] font-mono text-slate-600 mt-1">
                          Ref: {p.reference || "N/A"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800">
                          {new Date(p.paymentDate).toLocaleDateString("en-KE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          By {p.recordedBy.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        {formatCurrency(p.amount, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                        {formatCurrency(p.invoice.balanceDue, currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 2: CREDIT CONTROL & AR AGING WATCHLIST */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Customer Account</th>
                  <th className="py-3.5 px-4">Terms</th>
                  <th className="py-3.5 px-4 text-right">Credit Limit</th>
                  <th className="py-3.5 px-4 text-right">Outstanding AR</th>
                  <th className="py-3.5 px-4 text-right">Available Headroom</th>
                  <th className="py-3.5 px-4">Utilization</th>
                  <th className="py-3.5 px-4">Overdue Aging</th>
                  <th className="py-3.5 px-4">Risk Status</th>
                  <th className="py-3.5 px-4 text-right">Credit Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCreditAccounts.map((acc) => (
                  <tr
                    key={acc.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {acc.businessName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {acc.code} • {acc.customerType} • {acc.city || "Kenya"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      Net {acc.paymentTermsDays}d
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                      {formatCurrency(acc.creditLimit, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(acc.outstandingBalance, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                      {formatCurrency(acc.availableCredit, currency)}
                    </td>
                    <td className="py-3.5 px-4 w-36">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-700">
                          {acc.utilizationPct}%
                        </span>
                        <span className="text-slate-400">
                          {acc.openInvoicesCount} inv
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            acc.utilizationPct > 100
                              ? "bg-red-600"
                              : acc.utilizationPct >= 80
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(100, acc.utilizationPct)}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {acc.overdueInvoicesCount > 0 ? (
                        <div className="text-red-600 font-semibold">
                          {formatCurrency(acc.overdueBalance, currency)}
                          <div className="text-[10px] text-red-500">
                            {acc.overdueInvoicesCount} inv • {acc.maxDaysOverdue}d
                            overdue
                          </div>
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-medium">
                          Current (0d)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          RISK_BADGES[acc.creditRisk]
                        }`}
                      >
                        {acc.creditRisk.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canManage && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleHold(acc)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                              acc.status === "ON_HOLD"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                            }`}
                          >
                            {acc.status === "ON_HOLD" ? (
                              <>
                                <Unlock className="h-3 w-3" />
                                Release
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3" />
                                Hold
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer(acc);
                              setEditCreditLimit(String(acc.creditLimit));
                              setEditTermsDays(String(acc.paymentTermsDays));
                              setEditStatus(
                                acc.status === "ON_HOLD" ? "ON_HOLD" : "ACTIVE"
                              );
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                            title="Adjust Credit Limit & Terms"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Record Customer Payment */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Record Customer Payment Receipt
                </h2>
                <p className="text-xs text-slate-500">
                  Apply payment against an open Tax Invoice and reduce customer
                  AR balance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {openInvoices.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-900">
                  All issued invoices are fully paid!
                </p>
                <p className="text-xs text-slate-500">
                  Issue a new Tax Invoice under Sales → Invoices to record
                  additional customer payments.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Open Invoice *
                  </label>
                  <select
                    required
                    value={selectedInvoiceId}
                    onChange={(e) => handleSelectInvoice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  >
                    {openInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — {inv.customer.businessName} (Bal:{" "}
                        {formatCurrency(inv.balanceDue, currency)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Amount Paid ({currency}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payment Channel *
                    </label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    >
                      <option value="MPESA">M-Pesa Paybill / Till</option>
                      <option value="BANK_TRANSFER">Bank EFT / RTGS</option>
                      <option value="CHEQUE">Corporate Cheque</option>
                      <option value="CASH">Cash on Delivery</option>
                      <option value="CARD">Card POS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    M-Pesa / Bank Transaction Reference *
                  </label>
                  <input
                    type="text"
                    required
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Post Payment Receipt"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Edit Customer Credit Policy */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Credit Control Policy
                </h2>
                <p className="text-xs text-slate-500">
                  {editingCustomer.businessName} ({editingCustomer.code})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCreditPolicy} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Authorized Credit Limit ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={editCreditLimit}
                  onChange={(e) => setEditCreditLimit(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Terms (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  required
                  value={editTermsDays}
                  onChange={(e) => setEditTermsDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Credit Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as "ACTIVE" | "ON_HOLD")
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                >
                  <option value="ACTIVE">
                    ACTIVE — Allowed to place credit orders
                  </option>
                  <option value="ON_HOLD">
                    ON HOLD — Block new credit orders until AR cleared
                  </option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  {submitting ? "Updating..." : "Save Credit Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
