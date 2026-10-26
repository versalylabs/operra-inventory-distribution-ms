import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { ProductService } from "@/services/product.service";

export async function GET() {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "products:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const categories = await ProductService.listCategories(
      context.organization.id
    );
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("List categories error:", error);
    return NextResponse.json(
      { error: "Failed to load categories." },
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

    if (!hasPermission(context.membership.role, "products:manage")) {
      return NextResponse.json(
        { error: "You do not have permission to manage product categories." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, parentId, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required." },
        { status: 400 }
      );
    }

    const category = await ProductService.createCategory({
      organizationId: context.organization.id,
      userId: context.user.id,
      name,
      description,
      parentId,
      status,
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Failed to create category." },
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

    if (!hasPermission(context.membership.role, "products:manage")) {
      return NextResponse.json(
        { error: "You do not have permission to update product categories." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, description, parentId, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required." },
        { status: 400 }
      );
    }

    const category = await ProductService.updateCategory({
      id,
      organizationId: context.organization.id,
      userId: context.user.id,
      name,
      description,
      parentId,
      status,
    });

    return NextResponse.json({ success: true, category });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "INVALID_PARENT_CATEGORY") {
      return NextResponse.json(
        { error: "A category cannot be its own parent." },
        { status: 400 }
      );
    }
    console.error("Update category error:", error);
    return NextResponse.json(
      { error: "Failed to update category." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "products:manage")) {
      return NextResponse.json(
        { error: "You do not have permission to delete categories." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required." },
        { status: 400 }
      );
    }

    await ProductService.deleteCategory(
      context.organization.id,
      context.user.id,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { error: "Failed to delete category." },
      { status: 500 }
    );
  }
}
