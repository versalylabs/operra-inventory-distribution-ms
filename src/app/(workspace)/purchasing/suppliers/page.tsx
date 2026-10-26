import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { PurchaseService } from "@/services/purchase.service";
import { SuppliersClient } from "./SuppliersClient";

export default async function SuppliersPage() {
  const context = await requireAuth();

  const suppliers = await PurchaseService.listSuppliers(
    context.organization.id
  );

  return (
    <SuppliersClient
      initialSuppliers={suppliers}
      currency={context.organization.currency}
      canManage={hasPermission(context.membership.role, "suppliers:manage")}
    />
  );
}
