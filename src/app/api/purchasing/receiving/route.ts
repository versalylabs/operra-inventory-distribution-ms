import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { PurchaseService } from "@/services/purchase.service";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "purchasing:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const receipts = await PurchaseService.listGoodsReceipts(
      context.organization.id
    );
    return NextResponse.json({ receipts });
  } catch (error) {
    console.error("List GRNs error:", error);
    return NextResponse.json(
      { error: "Failed to load goods receipts." },
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

    if (!hasPermission(context.membership.role, "purchasing:receive")) {
      return NextResponse.json(
        { error: "You do not have permission to receive goods into warehouse stock." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { purchaseOrderId, deliveryNoteRef, notes, items } = body;

    if (!purchaseOrderId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Purchase order and received item quantities are required." },
        { status: 400 }
      );
    }

    const grn = await PurchaseService.receivePurchaseOrderGoods({
      organizationId: context.organization.id,
      userId: context.user.id,
      purchaseOrderId,
      deliveryNoteRef,
      notes,
      items,
    });

    return NextResponse.json({
      success: true,
      receipt: {
        ...grn,
        totalAcceptedValue: Number(grn.totalAcceptedValue),
        receivedAt: grn.receivedAt.toISOString(),
        items: grn.items.map((i) => ({
          ...i,
          unitCost: Number(i.unitCost),
        })),
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "PO_ALREADY_CLOSED") {
        return NextResponse.json(
          { error: "This Purchase Order has already been fully received or cancelled." },
          { status: 400 }
        );
      }
      if (error.message === "NO_ITEMS_RECEIVED") {
        return NextResponse.json(
          { error: "Please enter a non-zero received, damaged, or missing quantity." },
          { status: 400 }
        );
      }
    }
    console.error("Receive goods error:", error);
    return NextResponse.json(
      { error: "Failed to record goods receipt." },
      { status: 500 }
    );
  }
}
