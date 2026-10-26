import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { PurchaseService } from "@/services/purchase.service";
import { ReceivingClient } from "./ReceivingClient";

export default async function GoodsReceivingPage({
  searchParams,
}: {
  searchParams: Promise<{ poId?: string }>;
}) {
  const context = await requireAuth();
  const params = await searchParams;

  const [receipts, allOrders] = await Promise.all([
    PurchaseService.listGoodsReceipts(context.organization.id),
    PurchaseService.listPurchaseOrders(context.organization.id),
  ]);

  const receivableOrders = allOrders.filter(
    (o) =>
      o.status === "ORDERED" ||
      o.status === "APPROVED" ||
      o.status === "PARTIALLY_RECEIVED"
  );

  return (
    <ReceivingClient
      initialReceipts={receipts}
      receivableOrders={receivableOrders}
      currency={context.organization.currency}
      canReceive={hasPermission(context.membership.role, "purchasing:receive")}
      preselectedPoId={params.poId}
    />
  );
}
