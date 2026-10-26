import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { DistributionService } from "@/services/distribution.service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "deliveries:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [vehicles, warehouses] = await Promise.all([
      DistributionService.listVehicles(context.organization.id),
      prisma.warehouse.findMany({
        where: {
          organizationId: context.organization.id,
          status: "ACTIVE",
        },
        select: { id: true, code: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ vehicles, warehouses });
  } catch (error) {
    console.error("List vehicles error:", error);
    return NextResponse.json(
      { error: "Failed to load fleet vehicles." },
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

    if (!hasPermission(context.membership.role, "deliveries:manage")) {
      return NextResponse.json(
        { error: "You do not have permission to register fleet vehicles." },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body.registrationNumber || !body.makeModel) {
      return NextResponse.json(
        { error: "Vehicle registration number and make/model are required." },
        { status: 400 }
      );
    }

    const vehicle = await DistributionService.createVehicle({
      organizationId: context.organization.id,
      userId: context.user.id,
      ...body,
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    console.error("Create vehicle error:", error);
    if (
      error instanceof Error &&
      error.message.startsWith("DUPLICATE_VEHICLE_PLATE:")
    ) {
      return NextResponse.json(
        { error: error.message.split(":").slice(1).join(":") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to register vehicle." },
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

    if (!hasPermission(context.membership.role, "deliveries:manage")) {
      return NextResponse.json(
        { error: "You do not have permission to update fleet vehicles." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Vehicle ID is required." },
        { status: 400 }
      );
    }

    const vehicle = await DistributionService.updateVehicle({
      id,
      organizationId: context.organization.id,
      userId: context.user.id,
      ...updates,
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    console.error("Update vehicle error:", error);
    return NextResponse.json(
      { error: "Failed to update vehicle." },
      { status: 500 }
    );
  }
}
