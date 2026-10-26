import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { AnalyticsService } from "@/services/analytics.service";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "reports:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const analytics = await AnalyticsService.getExecutiveAnalytics(
      context.organization.id
    );

    return NextResponse.json({
      ...analytics,
      currency: context.organization.currency,
      organizationName: context.organization.name,
    });
  } catch (error) {
    console.error("Failed to load executive reports:", error);
    return NextResponse.json(
      { error: "Failed to load executive analytics" },
      { status: 500 }
    );
  }
}
