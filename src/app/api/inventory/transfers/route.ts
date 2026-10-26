import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { InventoryService } from "@/services/inventory.service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "inventory:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [transfers, warehouses, products] = await Promise.all([
      InventoryService.listStockTransfers(context.organization.id),
      prisma.warehouse.findMany({
        where: {
          organizationId: context.organization.id,
          status: "ACTIVE",
        },
        select: {
          id: true,
          code: true,
          name: true,
          location: true,
          isDefault: true,
        },
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
          costPrice: true,
          inventoryItems: {
            select: {
              warehouseId: true,
              currentStock: true,
              reservedStock: true,
              incomingStock: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      transfers,
      warehouses,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        unitOfMeasure: p.unitOfMeasure,
        costPrice: Number(p.costPrice),
        stockByWarehouse: p.inventoryItems.map((inv) => ({
          warehouseId: inv.warehouseId,
          currentStock: inv.currentStock,
          reservedStock: inv.reservedStock,
          incomingStock: inv.incomingStock,
          availableStock: Math.max(0, inv.currentStock - inv.reservedStock),
        })),
      })),
    });
  } catch (error) {
    console.error("List stock transfers error:", error);
    return NextResponse.json(
      { error: "Failed to load stock transfers." },
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

    if (!hasPermission(context.membership.role, "inventory:transfer")) {
      return NextResponse.json(
        { error: "You do not have permission to initiate stock transfers." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      sourceWarehouseId,
      destinationWarehouseId,
      driverName,
      vehicleRef,
      notes,
      dispatchImmediately,
      items,
    } = body;

    if (
      !sourceWarehouseId ||
      !destinationWarehouseId ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Source warehouse, destination warehouse, and at least one product line item are required.",
        },
        { status: 400 }
      );
    }

    const transfer = await InventoryService.createStockTransfer({
      organizationId: context.organization.id,
      userId: context.user.id,
      userRole: context.membership.role,
      sourceWarehouseId,
      destinationWarehouseId,
      driverName,
      vehicleRef,
      notes,
      dispatchImmediately: Boolean(dispatchImmediately),
      items,
    });

    return NextResponse.json({ success: true, transfer });
  } catch (error) {
    console.error("Create stock transfer error:", error);
    if (error instanceof Error) {
      if (
        error.message.startsWith("SAME_WAREHOUSE_TRANSFER:") ||
        error.message.startsWith("INSUFFICIENT_SOURCE_STOCK:")
      ) {
        const message = error.message.split(":").slice(1).join(":");
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }
    return NextResponse.json(
      { error: "Failed to create stock transfer." },
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

    if (!hasPermission(context.membership.role, "inventory:transfer")) {
      return NextResponse.json(
        { error: "You do not have permission to update stock transfers." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { transferId, action, driverName, vehicleRef, receivedItems } = body;

    if (!transferId || !action) {
      return NextResponse.json(
        { error: "Transfer ID and action are required." },
        { status: 400 }
      );
    }

    const updated = await InventoryService.updateStockTransferStatus({
      organizationId: context.organization.id,
      userId: context.user.id,
      transferId,
      action,
      driverName,
      vehicleRef,
      receivedItems,
    });

    return NextResponse.json({ success: true, transfer: updated });
  } catch (error) {
    console.error("Update stock transfer error:", error);
    if (error instanceof Error) {
      if (
        error.message.startsWith("INSUFFICIENT_SOURCE_STOCK:") ||
        error.message.startsWith("CANNOT_CANCEL_IN_TRANSIT:")
      ) {
        const message = error.message.split(":").slice(1).join(":");
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }
    return NextResponse.json(
      { error: "Failed to update stock transfer." },
      { status: 500 }
    );
  }
}
