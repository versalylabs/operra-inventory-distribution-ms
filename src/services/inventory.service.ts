import { prisma } from "@/lib/prisma";
import {
  AdjustmentReason,
  AdjustmentStatus,
  StockMovementType,
  UserRole,
  WarehouseStatus,
} from "@prisma/client";

export interface CreateWarehouseInput {
  organizationId: string;
  userId: string;
  name: string;
  code: string;
  location: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  managerId?: string | null;
  isDefault?: boolean;
  status?: WarehouseStatus;
}

export interface UpdateWarehouseInput extends Partial<CreateWarehouseInput> {
  id: string;
  organizationId: string;
  userId: string;
}

export interface CreateStockAdjustmentInput {
  organizationId: string;
  userId: string;
  userRole: UserRole;
  productId: string;
  warehouseId: string;
  quantityDelta: number;
  reason: AdjustmentReason;
  notes?: string | null;
}

export interface StockTransferLineInput {
  productId: string;
  requestedQuantity: number;
}

export interface CreateStockTransferInput {
  organizationId: string;
  userId: string;
  userRole: UserRole;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  driverName?: string | null;
  vehicleRef?: string | null;
  notes?: string | null;
  dispatchImmediately?: boolean;
  items: StockTransferLineInput[];
}

export interface ReceiveTransferLineInput {
  productId: string;
  receivedQuantity: number;
  damagedQuantity: number;
}

function mapReasonToMovementType(reason: AdjustmentReason): StockMovementType {
  switch (reason) {
    case "OPENING_BALANCE":
      return "OPENING_BALANCE";
    case "DAMAGED_GOODS":
    case "EXPIRED_GOODS":
      return "DAMAGE";
    case "LOST_GOODS":
      return "LOSS";
    case "STOCK_COUNT_CORRECTION":
    case "DATA_CORRECTION":
    default:
      return "ADJUSTMENT";
  }
}

