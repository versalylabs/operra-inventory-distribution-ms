import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { UsersClient } from "./UsersClient";

export default async function OrganizationUsersPage() {
  const context = await requireAuth();

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: context.organization.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          lastLoginAt: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const serializedMembers = members.map((m) => ({
    id: m.id,
    role: m.role,
    title: m.title,
    isActive: m.isActive,
    joinedAt: m.joinedAt.toISOString(),
    user: {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      phone: m.user.phone,
      status: m.user.status,
      lastLoginAt: m.user.lastLoginAt ? m.user.lastLoginAt.toISOString() : null,
    },
  }));

  return (
    <UsersClient
      initialMembers={serializedMembers}
      canManageUsers={hasPermission(context.membership.role, "users:manage")}
      currentUserId={context.user.id}
    />
  );
}
