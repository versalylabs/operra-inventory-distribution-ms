import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { ProductService } from "@/services/product.service";
import { CategoriesClient } from "./CategoriesClient";

export default async function CategoriesPage() {
  const context = await requireAuth();

  const categories = await ProductService.listCategories(
    context.organization.id
  );

  return (
    <CategoriesClient
      initialCategories={categories}
      canManage={hasPermission(context.membership.role, "products:manage")}
    />
  );
}
