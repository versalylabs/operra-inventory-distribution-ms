"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  Plus,
  Search,
  FolderTree,
  Barcode,
  Edit3,
  Eye,
  CheckCircle2,
  Clock,
  Archive,
  Loader2,
  AlertCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

export interface ProductRecord {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  categoryId: string | null;
  brand: string | null;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice: number | null;
  taxRate: number;
  minStockLevel: number;
  reorderLevel: number;
  maxStockLevel: number | null;
  imageUrl: string | null;
  preferredSupplier: string | null;
  status: ProductStatus;
  category: {
    id: string;
    name: string;
    parent: { id: string; name: string } | null;
  } | null;
}

export interface CategoryOption {
  id: string;
  name: string;
  parent: { id: string; name: string } | null;
}

const UNITS_OF_MEASURE = [
  "Unit",
  "Carton",
  "Crate",
  "Bale",
  "Case (24x)",
  "Case (12x)",
  "Bag (50kg)",
  "Bag (25kg)",
  "Jerrycan (20L)",
  "Bottle",
  "Pack",
  "Roll",
];

export function ProductsClient({
  initialProducts,
  categories,
  currency,
  defaultTaxRate,
  canManage,
  initialCategoryFilter = "ALL",
}: {
  initialProducts: ProductRecord[];
  categories: CategoryOption[];
  currency: string;
  defaultTaxRate: number;
  canManage: boolean;
  initialCategoryFilter?: string;
}) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRecord[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ProductStatus>("ALL");
  const [sortBy, setSortBy] = useState<"name" | "sku" | "price_desc" | "margin_desc">("name");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Detail Drawer
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);

  // Create / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    description: "",
    categoryId: "",
    brand: "",
    unitOfMeasure: "Carton",
    costPrice: "",
    sellingPrice: "",
    wholesalePrice: "",
    taxRate: String(defaultTaxRate),
    minStockLevel: "10",
    reorderLevel: "25",
    maxStockLevel: "500",
    imageUrl: "",
    preferredSupplier: "",
    status: "ACTIVE" as ProductStatus,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function calculateMargin(cost: number, selling: number) {
    if (!selling || selling <= 0) return 0;
    return ((selling - cost) / selling) * 100;
  }

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.preferredSupplier && p.preferredSupplier.toLowerCase().includes(q));

      const matchesCategory =
        categoryFilter === "ALL" ||
        p.categoryId === categoryFilter ||
        p.category?.parent?.id === categoryFilter;

      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    list.sort((a, b) => {
      if (sortBy === "sku") return a.sku.localeCompare(b.sku);
      if (sortBy === "price_desc") return b.sellingPrice - a.sellingPrice;
      if (sortBy === "margin_desc") {
        return (
          calculateMargin(b.costPrice, b.sellingPrice) -
          calculateMargin(a.costPrice, a.sellingPrice)
        );
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [products, search, categoryFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function openCreateModal() {
    setEditingId(null);
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    setForm({
      name: "",
      sku: `SKU-${randomCode}`,
      barcode: `61611000${randomCode}`,
      description: "",
      categoryId: categories[0]?.id || "",
      brand: "",
      unitOfMeasure: "Carton",
      costPrice: "",
      sellingPrice: "",
      wholesalePrice: "",
      taxRate: String(defaultTaxRate),
      minStockLevel: "15",
      reorderLevel: "30",
      maxStockLevel: "500",
      imageUrl: "",
      preferredSupplier: "",
      status: "ACTIVE",
    });
    setError("");
    setShowModal(true);
  }

  function openEditModal(product: ProductRecord) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || "",
      description: product.description || "",
      categoryId: product.categoryId || "",
      brand: product.brand || "",
      unitOfMeasure: product.unitOfMeasure,
      costPrice: String(product.costPrice),
      sellingPrice: String(product.sellingPrice),
      wholesalePrice:
        product.wholesalePrice !== null ? String(product.wholesalePrice) : "",
      taxRate: String(product.taxRate),
      minStockLevel: String(product.minStockLevel),
      reorderLevel: String(product.reorderLevel),
      maxStockLevel:
        product.maxStockLevel !== null ? String(product.maxStockLevel) : "",
      imageUrl: product.imageUrl || "",
      preferredSupplier: product.preferredSupplier || "",
      status: product.status,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch("/api/inventory/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          ...form,
          costPrice: parseFloat(form.costPrice) || 0,
          sellingPrice: parseFloat(form.sellingPrice) || 0,
          wholesalePrice:
            form.wholesalePrice !== "" ? parseFloat(form.wholesalePrice) : null,
          taxRate: parseFloat(form.taxRate) || 0,
          minStockLevel: parseInt(form.minStockLevel, 10) || 0,
          reorderLevel: parseInt(form.reorderLevel, 10) || 0,
          maxStockLevel:
            form.maxStockLevel !== "" ? parseInt(form.maxStockLevel, 10) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save product.");
        setLoading(false);
        return;
      }

      if (editingId) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingId ? data.product : p))
        );
        if (selectedProduct?.id === editingId) {
          setSelectedProduct(data.product);
        }
      } else {
        setProducts((prev) => [data.product, ...prev]);
      }

      setShowModal(false);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Network error while saving product.");
      setLoading(false);
    }
  }

  const activeCount = products.filter((p) => p.status === "ACTIVE").length;
  const avgMargin =
    products.length > 0
      ? products.reduce(
          (acc, p) => acc + calculateMargin(p.costPrice, p.sellingPrice),
          0
        ) / products.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <Package className="h-4 w-4" />
            Product Master Catalog
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Products, SKUs & Pricing Tiers
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Manage product specifications, barcodes, cost/wholesale/retail prices, and reorder thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/inventory/categories"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <FolderTree className="h-4 w-4 text-slate-500" />
            Categories ({categories.length})
          </Link>
          {canManage && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add New Product
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total Catalog SKUs
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {products.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Active SKUs
          </p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {activeCount}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Product Categories
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {categories.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Avg. Catalog Margin
          </p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {avgMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by product name, SKU, barcode, brand, or supplier..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parent ? `${c.parent.name} → ${c.name}` : c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "ALL" | ProductStatus);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as "name" | "sku" | "price_desc" | "margin_desc"
              )
            }
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="name">Sort: Name (A–Z)</option>
            <option value="sku">Sort: SKU Code</option>
            <option value="price_desc">Sort: Highest Price</option>
            <option value="margin_desc">Sort: Highest Margin %</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Product & Brand</th>
                <th className="py-3.5 px-4">SKU & Barcode</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Unit</th>
                <th className="py-3.5 px-4 text-right">Cost Price</th>
                <th className="py-3.5 px-4 text-right">Wholesale</th>
                <th className="py-3.5 px-4 text-right">Selling Price</th>
                <th className="py-3.5 px-4 text-right">Gross Margin</th>
                <th className="py-3.5 px-4 text-center">Reorder</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No products match your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const grossProfit = product.sellingPrice - product.costPrice;
                  const marginPct = calculateMargin(
                    product.costPrice,
                    product.sellingPrice
                  );

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {product.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(product)}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-left cursor-pointer"
                            >
                              {product.name}
                            </button>
                            <div className="text-[11px] text-slate-500">
                              {product.brand || "Standard"}
                              {product.preferredSupplier
                                ? ` • ${product.preferredSupplier}`
                                : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {product.sku}
                        </span>
                        {product.barcode && (
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-1">
                            <Barcode className="h-3 w-3" />
                            {product.barcode}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {product.category ? (
                          <div>
                            <span className="font-medium text-slate-800">
                              {product.category.name}
                            </span>
                            {product.category.parent && (
                              <span className="block text-[10px] text-slate-400">
                                {product.category.parent.name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Uncategorized</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {product.unitOfMeasure}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {formatCurrency(product.costPrice, currency)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {product.wholesalePrice
                          ? formatCurrency(product.wholesalePrice, currency)
                          : "—"}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(product.sellingPrice, currency)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                          <TrendingUp className="h-3 w-3" />
                          {marginPct.toFixed(1)}%
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          +{formatCurrency(grossProfit, currency)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-semibold text-slate-700">
                          {product.reorderLevel}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Min: {product.minStockLevel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {product.status === "ACTIVE" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        )}
                        {product.status === "DRAFT" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Clock className="h-3 w-3" />
                            Draft
                          </span>
                        )}
                        {product.status === "ARCHIVED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            <Archive className="h-3 w-3" />
                            Archived
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(product)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                            title="Inspect Product"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => openEditModal(product)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
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

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {filteredProducts.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-900">
              {Math.min(currentPage * pageSize, filteredProducts.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">
              {filteredProducts.length}
            </span>{" "}
            products
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Detail Drawer */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-slate-200 p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <div>
                  <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {selectedProduct.sku}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1.5">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedProduct.brand || "Standard Brand"} •{" "}
                    {selectedProduct.unitOfMeasure}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {selectedProduct.description && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Product Description
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {/* Profitability Card (Section 28 of Overview) */}
              <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    Unit Profitability Profile
                  </span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                    {calculateMargin(
                      selectedProduct.costPrice,
                      selectedProduct.sellingPrice
                    ).toFixed(1)}
                    % Margin
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <p className="text-slate-400">Cost Price</p>
                    <p className="text-sm font-bold mt-0.5">
                      {formatCurrency(selectedProduct.costPrice, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Selling Price</p>
                    <p className="text-sm font-bold mt-0.5">
                      {formatCurrency(selectedProduct.sellingPrice, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Gross Profit</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">
                      {formatCurrency(
                        selectedProduct.sellingPrice - selectedProduct.costPrice,
                        currency
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Specifications Grid */}
              <dl className="grid grid-cols-2 gap-4 text-xs bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div>
                  <dt className="text-slate-500">Category</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {selectedProduct.category?.name || "Uncategorized"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Barcode (EAN/UPC)</dt>
                  <dd className="font-mono font-semibold text-slate-900 mt-0.5">
                    {selectedProduct.barcode || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Wholesale Price</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {selectedProduct.wholesalePrice
                      ? formatCurrency(selectedProduct.wholesalePrice, currency)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Tax Rate (VAT)</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {selectedProduct.taxRate}%
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Minimum Stock Level</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {selectedProduct.minStockLevel} {selectedProduct.unitOfMeasure}s
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Reorder Point</dt>
                  <dd className="font-semibold text-amber-700 mt-0.5">
                    {selectedProduct.reorderLevel} {selectedProduct.unitOfMeasure}s
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Maximum Stock Level</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {selectedProduct.maxStockLevel
                      ? `${selectedProduct.maxStockLevel} ${selectedProduct.unitOfMeasure}s`
                      : "Unlimited"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Preferred Supplier</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {selectedProduct.preferredSupplier || "—"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    const p = selectedProduct;
                    setSelectedProduct(null);
                    openEditModal(p);
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Edit Product Details
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? "Edit Product SKU" : "Create New Product SKU"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Fresh Fri Vegetable Cooking Oil 1L"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="OIL-FF-1L"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({ ...form, categoryId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.parent ? `${c.parent.name} → ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="e.g., Pwani Oil / Coca-Cola"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Barcode (EAN-13 / UPC)
                  </label>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) =>
                      setForm({ ...form, barcode: e.target.value })
                    }
                    placeholder="616110..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Pricing Tiers */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.costPrice}
                    onChange={(e) =>
                      setForm({ ...form, costPrice: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wholesale ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.wholesalePrice}
                    onChange={(e) =>
                      setForm({ ...form, wholesalePrice: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.sellingPrice}
                    onChange={(e) =>
                      setForm({ ...form, sellingPrice: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.taxRate}
                    onChange={(e) =>
                      setForm({ ...form, taxRate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Units & Stock Thresholds */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit of Measure
                  </label>
                  <select
                    value={form.unitOfMeasure}
                    onChange={(e) =>
                      setForm({ ...form, unitOfMeasure: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {UNITS_OF_MEASURE.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Stock Level
                  </label>
                  <input
                    type="number"
                    value={form.minStockLevel}
                    onChange={(e) =>
                      setForm({ ...form, minStockLevel: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    value={form.reorderLevel}
                    onChange={(e) =>
                      setForm({ ...form, reorderLevel: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Stock Level
                  </label>
                  <input
                    type="number"
                    value={form.maxStockLevel}
                    onChange={(e) =>
                      setForm({ ...form, maxStockLevel: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Supplier
                  </label>
                  <input
                    type="text"
                    value={form.preferredSupplier}
                    onChange={(e) =>
                      setForm({ ...form, preferredSupplier: e.target.value })
                    }
                    placeholder="e.g., Bidco Africa Ltd"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as ProductStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="ACTIVE">Active (Available for Orders)</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Pack Notes
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Optional product specifications, packaging notes, or handling instructions..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingId ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
