import { UserRole } from "@prisma/client";

export type Permission =
  | "dashboard:view"
  | "products:view"
  | "products:manage"
  | "inventory:view"
  | "inventory:adjust"
  | "inventory:transfer"
  | "warehouses:view"
  | "warehouses:manage"
  | "suppliers:view"
  | "suppliers:manage"
  | "purchasing:view"
  | "purchasing:create"
  | "purchasing:approve"
  | "purchasing:receive"
  | "customers:view"
  | "customers:manage"
  | "sales:view"
  | "sales:create"
  | "sales:approve"
  | "deliveries:view"
  | "deliveries:manage"
  | "deliveries:update_status"
  | "finance:view"
  | "finance:manage"
  | "reports:view"
  | "users:view"
  | "users:manage"
  | "settings:view"
  | "settings:manage"
  | "audit:view";

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  OWNER: "Organization Owner",
  MANAGER: "Operations Manager",
  WAREHOUSE_STAFF: "Warehouse Staff",
  SALES_STAFF: "Sales Representative",
  DELIVERY_STAFF: "Delivery Driver",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  SUPER_ADMIN: "Platform-level Versaly administrator with global access across tenants.",
  OWNER: "Full administrative access to all modules, finances, users, and settings within the organization.",
  MANAGER: "Manages inventory, products, purchasing, sales, customers, suppliers, and operational reports.",
  WAREHOUSE_STAFF: "Views inventory, receives stock, picks orders, processes transfers, and performs stock counts.",
  SALES_STAFF: "Manages customers, creates quotations and sales orders, checks stock availability, and tracks balances.",
  DELIVERY_STAFF: "Views assigned deliveries, updates delivery status, and uploads proof of delivery.",
};

export const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-[#15191e] text-white border-white/20",
  OWNER: "bg-[#fff6f0] text-[#ff5900] border-[#ffd8bf]",
  MANAGER: "bg-blue-50 text-blue-700 border-blue-200",
  WAREHOUSE_STAFF: "bg-amber-50 text-amber-700 border-amber-200",
  SALES_STAFF: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DELIVERY_STAFF: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

const ALL_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "products:view",
  "products:manage",
  "inventory:view",
  "inventory:adjust",
  "inventory:transfer",
  "warehouses:view",
  "warehouses:manage",
  "suppliers:view",
  "suppliers:manage",
  "purchasing:view",
  "purchasing:create",
  "purchasing:approve",
  "purchasing:receive",
  "customers:view",
  "customers:manage",
  "sales:view",
  "sales:create",
  "sales:approve",
  "deliveries:view",
  "deliveries:manage",
  "deliveries:update_status",
  "finance:view",
  "finance:manage",
  "reports:view",
  "users:view",
  "users:manage",
  "settings:view",
  "settings:manage",
  "audit:view",
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  OWNER: ALL_PERMISSIONS,
  MANAGER: [
    "dashboard:view",
    "products:view",
    "products:manage",
    "inventory:view",
    "inventory:adjust",
    "inventory:transfer",
    "warehouses:view",
    "warehouses:manage",
    "suppliers:view",
    "suppliers:manage",
    "purchasing:view",
    "purchasing:create",
    "purchasing:approve",
    "purchasing:receive",
    "customers:view",
    "customers:manage",
    "sales:view",
    "sales:create",
    "sales:approve",
    "deliveries:view",
    "deliveries:manage",
    "deliveries:update_status",
    "finance:view",
    "finance:manage",
    "reports:view",
    "users:view",
    "settings:view",
    "audit:view",
  ],
  WAREHOUSE_STAFF: [
    "dashboard:view",
    "products:view",
    "inventory:view",
    "inventory:adjust",
    "inventory:transfer",
    "warehouses:view",
    "purchasing:view",
    "purchasing:receive",
    "sales:view",
    "deliveries:view",
  ],
  SALES_STAFF: [
    "dashboard:view",
    "products:view",
    "inventory:view",
    "customers:view",
    "customers:manage",
    "sales:view",
    "sales:create",
    "deliveries:view",
    "finance:view",
  ],
  DELIVERY_STAFF: [
    "dashboard:view",
    "deliveries:view",
    "deliveries:update_status",
    "customers:view",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
