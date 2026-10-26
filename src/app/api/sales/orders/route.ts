import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { SalesService } from "@/services/sales.service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "sales:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [orders, customers, warehouses, products] = await Promise.all([
      SalesService.listSalesOrders(context.organization.id),
      SalesService.listCustomers(context.organization.id),
      prisma.warehouse.findMany({
        where: {
          organizationId: context.organization.id,
          status: "ACTIVE",
        },
        select: { id: true, code: true, name: true, isDefault: true },
        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      }),
      prisma.product.findMany({
        where: {
          organizationId: context.organization.id,
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          sku: true,
          unitOfMeasure: true,
          sellingPrice: true,
          wholesalePrice: true,
          taxRate: true,
          inventoryItems: {
            select: {
              warehouseId: true,
              currentStock: true,
              reservedStock: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      orders,
      customers,
      warehouses,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        unitOfMeasure: p.unitOfMeasure,
        sellingPrice: Number(p.sellingPrice),
        wholesalePrice: p.wholesalePrice
          ? Number(p.wholesalePrice)
          : Number(p.sellingPrice),
        taxRate: Number(p.taxRate),
        stockByWarehouse: p.inventoryItems.map((inv) => ({
          warehouseId: inv.warehouseId,
          currentStock: inv.currentStock,
          reservedStock: inv.reservedStock,
          availableStock: Math.max(0, inv.currentStock - inv.reservedStock),
        })),
      })),
    });
  } catch (error) {
    console.error("List sales orders error:", error);
    return NextResponse.json(
      { error: "Failed to load sales orders." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "sales:create")) {
      return NextResponse.json(
        { error: "You do not have permission to create sales orders." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      customerId,
      warehouseId,
      deliveryAddress,
      expectedDeliveryAt,
      discountAmount,
      notes,
      confirmImmediately,
      items,
    } = body;

    if (!customerId || !warehouseId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Customer, dispatch warehouse, and at least one product line item are required." },
        { status: 400 }
      );
    }

    const order = await SalesService.createSalesOrder({
      organizationId: context.organization.id,
      userId: context.user.id,
      userRole: context.membership.role,
      customerId,
      warehouseId,
      deliveryAddress,
      expectedDeliveryAt,
      discountAmount,
      notes,
      confirmImmediately: Boolean(confirmImmediately),
      items,
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Create sales order error:", error);
    if (error instanceof Error) {
      if (
        error.message.startsWith("INSUFFICIENT_AVAILABLE_STOCK:") ||
        error.message.startsWith("CREDIT_LIMIT_EXCEEDED:") ||
        error.message.startsWith("CUSTOMER_NOT_ACTIVE:")
      ) {
        const message = error.message.split(":").slice(1).join(":");
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }
    return NextResponse.json(
      { error: "Failed to create sales order." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !hasPermission(context.membership.role, "sales:create") &&
      !hasPermission(context.membership.role, "sales:approve") &&
      !hasPermission(context.membership.role, "inventory:view")
    ) {
      return NextResponse.json(
        { error: "You do not have permission to update sales order status." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { salesOrderId, status } = body;

    if (!salesOrderId || !status) {
      return NextResponse.json(
        { error: "Sales Order ID and target status are required." },
        { status: 400 }
      );
    }

    const updated = await SalesService.updateSalesOrderStatus({
      organizationId: context.organization.id,
      userId: context.user.id,
      salesOrderId,
      status,
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error("Update sales order status error:", error);
    if (error instanceof Error) {
      if (
        error.message.startsWith("INSUFFICIENT_AVAILABLE_STOCK:") ||
        error.message.startsWith("CREDIT_LIMIT_EXCEEDED:") ||
        error.message.startsWith("CUSTOMER_NOT_ACTIVE:")
      ) {
        const message = error.message.split(":").slice(1).join(":");
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }
    return NextResponse.json(
      { error: "Failed to update sales order status." },
      { status: 500 }
    );
  }
}
