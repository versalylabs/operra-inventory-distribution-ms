import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { SalesService } from "@/services/sales.service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "customers:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [customers, members] = await Promise.all([
      SalesService.listCustomers(context.organization.id),
      prisma.organizationMember.findMany({
        where: {
          organizationId: context.organization.id,
          isActive: true,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      }),
    ]);

    const salesReps = members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    }));

    return NextResponse.json({ customers, salesReps });
  } catch (error) {
    console.error("List customers error:", error);
    return NextResponse.json(
      { error: "Failed to load customers." },
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

    if (!hasPermission(context.membership.role, "customers:manage")) {
      return NextResponse.json(
        { error: "You do not have permission to create customers." },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body.businessName || !body.businessName.trim()) {
      return NextResponse.json(
        { error: "Customer business name is required." },
        { status: 400 }
      );
    }

    const customer = await SalesService.createCustomer({
      organizationId: context.organization.id,
      userId: context.user.id,
      ...body,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json(
      { error: "Failed to create customer." },
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

    if (!hasPermission(context.membership.role, "customers:manage")) {
      return NextResponse.json(
        { error: "You do not have permission to update customers." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required." },
        { status: 400 }
      );
    }

    const customer = await SalesService.updateCustomer({
      id,
      organizationId: context.organization.id,
      userId: context.user.id,
      ...updates,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("Update customer error:", error);
    return NextResponse.json(
      { error: "Failed to update customer." },
      { status: 500 }
    );
  }
}
