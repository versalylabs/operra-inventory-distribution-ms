import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createUserSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: true },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact your organization administrator." },
        { status: 403 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const primaryMembership = user.memberships[0];
    if (!primaryMembership) {
      return NextResponse.json(
        { error: "No active organization membership found for this account." },
        { status: 403 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: primaryMembership.organizationId,
        userId: user.id,
        action: "USER_LOGIN",
        entity: "User",
        entityId: user.id,
        newValue: { email: user.email, role: primaryMembership.role },
      },
    });

    await createUserSession(
      user.id,
      primaryMembership.organizationId,
      primaryMembership.role,
      user.isSuperAdmin
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: primaryMembership.role,
        organizationName: primaryMembership.organization.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign in." },
      { status: 500 }
    );
  }
}
