import type { Metadata } from "next";
import { requireAuth, getCachedUnreadNotificationsCount } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: {
    default: "Workspace — Operra ERP",
    template: "%s | Operra ERP",
  },
};

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireAuth();

  const unreadNotificationsCount = await getCachedUnreadNotificationsCount(
    context.organization.id,
    context.user.id
  );

  return (
    <AppShell
      user={context.user}
      organization={{
        id: context.organization.id,
        name: context.organization.name,
        slug: context.organization.slug,
        currency: context.organization.currency,
        city: context.organization.city,
      }}
      membership={context.membership}
      allOrganizations={context.allOrganizations}
      unreadNotificationsCount={unreadNotificationsCount}
    >
      {children}
    </AppShell>
  );
}
