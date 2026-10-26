import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const context = await requireAuth();
  const org = context.organization;

  return (
    <SettingsClient
      organization={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        email: org.email,
        phone: org.phone,
        address: org.address,
        city: org.city,
        country: org.country,
        taxNumber: org.taxNumber,
        currency: org.currency,
        timezone: org.timezone,
        allowNegativeStock: org.allowNegativeStock,
        valuationMethod: org.valuationMethod,
        invoicePrefix: org.invoicePrefix,
        orderPrefix: org.orderPrefix,
        purchasePrefix: org.purchasePrefix,
        deliveryPrefix: org.deliveryPrefix,
        transferPrefix: org.transferPrefix,
        defaultPaymentTerms: org.defaultPaymentTerms,
        defaultTaxRate: Number(org.defaultTaxRate),
      }}
      canEdit={hasPermission(context.membership.role, "settings:manage")}
    />
  );
}
