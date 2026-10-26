import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { DistributionService } from "@/services/distribution.service";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "deliveries:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [drivers, vehicles] = await Promise.all([
      DistributionService.listDrivers(context.organization.id),
      DistributionService.listVehicles(context.organization.id),
    ]);

    return NextResponse.json({ drivers, vehicles });
  } catch (error) {
    console.error("List drivers error:", error);
    return NextResponse.json(
      { error: "Failed to load drivers." },
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
        { error: "You do not have permission to register drivers." },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body.fullName || !body.phone || !body.licenseNumber) {
      return NextResponse.json(
        { error: "Driver full name, phone number, and license number are required." },
        { status: 400 }
      );
    }

    const driver = await DistributionService.createDriver({
      organizationId: context.organization.id,
      userId: context.user.id,
      ...body,
    });

    return NextResponse.json({ success: true, driver });
  } catch (error) {
    console.error("Create driver error:", error);
    return NextResponse.json(
      { error: "Failed to create driver." },
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
        { error: "You do not have permission to update drivers." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Driver ID is required." },
        { status: 400 }
      );
    }

    const driver = await DistributionService.updateDriver({
      id,
      organizationId: context.organization.id,
      userId: context.user.id,
      ...updates,
    });

    return NextResponse.json({ success: true, driver });
  } catch (error) {
    console.error("Update driver error:", error);
    return NextResponse.json(
      { error: "Failed to update driver." },
      { status: 500 }
    );
  }
}
