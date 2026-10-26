import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { ProductService } from "@/services/product.service";
import { ProductsClient } from "./ProductsClient";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const context = await requireAuth();
  const params = await searchParams;

  const [products, categories] = await Promise.all([
    ProductService.listProducts({
      organizationId: context.organization.id,
    }),
    ProductService.listCategories(context.organization.id),
  ]);

  const serializedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    description: p.description,
    categoryId: p.categoryId,
    brand: p.brand,
    unitOfMeasure: p.unitOfMeasure,
    costPrice: Number(p.costPrice),
    sellingPrice: Number(p.sellingPrice),
    wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : null,
    taxRate: Number(p.taxRate),
    minStockLevel: p.minStockLevel,
    reorderLevel: p.reorderLevel,
    maxStockLevel: p.maxStockLevel,
    imageUrl: p.imageUrl,
    preferredSupplier: p.preferredSupplier,
    status: p.status,
    category: p.category,
  }));

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    parent: c.parent,
  }));

  return (
    <ProductsClient
      initialProducts={serializedProducts}
      categories={categoryOptions}
      currency={context.organization.currency}
      defaultTaxRate={Number(context.organization.defaultTaxRate)}
      canManage={hasPermission(context.membership.role, "products:manage")}
      initialCategoryFilter={params.categoryId || "ALL"}
    />
  );
}
