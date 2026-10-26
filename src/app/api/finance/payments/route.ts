import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { FinanceService } from "@/services/finance.service";
import { CustomerStatus, PaymentMethod } from "@prisma/client";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !hasPermission(context.membership.role, "finance:view") &&
      !hasPermission(context.membership.role, "sales:view")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [payments, invoices, creditAccounts] = await Promise.all([
      FinanceService.listPayments(context.organization.id),
      FinanceService.listInvoices(context.organization.id),
      FinanceService.getCreditControlSummary(context.organization.id),
    ]);

    const openInvoices = invoices.filter(
      (inv) =>
        inv.status !== "CANCELLED" &&
        inv.status !== "PAID" &&
        inv.balanceDue > 0
    );

    return NextResponse.json({
      payments,
      openInvoices,
      creditAccounts,
      currency: context.organization.currency,
      canManage: hasPermission(context.membership.role, "finance:manage"),
    });
  } catch (error) {
    console.error("Failed to fetch payments & credit control:", error);
    return NextResponse.json(
      { error: "Failed to load payments and credit control" },
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

    if (
      !hasPermission(context.membership.role, "finance:manage") &&
      !hasPermission(context.membership.role, "sales:create")
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions to record payments" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const payment = await FinanceService.recordPayment({
      organizationId: context.organization.id,
      recordedById: context.user.id,
      invoiceId: body.invoiceId,
      amount: Number(body.amount),
      method: (body.method as PaymentMethod) || "MPESA",
      reference: body.reference,
      paymentDate: body.paymentDate,
      notes: body.notes,
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to record payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !hasPermission(context.membership.role, "finance:manage") &&
      !hasPermission(context.membership.role, "customers:manage")
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions to modify credit control settings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const customer = await FinanceService.updateCustomerCreditControl({
      organizationId: context.organization.id,
      userId: context.user.id,
      customerId: body.customerId,
      status: body.status as CustomerStatus | undefined,
      creditLimit:
        body.creditLimit !== undefined ? Number(body.creditLimit) : undefined,
      paymentTermsDays:
        body.paymentTermsDays !== undefined
          ? Number(body.paymentTermsDays)
          : undefined,
      notes: body.notes,
    });

    return NextResponse.json({ customer });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update customer credit control";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
