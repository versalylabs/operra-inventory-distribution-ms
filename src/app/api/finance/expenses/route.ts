import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { FinanceService } from "@/services/finance.service";
import { InventoryService } from "@/services/inventory.service";
import { ExpenseCategory, PaymentMethod } from "@prisma/client";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "finance:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [expenses, warehouses] = await Promise.all([
      FinanceService.listExpenses(context.organization.id),
      InventoryService.listWarehouses(context.organization.id),
    ]);

    return NextResponse.json({
      expenses,
      warehouses: warehouses.map((w) => ({
        id: w.id,
        name: w.name,
        code: w.code,
      })),
      currency: context.organization.currency,
      canManage: hasPermission(context.membership.role, "finance:manage"),
    });
  } catch (error) {
    console.error("Failed to load expenses:", error);
    return NextResponse.json(
      { error: "Failed to load operational expenses" },
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

    if (!hasPermission(context.membership.role, "finance:manage")) {
      return NextResponse.json(
        { error: "Insufficient permissions to record expenses" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const expense = await FinanceService.createExpense({
      organizationId: context.organization.id,
      recordedById: context.user.id,
      category: (body.category as ExpenseCategory) || "FUEL",
      amount: Number(body.amount),
      description: body.description,
      paymentMethod: (body.paymentMethod as PaymentMethod) || "MPESA",
      reference: body.reference,
      warehouseId: body.warehouseId,
      expenseDate: body.expenseDate,
      notes: body.notes,
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to record expense";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
