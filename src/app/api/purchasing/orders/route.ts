import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { PurchaseService } from "@/services/purchase.service";
import { PurchaseOrderStatus } from "@prisma/client";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "purchasing:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orders = await PurchaseService.listPurchaseOrders(
      context.organization.id
    );
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("List POs error:", error);
    return NextResponse.json(
      { error: "Failed to load purchase orders." },
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

    if (!hasPermission(context.membership.role, "purchasing:create")) {
      return NextResponse.json(
        { error: "You do not have permission to create purchase orders." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      supplierId,
      warehouseId,
      expectedDeliveryAt,
      discountAmount,
      notes,
      submitForApproval,
      items,
    } = body;

    if (!supplierId || !warehouseId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error:
            "Supplier, destination warehouse, and at least one product line item are required.",
        },
        { status: 400 }
      );
    }

    const po = await PurchaseService.createPurchaseOrder({
      organizationId: context.organization.id,
      userId: context.user.id,
      userRole: context.membership.role,
      supplierId,
      warehouseId,
      expectedDeliveryAt,
      discountAmount,
      notes,
      submitForApproval,
      items,
    });

    return NextResponse.json({
      success: true,
      order: {
        ...po,
        subtotal: Number(po.subtotal),
        discountAmount: Number(po.discountAmount),
        taxAmount: Number(po.taxAmount),
        totalAmount: Number(po.totalAmount),
        expectedDeliveryAt: po.expectedDeliveryAt
          ? po.expectedDeliveryAt.toISOString()
          : null,
        createdAt: po.createdAt.toISOString(),
        approvedAt: po.approvedAt ? po.approvedAt.toISOString() : null,
        orderedAt: po.orderedAt ? po.orderedAt.toISOString() : null,
        receivedAt: po.receivedAt ? po.receivedAt.toISOString() : null,
        items: po.items.map((item) => ({
          ...item,
          unitCost: Number(item.unitCost),
          taxRate: Number(item.taxRate),
          lineTotal: Number(item.lineTotal),
        })),
      },
    });
  } catch (error) {
    console.error("Create PO error:", error);
    return NextResponse.json(
      { error: "Failed to create purchase order." },
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

    if (!hasPermission(context.membership.role, "purchasing:approve")) {
      return NextResponse.json(
        { error: "You do not have permission to approve or update PO statuses." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { purchaseOrderId, status } = body;

    if (!purchaseOrderId || !status) {
      return NextResponse.json(
        { error: "Purchase Order ID and target status are required." },
        { status: 400 }
      );
    }

    const updated = await PurchaseService.updatePurchaseOrderStatus({
      organizationId: context.organization.id,
      userId: context.user.id,
      purchaseOrderId,
      newStatus: status as PurchaseOrderStatus,
    });

    return NextResponse.json({
      success: true,
      order: {
        ...updated,
        subtotal: Number(updated.subtotal),
        discountAmount: Number(updated.discountAmount),
        taxAmount: Number(updated.taxAmount),
        totalAmount: Number(updated.totalAmount),
        expectedDeliveryAt: updated.expectedDeliveryAt
          ? updated.expectedDeliveryAt.toISOString()
          : null,
        createdAt: updated.createdAt.toISOString(),
        approvedAt: updated.approvedAt ? updated.approvedAt.toISOString() : null,
        orderedAt: updated.orderedAt ? updated.orderedAt.toISOString() : null,
        receivedAt: updated.receivedAt ? updated.receivedAt.toISOString() : null,
        items: updated.items.map((item) => ({
          ...item,
          unitCost: Number(item.unitCost),
          taxRate: Number(item.taxRate),
          lineTotal: Number(item.lineTotal),
        })),
      },
    });
  } catch (error) {
    console.error("Update PO status error:", error);
    return NextResponse.json(
      { error: "Failed to update purchase order status." },
      { status: 500 }
    );
  }
}
