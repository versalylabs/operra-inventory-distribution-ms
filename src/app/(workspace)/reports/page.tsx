"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Boxes,
  ShoppingBag,
  Truck,
  Download,
  Printer,
  Search,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  ArrowUpRight,
} from "lucide-react";

interface ProductProfitItem {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  unitOfMeasure: string;
  costPrice: number;
  wholesalePrice: number;
  sellingPrice: number;
  catalogUnitProfit: number;
  catalogMarginPct: number;
  unitsSold: number;
  revenueExclTax: number;
  revenueInclTax: number;
  cogs: number;
  realizedGrossProfit: number;
  realizedMarginPct: number;
}

interface AnalyticsPayload {
  currency: string;
  organizationName: string;
  financialSummary: {
    totalSalesRevenueExclTax: number;
    totalSalesRevenueInclTax: number;
    totalCOGS: number;
    grossProfit: number;
    grossMarginPct: number;
    totalOperatingExpenses: number;
    netOperatingProfit: number;
    netMarginPct: number;
    totalInvoicedAmount: number;
    totalCollectedCash: number;
    totalCustomerReceivables: number;
    totalSupplierPayables: number;
    expensesByCategory: Array<{
      category: string;
      amount: number;
      sharePct: number;
    }>;
  };
  productProfitability: ProductProfitItem[];
  salesAnalytics: {
    salesByWarehouse: Array<{
      warehouseId: string;
      name: string;
      code: string;
      orderCount: number;
      revenue: number;
    }>;
    salesByCategory: Array<{
      categoryName: string;
      unitsSold: number;
      revenue: number;
      grossProfit: number;
    }>;
    salesByCustomer: Array<{
      id: string;
      code: string;
      businessName: string;
      customerType: string;
      salesRepName: string;
      orderCount: number;
      totalPurchases: number;
      activeOrderRevenue: number;
      outstandingBalance: number;
      creditLimit: number;
      status: string;
    }>;
  };
  inventoryAnalytics: {
    inventoryByWarehouse: Array<{
      id: string;
      name: string;
      code: string;
      managerName: string;
      skuCount: number;
      currentUnits: number;
      reservedUnits: number;
      availableUnits: number;
      damagedUnits: number;
      costValuation: number;
      wholesaleValuation: number;
      potentialGrossProfit: number;
    }>;
    lowAndOutStockReport: Array<{
      id: string;
      sku: string;
      productName: string;
      categoryName: string;
      warehouseName: string;
      warehouseCode: string;
      currentStock: number;
      reservedStock: number;
      availableStock: number;
      reorderLevel: number;
      shortfall: number;
      estimatedRestockCost: number;
      status: "OUT_OF_STOCK" | "LOW_STOCK";
    }>;
    totalInventoryCostValue: number;
    totalInventoryWholesaleValue: number;
    recentMovementsCount: number;
  };
  purchasingAnalytics: {
    supplierPerformance: Array<{
      id: string;
      code: string;
      companyName: string;
      city: string | null;
      paymentTermsDays: number;
      poCount: number;
      grnCount: number;
      totalPurchases: number;
      outstandingBalance: number;
      fulfillmentRatePct: number;
      damagedUnits: number;
      missingUnits: number;
    }>;
  };
  distributionAnalytics: {
    deliveryStats: {
      totalDeliveries: number;
      deliveredCount: number;
      inTransitCount: number;
      assignedOrPendingCount: number;
      failedCount: number;
      podVerifiedCount: number;
    };
    driverLeaderboard: Array<{
      id: string;
      code: string;
      fullName: string;
      phone: string;
      licenseNumber: string;
      status: string;
      completedDeliveries: number;
      activeAssignedCount: number;
      vehicleReg: string;
      vehicleModel: string;
    }>;
    totalVehicles: number;
  };
}

type ReportTab =
  | "FINANCIAL"
  | "SALES"
  | "INVENTORY"
  | "PURCHASING"
  | "DISTRIBUTION";

