import { NextResponse } from "next/server";
import { getCurrentContext, createUserSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await request.json();
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required." },
        { status: 400 }
      );
    }

    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: context.user.id,
        },
      },
      include: { organization: true },
    });

    if (!membership || !membership.isActive) {
      return NextResponse.json(
        { error: "You do not have access to this organization." },
        { status: 403 }
      );
    }

    await createUserSession(
      context.user.id,
      membership.organizationId,
      membership.role,
      context.user.isSuperAdmin
    );

    return NextResponse.json({
      success: true,
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        role: membership.role,
      },
    });
  } catch (error) {
    console.error("Switch org error:", error);
    return NextResponse.json(
      { error: "Failed to switch organization." },
      { status: 500 }
    );
  }
}
