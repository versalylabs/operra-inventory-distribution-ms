import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { InventoryService } from "@/services/inventory.service";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "warehouses:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const warehouses = await InventoryService.listWarehouses(
      context.organization.id
    );
    return NextResponse.json({ warehouses });
  } catch (error) {
    console.error("List warehouses error:", error);
    return NextResponse.json(
      { error: "Failed to load warehouses." },
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

    if (!hasPermission(context.membership.role, "warehouses:manage")) {
      return NextResponse.json(
        { error: "You do not have permission to create warehouses." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      code,
      location,
      address,
      phone,
      email,
      managerId,
      isDefault,
      status,
    } = body;

    if (!name || !code || !location) {
      return NextResponse.json(
        { error: "Warehouse name, code, and location are required." },
        { status: 400 }
      );
    }

    const warehouse = await InventoryService.createWarehouse({
      organizationId: context.organization.id,
      userId: context.user.id,
      name,
      code,
      location,
      address,
      phone,
      email,
      managerId,
      isDefault,
      status,
    });

    return NextResponse.json({
      success: true,
      warehouse: {
        ...warehouse,
        skuCount: 0,
        totalUnits: 0,
        availableUnits: 0,
        reservedUnits: 0,
        damagedUnits: 0,
        totalValue: 0,
      },
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === "DUPLICATE_WAREHOUSE_CODE"
    ) {
      return NextResponse.json(
        { error: "A warehouse with this code already exists." },
        { status: 409 }
      );
    }
    console.error("Create warehouse error:", error);
    return NextResponse.json(
      { error: "Failed to create warehouse." },
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

    if (!hasPermission(context.membership.role, "warehouses:manage")) {
      return NextResponse.json(
        { error: "You do not have permission to update warehouses." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Warehouse ID is required." },
        { status: 400 }
      );
    }

    const warehouse = await InventoryService.updateWarehouse({
      id,
      organizationId: context.organization.id,
      userId: context.user.id,
      ...updates,
    });

    return NextResponse.json({ success: true, warehouse });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === "DUPLICATE_WAREHOUSE_CODE"
    ) {
      return NextResponse.json(
        { error: "Another warehouse already uses this code." },
        { status: 409 }
      );
    }
    console.error("Update warehouse error:", error);
    return NextResponse.json(
      { error: "Failed to update warehouse." },
      { status: 500 }
    );
  }
}
