import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { PurchaseService } from "@/services/purchase.service";
import { InventoryService } from "@/services/inventory.service";
import { ProductService } from "@/services/product.service";
import { PurchaseOrdersClient } from "./PurchaseOrdersClient";

export default async function PurchaseOrdersPage() {
  const context = await requireAuth();

  const [orders, suppliers, warehouses, products] = await Promise.all([
    PurchaseService.listPurchaseOrders(context.organization.id),
    PurchaseService.listSuppliers(context.organization.id),
    InventoryService.listWarehouses(context.organization.id),
    ProductService.listProducts({
      organizationId: context.organization.id,
      status: "ACTIVE",
    }),
  ]);

  return (
    <PurchaseOrdersClient
      initialOrders={orders}
      suppliers={suppliers.map((s) => ({
        id: s.id,
        code: s.code,
        companyName: s.companyName,
      }))}
      warehouses={warehouses.map((w) => ({
        id: w.id,
        code: w.code,
        name: w.name,
      }))}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        unitOfMeasure: p.unitOfMeasure,
        costPrice: Number(p.costPrice),
        taxRate: Number(p.taxRate),
      }))}
      currency={context.organization.currency}
      canCreate={hasPermission(context.membership.role, "purchasing:create")}
      canApprove={hasPermission(context.membership.role, "purchasing:approve")}
      canReceive={hasPermission(context.membership.role, "purchasing:receive")}
    />
  );
}