export default function ReportsAndAnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportTab>("FINANCIAL");
  const [search, setSearch] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  function handleExportCSV() {
    if (!data) return;
    let headers: string[] = [];
    let rows: Array<Array<string | number>> = [];

    if (activeTab === "FINANCIAL") {
      headers = [
        "SKU",
        "Product",
        "Category",
        "Cost Price",
        "Wholesale Price",
        "Unit Margin %",
        "Units Sold",
        "Revenue (Excl Tax)",
        "COGS",
        "Realized Gross Profit",
      ];
      rows = data.productProfitability.map((p) => [
        p.sku,
        `"${p.name}"`,
        `"${p.categoryName}"`,
        p.costPrice,
        p.wholesalePrice,
        `${p.catalogMarginPct}%`,
        p.unitsSold,
        p.revenueExclTax,
        p.cogs,
        p.realizedGrossProfit,
      ]);
    } else if (activeTab === "SALES") {
      headers = [
        "Customer Code",
        "Business Name",
        "Segment",
        "Sales Rep",
        "Orders",
        "Total Purchases",
        "Outstanding AR",
        "Status",
      ];
      rows = data.salesAnalytics.salesByCustomer.map((c) => [
        c.code,
        `"${c.businessName}"`,
        c.customerType,
        `"${c.salesRepName}"`,
        c.orderCount,
        c.totalPurchases,
        c.outstandingBalance,
        c.status,
      ]);
    } else if (activeTab === "INVENTORY") {
      headers = [
        "SKU",
        "Product",
        "Warehouse",
        "Available Stock",
        "Reorder Level",
        "Recommended Order Qty",
        "Est. Restock Cost",
        "Status",
      ];
      rows = data.inventoryAnalytics.lowAndOutStockReport.map((item) => [
        item.sku,
        `"${item.productName}"`,
        item.warehouseCode,
        item.availableStock,
        item.reorderLevel,
        item.shortfall,
        item.estimatedRestockCost,
        item.status,
      ]);
    } else if (activeTab === "PURCHASING") {
      headers = [
        "Supplier Code",
        "Company",
        "City",
        "PO Count",
        "Total Purchases",
        "Outstanding Payable",
        "GRN Acceptance %",
      ];
      rows = data.purchasingAnalytics.supplierPerformance.map((s) => [
        s.code,
        `"${s.companyName}"`,
        s.city || "Kenya",
        s.poCount,
        s.totalPurchases,
        s.outstandingBalance,
        `${s.fulfillmentRatePct}%`,
      ]);
    } else {
      headers = [
        "Driver Code",
        "Full Name",
        "License #",
        "Assigned Truck",
        "Completed Deliveries",
        "Status",
      ];
      rows = data.distributionAnalytics.driverLeaderboard.map((d) => [
        d.code,
        `"${d.fullName}"`,
        d.licenseNumber,
        d.vehicleReg,
        d.completedDeliveries,
        d.status,
      ]);
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Operra_${activeTab}_Report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading || !data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500">
        Computing real-time multi-domain profitability & operational analytics...
      </div>
    );
  }

  const {
    currency,
    financialSummary: fin,
    productProfitability,
    salesAnalytics,
    inventoryAnalytics,
    purchasingAnalytics,
    distributionAnalytics,
  } = data;

  const filteredProducts = productProfitability.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <BarChart3 className="h-4 w-4" />
            Business Intelligence & Margin Engine
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Executive Profitability & Operational Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Product-level gross margins, P&L statement, inventory valuation,
            supplier GRN quality, and fleet delivery SLA metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4 text-indigo-600" />
            Export {activeTab} CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print Executive Report
          </button>
        </div>
      </div>

      {/* Executive P&L Top Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Net Sales Revenue (Excl. Tax)
            </span>
            <ShoppingCart className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(fin.totalSalesRevenueExclTax, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Incl. 16% VAT: {formatCurrency(fin.totalSalesRevenueInclTax, currency)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Realized Gross Profit
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {formatCurrency(fin.grossProfit, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Gross Margin: <span className="font-bold">{fin.grossMarginPct}%</span>{" "}
            • COGS: {formatCurrency(fin.totalCOGS, currency)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Operating Expenses
            </span>
            <Wallet className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(fin.totalOperatingExpenses, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Fuel, Transport, Packaging & Repairs
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Net Operating Profit (EBITDA)
            </span>
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-600">
            {formatCurrency(fin.netOperatingProfit, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Net Operating Margin: <span className="font-bold">{fin.netMarginPct}%</span>
          </p>
        </div>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 flex flex-wrap items-center gap-1.5">
        {[
          {
            id: "FINANCIAL" as const,
            label: "1. Profitability & P&L",
            icon: TrendingUp,
          },
          {
            id: "SALES" as const,
            label: "2. Sales & Customer Analytics",
            icon: ShoppingCart,
          },
          {
            id: "INVENTORY" as const,
            label: "3. Inventory & Valuation",
            icon: Boxes,
          },
          {
            id: "PURCHASING" as const,
            label: "4. Purchasing & Suppliers",
            icon: ShoppingBag,
          },
          {
            id: "DISTRIBUTION" as const,
            label: "5. Distribution & Fleet SLA",
            icon: Truck,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: FINANCIAL P&L & PRODUCT-LEVEL PROFITABILITY */}
      {activeTab === "FINANCIAL" && (
        <div className="space-y-6">
          {/* P&L Breakdown + Expense Mix + Working Capital */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Income & Profitability Statement
              </h2>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Gross Billed Sales (Incl. VAT):</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(fin.totalSalesRevenueInclTax, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Net Sales Revenue (Excl. VAT):</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(fin.totalSalesRevenueExclTax, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Less: Cost of Goods Sold (COGS):</span>
                  <span>- {formatCurrency(fin.totalCOGS, currency)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-emerald-700 text-sm">
                  <span>Gross Profit ({fin.grossMarginPct}%):</span>
                  <span>{formatCurrency(fin.grossProfit, currency)}</span>
                </div>
                <div className="flex justify-between text-amber-700 pt-1">
                  <span>Less: Operating Expenses:</span>
                  <span>
                    - {formatCurrency(fin.totalOperatingExpenses, currency)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-indigo-700 text-sm">
                  <span>Net Operating Profit ({fin.netMarginPct}%):</span>
                  <span>{formatCurrency(fin.netOperatingProfit, currency)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">
                  Operating Expense Breakdown
                </h2>
                <Link
                  href="/finance/expenses"
                  className="text-xs text-indigo-600 font-medium hover:underline"
                >
                  Manage →
                </Link>
              </div>
              <div className="space-y-3 text-xs">
                {fin.expensesByCategory.map((e) => (
                  <div key={e.category} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-700">{e.category}</span>
                      <span className="text-slate-900 font-bold">
                        {formatCurrency(e.amount, currency)} ({e.sharePct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${e.sharePct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Treasury & Working Capital Position
              </h2>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-emerald-900">
                      Customer Cash Collected
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      M-Pesa, Bank EFT & Cash
                    </p>
                  </div>
                  <span className="font-bold text-emerald-800 text-sm">
                    {formatCurrency(fin.totalCollectedCash, currency)}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-blue-900">
                      Customer Receivables (AR)
                    </p>
                    <p className="text-[11px] text-blue-700">
                      Owed by Wholesale & Retail Accounts
                    </p>
                  </div>
                  <span className="font-bold text-blue-800 text-sm">
                    {formatCurrency(fin.totalCustomerReceivables, currency)}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-amber-900">
                      Supplier Payables (AP)
                    </p>
                    <p className="text-[11px] text-amber-700">
                      Owed to Manufacturers
                    </p>
                  </div>
                  <span className="font-bold text-amber-800 text-sm">
                    {formatCurrency(fin.totalSupplierPayables, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Product-Level Profitability Table (Section 28) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Product-Level Profitability & Gross Margin Matrix (All SKUs)
                </h2>
                <p className="text-xs text-slate-500">
                  Compares Unit Cost vs Wholesale/Selling Price, Unit Gross
                  Profit, Margin %, and Realized Sales Profit.
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter SKU, product, category..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">SKU & Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Wholesale Price</th>
                    <th className="py-3 px-4 text-right">Unit Profit</th>
                    <th className="py-3 px-4 text-right">Margin %</th>
                    <th className="py-3 px-4 text-right">Units Sold</th>
                    <th className="py-3 px-4 text-right">Realized Revenue</th>
                    <th className="py-3 px-4 text-right">Realized Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {p.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {p.sku} • {p.unitOfMeasure}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.categoryName}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {formatCurrency(p.costPrice, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {formatCurrency(p.wholesalePrice, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        +{formatCurrency(p.catalogUnitProfit, currency)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.catalogMarginPct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {p.unitsSold}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {formatCurrency(p.revenueExclTax, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-700">
                        {formatCurrency(p.realizedGrossProfit, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES & CUSTOMER ANALYTICS */}
      {activeTab === "SALES" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Warehouse */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
                Sales Revenue by Fulfillment Warehouse
              </h2>
              <div className="mt-4 space-y-3">
                {salesAnalytics.salesByWarehouse.map((w) => (
                  <div
                    key={w.warehouseId}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{w.name}</span>
                      <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200">
                        {w.code}
                      </span>
                      <p className="text-slate-500 mt-0.5">
                        {w.orderCount} Confirmed/Delivered Orders
                      </p>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">
                      {formatCurrency(w.revenue, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales by Category */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
                Sales & Gross Profit by Product Category
              </h2>
              <div className="mt-4 space-y-3">
                {salesAnalytics.salesByCategory.map((cat) => (
                  <div
                    key={cat.categoryName}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">
                        {cat.categoryName}
                      </span>
                      <p className="text-slate-500 mt-0.5">
                        {cat.unitsSold} Units Sold
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {formatCurrency(cat.revenue, currency)}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700">
                        Profit: {formatCurrency(cat.grossProfit, currency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sales by Customer Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">
                Customer Revenue & Accounts Receivable Leaderboard
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Segment</th>
                    <th className="py-3 px-4">Sales Rep</th>
                    <th className="py-3 px-4 text-right">Orders</th>
                    <th className="py-3 px-4 text-right">Lifetime Purchases</th>
                    <th className="py-3 px-4 text-right">Outstanding AR</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {salesAnalytics.salesByCustomer.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {c.businessName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {c.code}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {c.customerType}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {c.salesRepName}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {c.orderCount}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(c.totalPurchases, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-amber-700">
                        {formatCurrency(c.outstandingBalance, currency)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === "ON_HOLD"
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVENTORY & VALUATION REPORTS */}
      {activeTab === "INVENTORY" && (
        <div className="space-y-6">
          {/* Warehouse Valuation Matrix */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Multi-Warehouse Stock Valuation Report
                </h2>
                <p className="text-xs text-slate-500">
                  Compares Cost Valuation vs Wholesale Revenue Potential across
                  all depots.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600">
                Total Cost Value:{" "}
                {formatCurrency(
                  inventoryAnalytics.totalInventoryCostValue,
                  currency
                )}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Warehouse / Depot</th>
                    <th className="py-3 px-4 text-right">Stocked SKUs</th>
                    <th className="py-3 px-4 text-right">Physical Units</th>
                    <th className="py-3 px-4 text-right">Reserved</th>
                    <th className="py-3 px-4 text-right">Available</th>
                    <th className="py-3 px-4 text-right">Cost Valuation</th>
                    <th className="py-3 px-4 text-right">Wholesale Value</th>
                    <th className="py-3 px-4 text-right">Potential Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {inventoryAnalytics.inventoryByWarehouse.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">
                          {w.name}
                        </span>
                        <span className="ml-2 font-mono text-[10px] text-slate-500">
                          ({w.code})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium">
                        {w.skuCount}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {w.currentUnits.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right text-amber-700">
                        {w.reservedUnits.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {w.availableUnits.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        {formatCurrency(w.costValuation, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-indigo-600">
                        {formatCurrency(w.wholesaleValuation, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        +{formatCurrency(w.potentialGrossProfit, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low & Out of Stock Replenishment Report */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Low Stock & Out-of-Stock Replenishment Schedule
                </h2>
              </div>
              <Link
                href="/purchasing/orders"
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Raise Replenishment PO →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">SKU & Product</th>
                    <th className="py-3 px-4">Depot</th>
                    <th className="py-3 px-4 text-right">Available</th>
                    <th className="py-3 px-4 text-right">Reorder Level</th>
                    <th className="py-3 px-4 text-right">Suggested Order Qty</th>
                    <th className="py-3 px-4 text-right">Est. Restock Cost</th>
                    <th className="py-3 px-4">Alert Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {inventoryAnalytics.lowAndOutStockReport.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {item.productName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {item.sku} • {item.categoryName}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {item.warehouseName} ({item.warehouseCode})
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-red-600">
                        {item.availableStock}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.reorderLevel}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-indigo-600">
                        {item.shortfall} units
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {formatCurrency(item.estimatedRestockCost, currency)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === "OUT_OF_STOCK"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PURCHASING & SUPPLIER PERFORMANCE */}
      {activeTab === "PURCHASING" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">
              Supplier Spend, Payables & Goods Receiving Quality Report
            </h2>
            <p className="text-xs text-slate-500">
              Evaluates manufacturer purchase volume, outstanding balances, and
              GRN damaged/short-shipped rates.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4">Payment Terms</th>
                  <th className="py-3.5 px-4 text-right">POs / GRNs</th>
                  <th className="py-3.5 px-4 text-right">Total Purchases</th>
                  <th className="py-3.5 px-4 text-right">Outstanding Payable</th>
                  <th className="py-3.5 px-4 text-right">GRN Quality Rate</th>
                  <th className="py-3.5 px-4 text-right">Damaged / Missing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {purchasingAnalytics.supplierPerformance.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {s.companyName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {s.code} • {s.city || "Kenya"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      Net {s.paymentTermsDays} Days
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {s.poCount} POs / {s.grnCount} GRNs
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(s.totalPurchases, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-amber-700">
                      {formatCurrency(s.outstandingBalance, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.fulfillmentRatePct}% Accepted
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600">
                      {s.damagedUnits} dmg / {s.missingUnits} short
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DISTRIBUTION & FLEET SLA */}
      {activeTab === "DISTRIBUTION" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <span className="text-[11px] uppercase text-slate-400 font-semibold">
                Total Dispatches
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {distributionAnalytics.deliveryStats.totalDeliveries}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <span className="text-[11px] uppercase text-slate-400 font-semibold">
                Delivered with POD
              </span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {distributionAnalytics.deliveryStats.deliveredCount} (
                {distributionAnalytics.deliveryStats.podVerifiedCount} Signed)
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <span className="text-[11px] uppercase text-slate-400 font-semibold">
                Active In Transit
              </span>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {distributionAnalytics.deliveryStats.inTransitCount}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <span className="text-[11px] uppercase text-slate-400 font-semibold">
                Active Fleet Size
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {distributionAnalytics.totalVehicles} Trucks
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Commercial Driver Performance & Route Leaderboard
                </h2>
                <p className="text-xs text-slate-500">
                  Tracks completed POD deliveries, active route assignments, and
                  paired fleet vehicles.
                </p>
              </div>
              <Link
                href="/distribution/deliveries"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
              >
                Open Dispatch Board <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Driver</th>
                    <th className="py-3.5 px-4">License #</th>
                    <th className="py-3.5 px-4">Assigned Vehicle</th>
                    <th className="py-3.5 px-4 text-right">Completed PODs</th>
                    <th className="py-3.5 px-4 text-right">Active Routes</th>
                    <th className="py-3.5 px-4">Duty Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {distributionAnalytics.driverLeaderboard.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {d.fullName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {d.code} • {d.phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {d.licenseNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900">
                          {d.vehicleReg}
                        </span>{" "}
                        <span className="text-slate-500">{d.vehicleModel}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        {d.completedDeliveries} Deliveries
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-indigo-600">
                        {d.activeAssignedCount} Active
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === "AVAILABLE"
                              ? "bg-emerald-50 text-emerald-700"
                              : d.status === "ON_DELIVERY"
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {d.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
