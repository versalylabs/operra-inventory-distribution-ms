import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { DistributionService } from "@/services/distribution.service";
import { SalesService } from "@/services/sales.service";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "deliveries:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [deliveries, drivers, vehicles, salesOrders] = await Promise.all([
      DistributionService.listDeliveries(context.organization.id),
      DistributionService.listDrivers(context.organization.id),
      DistributionService.listVehicles(context.organization.id),
      SalesService.listSalesOrders(context.organization.id),
    ]);

    // Filter salesOrders that can be scheduled for delivery (CONFIRMED, PROCESSING, READY_FOR_DELIVERY)
    const dispatchableOrders = salesOrders.filter(
      (o) =>
        o.status === "CONFIRMED" ||
        o.status === "PROCESSING" ||
        o.status === "READY_FOR_DELIVERY"
    );

    return NextResponse.json({
      deliveries,
      drivers,
      vehicles,
      dispatchableOrders,
    });
  } catch (error) {
    console.error("List deliveries error:", error);
    return NextResponse.json(
      { error: "Failed to load deliveries." },
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
        { error: "You do not have permission to schedule deliveries." },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body.salesOrderId) {
      return NextResponse.json(
        { error: "Sales Order is required to create a delivery dispatch." },
        { status: 400 }
      );
    }

    const delivery = await DistributionService.createDelivery({
      organizationId: context.organization.id,
      userId: context.user.id,
      ...body,
    });

    return NextResponse.json({ success: true, delivery });
  } catch (error) {
    console.error("Create delivery error:", error);
    return NextResponse.json(
      { error: "Failed to create delivery." },
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
      !hasPermission(context.membership.role, "deliveries:manage") &&
      !hasPermission(context.membership.role, "deliveries:update_status")
    ) {
      return NextResponse.json(
        { error: "You do not have permission to update delivery status." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { deliveryId, status, driverId, vehicleId, failureReason, pod } =
      body;

    if (!deliveryId || !status) {
      return NextResponse.json(
        { error: "Delivery ID and target status are required." },
        { status: 400 }
      );
    }

    const updated = await DistributionService.updateDeliveryStatus({
      organizationId: context.organization.id,
      userId: context.user.id,
      deliveryId,
      status,
      driverId,
      vehicleId,
      failureReason,
      pod,
    });

    return NextResponse.json({ success: true, delivery: updated });
  } catch (error) {
    console.error("Update delivery status error:", error);
    if (error instanceof Error && error.message.startsWith("POD_REQUIRED:")) {
      return NextResponse.json(
        { error: error.message.split(":").slice(1).join(":") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update delivery status." },
      { status: 500 }
    );
  }
}
