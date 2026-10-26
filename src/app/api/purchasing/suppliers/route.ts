import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { PurchaseService } from "@/services/purchase.service";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "suppliers:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const suppliers = await PurchaseService.listSuppliers(
      context.organization.id
    );
    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("List suppliers error:", error);
    return NextResponse.json(
      { error: "Failed to load suppliers." },
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

    if (!hasPermission(context.membership.role, "suppliers:manage")) {
      return NextResponse.json(
        { error: "You do not have permission to create suppliers." },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body.companyName || !body.companyName.trim()) {
      return NextResponse.json(
        { error: "Supplier company name is required." },
        { status: 400 }
      );
    }

    const supplier = await PurchaseService.createSupplier({
      organizationId: context.organization.id,
      userId: context.user.id,
      ...body,
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    console.error("Create supplier error:", error);
    return NextResponse.json(
      { error: "Failed to create supplier." },
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

    if (!hasPermission(context.membership.role, "suppliers:manage")) {
      return NextResponse.json(
        { error: "You do not have permission to update suppliers." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Supplier ID is required." },
        { status: 400 }
      );
    }

    const supplier = await PurchaseService.updateSupplier({
      id,
      organizationId: context.organization.id,
      userId: context.user.id,
      ...updates,
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    console.error("Update supplier error:", error);
    return NextResponse.json(
      { error: "Failed to update supplier." },
      { status: 500 }
    );
  }
}
