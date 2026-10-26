import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

export async function PATCH(request: Request) {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "settings:manage")) {
      return NextResponse.json(
        { error: "Only Organization Owners can modify business settings." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      city,
      country,
      taxNumber,
      currency,
      timezone,
      allowNegativeStock,
      valuationMethod,
      invoicePrefix,
      orderPrefix,
      purchasePrefix,
      deliveryPrefix,
      transferPrefix,
      defaultPaymentTerms,
      defaultTaxRate,
    } = body;

    const updatedOrg = await prisma.organization.update({
      where: { id: context.organization.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(email !== undefined ? { email: email?.trim() || null } : {}),
        ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
        ...(address !== undefined ? { address: address?.trim() || null } : {}),
        ...(city !== undefined ? { city: city?.trim() || null } : {}),
        ...(country ? { country: country.trim() } : {}),
        ...(taxNumber !== undefined ? { taxNumber: taxNumber?.trim() || null } : {}),
        ...(currency ? { currency } : {}),
        ...(timezone ? { timezone } : {}),
        ...(typeof allowNegativeStock === "boolean" ? { allowNegativeStock } : {}),
        ...(valuationMethod ? { valuationMethod } : {}),
        ...(invoicePrefix ? { invoicePrefix: invoicePrefix.trim() } : {}),
        ...(orderPrefix ? { orderPrefix: orderPrefix.trim() } : {}),
        ...(purchasePrefix ? { purchasePrefix: purchasePrefix.trim() } : {}),
        ...(deliveryPrefix ? { deliveryPrefix: deliveryPrefix.trim() } : {}),
        ...(transferPrefix ? { transferPrefix: transferPrefix.trim() } : {}),
        ...(defaultPaymentTerms !== undefined
          ? { defaultPaymentTerms: Number(defaultPaymentTerms) }
          : {}),
        ...(defaultTaxRate !== undefined
          ? { defaultTaxRate: Number(defaultTaxRate) }
          : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: context.organization.id,
        userId: context.user.id,
        action: "ORGANIZATION_SETTINGS_UPDATED",
        entity: "Organization",
        entityId: context.organization.id,
        newValue: {
          name: updatedOrg.name,
          currency: updatedOrg.currency,
          allowNegativeStock: updatedOrg.allowNegativeStock,
        },
      },
    });

    return NextResponse.json({ success: true, organization: updatedOrg });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Failed to update organization settings." },
      { status: 500 }
    );
  }
}
