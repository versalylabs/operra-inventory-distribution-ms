"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Radar,
  CheckCheck,
  Wallet,
  Boxes,
  Clock,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [orgName, setOrgName] = useState("Organization");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [scanBanner, setScanBanner] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setOrgName(data.organizationName || "Organization");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function handleRunAlertScan() {
    setScanning(true);
    setScanBanner(null);
    try {
      const res = await fetch("/api/notifications", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.scanResult) {
        setScanBanner(
          `Scan complete: Checked ${data.scanResult.scannedStockRows} depot stock rows & ${data.scanResult.scannedInvoices} open invoices. Generated ${data.scanResult.newAlertsCreated} new actionable alert(s).`
        );
        await loadNotifications();
        router.refresh();
      }
    } finally {
      setScanning(false);
    }
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    await loadNotifications();
    router.refresh();
  }

  async function handleMarkRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    await loadNotifications();
    router.refresh();
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (filter === "ALL") return true;
    if (filter === "UNREAD") return !n.isRead;
    return n.type === filter;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Bell className="h-4 w-4" />
            Automated Watchdog & Alert Center
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Centralized Notifications — {orgName}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time alerts for low-stock thresholds, overdue tax invoices,
            credit limit holds, and payment receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              <CheckCheck className="h-4 w-4 text-emerald-600" />
              Mark All Read ({unreadCount})
            </button>
          )}
          <button
            type="button"
            onClick={handleRunAlertScan}
            disabled={scanning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Radar className="h-4 w-4" />
            {scanning
              ? "Scanning Stock & Invoices..."
              : "Run Automated Health & Alert Scan"}
          </button>
        </div>
      </div>

      {scanBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <span>{scanBanner}</span>
          <button
            type="button"
            onClick={() => setScanBanner(null)}
            className="text-emerald-600 hover:underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-1.5">
        {[
          { id: "ALL", label: `All Alerts (${notifications.length})` },
          { id: "UNREAD", label: `Unread (${unreadCount})` },
          { id: "LOW_STOCK", label: "Low & Out of Stock" },
          { id: "INVOICE_OVERDUE", label: "Overdue Invoices" },
          { id: "CREDIT_CONTROL", label: "Credit Control" },
          { id: "PAYMENT_RECEIVED", label: "Payments Received" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filter === tab.id
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            Loading notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
            No notifications match this filter. Click &ldquo;Run Automated
            Health &amp; Alert Scan&rdquo; above to check live stock and
            invoices.
          </div>
        ) : (
          filtered.map((item) => {
            const isWarning =
              item.type === "LOW_STOCK" ||
              item.type === "INVOICE_OVERDUE" ||
              item.type === "CREDIT_CONTROL";

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors ${
                  !item.isRead
                    ? "border-indigo-300 bg-indigo-50/15"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      item.type === "LOW_STOCK"
                        ? "bg-amber-50 text-amber-600"
                        : item.type === "INVOICE_OVERDUE" ||
                          item.type === "CREDIT_CONTROL"
                        ? "bg-red-50 text-red-600"
                        : item.type === "PAYMENT_RECEIVED"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-indigo-50 text-indigo-600"
                    }`}
                  >
                    {item.type === "LOW_STOCK" ? (
                      <Boxes className="h-5 w-5" />
                    ) : isWarning ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : item.type === "PAYMENT_RECEIVED" ? (
                      <Wallet className="h-5 w-5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.type.replace("_", " ")}
                      </span>
                      {!item.isRead && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                          New
                        </span>
                      )}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 mt-1">
                      {item.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(item.id)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}
                  {item.link && (
                    <Link
                      href={item.link}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                    >
                      Open Module
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
