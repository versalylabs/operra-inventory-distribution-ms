import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { InventoryService } from "@/services/inventory.service";
import { ProductService } from "@/services/product.service";
import { AdjustmentsClient } from "./AdjustmentsClient";

export default async function StockAdjustmentsPage() {
  const context = await requireAuth();

  const [adjustments, products, warehouses] = await Promise.all([
    InventoryService.listStockAdjustments(context.organization.id),
    ProductService.listProducts({
      organizationId: context.organization.id,
      status: "ACTIVE",
    }),
    InventoryService.listWarehouses(context.organization.id),
  ]);

  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    unitOfMeasure: p.unitOfMeasure,
  }));

  const warehouseOptions = warehouses.map((w) => ({
    id: w.id,
    name: w.name,
    code: w.code,
  }));

  const isManagerOrOwner =
    context.membership.role === "SUPER_ADMIN" ||
    context.membership.role === "OWNER" ||
    context.membership.role === "MANAGER";

  return (
    <AdjustmentsClient
      initialAdjustments={adjustments}
      products={productOptions}
      warehouses={warehouseOptions}
      canAdjust={hasPermission(context.membership.role, "inventory:adjust")}
      isManagerOrOwner={isManagerOrOwner}
    />
  );
}
