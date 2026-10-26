import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { Boxes, ArrowLeft, Layers, CheckCircle2 } from "lucide-react";

const MODULE_DESCRIPTIONS: Record<
  string,
  {
    title: string;
    phase: string;
    description: string;
    capabilities: string[];
  }
> = {
  "inventory/products": {
    title: "Product Catalog & SKU Management",
    phase: "Phase 2 — Product & Category Management",
    description:
      "Centralized product master supporting SKUs, barcodes, cost/selling/wholesale pricing, tax rates, and stock reorder thresholds.",
    capabilities: [
      "Full SKU, barcode, brand, and unit-of-measure management",
      "Retail, wholesale, and cost price tiers with tax configuration",
      "Minimum, reorder, and maximum stock threshold rules",
      "Fast multi-column search, category filtering, and pagination",
    ],
  },
  "inventory/categories": {
    title: "Product Categories Hierarchy",
    phase: "Phase 2 — Product & Category Management",
    description:
      "Organize products into nested parent-child categories (e.g., Beverages → Soft Drinks, Juices, Water).",
    capabilities: [
      "Nested parent and child category trees",
      "Category-level SKU counts and status toggles",
      "Category-based revenue and stock value rollups",
    ],
  },
  "inventory/stock": {
    title: "Multi-Warehouse Stock & Immutable Ledger",
    phase: "Phase 3 — Warehouses & Inventory Core",
    description:
      "Real-time visibility into Current Stock, Reserved Stock, Available Stock, Incoming Stock, and Damaged Stock with atomic movement logs.",
    capabilities: [
      "Available Stock = Current Stock - Reserved Stock formula enforcement",
      "Immutable stock movement ledger for every receipt, sale, transfer, and adjustment",
      "Warehouse-filtered stock valuation and movement history",
    ],
  },
  "inventory/warehouses": {
    title: "Warehouse & Depot Management",
    phase: "Phase 3 — Warehouses & Inventory Core",
    description:
      "Manage physical distribution centers, depots, and retail branches with dedicated stock ledgers.",
    capabilities: [
      "Multi-location warehouse profiles (Nairobi Main, Industrial Area Depot, Mombasa)",
      "Assigned warehouse managers and contact details",
      "Per-warehouse stock availability and valuation",
    ],
  },
  "inventory/transfers": {
    title: "Inter-Warehouse Stock Transfers",
    phase: "Phase 8 — Transfers & Advanced Inventory",
    description:
      "Controlled stock transfer workflow from Request → Approval → Dispatch → In Transit → Received.",
    capabilities: [
      "Multi-stage transfer status tracking across warehouses",
      "Dual atomic stock movement entries on dispatch and receipt",
      "In-transit inventory tracking",
    ],
  },
  "inventory/adjustments": {
    title: "Authorized Stock Adjustments",
    phase: "Phase 3 — Warehouses & Inventory Core",
    description:
      "Record stock count corrections, damaged goods, expired items, and opening balances with full audit trails.",
    capabilities: [
      "Reason-coded adjustments (Damaged, Lost, Expired, Count Correction)",
      "Manager approval workflow for sensitive adjustments",
      "Automatic immutable stock movement generation",
    ],
  },
  "purchasing/orders": {
    title: "Purchase Orders (PO)",
    phase: "Phase 4 — Suppliers & Purchasing",
    description:
      "Create, approve, and track supplier purchase orders from draft through partial or full goods receipt.",
    capabilities: [
      "Draft → Pending Approval → Approved → Ordered → Received lifecycle",
      "Unit cost, discount, and tax calculation",
      "Printable Purchase Order documents",
    ],
  },
  "purchasing/suppliers": {
    title: "Supplier Directory & Payables",
    phase: "Phase 4 — Suppliers & Purchasing",
    description:
      "Manage supplier profiles, credit terms, supplied SKUs, purchase history, and outstanding payable balances.",
    capabilities: [
      "Supplier contact, tax PIN, and bank/payment details",
      "Automated supplier payable balance tracking",
      "Linked products and historical PO performance",
    ],
  },
  "purchasing/receiving": {
    title: "Goods Receiving Notes (GRN)",
    phase: "Phase 4 — Suppliers & Purchasing",
    description:
      "Verify actual received, damaged, and missing quantities at the warehouse dock to accurately increment inventory.",
    capabilities: [
      "Ordered vs. Received vs. Damaged vs. Missing quantity reconciliation",
      "Atomic stock increment based strictly on actual received goods",
      "Partial delivery support on open Purchase Orders",
    ],
  },
  "sales/orders": {
    title: "Sales Orders & Stock Reservation",
    phase: "Phase 5 — Customers & Sales Orders",
    description:
      "Capture customer orders, automatically reserve available warehouse stock, and coordinate picking, packing, and delivery.",
    capabilities: [
      "Automatic stock reservation upon order confirmation to prevent overselling",
      "Draft → Confirmed → Processing → Ready for Delivery → Delivered workflow",
      "One-click conversion to Delivery Note and Customer Invoice",
    ],
  },
  "sales/customers": {
    title: "Customer Accounts & Receivables",
    phase: "Phase 5 — Customers & Sales Orders",
    description:
      "Manage B2B wholesalers, retailers, distributors, and corporate customers with credit limits and receivable ledgers.",
    capabilities: [
      "Configurable customer types (Wholesale, Retail, Distributor, Corporate)",
      "Credit limit enforcement and payment terms",
      "Complete customer statement: orders, invoices, payments, and deliveries",
    ],
  },
  "sales/invoices": {
    title: "Customer Invoicing",
    phase: "Phase 7 — Invoicing & Payments",
    description:
      "Generate tax-compliant invoices from sales orders and track settlement status through to full payment.",
    capabilities: [
      "Draft, Issued, Partially Paid, Paid, and Overdue tracking",
      "Automated customer balance updates",
      "Printable branded tax invoices",
    ],
  },
  "distribution/deliveries": {
    title: "Distribution & Last-Mile Deliveries",
    phase: "Phase 6 — Distribution & Deliveries",
    description:
      "Assign drivers and vehicles to confirmed orders, track dispatch status, and capture electronic Proof of Delivery (POD).",
    capabilities: [
      "Pending → Assigned → Dispatched → In Transit → Delivered / Failed status flow",
      "Recipient name, signature, timestamp, and photo Proof of Delivery",
      "Mobile-ready interface for field delivery drivers",
    ],
  },
  "distribution/drivers": {
    title: "Delivery Drivers & Dispatch Team",
    phase: "Phase 6 — Distribution & Deliveries",
    description:
      "Manage active delivery personnel, assigned routes, and delivery completion performance.",
    capabilities: [
      "Driver assignment and active delivery workload",
      "Delivery success rate and turnaround analytics",
    ],
  },
  "distribution/vehicles": {
    title: "Fleet & Vehicle Registry",
    phase: "Phase 6 — Distribution & Deliveries",
    description:
      "Track delivery vans, trucks, and motorbikes with registration plates and load capacity.",
    capabilities: [
      "Vehicle registration, capacity, and assigned driver",
      "Dispatch history per vehicle",
    ],
  },
  "finance/payments": {
    title: "Payments & Settlement Ledger",
    phase: "Phase 7 — Invoicing & Payments",
    description:
      "Record customer collections and supplier disbursements across Cash, M-Pesa, Bank Transfer, and Card.",
    capabilities: [
      "Multi-method payment recording (Cash, M-Pesa, Bank, Card)",
      "Abstracted payment provider layer ready for M-Pesa STK Push & reconciliation",
      "Automatic invoice settlement and receipt generation",
    ],
  },
  "finance/expenses": {
    title: "Operational Expenses",
    phase: "Phase 7 — Invoicing & Payments",
    description:
      "Track fuel, transport, warehouse utilities, packaging, and staff expenses for accurate net profitability.",
    capabilities: [
      "Categorized expense ledger with payment references and attachments",
      "Direct integration into Financial & Gross/Net Profit reporting",
    ],
  },
  reports: {
    title: "Executive Reports & Business Intelligence",
    phase: "Phase 9 — Reports & Analytics",
    description:
      "Actionable operational and financial reports across Inventory, Sales, Purchasing, Distribution, and Profitability.",
    capabilities: [
      "Stock valuation, movement ledger, and inventory aging reports",
      "Sales & gross profit by product, category, customer, and warehouse",
      "Customer receivables & supplier payables aging with CSV/PDF export",
    ],
  },
};

export default async function ModuleRoadmapPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  await requireAuth();
  const { slug } = await params;
  const key = slug.join("/");
  const mod = MODULE_DESCRIPTIONS[key] || {
    title: `Operra Module (${key})`,
    phase: "Scheduled Development Phase",
    description:
      "This operational module is registered in the Operra navigation architecture and will be activated in its designated development phase.",
    capabilities: [
      "Multi-tenant data isolation",
      "Role-Based Access Control enforcement",
      "Server-side transaction integrity",
    ],
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Operational Command Center
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                <Layers className="h-3.5 w-3.5" />
                {mod.phase}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                {mod.title}
              </h1>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          {mod.description}
        </p>

        <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Architectural Specifications Queued for This Module
          </h2>
          <ul className="space-y-2.5">
            {mod.capabilities.map((cap) => (
              <li
                key={cap}
                className="flex items-start gap-2.5 text-xs text-slate-700"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
