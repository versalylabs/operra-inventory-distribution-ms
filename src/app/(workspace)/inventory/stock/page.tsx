import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { InventoryService } from "@/services/inventory.service";
import { StockClient } from "./StockClient";

export default async function InventoryStockPage({
  searchParams,
}: {
  searchParams: Promise<{ warehouseId?: string }>;
}) {
  const context = await requireAuth();
  const params = await searchParams;

  const [stockItems, movements, warehouses] = await Promise.all([
    InventoryService.listInventoryStock({
      organizationId: context.organization.id,
    }),
    InventoryService.listStockMovements({
      organizationId: context.organization.id,
      limit: 150,
    }),
    InventoryService.listWarehouses(context.organization.id),
  ]);

  const warehouseOptions = warehouses.map((w) => ({
    id: w.id,
    name: w.name,
    code: w.code,
  }));

  return (
    <StockClient
      stockItems={stockItems}
      movements={movements}
      warehouses={warehouseOptions}
      currency={context.organization.currency}
      canAdjust={hasPermission(context.membership.role, "inventory:adjust")}
      initialWarehouseFilter={params.warehouseId || "ALL"}
    />
  );
}
