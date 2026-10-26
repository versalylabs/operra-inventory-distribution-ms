import { NextResponse } from "next/server";
import { getCurrentContext, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { UserRole } from "@prisma/client";

export async function GET() {
  const context = await getCurrentContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: context.organization.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "users:manage")) {
      return NextResponse.json(
        { error: "You do not have permission to manage users in this organization." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, phone, role, title, password } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required." },
        { status: 400 }
      );
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.toLowerCase().trim();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }
    const validRoles: UserRole[] = [
      "OWNER",
      "MANAGER",
      "WAREHOUSE_STAFF",
      "SALES_STAFF",
      "DELIVERY_STAFF",
    ];

    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid user role." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password || "operra123");

    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            name: name.trim(),
            email: normalizedEmail,
            phone: phone?.trim() || null,
            passwordHash,
            status: "ACTIVE",
          },
        });
      }

      const existingMembership = await tx.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: context.organization.id,
            userId: user.id,
          },
        },
      });

      if (existingMembership) {
        throw new Error("ALREADY_MEMBER");
      }

      const member = await tx.organizationMember.create({
        data: {
          organizationId: context.organization.id,
          userId: user.id,
          role: role as UserRole,
          title: title?.trim() || null,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true,
              lastLoginAt: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: context.organization.id,
          userId: context.user.id,
          action: "TEAM_MEMBER_ADDED",
          entity: "OrganizationMember",
          entityId: member.id,
          newValue: {
            email: user.email,
            name: user.name,
            role: member.role,
          },
        },
      });

      return member;
    });

    return NextResponse.json({ success: true, member: result });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "ALREADY_MEMBER") {
      return NextResponse.json(
        { error: "This user is already a member of your organization." },
        { status: 409 }
      );
    }
    console.error("Add user error:", error);
    return NextResponse.json(
      { error: "Failed to add team member." },
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

    if (!hasPermission(context.membership.role, "users:manage")) {
      return NextResponse.json(
        { error: "You do not have permission to update team roles." },
        { status: 403 }
      );
    }

    const { memberId, role, isActive, title } = await request.json();
    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required." }, { status: 400 });
    }

    const existing = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId: context.organization.id,
      },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Team member not found." }, { status: 404 });
    }

    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data: {
        ...(role ? { role: role as UserRole } : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
        ...(title !== undefined ? { title } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            lastLoginAt: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: context.organization.id,
        userId: context.user.id,
        action: "TEAM_MEMBER_UPDATED",
        entity: "OrganizationMember",
        entityId: updated.id,
        previousValue: { role: existing.role, isActive: existing.isActive },
        newValue: { role: updated.role, isActive: updated.isActive },
      },
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update team member." },
      { status: 500 }
    );
  }
}
