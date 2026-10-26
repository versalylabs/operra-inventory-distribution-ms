import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InventoryService } from "@/services/inventory.service";
import { PurchaseService } from "@/services/purchase.service";
import { SalesService } from "@/services/sales.service";
import { DistributionService } from "@/services/distribution.service";
import { FinanceService } from "@/services/finance.service";
import { ROLE_LABELS, ROLE_BADGE_STYLES, ROLE_DESCRIPTIONS } from "@/lib/rbac";
import { formatCurrency } from "@/lib/utils";
import {
  Boxes,
  Warehouse,
  ShoppingCart,
  Truck,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Building2,
  FileText,
  AlertTriangle,
  XCircle,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

export const metadata = {
  title: "Operations Dashboard",
};

export default async function DashboardPage() {
  const context = await requireAuth();

  const [
    productCount,
    categoryCount,
    warehouses,
    stockItems,
    suppliers,
    purchaseOrders,
    customers,
    salesOrders,
    deliveries,
    drivers,
    vehicles,
    invoices,
    payments,
    recentAuditLogs,
    notifications,
  ] = await Promise.all([
    prisma.product.count({
      where: { organizationId: context.organization.id, status: "ACTIVE" },
    }),
    prisma.category.count({
      where: { organizationId: context.organization.id, status: "ACTIVE" },
    }),
    InventoryService.listWarehouses(context.organization.id),
    InventoryService.listInventoryStock({
      organizationId: context.organization.id,
    }),
    PurchaseService.listSuppliers(context.organization.id),
    PurchaseService.listPurchaseOrders(context.organization.id),
    SalesService.listCustomers(context.organization.id),
    SalesService.listSalesOrders(context.organization.id),
    DistributionService.listDeliveries(context.organization.id),
    DistributionService.listDrivers(context.organization.id),
    DistributionService.listVehicles(context.organization.id),
    FinanceService.listInvoices(context.organization.id),
    FinanceService.listPayments(context.organization.id),
    prisma.auditLog.findMany({
      where: { organizationId: context.organization.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.notification.findMany({
      where: { organizationId: context.organization.id },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const totalInventoryValue = stockItems.reduce(
    (sum, item) => sum + item.stockValue,
    0
  );
  const totalAvailableUnits = stockItems.reduce(
    (sum, item) => sum + item.availableStock,
    0
  );
  const lowStockItems = stockItems.filter(
    (item) => item.health === "LOW_STOCK"
  );
  const outOfStockItems = stockItems.filter(
    (item) => item.health === "OUT_OF_STOCK"
  );

  const totalSupplierPayables = suppliers.reduce(
    (sum, s) => sum + s.outstandingBalance,
    0
  );
  const openPoCount = purchaseOrders.filter(
    (po) =>
      po.status === "ORDERED" ||
      po.status === "PENDING_APPROVAL" ||
      po.status === "PARTIALLY_RECEIVED"
  ).length;

  const activeSalesOrders = salesOrders.filter(
    (o) =>
      o.status === "CONFIRMED" ||
      o.status === "PROCESSING" ||
      o.status === "READY_FOR_DELIVERY"
  );
  const activePipelineValue = activeSalesOrders.reduce(
    (sum, o) => sum + o.totalAmount,
    0
  );
  const totalCustomerReceivables = customers.reduce(
    (sum, c) => sum + c.outstandingBalance,
    0
  );
  const totalCollectedPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const activeDeliveriesCount = deliveries.filter(
    (d) =>
      d.status === "PENDING" ||
      d.status === "ASSIGNED" ||
      d.status === "IN_TRANSIT"
  ).length;
  const completedPodCount = deliveries.filter(
    (d) => d.status === "DELIVERED"
  ).length;

  const kpiCards = [
    {
      label: "Total Inventory Value",
      value: formatCurrency(totalInventoryValue, context.organization.currency),
      subtext: `${totalAvailableUnits.toLocaleString()} Available Units across ${warehouses.length} Warehouses`,
      icon: Boxes,
      href: "/inventory/stock",
    },
    {
      label: "Active Sales & Invoicing",
      value: formatCurrency(activePipelineValue, context.organization.currency),
      subtext: `${invoices.length} Tax Invoices • ${salesOrders.length} Sales Orders`,
      icon: ShoppingCart,
      href: "/sales/invoices",
    },
    {
      label: "AR & Credit Control",
      value: formatCurrency(
        totalCustomerReceivables,
        context.organization.currency
      ),
      subtext: `${formatCurrency(totalCollectedPayments, context.organization.currency)} Collected (${payments.length} Receipts)`,
      icon: Wallet,
      href: "/finance/payments",
    },
    {
      label: "Outstanding Supplier Balances",
      value: formatCurrency(
        totalSupplierPayables,
        context.organization.currency
      ),
      subtext: `${suppliers.length} Active Suppliers • ${openPoCount} Open POs`,
      icon: ShoppingBag,
      href: "/purchasing/suppliers",
    },
    {
      label: "Low & Out of Stock Alerts",
      value: `${lowStockItems.length} Low / ${outOfStockItems.length} Out`,
      subtext: `${productCount} SKUs across ${categoryCount} Categories`,
      icon: AlertTriangle,
      href: "/inventory/stock",
    },
    {
      label: "Active Fleet Deliveries",
      value: `${activeDeliveriesCount} Active / ${completedPodCount} PODs`,
      subtext: `${vehicles.length} Fleet Vehicles • ${drivers.length} Commercial Drivers`,
      icon: Truck,
      href: "/distribution/deliveries",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Operational Banner */}
      <div className="bg-white rounded-[12px] border border-[#b9bbc6]/40 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Phase 9 Profitability, Expenses &amp; Executive Analytics Active
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-[6px] border ${
                ROLE_BADGE_STYLES[context.membership.role]
              }`}
            >
              Signed in as {ROLE_LABELS[context.membership.role]}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-compressed-sm text-[#000000]">
            Operational Command Center — {context.organization.name}
          </h1>
          <p className="text-sm text-[#60646c] mt-1">
            {ROLE_DESCRIPTIONS[context.membership.role]}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#ff5900] hover:bg-[#e04e00] text-white text-xs font-semibold tracking-compressed-sm transition-all shadow-xs"
          >
            <FileText className="h-3.5 w-3.5" />
            Profitability &amp; Reports
          </Link>
          <Link
            href="/finance/payments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold tracking-compressed-sm transition-all shadow-xs"
          >
            <Wallet className="h-3.5 w-3.5" />
            Payments &amp; Credit ({payments.length})
          </Link>
          <Link
            href="/distribution/deliveries"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#15191e] hover:bg-[#000000] text-white text-xs font-semibold tracking-compressed-sm transition-all shadow-xs"
          >
            <Truck className="h-3.5 w-3.5" />
            Deliveries &amp; POD ({deliveries.length})
          </Link>
        </div>
      </div>

      {/* Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group bg-white rounded-[12px] border border-[#b9bbc6]/40 p-5 hover:border-[#ff5900]/60 hover:shadow-xs transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-[10px] bg-[#f3f3f7] group-hover:bg-[#fff6f0] flex items-center justify-center text-[#15191e] group-hover:text-[#ff5900] transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-[#8b8d98] group-hover:text-[#ff5900] transition-colors" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#60646c]">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-extrabold tracking-compressed-sm text-[#000000]">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-[#8b8d98]">{card.subtext}</p>
            </Link>
          );
        })}
      </div>

      {/* Warehouse Valuation Breakdown & Low Stock Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouse Stock Valuation */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-indigo-600" />
              Stock Value by Warehouse
            </h2>
            <Link
              href="/inventory/warehouses"
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              Manage →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {warehouses.map((w) => (
              <Link
                key={w.id}
                href={`/inventory/stock?warehouseId=${w.id}`}
                className="block p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50/40 border border-slate-200/80 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      {w.name}
                    </span>
                    <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {w.code}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-indigo-600">
                    {formatCurrency(w.totalValue, context.organization.currency)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{w.skuCount} Stocked SKUs</span>
                  <span>
                    {w.availableUnits.toLocaleString()} Available /{" "}
                    {w.reservedUnits} Reserved
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Low Stock & Out of Stock Watchlist */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Replenishment Watchlist (Low & Out of Stock)
              </h2>
            </div>
            <Link
              href="/purchasing/orders"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              Create PO →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {[...outOfStockItems, ...lowStockItems].slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">
                    {item.product.name}
                  </span>
                  <div className="text-slate-500 mt-0.5">
                    <span className="font-mono text-[11px] text-slate-700">
                      {item.product.sku}
                    </span>{" "}
                    • {item.warehouse.name} ({item.warehouse.code})
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {item.health === "OUT_OF_STOCK" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                      <XCircle className="h-3 w-3" />0 Available (Reorder:{" "}
                      {item.product.reorderLevel})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      <AlertTriangle className="h-3 w-3" />
                      {item.availableStock} Available (Reorder:{" "}
                      {item.product.reorderLevel})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tenant Isolation & Audit Activity + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Security & Audit Logs */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Recent Organization Audit Trail
              </h2>
            </div>
            <Link
              href="/settings/audit-logs"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              View full log →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {recentAuditLogs.map((log) => (
              <div
                key={log.id}
                className="py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800">
                    {log.action}
                  </span>{" "}
                  <span className="text-slate-500">on {log.entity}</span>
                  <p className="text-slate-500 mt-0.5">
                    By {log.user?.name || "System"} (
                    {log.user?.email || "automated"})
                  </p>
                </div>
                <div className="text-right text-slate-400 shrink-0 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(log.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Organization Configuration & Notifications */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                Tenant Document Rules
              </h2>
              <Link
                href="/settings"
                className="text-xs text-indigo-600 hover:underline"
              >
                Edit
              </Link>
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">Base Currency:</dt>
                <dd className="font-semibold text-slate-900">
                  {context.organization.currency}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Valuation Model:</dt>
                <dd className="font-semibold text-slate-900">
                  {context.organization.valuationMethod}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Negative Stock Allowed:</dt>
                <dd className="font-semibold text-slate-900">
                  {context.organization.allowNegativeStock
                    ? "Yes"
                    : "No (Strict)"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Document Prefixes:</dt>
                <dd className="font-mono text-slate-800">
                  {context.organization.orderPrefix} /{" "}
                  {context.organization.purchasePrefix} /{" "}
                  {context.organization.invoicePrefix}
                </dd>
              </div>
            </dl>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              System Notifications
            </h3>
            <div className="space-y-2.5">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs"
                >
                  <p className="font-semibold text-slate-900">{n.title}</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
