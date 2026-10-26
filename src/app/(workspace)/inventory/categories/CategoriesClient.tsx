"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CategoryStatus } from "@prisma/client";
import {
  FolderTree,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  CornerDownRight,
  Package,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  status: CategoryStatus;
  parent: { id: string; name: string } | null;
  _count: {
    products: number;
    children: number;
  };
}

export function CategoriesClient({
  initialCategories,
  canManage,
}: {
  initialCategories: CategoryRecord[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryRecord[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CategoryStatus>("ALL");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [status, setStatus] = useState<CategoryStatus>("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Organize categories into hierarchical tree order (Parent followed immediately by its children)
  const orderedCategories = useMemo(() => {
    const filtered = categories.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
        (c.parent && c.parent.name.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (search || statusFilter !== "ALL") {
      return filtered;
    }

    const roots = filtered.filter((c) => !c.parentId);
    const childrenByParent = new Map<string, CategoryRecord[]>();

    for (const c of filtered) {
      if (c.parentId) {
        const list = childrenByParent.get(c.parentId) || [];
        list.push(c);
        childrenByParent.set(c.parentId, list);
      }
    }

    const result: CategoryRecord[] = [];
    for (const root of roots) {
      result.push(root);
      const kids = childrenByParent.get(root.id) || [];
      result.push(...kids);
    }

    // Add any orphan children whose parents weren't in root
    const includedIds = new Set(result.map((r) => r.id));
    for (const c of filtered) {
      if (!includedIds.has(c.id)) {
        result.push(c);
      }
    }

    return result;
  }, [categories, search, statusFilter]);

  const topLevelCategories = useMemo(
    () => categories.filter((c) => !c.parentId && c.id !== editingId),
    [categories, editingId]
  );

  function openCreateModal(defaultParentId = "") {
    setEditingId(null);
    setName("");
    setDescription("");
    setParentId(defaultParentId);
    setStatus("ACTIVE");
    setError("");
    setShowModal(true);
  }

  function openEditModal(cat: CategoryRecord) {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    setParentId(cat.parentId || "");
    setStatus(cat.status);
    setError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch("/api/inventory/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          name,
          description,
          parentId: parentId || null,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save category.");
        setLoading(false);
        return;
      }

      if (editingId) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? data.category : c))
        );
      } else {
        setCategories((prev) => [...prev, data.category]);
      }

      setShowModal(false);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Network error while saving category.");
      setLoading(false);
    }
  }

  async function handleDelete(cat: CategoryRecord) {
    if (cat._count.products > 0 || cat._count.children > 0) {
      alert(
        `Cannot delete "${cat.name}" while it contains ${cat._count.products} product(s) or ${cat._count.children} subcategory(ies). Reassign them first or mark the category Inactive.`
      );
      return;
    }

    if (!confirm(`Delete category "${cat.name}"?`)) return;

    const res = await fetch(`/api/inventory/categories?id=${cat.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      router.refresh();
    }
  }

  const totalParentCount = categories.filter((c) => !c.parentId).length;
  const totalSubCount = categories.filter((c) => Boolean(c.parentId)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <FolderTree className="h-4 w-4" />
            Inventory Architecture
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Product Categories & Hierarchy
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Organize SKUs into parent departments and nested subcategories for structured reporting and stock control.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/inventory/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Package className="h-4 w-4 text-slate-500" />
            View Products
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {canManage && (
            <button
              type="button"
              onClick={() => openCreateModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Category
            </button>
          )}
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total Categories
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {categories.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Primary Departments
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {totalParentCount}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Nested Subcategories
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {totalSubCount}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories or descriptions..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | CategoryStatus)
            }
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Category Hierarchy</th>
                <th className="py-3.5 px-4">Parent Department</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Products</th>
                <th className="py-3.5 px-4">Status</th>
                {canManage && (
                  <th className="py-3.5 px-4 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {orderedCategories.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 6 : 5}
                    className="py-12 text-center text-slate-500"
                  >
                    No product categories match your filter criteria.
                  </td>
                </tr>
              ) : (
                orderedCategories.map((cat) => {
                  const isSub = Boolean(cat.parentId);
                  return (
                    <tr
                      key={cat.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSub ? "bg-slate-50/30" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div
                          className={`flex items-center gap-2 ${
                            isSub ? "pl-6" : ""
                          }`}
                        >
                          {isSub ? (
                            <CornerDownRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <FolderTree className="h-4 w-4 text-indigo-600 shrink-0" />
                          )}
                          <span
                            className={
                              isSub
                                ? "font-medium text-slate-800"
                                : "font-bold text-slate-900 text-sm"
                            }
                          >
                            {cat.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {cat.parent ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {cat.parent.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">Primary Department</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {cat.description || "—"}
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href={`/inventory/products?categoryId=${cat.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
                        >
                          {cat._count.products} SKUs
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        {cat.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {!isSub && (
                              <button
                                type="button"
                                onClick={() => openCreateModal(cat.id)}
                                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-500 px-2 py-1 rounded hover:bg-indigo-50 cursor-pointer"
                              >
                                + Subcategory
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditModal(cat)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(cat)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? "Edit Product Category" : "Create Product Category"}
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Soft Drinks or Cooking Oils"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Category (Optional)
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">None (Top-Level Department)</option>
                  {topLevelCategories.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of products in this category..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CategoryStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
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
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingId ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
