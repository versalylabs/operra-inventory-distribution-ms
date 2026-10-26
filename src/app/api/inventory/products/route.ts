import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { ProductService } from "@/services/product.service";
import { ProductStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const context = await getCurrentContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(context.membership.role, "products:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const status = (searchParams.get("status") as ProductStatus | "ALL") || "ALL";

    const products = await ProductService.listProducts({
      organizationId: context.organization.id,
      search,
      categoryId,
      status,
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("List products error:", error);
    return NextResponse.json(
      { error: "Failed to load products." },
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
        { error: "You do not have permission to create products." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      sku,
      barcode,
      description,
      categoryId,
      brand,
      unitOfMeasure,
      costPrice,
      sellingPrice,
      wholesalePrice,
      taxRate,
      minStockLevel,
      reorderLevel,
      maxStockLevel,
      imageUrl,
      preferredSupplier,
      status,
    } = body;

    if (!name || !sku) {
      return NextResponse.json(
        { error: "Product name and SKU are required." },
        { status: 400 }
      );
    }

    const product = await ProductService.createProduct({
      organizationId: context.organization.id,
      userId: context.user.id,
      name,
      sku,
      barcode,
      description,
      categoryId,
      brand,
      unitOfMeasure,
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      wholesalePrice:
        wholesalePrice !== undefined && wholesalePrice !== ""
          ? Number(wholesalePrice)
          : null,
      taxRate: taxRate !== undefined ? Number(taxRate) : Number(context.organization.defaultTaxRate),
      minStockLevel: minStockLevel !== undefined ? Number(minStockLevel) : 10,
      reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : 25,
      maxStockLevel:
        maxStockLevel !== undefined && maxStockLevel !== ""
          ? Number(maxStockLevel)
          : null,
      imageUrl,
      preferredSupplier,
      status,
    });

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        costPrice: Number(product.costPrice),
        sellingPrice: Number(product.sellingPrice),
        wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
        taxRate: Number(product.taxRate),
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "DUPLICATE_SKU") {
      return NextResponse.json(
        { error: "A product with this SKU already exists in your organization." },
        { status: 409 }
      );
    }
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Failed to create product." },
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
        { error: "You do not have permission to update products." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const product = await ProductService.updateProduct({
      id,
      organizationId: context.organization.id,
      userId: context.user.id,
      ...updates,
    });

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        costPrice: Number(product.costPrice),
        sellingPrice: Number(product.sellingPrice),
        wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
        taxRate: Number(product.taxRate),
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "DUPLICATE_SKU") {
      return NextResponse.json(
        { error: "Another product in your organization already uses this SKU." },
        { status: 409 }
      );
    }
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 }
    );
  }
}