export const InventoryService = {
  async listWarehouses(organizationId: string) {
    const warehouses = await prisma.warehouse.findMany({
      where: { organizationId },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        inventoryItems: {
          include: {
            product: { select: { id: true, costPrice: true, sellingPrice: true } },
          },
        },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    return warehouses.map((w) => {
      let totalUnits = 0;
      let reservedUnits = 0;
      let damagedUnits = 0;
      let totalValue = 0;

      for (const item of w.inventoryItems) {
        totalUnits += item.currentStock;
        reservedUnits += item.reservedStock;
        damagedUnits += item.damagedStock;
        totalValue += item.currentStock * Number(item.product.costPrice);
      }

      return {
        id: w.id,
        name: w.name,
        code: w.code,
        location: w.location,
        address: w.address,
        phone: w.phone,
        email: w.email,
        managerId: w.managerId,
        manager: w.manager,
        isDefault: w.isDefault,
        status: w.status,
        skuCount: w.inventoryItems.filter((i) => i.currentStock > 0).length,
        totalUnits,
        availableUnits: totalUnits - reservedUnits,
        reservedUnits,
        damagedUnits,
        totalValue,
      };
    });
  },

  async createWarehouse(input: CreateWarehouseInput) {
    const normalizedCode = input.code.trim().toUpperCase();

    return prisma.$transaction(async (tx) => {
      const existing = await tx.warehouse.findUnique({
        where: {
          organizationId_code: {
            organizationId: input.organizationId,
            code: normalizedCode,
          },
        },
      });

      if (existing) {
        throw new Error("DUPLICATE_WAREHOUSE_CODE");
      }

      if (input.isDefault) {
        await tx.warehouse.updateMany({
          where: { organizationId: input.organizationId },
          data: { isDefault: false },
        });
      }

      const warehouse = await tx.warehouse.create({
        data: {
          organizationId: input.organizationId,
          name: input.name.trim(),
          code: normalizedCode,
          location: input.location.trim(),
          address: input.address?.trim() || null,
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          managerId: input.managerId || null,
          isDefault: Boolean(input.isDefault),
          status: input.status || "ACTIVE",
        },
        include: {
          manager: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "WAREHOUSE_CREATED",
          entity: "Warehouse",
          entityId: warehouse.id,
          newValue: {
            code: warehouse.code,
            name: warehouse.name,
            location: warehouse.location,
          },
        },
      });

      return warehouse;
    });
  },

  async updateWarehouse(input: UpdateWarehouseInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.warehouse.findFirst({
        where: { id: input.id, organizationId: input.organizationId },
      });

      if (!existing) {
        throw new Error("WAREHOUSE_NOT_FOUND");
      }

      const normalizedCode = input.code
        ? input.code.trim().toUpperCase()
        : existing.code;

      if (normalizedCode !== existing.code) {
        const duplicate = await tx.warehouse.findUnique({
          where: {
            organizationId_code: {
              organizationId: input.organizationId,
              code: normalizedCode,
            },
          },
        });
        if (duplicate) {
          throw new Error("DUPLICATE_WAREHOUSE_CODE");
        }
      }

      if (input.isDefault) {
        await tx.warehouse.updateMany({
          where: { organizationId: input.organizationId },
          data: { isDefault: false },
        });
      }

      const updated = await tx.warehouse.update({
        where: { id: input.id },
        data: {
          ...(input.name ? { name: input.name.trim() } : {}),
          code: normalizedCode,
          ...(input.location ? { location: input.location.trim() } : {}),
          ...(input.address !== undefined
            ? { address: input.address?.trim() || null }
            : {}),
          ...(input.phone !== undefined
            ? { phone: input.phone?.trim() || null }
            : {}),
          ...(input.email !== undefined
            ? { email: input.email?.trim() || null }
            : {}),
          ...(input.managerId !== undefined
            ? { managerId: input.managerId || null }
            : {}),
          ...(input.isDefault !== undefined
            ? { isDefault: Boolean(input.isDefault) }
            : {}),
          ...(input.status ? { status: input.status } : {}),
        },
        include: {
          manager: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "WAREHOUSE_UPDATED",
          entity: "Warehouse",
          entityId: updated.id,
          previousValue: {
            code: existing.code,
            name: existing.name,
            status: existing.status,
          },
          newValue: {
            code: updated.code,
            name: updated.name,
            status: updated.status,
          },
        },
      });

      return updated;
    });
  },

  async listInventoryStock(params: {
    organizationId: string;
    warehouseId?: string;
  }) {
    const { organizationId, warehouseId } = params;

    const items = await prisma.inventoryItem.findMany({
      where: {
        organizationId,
        ...(warehouseId && warehouseId !== "ALL" ? { warehouseId } : {}),
      },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true } },
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ product: { name: "asc" } }, { warehouse: { name: "asc" } }],
    });

    return items.map((item) => {
      const costPrice = Number(item.product.costPrice);
      const sellingPrice = Number(item.product.sellingPrice);
      const availableStock = item.currentStock - item.reservedStock;
      const stockValue = item.currentStock * costPrice;

      let health: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
      if (availableStock <= 0) {
        health = "OUT_OF_STOCK";
      } else if (availableStock <= item.product.reorderLevel) {
        health = "LOW_STOCK";
      }

      return {
        id: item.id,
        productId: item.productId,
        warehouseId: item.warehouseId,
        currentStock: item.currentStock,
        reservedStock: item.reservedStock,
        availableStock,
        incomingStock: item.incomingStock,
        damagedStock: item.damagedStock,
        stockValue,
        health,
        updatedAt: item.updatedAt.toISOString(),
        product: {
          id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          barcode: item.product.barcode,
          unitOfMeasure: item.product.unitOfMeasure,
          costPrice,
          sellingPrice,
          minStockLevel: item.product.minStockLevel,
          reorderLevel: item.product.reorderLevel,
          categoryName: item.product.category?.name || "Uncategorized",
        },
        warehouse: item.warehouse,
      };
    });
  },

  async listStockMovements(params: {
    organizationId: string;
    warehouseId?: string;
    productId?: string;
    limit?: number;
  }) {
    const { organizationId, warehouseId, productId, limit = 100 } = params;

    const movements = await prisma.stockMovement.findMany({
      where: {
        organizationId,
        ...(warehouseId && warehouseId !== "ALL" ? { warehouseId } : {}),
        ...(productId ? { productId } : {}),
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true, unitOfMeasure: true },
        },
        warehouse: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return movements.map((m) => ({
      id: m.id,
      movementType: m.movementType,
      quantity: m.quantity,
      previousQuantity: m.previousQuantity,
      newQuantity: m.newQuantity,
      reference: m.reference,
      notes: m.notes,
      createdAt: m.createdAt.toISOString(),
      product: m.product,
      warehouse: m.warehouse,
      user: m.user,
    }));
  },

  async listStockAdjustments(organizationId: string) {
    const adjustments = await prisma.stockAdjustment.findMany({
      where: { organizationId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unitOfMeasure: true,
            costPrice: true,
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return adjustments.map((a) => ({
      id: a.id,
      adjustmentNumber: a.adjustmentNumber,
      quantityDelta: a.quantityDelta,
      previousQuantity: a.previousQuantity,
      newQuantity: a.newQuantity,
      reason: a.reason,
      status: a.status,
      notes: a.notes,
      createdAt: a.createdAt.toISOString(),
      approvedAt: a.approvedAt ? a.approvedAt.toISOString() : null,
      product: {
        ...a.product,
        costPrice: Number(a.product.costPrice),
      },
      warehouse: a.warehouse,
      createdBy: a.createdBy,
      approvedBy: a.approvedBy,
    }));
  },

  /**
   * Creates a Stock Adjustment and, if authorized or non-sensitive, atomically
   * updates InventoryItem and appends an immutable StockMovement record.
   * Per Section 14: "For sensitive adjustments, require manager approval."
   */
  async createStockAdjustment(input: CreateStockAdjustmentInput) {
    if (input.quantityDelta === 0) {
      throw new Error("ZERO_QUANTITY_ADJUSTMENT");
    }

    const isManagerOrOwner =
      input.userRole === "SUPER_ADMIN" ||
      input.userRole === "OWNER" ||
      input.userRole === "MANAGER";

    // Sensitive adjustments by non-managers (e.g., negative deduction or large >= 25 units) require approval
    const isSensitive =
      input.quantityDelta < 0 || Math.abs(input.quantityDelta) >= 25;
    const status: AdjustmentStatus =
      isManagerOrOwner || !isSensitive ? "APPROVED" : "PENDING_APPROVAL";

    return prisma.$transaction(async (tx) => {
      const [org, product, warehouse] = await Promise.all([
        tx.organization.findUnique({ where: { id: input.organizationId } }),
        tx.product.findFirst({
          where: { id: input.productId, organizationId: input.organizationId },
        }),
        tx.warehouse.findFirst({
          where: {
            id: input.warehouseId,
            organizationId: input.organizationId,
          },
        }),
      ]);

      if (!org || !product || !warehouse) {
        throw new Error("ENTITY_NOT_FOUND");
      }

      const existingItem = await tx.inventoryItem.findUnique({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
      });

      const previousQuantity = existingItem ? existingItem.currentStock : 0;
      const newQuantity = previousQuantity + input.quantityDelta;

      if (newQuantity < 0 && !org.allowNegativeStock) {
        throw new Error("NEGATIVE_STOCK_NOT_ALLOWED");
      }

      const count = await tx.stockAdjustment.count({
        where: { organizationId: input.organizationId },
      });
      const adjustmentNumber = `ADJ-${String(count + 1001)}`;

      const adjustment = await tx.stockAdjustment.create({
        data: {
          organizationId: input.organizationId,
          adjustmentNumber,
          productId: input.productId,
          warehouseId: input.warehouseId,
          quantityDelta: input.quantityDelta,
          previousQuantity,
          newQuantity,
          reason: input.reason,
          status,
          notes: input.notes?.trim() || null,
          createdById: input.userId,
          approvedById: status === "APPROVED" ? input.userId : null,
          approvedAt: status === "APPROVED" ? new Date() : null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              unitOfMeasure: true,
              costPrice: true,
            },
          },
          warehouse: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
      });

      if (status === "APPROVED") {
        const damagedIncrement =
          (input.reason === "DAMAGED_GOODS" ||
            input.reason === "EXPIRED_GOODS") &&
          input.quantityDelta < 0
            ? Math.abs(input.quantityDelta)
            : 0;

        await tx.inventoryItem.upsert({
          where: {
            productId_warehouseId: {
              productId: input.productId,
              warehouseId: input.warehouseId,
            },
          },
          update: {
            currentStock: newQuantity,
            ...(damagedIncrement > 0
              ? { damagedStock: { increment: damagedIncrement } }
              : {}),
          },
          create: {
            organizationId: input.organizationId,
            productId: input.productId,
            warehouseId: input.warehouseId,
            currentStock: newQuantity,
            damagedStock: damagedIncrement,
          },
        });

        await tx.stockMovement.create({
          data: {
            organizationId: input.organizationId,
            productId: input.productId,
            warehouseId: input.warehouseId,
            movementType: mapReasonToMovementType(input.reason),
            quantity: input.quantityDelta,
            previousQuantity,
            newQuantity,
            reference: adjustment.adjustmentNumber,
            notes:
              input.notes?.trim() ||
              `Stock adjustment (${input.reason.replace(/_/g, " ")})`,
            userId: input.userId,
          },
        });

        // Trigger Low-Stock Alert Notification if stock dropped to or below reorderLevel
        if (newQuantity <= product.reorderLevel) {
          await tx.notification.create({
            data: {
              organizationId: input.organizationId,
              type: "LOW_STOCK",
              title: `Low Stock Alert: ${product.name}`,
              message: `${product.sku} at ${warehouse.name} is at ${newQuantity} ${product.unitOfMeasure}s (Reorder level: ${product.reorderLevel}).`,
              link: "/inventory/stock",
            },
          });
        }
      } else {
        await tx.notification.create({
          data: {
            organizationId: input.organizationId,
            type: "APPROVAL_REQUIRED",
            title: `Adjustment Pending Approval (${adjustmentNumber})`,
            message: `Sensitive stock adjustment of ${input.quantityDelta} ${product.unitOfMeasure}s for ${product.name} at ${warehouse.name} requires Manager approval.`,
            link: "/inventory/adjustments",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action:
            status === "APPROVED"
              ? "STOCK_ADJUSTED"
              : "STOCK_ADJUSTMENT_REQUESTED",
          entity: "StockAdjustment",
          entityId: adjustment.id,
          previousValue: { quantity: previousQuantity },
          newValue: {
            adjustmentNumber,
            sku: product.sku,
            warehouse: warehouse.code,
            delta: input.quantityDelta,
            newQuantity,
            reason: input.reason,
            status,
          },
        },
      });

      return adjustment;
    });
  },

  async reviewStockAdjustment(params: {
    organizationId: string;
    userId: string;
    adjustmentId: string;
    decision: "APPROVED" | "REJECTED";
  }) {
    const { organizationId, userId, adjustmentId, decision } = params;

    return prisma.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.findFirst({
        where: { id: adjustmentId, organizationId },
        include: {
          product: true,
          warehouse: true,
        },
      });

      if (!adjustment) {
        throw new Error("ADJUSTMENT_NOT_FOUND");
      }

      if (adjustment.status !== "PENDING_APPROVAL") {
        throw new Error("ALREADY_REVIEWED");
      }

      if (decision === "REJECTED") {
        const rejected = await tx.stockAdjustment.update({
          where: { id: adjustmentId },
          data: {
            status: "REJECTED",
            approvedById: userId,
            approvedAt: new Date(),
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unitOfMeasure: true,
                costPrice: true,
              },
            },
            warehouse: { select: { id: true, name: true, code: true } },
            createdBy: { select: { id: true, name: true, email: true } },
            approvedBy: { select: { id: true, name: true, email: true } },
          },
        });

        await tx.auditLog.create({
          data: {
            organizationId,
            userId,
            action: "STOCK_ADJUSTMENT_REJECTED",
            entity: "StockAdjustment",
            entityId: adjustmentId,
            newValue: { adjustmentNumber: adjustment.adjustmentNumber },
          },
        });

        return rejected;
      }

      // Approving: Re-read current stock inside transaction for strict ledger accuracy
      const org = await tx.organization.findUnique({
        where: { id: organizationId },
      });

      const currentItem = await tx.inventoryItem.findUnique({
        where: {
          productId_warehouseId: {
            productId: adjustment.productId,
            warehouseId: adjustment.warehouseId,
          },
        },
      });

      const previousQuantity = currentItem ? currentItem.currentStock : 0;
      const newQuantity = previousQuantity + adjustment.quantityDelta;

      if (newQuantity < 0 && !org?.allowNegativeStock) {
        throw new Error("NEGATIVE_STOCK_NOT_ALLOWED");
      }

      const damagedIncrement =
        (adjustment.reason === "DAMAGED_GOODS" ||
          adjustment.reason === "EXPIRED_GOODS") &&
        adjustment.quantityDelta < 0
          ? Math.abs(adjustment.quantityDelta)
          : 0;

      await tx.inventoryItem.upsert({
        where: {
          productId_warehouseId: {
            productId: adjustment.productId,
            warehouseId: adjustment.warehouseId,
          },
        },
        update: {
          currentStock: newQuantity,
          ...(damagedIncrement > 0
            ? { damagedStock: { increment: damagedIncrement } }
            : {}),
        },
        create: {
          organizationId,
          productId: adjustment.productId,
          warehouseId: adjustment.warehouseId,
          currentStock: newQuantity,
          damagedStock: damagedIncrement,
        },
      });

      await tx.stockMovement.create({
        data: {
          organizationId,
          productId: adjustment.productId,
          warehouseId: adjustment.warehouseId,
          movementType: mapReasonToMovementType(adjustment.reason),
          quantity: adjustment.quantityDelta,
          previousQuantity,
          newQuantity,
          reference: adjustment.adjustmentNumber,
          notes:
            adjustment.notes ||
            `Approved stock adjustment (${adjustment.reason.replace(/_/g, " ")})`,
          userId,
        },
      });

      const approved = await tx.stockAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: "APPROVED",
          previousQuantity,
          newQuantity,
          approvedById: userId,
          approvedAt: new Date(),
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              unitOfMeasure: true,
              costPrice: true,
            },
          },
          warehouse: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          userId,
          action: "STOCK_ADJUSTMENT_APPROVED",
          entity: "StockAdjustment",
          entityId: adjustmentId,
          previousValue: { quantity: previousQuantity },
          newValue: {
            adjustmentNumber: adjustment.adjustmentNumber,
            newQuantity,
          },
        },
      });

      return approved;
    });
  },

  async listStockTransfers(organizationId: string) {
    const transfers = await prisma.stockTransfer.findMany({
      where: { organizationId },
      include: {
        sourceWarehouse: { select: { id: true, code: true, name: true, location: true } },
        destinationWarehouse: { select: { id: true, code: true, name: true, location: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        dispatchedBy: { select: { id: true, name: true } },
        receivedBy: { select: { id: true, name: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unitOfMeasure: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return transfers.map((t) => {
      const totalRequestedUnits = t.items.reduce(
        (sum, i) => sum + i.requestedQuantity,
        0
      );
      const totalDispatchedUnits = t.items.reduce(
        (sum, i) => sum + i.dispatchedQuantity,
        0
      );
      const totalReceivedUnits = t.items.reduce(
        (sum, i) => sum + i.receivedQuantity,
        0
      );
      const totalDamagedUnits = t.items.reduce(
        (sum, i) => sum + i.damagedQuantity,
        0
      );
      const totalValue = t.items.reduce(
        (sum, i) => sum + i.requestedQuantity * Number(i.unitCost),
        0
      );

      return {
        id: t.id,
        transferNumber: t.transferNumber,
        sourceWarehouseId: t.sourceWarehouseId,
        sourceWarehouse: t.sourceWarehouse,
        destinationWarehouseId: t.destinationWarehouseId,
        destinationWarehouse: t.destinationWarehouse,
        status: t.status,
        driverName: t.driverName,
        vehicleRef: t.vehicleRef,
        notes: t.notes,
        requestedBy: t.requestedBy,
        approvedBy: t.approvedBy,
        dispatchedBy: t.dispatchedBy,
        receivedBy: t.receivedBy,
        approvedAt: t.approvedAt?.toISOString() || null,
        dispatchedAt: t.dispatchedAt?.toISOString() || null,
        receivedAt: t.receivedAt?.toISOString() || null,
        createdAt: t.createdAt.toISOString(),
        totalRequestedUnits,
        totalDispatchedUnits,
        totalReceivedUnits,
        totalDamagedUnits,
        totalValue,
        items: t.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          unitOfMeasure: item.product.unitOfMeasure,
          requestedQuantity: item.requestedQuantity,
          dispatchedQuantity: item.dispatchedQuantity,
          receivedQuantity: item.receivedQuantity,
          damagedQuantity: item.damagedQuantity,
          unitCost: Number(item.unitCost),
          lineValue: item.requestedQuantity * Number(item.unitCost),
        })),
      };
    });
  },

  async createStockTransfer(input: CreateStockTransferInput) {
    if (input.sourceWarehouseId === input.destinationWarehouseId) {
      throw new Error(
        "SAME_WAREHOUSE_TRANSFER:Source warehouse and destination warehouse must be different."
      );
    }

    if (!input.items || input.items.length === 0) {
      throw new Error("EMPTY_TRANSFER_ITEMS");
    }

    return prisma.$transaction(async (tx) => {
      const [org, sourceWh, destWh] = await Promise.all([
        tx.organization.findUnique({ where: { id: input.organizationId } }),
        tx.warehouse.findFirst({
          where: {
            id: input.sourceWarehouseId,
            organizationId: input.organizationId,
          },
        }),
        tx.warehouse.findFirst({
          where: {
            id: input.destinationWarehouseId,
            organizationId: input.organizationId,
          },
        }),
      ]);

      if (!org || !sourceWh || !destWh) {
        throw new Error("INVALID_WAREHOUSE");
      }

      const count = await tx.stockTransfer.count({
        where: { organizationId: input.organizationId },
      });

      const year = new Date().getFullYear();
      const prefix = org.transferPrefix || "TRF-";
      const transferNumber = `${prefix}${year}-${String(count + 1).padStart(4, "0")}`;

      const canApprove =
        input.userRole === "SUPER_ADMIN" ||
        input.userRole === "OWNER" ||
        input.userRole === "MANAGER";

      const dispatchNow = Boolean(input.dispatchImmediately && canApprove);

      const preparedItems: Array<{
        productId: string;
        requestedQuantity: number;
        dispatchedQuantity: number;
        unitCost: number;
      }> = [];

      for (const line of input.items) {
        const qty = Math.max(1, Math.round(Number(line.requestedQuantity)));
        const product = await tx.product.findFirst({
          where: {
            id: line.productId,
            organizationId: input.organizationId,
          },
        });

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        const sourceInv = await tx.inventoryItem.findUnique({
          where: {
            productId_warehouseId: {
              productId: product.id,
              warehouseId: sourceWh.id,
            },
          },
        });

        const currentStock = sourceInv?.currentStock ?? 0;
        const reservedStock = sourceInv?.reservedStock ?? 0;
        const availableStock = currentStock - reservedStock;

        if (!org.allowNegativeStock && availableStock < qty) {
          throw new Error(
            `INSUFFICIENT_SOURCE_STOCK:${product.name} (${product.sku}) only has ${availableStock} available units at ${sourceWh.name} (${currentStock} on hand, ${reservedStock} reserved). Requested: ${qty}.`
          );
        }

        if (dispatchNow) {
          // Immediately deduct from source warehouse, create TRANSFER_OUT movement, and increment incomingStock at destination
          const newSourceStock = currentStock - qty;

          await tx.inventoryItem.upsert({
            where: {
              productId_warehouseId: {
                productId: product.id,
                warehouseId: sourceWh.id,
              },
            },
            create: {
              organizationId: input.organizationId,
              productId: product.id,
              warehouseId: sourceWh.id,
              currentStock: newSourceStock,
            },
            update: {
              currentStock: newSourceStock,
            },
          });

          await tx.stockMovement.create({
            data: {
              organizationId: input.organizationId,
              productId: product.id,
              warehouseId: sourceWh.id,
              movementType: "TRANSFER_OUT",
              quantity: -qty,
              previousQuantity: currentStock,
              newQuantity: newSourceStock,
              reference: transferNumber,
              notes: `Inter-warehouse transfer dispatched to ${destWh.name}`,
              userId: input.userId,
            },
          });

          await tx.inventoryItem.upsert({
            where: {
              productId_warehouseId: {
                productId: product.id,
                warehouseId: destWh.id,
              },
            },
            create: {
              organizationId: input.organizationId,
              productId: product.id,
              warehouseId: destWh.id,
              currentStock: 0,
              incomingStock: qty,
            },
            update: {
              incomingStock: {
                increment: qty,
              },
            },
          });
        } else {
          // Reserve stock at source warehouse while awaiting approval / dispatch
          await tx.inventoryItem.upsert({
            where: {
              productId_warehouseId: {
                productId: product.id,
                warehouseId: sourceWh.id,
              },
            },
            create: {
              organizationId: input.organizationId,
              productId: product.id,
              warehouseId: sourceWh.id,
              currentStock: 0,
              reservedStock: qty,
            },
            update: {
              reservedStock: {
                increment: qty,
              },
            },
          });
        }

        preparedItems.push({
          productId: product.id,
          requestedQuantity: qty,
          dispatchedQuantity: dispatchNow ? qty : 0,
          unitCost: Number(product.costPrice),
        });
      }

      const initialStatus = dispatchNow
        ? "IN_TRANSIT"
        : canApprove
        ? "APPROVED"
        : "REQUESTED";

      const transfer = await tx.stockTransfer.create({
        data: {
          organizationId: input.organizationId,
          transferNumber,
          sourceWarehouseId: sourceWh.id,
          destinationWarehouseId: destWh.id,
          status: initialStatus,
          driverName: input.driverName?.trim() || null,
          vehicleRef: input.vehicleRef?.trim() || null,
          notes: input.notes?.trim() || null,
          requestedById: input.userId,
          approvedById: canApprove ? input.userId : null,
          approvedAt: canApprove ? new Date() : null,
          dispatchedById: dispatchNow ? input.userId : null,
          dispatchedAt: dispatchNow ? new Date() : null,
          items: {
            create: preparedItems,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "STOCK_TRANSFER_CREATED",
          entity: "StockTransfer",
          entityId: transfer.id,
          newValue: {
            transferNumber: transfer.transferNumber,
            from: sourceWh.name,
            to: destWh.name,
            status: transfer.status,
          },
        },
      });

      await tx.notification.create({
        data: {
          organizationId: input.organizationId,
          type: "STOCK_TRANSFER",
          title: `Stock Transfer ${transfer.transferNumber} (${transfer.status.replace(/_/g, " ")})`,
          message: `Transfer from ${sourceWh.name} to ${destWh.name} initiated (${preparedItems.reduce((s, i) => s + i.requestedQuantity, 0)} units).`,
          link: "/inventory/transfers",
        },
      });

      return transfer;
    });
  },

  async updateStockTransferStatus(input: {
    organizationId: string;
    userId: string;
    transferId: string;
    action: "APPROVE" | "DISPATCH" | "RECEIVE" | "CANCEL";
    driverName?: string | null;
    vehicleRef?: string | null;
    receivedItems?: ReceiveTransferLineInput[];
  }) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findFirst({
        where: {
          id: input.transferId,
          organizationId: input.organizationId,
        },
        include: {
          sourceWarehouse: true,
          destinationWarehouse: true,
          organization: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!transfer) {
        throw new Error("TRANSFER_NOT_FOUND");
      }

      if (
        transfer.status === "RECEIVED" ||
        transfer.status === "CANCELLED"
      ) {
        throw new Error("TRANSFER_ALREADY_FINALIZED");
      }

      if (input.action === "APPROVE") {
        const updated = await tx.stockTransfer.update({
          where: { id: transfer.id },
          data: {
            status: "APPROVED",
            approvedById: input.userId,
            approvedAt: new Date(),
          },
        });

        await tx.auditLog.create({
          data: {
            organizationId: input.organizationId,
            userId: input.userId,
            action: "STOCK_TRANSFER_APPROVED",
            entity: "StockTransfer",
            entityId: transfer.id,
            newValue: {
              transferNumber: transfer.transferNumber,
              status: "APPROVED",
            },
          },
        });

        return updated;
      }

      if (input.action === "DISPATCH") {
        // Deduct from sourceWarehouse (and release reservedStock), create TRANSFER_OUT movements, and increment incomingStock at destinationWarehouse
        for (const item of transfer.items) {
          const qty = item.requestedQuantity;
          const sourceInv = await tx.inventoryItem.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: transfer.sourceWarehouseId,
              },
            },
          });

          const previousStock = sourceInv?.currentStock ?? 0;
          const currentReserved = sourceInv?.reservedStock ?? 0;
          const newStock = previousStock - qty;

          if (!transfer.organization.allowNegativeStock && newStock < 0) {
            throw new Error(
              `INSUFFICIENT_SOURCE_STOCK:Cannot dispatch ${qty} units of ${item.product.name}; only ${previousStock} units physically on hand at ${transfer.sourceWarehouse.name}.`
            );
          }

          await tx.inventoryItem.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: transfer.sourceWarehouseId,
              },
            },
            create: {
              organizationId: input.organizationId,
              productId: item.productId,
              warehouseId: transfer.sourceWarehouseId,
              currentStock: newStock,
              reservedStock: 0,
            },
            update: {
              currentStock: newStock,
              reservedStock: Math.max(0, currentReserved - qty),
            },
          });

          await tx.stockMovement.create({
            data: {
              organizationId: input.organizationId,
              productId: item.productId,
              warehouseId: transfer.sourceWarehouseId,
              movementType: "TRANSFER_OUT",
              quantity: -qty,
              previousQuantity: previousStock,
              newQuantity: newStock,
              reference: transfer.transferNumber,
              notes: `Dispatched to ${transfer.destinationWarehouse.name}`,
              userId: input.userId,
            },
          });

          await tx.inventoryItem.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: transfer.destinationWarehouseId,
              },
            },
            create: {
              organizationId: input.organizationId,
              productId: item.productId,
              warehouseId: transfer.destinationWarehouseId,
              currentStock: 0,
              incomingStock: qty,
            },
            update: {
              incomingStock: {
                increment: qty,
              },
            },
          });

          await tx.stockTransferItem.update({
            where: { id: item.id },
            data: {
              dispatchedQuantity: qty,
            },
          });
        }

        const updated = await tx.stockTransfer.update({
          where: { id: transfer.id },
          data: {
            status: "IN_TRANSIT",
            dispatchedById: input.userId,
            dispatchedAt: new Date(),
            ...(input.driverName !== undefined
              ? { driverName: input.driverName?.trim() || null }
              : {}),
            ...(input.vehicleRef !== undefined
              ? { vehicleRef: input.vehicleRef?.trim() || null }
              : {}),
          },
        });

        await tx.auditLog.create({
          data: {
            organizationId: input.organizationId,
            userId: input.userId,
            action: "STOCK_TRANSFER_DISPATCHED",
            entity: "StockTransfer",
            entityId: transfer.id,
            newValue: {
              transferNumber: transfer.transferNumber,
              status: "IN_TRANSIT",
              from: transfer.sourceWarehouse.name,
              to: transfer.destinationWarehouse.name,
            },
          },
        });

        return updated;
      }

      if (input.action === "RECEIVE") {
        const receiveMap = new Map<
          string,
          { receivedQuantity: number; damagedQuantity: number }
        >();
        if (input.receivedItems) {
          for (const ri of input.receivedItems) {
            receiveMap.set(ri.productId, {
              receivedQuantity: Math.max(0, Number(ri.receivedQuantity)),
              damagedQuantity: Math.max(0, Number(ri.damagedQuantity || 0)),
            });
          }
        }

        for (const item of transfer.items) {
          const dispatchedQty =
            item.dispatchedQuantity > 0
              ? item.dispatchedQuantity
              : item.requestedQuantity;
          const custom = receiveMap.get(item.productId);
          const receivedQty = custom
            ? custom.receivedQuantity
            : dispatchedQty;
          const damagedQty = custom ? custom.damagedQuantity : 0;

          const destInv = await tx.inventoryItem.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: transfer.destinationWarehouseId,
              },
            },
          });

          const previousDestStock = destInv?.currentStock ?? 0;
          const currentIncoming = destInv?.incomingStock ?? 0;
          const newDestStock = previousDestStock + receivedQty;

          await tx.inventoryItem.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: transfer.destinationWarehouseId,
              },
            },
            create: {
              organizationId: input.organizationId,
              productId: item.productId,
              warehouseId: transfer.destinationWarehouseId,
              currentStock: newDestStock,
              incomingStock: 0,
              damagedStock: damagedQty,
            },
            update: {
              currentStock: newDestStock,
              incomingStock: Math.max(0, currentIncoming - dispatchedQty),
              ...(damagedQty > 0
                ? { damagedStock: { increment: damagedQty } }
                : {}),
            },
          });

          if (receivedQty > 0) {
            await tx.stockMovement.create({
              data: {
                organizationId: input.organizationId,
                productId: item.productId,
                warehouseId: transfer.destinationWarehouseId,
                movementType: "TRANSFER_IN",
                quantity: receivedQty,
                previousQuantity: previousDestStock,
                newQuantity: newDestStock,
                reference: transfer.transferNumber,
                notes: `Received from ${transfer.sourceWarehouse.name}${
                  damagedQty > 0 ? ` (${damagedQty} damaged in transit)` : ""
                }`,
                userId: input.userId,
              },
            });
          }

          await tx.stockTransferItem.update({
            where: { id: item.id },
            data: {
              dispatchedQuantity: dispatchedQty,
              receivedQuantity: receivedQty,
              damagedQuantity: damagedQty,
            },
          });
        }

        const updated = await tx.stockTransfer.update({
          where: { id: transfer.id },
          data: {
            status: "RECEIVED",
            receivedById: input.userId,
            receivedAt: new Date(),
          },
        });

        await tx.auditLog.create({
          data: {
            organizationId: input.organizationId,
            userId: input.userId,
            action: "STOCK_TRANSFER_RECEIVED",
            entity: "StockTransfer",
            entityId: transfer.id,
            newValue: {
              transferNumber: transfer.transferNumber,
              status: "RECEIVED",
              destinationWarehouse: transfer.destinationWarehouse.name,
            },
          },
        });

        return updated;
      }

      if (input.action === "CANCEL") {
        if (
          transfer.status === "IN_TRANSIT" ||
          transfer.status === "DISPATCHED"
        ) {
          throw new Error(
            "CANNOT_CANCEL_IN_TRANSIT:Consignment is already in transit. Receive it at the destination or return it."
          );
        }

        // Release reserved stock at sourceWarehouse
        for (const item of transfer.items) {
          const sourceInv = await tx.inventoryItem.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: transfer.sourceWarehouseId,
              },
            },
          });

          if (sourceInv) {
            await tx.inventoryItem.update({
              where: { id: sourceInv.id },
              data: {
                reservedStock: Math.max(
                  0,
                  sourceInv.reservedStock - item.requestedQuantity
                ),
              },
            });
          }
        }

        const updated = await tx.stockTransfer.update({
          where: { id: transfer.id },
          data: {
            status: "CANCELLED",
          },
        });

        await tx.auditLog.create({
          data: {
            organizationId: input.organizationId,
            userId: input.userId,
            action: "STOCK_TRANSFER_CANCELLED",
            entity: "StockTransfer",
            entityId: transfer.id,
            newValue: {
              transferNumber: transfer.transferNumber,
              status: "CANCELLED",
            },
          },
        });

        return updated;
      }

      throw new Error("INVALID_TRANSFER_ACTION");
    });
  },
};

