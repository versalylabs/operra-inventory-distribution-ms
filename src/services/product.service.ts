import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { CategoryStatus, ProductStatus } from "@prisma/client";

export interface CreateCategoryInput {
  organizationId: string;
  userId: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  status?: CategoryStatus;
}

export interface UpdateCategoryInput {
  id: string;
  organizationId: string;
  userId: string;
  name?: string;
  description?: string | null;
  parentId?: string | null;
  status?: CategoryStatus;
}

export interface CreateProductInput {
  organizationId: string;
  userId: string;
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  categoryId?: string | null;
  brand?: string | null;
  unitOfMeasure?: string;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number | null;
  taxRate?: number;
  minStockLevel?: number;
  reorderLevel?: number;
  maxStockLevel?: number | null;
  imageUrl?: string | null;
  preferredSupplier?: string | null;
  status?: ProductStatus;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
  organizationId: string;
  userId: string;
}

export const ProductService = {
  async listCategories(organizationId: string) {
    return prisma.category.findMany({
      where: { organizationId },
      include: {
        parent: { select: { id: true, name: true } },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
    });
  },

  async createCategory(input: CreateCategoryInput) {
    const baseSlug = slugify(input.name) || "category";

    return prisma.$transaction(async (tx) => {
      const existing = await tx.category.findUnique({
        where: {
          organizationId_slug: {
            organizationId: input.organizationId,
            slug: baseSlug,
          },
        },
      });

      const finalSlug = existing
        ? `${baseSlug}-${Math.random().toString(36).substring(2, 5)}`
        : baseSlug;

      const category = await tx.category.create({
        data: {
          organizationId: input.organizationId,
          name: input.name.trim(),
          slug: finalSlug,
          description: input.description?.trim() || null,
          parentId: input.parentId || null,
          status: input.status || "ACTIVE",
        },
        include: {
          parent: { select: { id: true, name: true } },
          _count: { select: { products: true, children: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "CATEGORY_CREATED",
          entity: "Category",
          entityId: category.id,
          newValue: {
            name: category.name,
            parentId: category.parentId,
            status: category.status,
          },
        },
      });

      return category;
    });
  },

  async updateCategory(input: UpdateCategoryInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.category.findFirst({
        where: { id: input.id, organizationId: input.organizationId },
      });

      if (!existing) {
        throw new Error("CATEGORY_NOT_FOUND");
      }

      if (input.parentId && input.parentId === input.id) {
        throw new Error("INVALID_PARENT_CATEGORY");
      }

      const updated = await tx.category.update({
        where: { id: input.id },
        data: {
          ...(input.name ? { name: input.name.trim() } : {}),
          ...(input.description !== undefined
            ? { description: input.description?.trim() || null }
            : {}),
          ...(input.parentId !== undefined
            ? { parentId: input.parentId || null }
            : {}),
          ...(input.status ? { status: input.status } : {}),
        },
        include: {
          parent: { select: { id: true, name: true } },
          _count: { select: { products: true, children: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "CATEGORY_UPDATED",
          entity: "Category",
          entityId: updated.id,
          previousValue: {
            name: existing.name,
            status: existing.status,
            parentId: existing.parentId,
          },
          newValue: {
            name: updated.name,
            status: updated.status,
            parentId: updated.parentId,
          },
        },
      });

      return updated;
    });
  },

  async deleteCategory(organizationId: string, userId: string, categoryId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.category.findFirst({
        where: { id: categoryId, organizationId },
        include: { _count: { select: { products: true, children: true } } },
      });

      if (!existing) {
        throw new Error("CATEGORY_NOT_FOUND");
      }

      await tx.category.delete({
        where: { id: categoryId },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          userId,
          action: "CATEGORY_DELETED",
          entity: "Category",
          entityId: categoryId,
          previousValue: { name: existing.name },
        },
      });

      return { success: true };
    });
  },

  async listProducts(params: {
    organizationId: string;
    search?: string;
    categoryId?: string;
    status?: ProductStatus | "ALL";
  }) {
    const { organizationId, search, categoryId, status } = params;

    return prisma.product.findMany({
      where: {
        organizationId,
        ...(categoryId && categoryId !== "ALL" ? { categoryId } : {}),
        ...(status && status !== "ALL" ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
                { barcode: { contains: search, mode: "insensitive" } },
                { brand: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            parent: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ name: "asc" }],
    });
  },

  async createProduct(input: CreateProductInput) {
    const normalizedSku = input.sku.trim().toUpperCase();

    return prisma.$transaction(async (tx) => {
      const duplicateSku = await tx.product.findUnique({
        where: {
          organizationId_sku: {
            organizationId: input.organizationId,
            sku: normalizedSku,
          },
        },
      });

      if (duplicateSku) {
        throw new Error("DUPLICATE_SKU");
      }

      const product = await tx.product.create({
        data: {
          organizationId: input.organizationId,
          name: input.name.trim(),
          sku: normalizedSku,
          barcode: input.barcode?.trim() || null,
          description: input.description?.trim() || null,
          categoryId: input.categoryId || null,
          brand: input.brand?.trim() || null,
          unitOfMeasure: input.unitOfMeasure?.trim() || "Unit",
          costPrice: Number(input.costPrice) || 0,
          sellingPrice: Number(input.sellingPrice) || 0,
          wholesalePrice:
            input.wholesalePrice !== undefined && input.wholesalePrice !== null
              ? Number(input.wholesalePrice)
              : null,
          taxRate: input.taxRate !== undefined ? Number(input.taxRate) : 16.0,
          minStockLevel:
            input.minStockLevel !== undefined ? Number(input.minStockLevel) : 10,
          reorderLevel:
            input.reorderLevel !== undefined ? Number(input.reorderLevel) : 25,
          maxStockLevel:
            input.maxStockLevel !== undefined && input.maxStockLevel !== null
              ? Number(input.maxStockLevel)
              : null,
          imageUrl: input.imageUrl?.trim() || null,
          preferredSupplier: input.preferredSupplier?.trim() || null,
          status: input.status || "ACTIVE",
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              parent: { select: { id: true, name: true } },
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "PRODUCT_CREATED",
          entity: "Product",
          entityId: product.id,
          newValue: {
            sku: product.sku,
            name: product.name,
            costPrice: Number(product.costPrice),
            sellingPrice: Number(product.sellingPrice),
          },
        },
      });

      return product;
    });
  },

  async updateProduct(input: UpdateProductInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.product.findFirst({
        where: {
          id: input.id,
          organizationId: input.organizationId,
        },
      });

      if (!existing) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const normalizedSku = input.sku
        ? input.sku.trim().toUpperCase()
        : existing.sku;

      if (normalizedSku !== existing.sku) {
        const duplicate = await tx.product.findUnique({
          where: {
            organizationId_sku: {
              organizationId: input.organizationId,
              sku: normalizedSku,
            },
          },
        });
        if (duplicate) {
          throw new Error("DUPLICATE_SKU");
        }
      }

      const updated = await tx.product.update({
        where: { id: input.id },
        data: {
          ...(input.name ? { name: input.name.trim() } : {}),
          sku: normalizedSku,
          ...(input.barcode !== undefined
            ? { barcode: input.barcode?.trim() || null }
            : {}),
          ...(input.description !== undefined
            ? { description: input.description?.trim() || null }
            : {}),
          ...(input.categoryId !== undefined
            ? { categoryId: input.categoryId || null }
            : {}),
          ...(input.brand !== undefined
            ? { brand: input.brand?.trim() || null }
            : {}),
          ...(input.unitOfMeasure
            ? { unitOfMeasure: input.unitOfMeasure.trim() }
            : {}),
          ...(input.costPrice !== undefined
            ? { costPrice: Number(input.costPrice) }
            : {}),
          ...(input.sellingPrice !== undefined
            ? { sellingPrice: Number(input.sellingPrice) }
            : {}),
          ...(input.wholesalePrice !== undefined
            ? {
                wholesalePrice:
                  input.wholesalePrice !== null &&
                  String(input.wholesalePrice) !== ""
                    ? Number(input.wholesalePrice)
                    : null,
              }
            : {}),
          ...(input.taxRate !== undefined
            ? { taxRate: Number(input.taxRate) }
            : {}),
          ...(input.minStockLevel !== undefined
            ? { minStockLevel: Number(input.minStockLevel) }
            : {}),
          ...(input.reorderLevel !== undefined
            ? { reorderLevel: Number(input.reorderLevel) }
            : {}),
          ...(input.maxStockLevel !== undefined
            ? {
                maxStockLevel:
                  input.maxStockLevel !== null &&
                  String(input.maxStockLevel) !== ""
                    ? Number(input.maxStockLevel)
                    : null,
              }
            : {}),
          ...(input.imageUrl !== undefined
            ? { imageUrl: input.imageUrl?.trim() || null }
            : {}),
          ...(input.preferredSupplier !== undefined
            ? { preferredSupplier: input.preferredSupplier?.trim() || null }
            : {}),
          ...(input.status ? { status: input.status } : {}),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              parent: { select: { id: true, name: true } },
            },
          },
        },
      });

      const priceChanged =
        Number(existing.costPrice) !== Number(updated.costPrice) ||
        Number(existing.sellingPrice) !== Number(updated.sellingPrice);

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: priceChanged ? "PRODUCT_PRICE_CHANGED" : "PRODUCT_UPDATED",
          entity: "Product",
          entityId: updated.id,
          previousValue: {
            sku: existing.sku,
            name: existing.name,
            costPrice: Number(existing.costPrice),
            sellingPrice: Number(existing.sellingPrice),
            status: existing.status,
          },
          newValue: {
            sku: updated.sku,
            name: updated.name,
            costPrice: Number(updated.costPrice),
            sellingPrice: Number(updated.sellingPrice),
            status: updated.status,
          },
        },
      });

      return updated;
    });
  },
};
