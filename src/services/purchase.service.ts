import { prisma } from "@/lib/prisma";
import { PurchaseOrderStatus, SupplierStatus, UserRole } from "@prisma/client";

export interface CreateSupplierInput {
  organizationId: string;
  userId: string;
  companyName: string;
  code?: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  taxNumber?: string | null;
  paymentTermsDays?: number;
  creditLimit?: number;
  bankDetails?: string | null;
  suppliedCategories?: string | null;
  status?: SupplierStatus;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  id: string;
  organizationId: string;
  userId: string;
}

export interface PurchaseOrderLineInput {
  productId: string;
  orderedQuantity: number;
  unitCost: number;
  taxRate?: number;
}

export interface CreatePurchaseOrderInput {
  organizationId: string;
  userId: string;
  userRole: UserRole;
  supplierId: string;
  warehouseId: string;
  expectedDeliveryAt?: string | null;
  discountAmount?: number;
  notes?: string | null;
  submitForApproval?: boolean;
  items: PurchaseOrderLineInput[];
}

export interface ReceiveGoodsItemInput {
  productId: string;
  receivedQuantity: number;
  damagedQuantity: number;
  missingQuantity: number;
}

export interface CreateGoodsReceiptInput {
  organizationId: string;
  userId: string;
  purchaseOrderId: string;
  deliveryNoteRef?: string | null;
  notes?: string | null;
  items: ReceiveGoodsItemInput[];
}

