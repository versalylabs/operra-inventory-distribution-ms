import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AnalyticsService } from "@/services/analytics.service";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        organizationId: context.organization.id,
        OR: [{ userId: null }, { userId: context.user.id }],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      notifications,
      organizationName: context.organization.name,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !hasPermission(context.membership.role, "dashboard:view") &&
      !hasPermission(context.membership.role, "inventory:view")
    ) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions to trigger alert scans." },
        { status: 403 }
      );
    }

    const scanResult = await AnalyticsService.runAutomatedAlertScan(
      context.organization.id
    );

    return NextResponse.json({ scanResult });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run alert scan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: {
          organizationId: context.organization.id,
          OR: [{ userId: null }, { userId: context.user.id }],
          isRead: false,
        },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (body.notificationId) {
      await prisma.notification.updateMany({
        where: {
          id: body.notificationId,
          organizationId: context.organization.id,
        },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update notification status:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
