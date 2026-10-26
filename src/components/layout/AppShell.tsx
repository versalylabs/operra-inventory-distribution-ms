"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import {
  ROLE_LABELS,
  ROLE_BADGE_STYLES,
  hasPermission,
  Permission,
} from "@/lib/rbac";
import { OperraLogo } from "@/components/brand/OperraLogo";
import {
  Boxes,
  LayoutDashboard,
  ShoppingCart,
  Package,
  ShoppingBag,
  Truck,
  Wallet,
  BarChart3,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  LogOut,
  Menu,
  X,
  Users,
  Shield,
  Check,
  Loader2,
  Globe,
} from "lucide-react";

interface NavChild {
  label: string;
  href: string;
  permission?: Permission;
}

interface NavGroup {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  children?: NavChild[];
}

const NAVIGATION: NavGroup[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard:view",
  },
  {
    label: "Sales",
    icon: ShoppingCart,
    permission: "sales:view",
    children: [
      { label: "Orders", href: "/sales/orders", permission: "sales:view" },
      {
        label: "Customers",
        href: "/sales/customers",
        permission: "customers:view",
      },
      { label: "Invoices", href: "/sales/invoices", permission: "sales:view" },
    ],
  },
  {
    label: "Inventory",
    icon: Package,
    permission: "inventory:view",
    children: [
      {
        label: "Products",
        href: "/inventory/products",
        permission: "products:view",
      },
      {
        label: "Categories",
        href: "/inventory/categories",
        permission: "products:view",
      },
      { label: "Stock", href: "/inventory/stock", permission: "inventory:view" },
      {
        label: "Warehouses",
        href: "/inventory/warehouses",
        permission: "warehouses:view",
      },
      {
        label: "Transfers",
        href: "/inventory/transfers",
        permission: "inventory:transfer",
      },
      {
        label: "Adjustments",
        href: "/inventory/adjustments",
        permission: "inventory:adjust",
      },
    ],
  },
  {
    label: "Purchasing",
    icon: ShoppingBag,
    permission: "purchasing:view",
    children: [
      {
        label: "Purchase Orders",
        href: "/purchasing/orders",
        permission: "purchasing:view",
      },
      {
        label: "Suppliers",
        href: "/purchasing/suppliers",
        permission: "suppliers:view",
      },
      {
        label: "Receiving",
        href: "/purchasing/receiving",
        permission: "purchasing:receive",
      },
    ],
  },
  {
    label: "Distribution",
    icon: Truck,
    permission: "deliveries:view",
    children: [
      {
        label: "Deliveries",
        href: "/distribution/deliveries",
        permission: "deliveries:view",
      },
      {
        label: "Drivers",
        href: "/distribution/drivers",
        permission: "deliveries:view",
      },
      {
        label: "Vehicles",
        href: "/distribution/vehicles",
        permission: "deliveries:view",
      },
    ],
  },
  {
    label: "Finance",
    icon: Wallet,
    permission: "finance:view",
    children: [
      {
        label: "Payments",
        href: "/finance/payments",
        permission: "finance:view",
      },
      {
        label: "Expenses",
        href: "/finance/expenses",
        permission: "finance:view",
      },
    ],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    permission: "reports:view",
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    label: "Settings",
    icon: Settings,
    permission: "settings:view",
    children: [
      {
        label: "Organization Profile",
        href: "/settings",
        permission: "settings:view",
      },
      {
        label: "Users & Roles",
        href: "/settings/users",
        permission: "users:view",
      },
      {
        label: "Audit Logs",
        href: "/settings/audit-logs",
        permission: "audit:view",
      },
    ],
  },
];

interface AppShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    isSuperAdmin: boolean;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    city: string | null;
  };
  membership: {
    role: UserRole;
    title: string | null;
  };
  allOrganizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: UserRole;
    currency: string;
  }>;
  unreadNotificationsCount: number;
  children: React.ReactNode;
}