export const PurchaseService = {
  async listSuppliers(organizationId: string) {
    const suppliers = await prisma.supplier.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            purchaseOrders: true,
            goodsReceipts: true,
          },
        },
      },
      orderBy: { companyName: "asc" },
    });

    return suppliers.map((s) => ({
      id: s.id,
      code: s.code,
      companyName: s.companyName,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email,
      address: s.address,
      city: s.city,
      taxNumber: s.taxNumber,
      paymentTermsDays: s.paymentTermsDays,
      creditLimit: Number(s.creditLimit),
      bankDetails: s.bankDetails,
      suppliedCategories: s.suppliedCategories,
      totalPurchases: Number(s.totalPurchases),
      outstandingBalance: Number(s.outstandingBalance),
      status: s.status,
      poCount: s._count.purchaseOrders,
      grnCount: s._count.goodsReceipts,
    }));
  },

  async createSupplier(input: CreateSupplierInput) {
    return prisma.$transaction(async (tx) => {
      const count = await tx.supplier.count({
        where: { organizationId: input.organizationId },
      });

      const code = input.code
        ? input.code.trim().toUpperCase()
        : `SUP-${String(count + 101)}`;

      const supplier = await tx.supplier.create({
        data: {
          organizationId: input.organizationId,
          code,
          companyName: input.companyName.trim(),
          contactPerson: input.contactPerson?.trim() || null,
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          address: input.address?.trim() || null,
          city: input.city?.trim() || "Nairobi",
          taxNumber: input.taxNumber?.trim() || null,
          paymentTermsDays:
            input.paymentTermsDays !== undefined
              ? Number(input.paymentTermsDays)
              : 30,
          creditLimit:
            input.creditLimit !== undefined ? Number(input.creditLimit) : 500000,
          bankDetails: input.bankDetails?.trim() || null,
          suppliedCategories: input.suppliedCategories?.trim() || null,
          status: input.status || "ACTIVE",
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "SUPPLIER_CREATED",
          entity: "Supplier",
          entityId: supplier.id,
          newValue: {
            code: supplier.code,
            companyName: supplier.companyName,
          },
        },
      });

      return {
        ...supplier,
        creditLimit: Number(supplier.creditLimit),
        totalPurchases: Number(supplier.totalPurchases),
        outstandingBalance: Number(supplier.outstandingBalance),
        poCount: 0,
        grnCount: 0,
      };
    });
  },

  async updateSupplier(input: UpdateSupplierInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.supplier.findFirst({
        where: { id: input.id, organizationId: input.organizationId },
      });

      if (!existing) {
        throw new Error("SUPPLIER_NOT_FOUND");
      }

      const updated = await tx.supplier.update({
        where: { id: input.id },
        data: {
          ...(input.companyName
            ? { companyName: input.companyName.trim() }
            : {}),
          ...(input.contactPerson !== undefined
            ? { contactPerson: input.contactPerson?.trim() || null }
            : {}),
          ...(input.phone !== undefined
            ? { phone: input.phone?.trim() || null }
            : {}),
          ...(input.email !== undefined
            ? { email: input.email?.trim() || null }
            : {}),
          ...(input.address !== undefined
            ? { address: input.address?.trim() || null }
            : {}),
          ...(input.city !== undefined
            ? { city: input.city?.trim() || null }
            : {}),
          ...(input.taxNumber !== undefined
            ? { taxNumber: input.taxNumber?.trim() || null }
            : {}),
          ...(input.paymentTermsDays !== undefined
            ? { paymentTermsDays: Number(input.paymentTermsDays) }
            : {}),
          ...(input.creditLimit !== undefined
            ? { creditLimit: Number(input.creditLimit) }
            : {}),
          ...(input.bankDetails !== undefined
            ? { bankDetails: input.bankDetails?.trim() || null }
            : {}),
          ...(input.suppliedCategories !== undefined
            ? { suppliedCategories: input.suppliedCategories?.trim() || null }
            : {}),
          ...(input.status ? { status: input.status } : {}),
        },
        include: {
          _count: {
            select: { purchaseOrders: true, goodsReceipts: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "SUPPLIER_UPDATED",
          entity: "Supplier",
          entityId: updated.id,
          newValue: {
            companyName: updated.companyName,
            status: updated.status,
          },
        },
      });

      return {
        ...updated,
        creditLimit: Number(updated.creditLimit),
        totalPurchases: Number(updated.totalPurchases),
        outstandingBalance: Number(updated.outstandingBalance),
        poCount: updated._count.purchaseOrders,
        grnCount: updated._count.goodsReceipts,
      };
    });
  },

  async listPurchaseOrders(organizationId: string) {
    const pos = await prisma.purchaseOrder.findMany({
      where: { organizationId },
      include: {
        supplier: {
          select: { id: true, code: true, companyName: true, phone: true },
        },
        warehouse: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
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

    return pos.map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      subtotal: Number(po.subtotal),
      discountAmount: Number(po.discountAmount),
      taxAmount: Number(po.taxAmount),
      totalAmount: Number(po.totalAmount),
      expectedDeliveryAt: po.expectedDeliveryAt
        ? po.expectedDeliveryAt.toISOString()
        : null,
      notes: po.notes,
      createdAt: po.createdAt.toISOString(),
      approvedAt: po.approvedAt ? po.approvedAt.toISOString() : null,
      orderedAt: po.orderedAt ? po.orderedAt.toISOString() : null,
      receivedAt: po.receivedAt ? po.receivedAt.toISOString() : null,
      supplier: po.supplier,
      warehouse: po.warehouse,
      createdBy: po.createdBy,
      approvedBy: po.approvedBy,
      items: po.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        orderedQuantity: item.orderedQuantity,
        receivedQuantity: item.receivedQuantity,
        damagedQuantity: item.damagedQuantity,
        unitCost: Number(item.unitCost),
        taxRate: Number(item.taxRate),
        lineTotal: Number(item.lineTotal),
        product: item.product,
      })),
    }));
  },

  async createPurchaseOrder(input: CreatePurchaseOrderInput) {
    if (!input.items || input.items.length === 0) {
      throw new Error("EMPTY_PO_ITEMS");
    }

    const isManagerOrOwner =
      input.userRole === "SUPER_ADMIN" ||
      input.userRole === "OWNER" ||
      input.userRole === "MANAGER";

    const initialStatus: PurchaseOrderStatus = input.submitForApproval
      ? isManagerOrOwner
        ? "ORDERED"
        : "PENDING_APPROVAL"
      : "DRAFT";

    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.findUnique({
        where: { id: input.organizationId },
      });
      const count = await tx.purchaseOrder.count({
        where: { organizationId: input.organizationId },
      });
      const prefix = org?.purchasePrefix || "PO-";
      const poNumber = `${prefix}${String(count + 2001)}`;

      let subtotal = 0;
      let taxAmount = 0;

      const preparedItems = input.items.map((line) => {
        const qty = Math.max(1, Number(line.orderedQuantity));
        const cost = Math.max(0, Number(line.unitCost));
        const taxRate = line.taxRate !== undefined ? Number(line.taxRate) : 16.0;
        const lineSub = qty * cost;
        const lineTax = lineSub * (taxRate / 100);
        subtotal += lineSub;
        taxAmount += lineTax;

        return {
          productId: line.productId,
          orderedQuantity: qty,
          unitCost: cost,
          taxRate,
          lineTotal: lineSub + lineTax,
        };
      });

      const discountAmount = Math.max(0, Number(input.discountAmount) || 0);
      const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

      const po = await tx.purchaseOrder.create({
        data: {
          organizationId: input.organizationId,
          poNumber,
          supplierId: input.supplierId,
          warehouseId: input.warehouseId,
          status: initialStatus,
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          expectedDeliveryAt: input.expectedDeliveryAt
            ? new Date(input.expectedDeliveryAt)
            : null,
          notes: input.notes?.trim() || null,
          createdById: input.userId,
          approvedById: initialStatus === "ORDERED" ? input.userId : null,
          approvedAt: initialStatus === "ORDERED" ? new Date() : null,
          orderedAt: initialStatus === "ORDERED" ? new Date() : null,
          items: {
            create: preparedItems,
          },
        },
        include: {
          supplier: {
            select: { id: true, code: true, companyName: true, phone: true },
          },
          warehouse: { select: { id: true, code: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
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
      });

      // If PO is immediately placed on order, increment incomingStock for each product at target warehouse
      if (initialStatus === "ORDERED") {
        for (const item of preparedItems) {
          await tx.inventoryItem.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: input.warehouseId,
              },
            },
            update: {
              incomingStock: { increment: item.orderedQuantity },
            },
            create: {
              organizationId: input.organizationId,
              productId: item.productId,
              warehouseId: input.warehouseId,
              currentStock: 0,
              incomingStock: item.orderedQuantity,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "PURCHASE_ORDER_CREATED",
          entity: "PurchaseOrder",
          entityId: po.id,
          newValue: {
            poNumber: po.poNumber,
            supplier: po.supplier.companyName,
            totalAmount,
            status: po.status,
          },
        },
      });

      return po;
    });
  },

  async updatePurchaseOrderStatus(params: {
    organizationId: string;
    userId: string;
    purchaseOrderId: string;
    newStatus: PurchaseOrderStatus;
  }) {
    const { organizationId, userId, purchaseOrderId, newStatus } = params;

    return prisma.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findFirst({
        where: { id: purchaseOrderId, organizationId },
        include: { items: true, supplier: true },
      });

      if (!existing) {
        throw new Error("PO_NOT_FOUND");
      }

      // Transition to ORDERED increments incomingStock if not already ORDERED/APPROVED
      const wasOrdered =
        existing.status === "ORDERED" || existing.status === "APPROVED";
      const becomesOrdered =
        newStatus === "ORDERED" || newStatus === "APPROVED";

      if (!wasOrdered && becomesOrdered) {
        for (const item of existing.items) {
          await tx.inventoryItem.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: existing.warehouseId,
              },
            },
            update: {
              incomingStock: { increment: item.orderedQuantity },
            },
            create: {
              organizationId,
              productId: item.productId,
              warehouseId: existing.warehouseId,
              currentStock: 0,
              incomingStock: item.orderedQuantity,
            },
          });
        }
      }

      // Transition to CANCELLED reverses remaining incomingStock
      if (wasOrdered && newStatus === "CANCELLED") {
        for (const item of existing.items) {
          const remainingIncoming = Math.max(
            0,
            item.orderedQuantity - item.receivedQuantity
          );
          if (remainingIncoming > 0) {
            await tx.inventoryItem.updateMany({
              where: {
                productId: item.productId,
                warehouseId: existing.warehouseId,
                incomingStock: { gte: remainingIncoming },
              },
              data: {
                incomingStock: { decrement: remainingIncoming },
              },
            });
          }
        }
      }

      const updated = await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          status: newStatus,
          ...(becomesOrdered
            ? { approvedById: userId, approvedAt: new Date(), orderedAt: new Date() }
            : {}),
        },
        include: {
          supplier: {
            select: { id: true, code: true, companyName: true, phone: true },
          },
          warehouse: { select: { id: true, code: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
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
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          userId,
          action: `PURCHASE_ORDER_${newStatus}`,
          entity: "PurchaseOrder",
          entityId: purchaseOrderId,
          previousValue: { status: existing.status },
          newValue: { poNumber: existing.poNumber, status: newStatus },
        },
      });

      return updated;
    });
  },

  /**
   * Goods Receiving (Section 17):
   * Records actual received, damaged, and missing quantities against a Purchase Order.
   * Updates warehouse stock based strictly on receivedQuantity (not orderedQuantity),
   * creates immutable StockMovement records, and updates Supplier payable balance.
   */
  async receivePurchaseOrderGoods(input: CreateGoodsReceiptInput) {
    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findFirst({
        where: {
          id: input.purchaseOrderId,
          organizationId: input.organizationId,
        },
        include: {
          items: { include: { product: true } },
          supplier: true,
          warehouse: true,
        },
      });

      if (!po) {
        throw new Error("PO_NOT_FOUND");
      }

      if (po.status === "RECEIVED" || po.status === "CANCELLED") {
        throw new Error("PO_ALREADY_CLOSED");
      }

      const grnCount = await tx.goodsReceipt.count({
        where: { organizationId: input.organizationId },
      });
      const grnNumber = `GRN-${String(grnCount + 3001)}`;

      let totalAcceptedValue = 0;
      const grnItemsToCreate: Array<{
        productId: string;
        orderedQuantity: number;
        receivedQuantity: number;
        damagedQuantity: number;
        missingQuantity: number;
        unitCost: number;
      }> = [];

      for (const lineInput of input.items) {
        const poItem = po.items.find(
          (i) => i.productId === lineInput.productId
        );
        if (!poItem) continue;

        const receivedQty = Math.max(0, Number(lineInput.receivedQuantity) || 0);
        const damagedQty = Math.max(0, Number(lineInput.damagedQuantity) || 0);
        const missingQty = Math.max(0, Number(lineInput.missingQuantity) || 0);

        if (receivedQty === 0 && damagedQty === 0 && missingQty === 0) {
          continue;
        }

        const unitCost = Number(poItem.unitCost);
        const taxRate = Number(poItem.taxRate);
        const acceptedLineValueWithTax =
          receivedQty * unitCost * (1 + taxRate / 100);
        totalAcceptedValue += acceptedLineValueWithTax;

        grnItemsToCreate.push({
          productId: poItem.productId,
          orderedQuantity: poItem.orderedQuantity,
          receivedQuantity: receivedQty,
          damagedQuantity: damagedQty,
          missingQuantity: missingQty,
          unitCost,
        });

        // Update PurchaseOrderItem cumulative received & damaged quantities
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: {
            receivedQuantity: { increment: receivedQty },
            damagedQuantity: { increment: damagedQty },
          },
        });

        // Update Warehouse InventoryItem based strictly on actual receivedQuantity
        const existingInv = await tx.inventoryItem.findUnique({
          where: {
            productId_warehouseId: {
              productId: poItem.productId,
              warehouseId: po.warehouseId,
            },
          },
        });

        const previousQuantity = existingInv ? existingInv.currentStock : 0;
        const newQuantity = previousQuantity + receivedQty;
        const incomingDecrement = Math.min(
          existingInv?.incomingStock || 0,
          receivedQty + damagedQty + missingQty
        );

        await tx.inventoryItem.upsert({
          where: {
            productId_warehouseId: {
              productId: poItem.productId,
              warehouseId: po.warehouseId,
            },
          },
          update: {
            currentStock: newQuantity,
            damagedStock: { increment: damagedQty },
            ...(incomingDecrement > 0
              ? { incomingStock: { decrement: incomingDecrement } }
              : {}),
          },
          create: {
            organizationId: input.organizationId,
            productId: poItem.productId,
            warehouseId: po.warehouseId,
            currentStock: newQuantity,
            damagedStock: damagedQty,
            incomingStock: 0,
          },
        });

        // Create immutable StockMovement record for actual received stock
        if (receivedQty > 0) {
          await tx.stockMovement.create({
            data: {
              organizationId: input.organizationId,
              productId: poItem.productId,
              warehouseId: po.warehouseId,
              movementType: "PURCHASE_RECEIPT",
              quantity: receivedQty,
              previousQuantity,
              newQuantity,
              reference: `${grnNumber} (${po.poNumber})`,
              notes: `Goods received from ${po.supplier.companyName}${
                damagedQty > 0 ? ` (${damagedQty} damaged` : ""
              }${missingQty > 0 ? `, ${missingQty} missing)` : damagedQty > 0 ? ")" : ""}`,
              userId: input.userId,
            },
          });
        }
      }

      if (grnItemsToCreate.length === 0) {
        throw new Error("NO_ITEMS_RECEIVED");
      }

      const grn = await tx.goodsReceipt.create({
        data: {
          organizationId: input.organizationId,
          grnNumber,
          purchaseOrderId: po.id,
          supplierId: po.supplierId,
          warehouseId: po.warehouseId,
          receivedById: input.userId,
          deliveryNoteRef: input.deliveryNoteRef?.trim() || null,
          notes: input.notes?.trim() || null,
          totalAcceptedValue,
          items: {
            create: grnItemsToCreate,
          },
        },
        include: {
          purchaseOrder: { select: { id: true, poNumber: true } },
          supplier: { select: { id: true, companyName: true, code: true } },
          warehouse: { select: { id: true, name: true, code: true } },
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
      });

      // Check if all PO items are now fully accounted for
      const refreshedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: po.id },
      });

      const allFulfilled = refreshedItems.every(
        (item) =>
          item.receivedQuantity + item.damagedQuantity >= item.orderedQuantity
      );

      const newPoStatus: PurchaseOrderStatus = allFulfilled
        ? "RECEIVED"
        : "PARTIALLY_RECEIVED";

      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          status: newPoStatus,
          ...(newPoStatus === "RECEIVED" ? { receivedAt: new Date() } : {}),
        },
      });

      // Increment Supplier totalPurchases & outstandingBalance by accepted goods value
      await tx.supplier.update({
        where: { id: po.supplierId },
        data: {
          totalPurchases: { increment: totalAcceptedValue },
          outstandingBalance: { increment: totalAcceptedValue },
        },
      });

      await tx.notification.create({
        data: {
          organizationId: input.organizationId,
          type: "PURCHASING",
          title: `Goods Received: ${grnNumber} (${po.poNumber})`,
          message: `Warehouse ${po.warehouse.name} received goods from ${po.supplier.companyName}. Stock ledger and supplier payable balance updated.`,
          link: "/purchasing/receiving",
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "GOODS_RECEIVED",
          entity: "GoodsReceipt",
          entityId: grn.id,
          newValue: {
            grnNumber,
            poNumber: po.poNumber,
            totalAcceptedValue,
            poStatus: newPoStatus,
          },
        },
      });

      return grn;
    });
  },

  async listGoodsReceipts(organizationId: string) {
    const grns = await prisma.goodsReceipt.findMany({
      where: { organizationId },
      include: {
        purchaseOrder: { select: { id: true, poNumber: true, status: true } },
        supplier: { select: { id: true, companyName: true, code: true } },
        warehouse: { select: { id: true, name: true, code: true } },
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
      orderBy: { receivedAt: "desc" },
    });

    return grns.map((g) => ({
      id: g.id,
      grnNumber: g.grnNumber,
      deliveryNoteRef: g.deliveryNoteRef,
      notes: g.notes,
      totalAcceptedValue: Number(g.totalAcceptedValue),
      receivedAt: g.receivedAt.toISOString(),
      purchaseOrder: g.purchaseOrder,
      supplier: g.supplier,
      warehouse: g.warehouse,
      receivedBy: g.receivedBy,
      items: g.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        orderedQuantity: i.orderedQuantity,
        receivedQuantity: i.receivedQuantity,
        damagedQuantity: i.damagedQuantity,
        missingQuantity: i.missingQuantity,
        unitCost: Number(i.unitCost),
        product: i.product,
      })),
    }));
  },
};
