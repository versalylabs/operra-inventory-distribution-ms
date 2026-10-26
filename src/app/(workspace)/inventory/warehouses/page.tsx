import { requireAuth } from "@/lib/auth";
import { hasPermission, ROLE_LABELS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { InventoryService } from "@/services/inventory.service";
import { WarehousesClient } from "./WarehousesClient";

export default async function WarehousesPage() {
  const context = await requireAuth();

  const [warehouses, members] = await Promise.all([
    InventoryService.listWarehouses(context.organization.id),
    prisma.organizationMember.findMany({
      where: { organizationId: context.organization.id, isActive: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { joinedAt: "asc" },
    }),
  ]);

  const managerOptions = members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: ROLE_LABELS[m.role],
  }));

  return (
    <WarehousesClient
      initialWarehouses={warehouses}
      managers={managerOptions}
      currency={context.organization.currency}
      canManage={hasPermission(context.membership.role, "warehouses:manage")}
    />
  );
}
