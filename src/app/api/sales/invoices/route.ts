import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { FinanceService } from "@/services/finance.service";
import { InvoiceStatus } from "@prisma/client";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !hasPermission(context.membership.role, "sales:view") &&
      !hasPermission(context.membership.role, "finance:view")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [invoices, billableOrders, creditAccounts] = await Promise.all([
      FinanceService.listInvoices(context.organization.id),
      FinanceService.listBillableSalesOrders(context.organization.id),
      FinanceService.getCreditControlSummary(context.organization.id),
    ]);

    return NextResponse.json({
      invoices,
      billableOrders,
      creditAccounts,
      currency: context.organization.currency,
      organization: {
        name: context.organization.name,
        taxNumber: context.organization.taxNumber,
        phone: context.organization.phone,
        email: context.organization.email,
        address: context.organization.address,
        city: context.organization.city,
      },
      canManage:
        hasPermission(context.membership.role, "finance:manage") ||
        hasPermission(context.membership.role, "sales:create"),
    });
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json(
      { error: "Failed to load invoices" },
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
        { error: "Insufficient permissions to issue invoices" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const invoice = await FinanceService.createInvoice({
      organizationId: context.organization.id,
      issuedById: context.user.id,
      salesOrderId: body.salesOrderId,
      dueDate: body.dueDate,
      taxReference: body.taxReference,
      notes: body.notes,
      status: body.status as InvoiceStatus | undefined,
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create invoice";
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
      !hasPermission(context.membership.role, "sales:approve")
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions to update invoice status" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updated = await FinanceService.updateInvoiceStatus({
      organizationId: context.organization.id,
      userId: context.user.id,
      invoiceId: body.invoiceId,
      status: body.status as InvoiceStatus,
    });

    return NextResponse.json({ invoice: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update invoice";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
