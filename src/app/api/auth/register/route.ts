import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createUserSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      organizationName,
      city,
      currency = "KES",
    } = body;

    if (!name || !email || !password || !organizationName) {
      return NextResponse.json(
        { error: "Name, email, password, and business name are required." },
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

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const baseSlug = slugify(organizationName) || "org";
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: organizationName.trim(),
          slug: uniqueSlug,
          email: normalizedEmail,
          phone: phone?.trim() || null,
          city: city?.trim() || "Nairobi",
          currency,
        },
      });

      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          phone: phone?.trim() || null,
          lastLoginAt: new Date(),
        },
      });

      const membership = await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: "OWNER",
          title: "Founder / Managing Director",
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          action: "ORGANIZATION_CREATED",
          entity: "Organization",
          entityId: organization.id,
          newValue: {
            organizationName: organization.name,
            ownerEmail: user.email,
          },
        },
      });

      await tx.notification.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          type: "SYSTEM",
          title: "Welcome to Operra",
          message: `${organization.name} workspace is ready. Configure your warehouses and product catalog to begin operations.`,
          link: "/settings",
        },
      });

      return { organization, user, membership };
    });

    await createUserSession(
      result.user.id,
      result.organization.id,
      result.membership.role,
      false
    );

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        organizationName: result.organization.name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account and organization workspace." },
      { status: 500 }
    );
  }
}
