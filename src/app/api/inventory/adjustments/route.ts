import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { InventoryService } from "@/services/inventory.service";
import { AdjustmentReason } from "@prisma/client";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "inventory:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adjustments = await InventoryService.listStockAdjustments(
      context.organization.id
    );
    return NextResponse.json({ adjustments });
  } catch (error) {
    console.error("List adjustments error:", error);
    return NextResponse.json(
      { error: "Failed to load stock adjustments." },
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

    if (!hasPermission(context.membership.role, "inventory:adjust")) {
      return NextResponse.json(
        { error: "You do not have permission to adjust inventory stock." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { productId, warehouseId, quantityDelta, reason, notes } = body;

    if (!productId || !warehouseId || !quantityDelta || !reason) {
      return NextResponse.json(
        {
          error:
            "Product, warehouse, non-zero quantity adjustment, and reason are required.",
        },
        { status: 400 }
      );
    }

    const adjustment = await InventoryService.createStockAdjustment({
      organizationId: context.organization.id,
      userId: context.user.id,
      userRole: context.membership.role,
      productId,
      warehouseId,
      quantityDelta: Number(quantityDelta),
      reason: reason as AdjustmentReason,
      notes,
    });

    return NextResponse.json({
      success: true,
      adjustment: {
        ...adjustment,
        createdAt: adjustment.createdAt.toISOString(),
        approvedAt: adjustment.approvedAt
          ? adjustment.approvedAt.toISOString()
          : null,
        product: {
          ...adjustment.product,
          costPrice: Number(adjustment.product.costPrice),
        },
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "NEGATIVE_STOCK_NOT_ALLOWED") {
        return NextResponse.json(
          {
            error:
              "Adjustment rejected: Resulting stock would be negative, and negative inventory is disabled for this organization.",
          },
          { status: 400 }
        );
      }
      if (error.message === "ZERO_QUANTITY_ADJUSTMENT") {
        return NextResponse.json(
          { error: "Adjustment quantity must be greater than or less than 0." },
          { status: 400 }
        );
      }
    }
    console.error("Create adjustment error:", error);
    return NextResponse.json(
      { error: "Failed to process stock adjustment." },
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

    const isManagerOrOwner =
      context.membership.role === "SUPER_ADMIN" ||
      context.membership.role === "OWNER" ||
      context.membership.role === "MANAGER";

    if (!isManagerOrOwner) {
      return NextResponse.json(
        { error: "Only Managers and Organization Owners can approve sensitive adjustments." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { adjustmentId, decision } = body;

    if (!adjustmentId || (decision !== "APPROVED" && decision !== "REJECTED")) {
      return NextResponse.json(
        { error: "Adjustment ID and valid decision are required." },
        { status: 400 }
      );
    }

    const updated = await InventoryService.reviewStockAdjustment({
      organizationId: context.organization.id,
      userId: context.user.id,
      adjustmentId,
      decision,
    });

    return NextResponse.json({
      success: true,
      adjustment: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        approvedAt: updated.approvedAt ? updated.approvedAt.toISOString() : null,
        product: {
          ...updated.product,
          costPrice: Number(updated.product.costPrice),
        },
      },
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === "NEGATIVE_STOCK_NOT_ALLOWED"
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot approve adjustment: Current warehouse stock is insufficient and negative stock is disabled.",
        },
        { status: 400 }
      );
    }
    console.error("Review adjustment error:", error);
    return NextResponse.json(
      { error: "Failed to review stock adjustment." },
      { status: 500 }
    );
  }
}