export function AppShell({
  user,
  organization,
  membership,
  allOrganizations,
  unreadNotificationsCount,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orgSwitcherOpen, setOrgSwitcherOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      Sales: true,
      Inventory: true,
      Purchasing: true,
      Distribution: true,
      Finance: true,
      Settings: pathname.startsWith("/settings"),
    }
  );

  // Clear pending navigation indicator as soon as pathname updates
  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  // Background prefetch all workspace routes so clicking any sidebar link is instantaneous
  useEffect(() => {
    const timer = setTimeout(() => {
      for (const group of NAVIGATION) {
        if (group.href) {
          router.prefetch(group.href);
        }
        if (group.children) {
          for (const child of group.children) {
            router.prefetch(child.href);
          }
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [router]);

  const activePath = pendingPath || pathname;
  const isNavigating = Boolean(pendingPath && pendingPath !== pathname);

  function handleNavClick(href: string) {
    setMobileMenuOpen(false);
    if (href !== pathname) {
      setPendingPath(href);
    }
  }

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleSwitchOrganization(orgId: string) {
    setOrgSwitcherOpen(false);
    if (orgId === organization.id) return;
    const res = await fetch("/api/auth/switch-org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: orgId }),
    });
    if (res.ok) {
      router.refresh();
    }
  }

  const visibleNavigation = NAVIGATION.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(membership.role, item.permission);
  });

  return (
    <div className="h-screen overflow-hidden bg-[#f8f9fb] text-slate-900 flex">
      {/* Top Instant Route Transition Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#ff5900]/20 overflow-hidden">
          <div className="h-full w-1/2 bg-[#ff5900] animate-pulse rounded-r-full" />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#000710]/70 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-68 h-full bg-[#000710] text-[#b9bbc6] flex flex-col border-r border-[#15191e] transition-transform duration-200 lg:static lg:translate-x-0 shrink-0 select-none overflow-hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
          <Link
            href="/dashboard"
            prefetch={true}
            onClick={() => handleNavClick("/dashboard")}
            className="group hover:opacity-95 transition-opacity"
          >
            <OperraLogo inverted size="md" badge="ERP" subtitle="Distribution & Inventory MS" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-[#8b8d98] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Organization Tenant Switcher */}
        <div className="p-3 border-b border-white/10 relative">
          <button
            type="button"
            onClick={() => setOrgSwitcherOpen(!orgSwitcherOpen)}
            className="w-full p-2.5 rounded-[10px] bg-[#15191e] hover:bg-[#1c2229] border border-white/10 flex items-center justify-between text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-[8px] bg-[#ff5900]/15 border border-[#ff5900]/30 flex items-center justify-center shrink-0 text-[#ff5900]">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {organization.name}
                </p>
                <p className="text-[11px] text-[#8b8d98] truncate">
                  {organization.city || "Kenya"} • {organization.currency}
                </p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-[#8b8d98] shrink-0" />
          </button>

          {orgSwitcherOpen && (
            <div className="absolute left-3 right-3 mt-1.5 bg-[#15191e] border border-white/15 rounded-[12px] shadow-2xl z-50 py-1.5">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b8d98]">
                Switch Organization Tenant
              </div>
              {allOrganizations.map((org) => {
                const isCurrent = org.id === organization.id;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => handleSwitchOrganization(org.id)}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">
                        {org.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {ROLE_LABELS[org.role]} • {org.currency}
                      </p>
                    </div>
                    {isCurrent && (
                      <Check className="h-4 w-4 text-[#ff5900] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            const visibleChildren = item.children?.filter(
              (child) =>
                !child.permission ||
                hasPermission(membership.role, child.permission)
            );

            if (visibleChildren && visibleChildren.length > 0) {
              const isGroupActive = visibleChildren.some(
                (c) =>
                  activePath === c.href || activePath.startsWith(c.href + "/")
              );
              const isOpen = expandedGroups[item.label] ?? isGroupActive;

              return (
                <div key={item.label} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs font-medium transition-colors cursor-pointer ${
                      isGroupActive
                        ? "text-white bg-[#15191e] border-l-2 border-[#ff5900]"
                        : "text-[#8b8d98] hover:text-white hover:bg-[#15191e]/60"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-[#8b8d98]" />
                      {item.label}
                    </span>
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-[#8b8d98]" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-[#8b8d98]" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="pl-9 pr-2 py-1 space-y-0.5 border-l border-white/10 ml-4">
                      {visibleChildren.map((child) => {
                        const isChildActive = activePath === child.href;
                        const isChildPending =
                          pendingPath === child.href &&
                          pathname !== child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            prefetch={true}
                            onClick={() => handleNavClick(child.href)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs transition-colors ${
                              isChildActive
                                ? "bg-[#ff5900] text-white font-semibold shadow-xs"
                                : "text-[#8b8d98] hover:text-white hover:bg-[#15191e]"
                            }`}
                          >
                            <span>{child.label}</span>
                            {isChildPending && (
                              <Loader2 className="h-3 w-3 animate-spin text-white" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            if (!item.href) return null;
            const isActive =
              activePath === item.href ||
              activePath.startsWith(item.href + "/");
            const isItemPending =
              pendingPath === item.href && pathname !== item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                prefetch={true}
                onClick={() => handleNavClick(item.href!)}
                className={`flex items-center justify-between px-3 py-2 rounded-[8px] text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[#ff5900] text-white shadow-xs font-semibold"
                    : "text-[#8b8d98] hover:text-white hover:bg-[#15191e]/60"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <span className="flex items-center gap-1.5">
                  {isItemPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  )}
                  {item.label === "Notifications" &&
                    unreadNotificationsCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-[#ff5900] text-white">
                        {unreadNotificationsCount}
                      </span>
                    )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-white/10 bg-[#000710]">
          <div className="flex items-center justify-between gap-2 p-2 rounded-[10px] bg-[#15191e] border border-white/10">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-[#8b8d98] truncate">
                {ROLE_LABELS[membership.role]}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="p-2 rounded-[6px] text-[#8b8d98] hover:text-[#ff5900] hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-white border-b border-[#f3f3f7] px-4 lg:px-8 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-[#f3f3f7]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {organization.name}
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                    ROLE_BADGE_STYLES[membership.role]
                  }`}
                >
                  {ROLE_LABELS[membership.role]}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {membership.title || "Operational Workspace"} • Tenant ID:{" "}
                <code className="text-[11px] text-slate-600">
                  {organization.slug}
                </code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#b9bbc6]/40 hover:bg-[#f3f3f7] text-xs font-semibold text-[#000000] tracking-compressed-sm transition-colors"
            >
              <Globe className="h-3.5 w-3.5 text-[#ff5900]" />
              Corporate Website
            </Link>
            {hasPermission(membership.role, "users:view") && (
              <Link
                href="/settings/users"
                prefetch={true}
                onClick={() => handleNavClick("/settings/users")}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#b9bbc6]/40 hover:bg-[#f3f3f7] text-xs font-medium text-slate-700 transition-colors"
              >
                <Users className="h-3.5 w-3.5 text-slate-500" />
                Team & Roles
              </Link>
            )}
            <Link
              href="/notifications"
              prefetch={true}
              onClick={() => handleNavClick("/notifications")}
              className="relative p-2 rounded-[8px] border border-[#b9bbc6]/40 hover:bg-[#f3f3f7] text-slate-600 transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#ff5900] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>
            <Link
              href="/settings"
              prefetch={true}
              onClick={() => handleNavClick("/settings")}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#000000] hover:bg-[#15191e] text-white text-xs font-medium tracking-compressed-sm transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-[#ff5900]" />
              Settings
            </Link>
          </div>
        </header>

        {/* Page Body with Independent Scroll Container */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 w-full">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
