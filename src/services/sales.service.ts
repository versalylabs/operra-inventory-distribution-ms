import { prisma } from "@/lib/prisma";
import { CustomerStatus, CustomerType, SalesOrderStatus, UserRole } from "@prisma/client";

export interface CreateCustomerInput {
  organizationId: string;
  userId: string;
  businessName: string;
  code?: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  deliveryAddress?: string | null;
  customerType?: CustomerType;
  taxNumber?: string | null;
  paymentTermsDays?: number;
  creditLimit?: number;
  salesRepId?: string | null;
  status?: CustomerStatus;
  notes?: string | null;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  id: string;
  organizationId: string;
  userId: string;
}

export interface SalesOrderLineInput {
  productId: string;
  orderedQuantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
}

export interface CreateSalesOrderInput {
  organizationId: string;
  userId: string;
  userRole: UserRole;
  customerId: string;
  warehouseId: string;
  salesPersonId?: string;
  deliveryAddress?: string | null;
  expectedDeliveryAt?: string | null;
  discountAmount?: number;
  notes?: string | null;
  confirmImmediately?: boolean;
  items: SalesOrderLineInput[];
}

export const SalesService = {
  async listCustomers(organizationId: string) {
    const customers = await prisma.customer.findMany({
      where: { organizationId },
      include: {
        salesRep: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            salesOrders: true,
          },
        },
      },
      orderBy: { businessName: "asc" },
    });

    return customers.map((c) => {
      const creditLimit = Number(c.creditLimit);
      const outstandingBalance = Number(c.outstandingBalance);
      const creditUtilizationPct =
        creditLimit > 0
          ? Math.min(100, Math.round((outstandingBalance / creditLimit) * 100))
          : 0;

      return {
        id: c.id,
        code: c.code,
        businessName: c.businessName,
        contactPerson: c.contactPerson,
        phone: c.phone,
        email: c.email,
        address: c.address,
        city: c.city,
        deliveryAddress: c.deliveryAddress,
        customerType: c.customerType,
        taxNumber: c.taxNumber,
        paymentTermsDays: c.paymentTermsDays,
        creditLimit,
        totalPurchases: Number(c.totalPurchases),
        outstandingBalance,
        creditUtilizationPct,
        salesRepId: c.salesRepId,
        salesRep: c.salesRep,
        status: c.status,
        notes: c.notes,
        orderCount: c._count.salesOrders,
      };
    });
  },

  async createCustomer(input: CreateCustomerInput) {
    return prisma.$transaction(async (tx) => {
      const count = await tx.customer.count({
        where: { organizationId: input.organizationId },
      });

      const code = input.code
        ? input.code.trim().toUpperCase()
        : `CUS-${String(count + 101)}`;

      const customer = await tx.customer.create({
        data: {
          organizationId: input.organizationId,
          code,
          businessName: input.businessName.trim(),
          contactPerson: input.contactPerson?.trim() || null,
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          address: input.address?.trim() || null,
          city: input.city?.trim() || "Nairobi",
          deliveryAddress:
            input.deliveryAddress?.trim() || input.address?.trim() || null,
          customerType: input.customerType || "WHOLESALE",
          taxNumber: input.taxNumber?.trim() || null,
          paymentTermsDays:
            input.paymentTermsDays !== undefined
              ? Number(input.paymentTermsDays)
              : 14,
          creditLimit:
            input.creditLimit !== undefined ? Number(input.creditLimit) : 250000,
          salesRepId: input.salesRepId || input.userId,
          status: input.status || "ACTIVE",
          notes: input.notes?.trim() || null,
        },
        include: {
          salesRep: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "CUSTOMER_CREATED",
          entity: "Customer",
          entityId: customer.id,
          newValue: {
            code: customer.code,
            businessName: customer.businessName,
            customerType: customer.customerType,
            creditLimit: Number(customer.creditLimit),
          },
        },
      });

      return {
        ...customer,
        creditLimit: Number(customer.creditLimit),
        totalPurchases: Number(customer.totalPurchases),
        outstandingBalance: Number(customer.outstandingBalance),
        creditUtilizationPct: 0,
        orderCount: 0,
      };
    });
  },

  async updateCustomer(input: UpdateCustomerInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.customer.findFirst({
        where: { id: input.id, organizationId: input.organizationId },
      });

      if (!existing) {
        throw new Error("CUSTOMER_NOT_FOUND");
      }

      const updated = await tx.customer.update({
        where: { id: input.id },
        data: {
          ...(input.businessName
            ? { businessName: input.businessName.trim() }
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
          ...(input.deliveryAddress !== undefined
            ? { deliveryAddress: input.deliveryAddress?.trim() || null }
            : {}),
          ...(input.customerType ? { customerType: input.customerType } : {}),
          ...(input.taxNumber !== undefined
            ? { taxNumber: input.taxNumber?.trim() || null }
            : {}),
          ...(input.paymentTermsDays !== undefined
            ? { paymentTermsDays: Number(input.paymentTermsDays) }
            : {}),
          ...(input.creditLimit !== undefined
            ? { creditLimit: Number(input.creditLimit) }
            : {}),
          ...(input.salesRepId !== undefined
            ? { salesRepId: input.salesRepId || null }
            : {}),
          ...(input.status ? { status: input.status } : {}),
          ...(input.notes !== undefined
            ? { notes: input.notes?.trim() || null }
            : {}),
        },
        include: {
          salesRep: { select: { id: true, name: true, email: true } },
          _count: { select: { salesOrders: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "CUSTOMER_UPDATED",
          entity: "Customer",
          entityId: updated.id,
          newValue: {
            businessName: updated.businessName,
            customerType: updated.customerType,
            status: updated.status,
            creditLimit: Number(updated.creditLimit),
          },
        },
      });

      const creditLimit = Number(updated.creditLimit);
      const outstandingBalance = Number(updated.outstandingBalance);

      return {
        ...updated,
        creditLimit,
        totalPurchases: Number(updated.totalPurchases),
        outstandingBalance,
        creditUtilizationPct:
          creditLimit > 0
            ? Math.min(100, Math.round((outstandingBalance / creditLimit) * 100))
            : 0,
        orderCount: updated._count.salesOrders,
      };
    });
  },

  async listSalesOrders(organizationId: string) {
    const orders = await prisma.salesOrder.findMany({
      where: { organizationId },
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            businessName: true,
            customerType: true,
            phone: true,
            city: true,
            creditLimit: true,
            outstandingBalance: true,
          },
        },
        warehouse: {
          select: { id: true, code: true, name: true },
        },
        salesPerson: {
          select: { id: true, name: true },
        },
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

    return orders.map((o) => {
      const totalOrderedUnits = o.items.reduce(
        (sum, i) => sum + i.orderedQuantity,
        0
      );
      const totalDeliveredUnits = o.items.reduce(
        (sum, i) => sum + i.deliveredQuantity,
        0
      );

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        customerId: o.customerId,
        customer: {
          ...o.customer,
          creditLimit: Number(o.customer.creditLimit),
          outstandingBalance: Number(o.customer.outstandingBalance),
        },
        warehouseId: o.warehouseId,
        warehouse: o.warehouse,
        salesPersonId: o.salesPersonId,
        salesPerson: o.salesPerson,
        status: o.status,
        subtotal: Number(o.subtotal),
        discountAmount: Number(o.discountAmount),
        taxAmount: Number(o.taxAmount),
        totalAmount: Number(o.totalAmount),
        deliveryAddress: o.deliveryAddress,
        expectedDeliveryAt: o.expectedDeliveryAt?.toISOString() || null,
        notes: o.notes,
        stockReserved: o.stockReserved,
        confirmedAt: o.confirmedAt?.toISOString() || null,
        deliveredAt: o.deliveredAt?.toISOString() || null,
        createdAt: o.createdAt.toISOString(),
        totalOrderedUnits,
        totalDeliveredUnits,
        fulfillmentPct:
          totalOrderedUnits > 0
            ? Math.min(
                100,
                Math.round((totalDeliveredUnits / totalOrderedUnits) * 100)
              )
            : 0,
        items: o.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          unitOfMeasure: item.product.unitOfMeasure,
          orderedQuantity: item.orderedQuantity,
          deliveredQuantity: item.deliveredQuantity,
          remainingQuantity: Math.max(
            0,
            item.orderedQuantity - item.deliveredQuantity
          ),
          unitPrice: Number(item.unitPrice),
          discountAmount: Number(item.discountAmount),
          taxRate: Number(item.taxRate),
          lineTotal: Number(item.lineTotal),
        })),
      };
    });
  },

  async createSalesOrder(input: CreateSalesOrderInput) {
    if (!input.items || input.items.length === 0) {
      throw new Error("EMPTY_ORDER_ITEMS");
    }

    return prisma.$transaction(async (tx) => {
      const [org, customer, warehouse] = await Promise.all([
        tx.organization.findUnique({ where: { id: input.organizationId } }),
        tx.customer.findFirst({
          where: { id: input.customerId, organizationId: input.organizationId },
        }),
        tx.warehouse.findFirst({
          where: { id: input.warehouseId, organizationId: input.organizationId },
        }),
      ]);

      if (!org || !customer || !warehouse) {
        throw new Error("INVALID_CUSTOMER_OR_WAREHOUSE");
      }

      if (customer.status !== "ACTIVE" && input.confirmImmediately) {
        throw new Error(
          `CUSTOMER_NOT_ACTIVE:Cannot confirm an order for a customer whose account status is ${customer.status}.`
        );
      }

      const count = await tx.salesOrder.count({
        where: { organizationId: input.organizationId },
      });

      const year = new Date().getFullYear();
      const prefix = org.orderPrefix || "ORD-";
      const orderNumber = `${prefix}${year}-${String(count + 1).padStart(4, "0")}`;

      let subtotal = 0;
      let taxAmount = 0;

      const preparedItems = input.items.map((line) => {
        const qty = Math.max(1, Math.round(Number(line.orderedQuantity)));
        const price = Math.max(0, Number(line.unitPrice));
        const lineDiscount = Math.max(0, Number(line.discountAmount || 0));
        const taxRate =
          line.taxRate !== undefined ? Number(line.taxRate) : 16;

        const netLine = Math.max(0, qty * price - lineDiscount);
        const lineTax = (netLine * taxRate) / 100;
        const lineTotal = netLine + lineTax;

        subtotal += netLine;
        taxAmount += lineTax;

        return {
          productId: line.productId,
          orderedQuantity: qty,
          unitPrice: price,
          discountAmount: lineDiscount,
          taxRate,
          lineTotal,
        };
      });

      const orderDiscount = Math.max(0, Number(input.discountAmount || 0));
      const totalAmount = Math.max(0, subtotal - orderDiscount + taxAmount);

      // If confirming immediately, validate credit limit & reserve stock
      if (input.confirmImmediately) {
        const creditLimit = Number(customer.creditLimit);
        const currentBalance = Number(customer.outstandingBalance);
        if (creditLimit > 0 && currentBalance + totalAmount > creditLimit) {
          throw new Error(
            `CREDIT_LIMIT_EXCEEDED:Order total (KES ${totalAmount.toLocaleString()}) would push ${customer.businessName} above their credit limit of KES ${creditLimit.toLocaleString()} (Current balance: KES ${currentBalance.toLocaleString()}). Save as Draft or increase credit limit.`
          );
        }

        // Validate and reserve stock in the selected warehouse
        for (const item of preparedItems) {
          const product = await tx.product.findFirst({
            where: {
              id: item.productId,
              organizationId: input.organizationId,
            },
          });

          if (!product) {
            throw new Error("PRODUCT_NOT_FOUND");
          }

          const inv = await tx.inventoryItem.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: input.warehouseId,
              },
            },
          });

          const currentStock = inv?.currentStock ?? 0;
          const reservedStock = inv?.reservedStock ?? 0;
          const availableStock = currentStock - reservedStock;

          if (!org.allowNegativeStock && availableStock < item.orderedQuantity) {
            throw new Error(
              `INSUFFICIENT_AVAILABLE_STOCK:${product.name} (${product.sku}) only has ${availableStock} available units in ${warehouse.name} (${currentStock} on hand, ${reservedStock} already reserved). Requested: ${item.orderedQuantity}.`
            );
          }

          await tx.inventoryItem.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: input.warehouseId,
              },
            },
            create: {
              organizationId: input.organizationId,
              productId: item.productId,
              warehouseId: input.warehouseId,
              currentStock: 0,
              reservedStock: item.orderedQuantity,
            },
            update: {
              reservedStock: {
                increment: item.orderedQuantity,
              },
            },
          });
        }
      }

      const initialStatus: SalesOrderStatus = input.confirmImmediately
        ? "CONFIRMED"
        : "DRAFT";

      const order = await tx.salesOrder.create({
        data: {
          organizationId: input.organizationId,
          orderNumber,
          customerId: input.customerId,
          warehouseId: input.warehouseId,
          salesPersonId: input.salesPersonId || input.userId,
          status: initialStatus,
          subtotal,
          discountAmount: orderDiscount,
          taxAmount,
          totalAmount,
          deliveryAddress:
            input.deliveryAddress?.trim() ||
            customer.deliveryAddress ||
            customer.address ||
            null,
          expectedDeliveryAt: input.expectedDeliveryAt
            ? new Date(input.expectedDeliveryAt)
            : null,
          notes: input.notes?.trim() || null,
          stockReserved: Boolean(input.confirmImmediately),
          confirmedAt: input.confirmImmediately ? new Date() : null,
          items: {
            create: preparedItems,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: "SALES_ORDER_CREATED",
          entity: "SalesOrder",
          entityId: order.id,
          newValue: {
            orderNumber: order.orderNumber,
            customer: customer.businessName,
            status: order.status,
            totalAmount,
            stockReserved: order.stockReserved,
          },
        },
      });

      if (input.confirmImmediately) {
        await tx.notification.create({
          data: {
            organizationId: input.organizationId,
            type: "SALES_ORDER",
            title: `Sales Order ${order.orderNumber} Confirmed`,
            message: `${customer.businessName} order for KES ${totalAmount.toLocaleString()} confirmed and stock reserved at ${warehouse.name}.`,
            link: "/sales/orders",
          },
        });
      }

      return order;
    });
  },

  async updateSalesOrderStatus(input: {
    organizationId: string;
    userId: string;
    salesOrderId: string;
    status: SalesOrderStatus;
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findFirst({
        where: {
          id: input.salesOrderId,
          organizationId: input.organizationId,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
          warehouse: true,
          organization: true,
        },
      });

      if (!order) {
        throw new Error("SALES_ORDER_NOT_FOUND");
      }

      if (order.status === "DELIVERED" || order.status === "CANCELLED") {
        throw new Error("ORDER_ALREADY_FINALIZED");
      }

      let stockReserved = order.stockReserved;

      // Case 1: Transitioning from DRAFT -> CONFIRMED (or PROCESSING) where stock is not yet reserved
      if (
        !order.stockReserved &&
        (input.status === "CONFIRMED" ||
          input.status === "PROCESSING" ||
          input.status === "READY_FOR_DELIVERY")
      ) {
        if (order.customer.status !== "ACTIVE") {
          throw new Error(
            `CUSTOMER_NOT_ACTIVE:Cannot confirm order for customer with status ${order.customer.status}.`
          );
        }

        const creditLimit = Number(order.customer.creditLimit);
        const currentBalance = Number(order.customer.outstandingBalance);
        const orderTotal = Number(order.totalAmount);

        if (creditLimit > 0 && currentBalance + orderTotal > creditLimit) {
          throw new Error(
            `CREDIT_LIMIT_EXCEEDED:Order total (KES ${orderTotal.toLocaleString()}) exceeds available credit limit for ${order.customer.businessName}.`
          );
        }

        for (const item of order.items) {
          const inv = await tx.inventoryItem.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: order.warehouseId,
              },
            },
          });

          const currentStock = inv?.currentStock ?? 0;
          const reservedStock = inv?.reservedStock ?? 0;
          const availableStock = currentStock - reservedStock;

          if (
            !order.organization.allowNegativeStock &&
            availableStock < item.orderedQuantity
          ) {
            throw new Error(
              `INSUFFICIENT_AVAILABLE_STOCK:${item.product.name} (${item.product.sku}) only has ${availableStock} available units in ${order.warehouse.name}. Requested: ${item.orderedQuantity}.`
            );
          }

          await tx.inventoryItem.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: order.warehouseId,
              },
            },
            create: {
              organizationId: input.organizationId,
              productId: item.productId,
              warehouseId: order.warehouseId,
              currentStock: 0,
              reservedStock: item.orderedQuantity,
            },
            update: {
              reservedStock: {
                increment: item.orderedQuantity,
              },
            },
          });
        }

        stockReserved = true;
      }

      // Case 2: Transitioning to DELIVERED (deduct physical stock, release reservation, create SALE StockMovements, update Customer balance)
      if (input.status === "DELIVERED") {
        for (const item of order.items) {
          const remainingToDeliver = Math.max(
            0,
            item.orderedQuantity - item.deliveredQuantity
          );
          if (remainingToDeliver === 0) continue;

          const inv = await tx.inventoryItem.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: order.warehouseId,
              },
            },
          });

          const previousStock = inv?.currentStock ?? 0;
          const currentReserved = inv?.reservedStock ?? 0;
          const newStock = previousStock - remainingToDeliver;

          if (!order.organization.allowNegativeStock && newStock < 0) {
            throw new Error(
              `INSUFFICIENT_AVAILABLE_STOCK:Cannot deliver ${remainingToDeliver} units of ${item.product.name}; only ${previousStock} units physically on hand in ${order.warehouse.name}.`
            );
          }

          const newReserved = order.stockReserved
            ? Math.max(0, currentReserved - remainingToDeliver)
            : currentReserved;

          await tx.inventoryItem.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: order.warehouseId,
              },
            },
            create: {
              organizationId: input.organizationId,
              productId: item.productId,
              warehouseId: order.warehouseId,
              currentStock: newStock,
              reservedStock: 0,
            },
            update: {
              currentStock: newStock,
              reservedStock: newReserved,
            },
          });

          await tx.salesOrderItem.update({
            where: { id: item.id },
            data: {
              deliveredQuantity: item.orderedQuantity,
            },
          });

          await tx.stockMovement.create({
            data: {
              organizationId: input.organizationId,
              productId: item.productId,
              warehouseId: order.warehouseId,
              movementType: "SALE",
              quantity: -remainingToDeliver,
              previousQuantity: previousStock,
              newQuantity: newStock,
              reference: order.orderNumber,
              notes: `Fulfilled Sales Order ${order.orderNumber} for ${order.customer.businessName}`,
              userId: input.userId,
            },
          });

          // Low stock alert check
          if (newStock <= item.product.reorderLevel) {
            await tx.notification.create({
              data: {
                organizationId: input.organizationId,
                type: "LOW_STOCK",
                title: `Low Stock Alert: ${item.product.name}`,
                message: `${item.product.name} (${item.product.sku}) dropped to ${newStock} ${item.product.unitOfMeasure}s at ${order.warehouse.name} (Reorder level: ${item.product.reorderLevel}).`,
                link: "/inventory/stock",
              },
            });
          }
        }

        // Increment customer total purchases & outstanding balance
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalPurchases: {
              increment: Number(order.totalAmount),
            },
            outstandingBalance: {
              increment: Number(order.totalAmount),
            },
          },
        });

        stockReserved = false;
      }

      // Case 3: Transitioning to CANCELLED (release reserved stock if it was reserved)
      if (input.status === "CANCELLED" && order.stockReserved) {
        for (const item of order.items) {
          const remainingReserved = Math.max(
            0,
            item.orderedQuantity - item.deliveredQuantity
          );
          if (remainingReserved === 0) continue;

          const inv = await tx.inventoryItem.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: order.warehouseId,
              },
            },
          });

          if (inv) {
            await tx.inventoryItem.update({
              where: { id: inv.id },
              data: {
                reservedStock: Math.max(0, inv.reservedStock - remainingReserved),
              },
            });
          }
        }

        stockReserved = false;
      }

      const updated = await tx.salesOrder.update({
        where: { id: order.id },
        data: {
          status: input.status,
          stockReserved,
          ...(input.status === "CONFIRMED" && !order.confirmedAt
            ? { confirmedAt: new Date() }
            : {}),
          ...(input.status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: `SALES_ORDER_${input.status}`,
          entity: "SalesOrder",
          entityId: order.id,
          previousValue: {
            status: order.status,
            stockReserved: order.stockReserved,
          },
          newValue: {
            status: input.status,
            stockReserved,
            orderNumber: order.orderNumber,
          },
        },
      });

      return updated;
    });
  },
};
