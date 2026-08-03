import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function BillingCategoryPage() {
  return (
    <SimpleMasterPage
      title="Billing Categories"
      subtitle="Configure billing categories for contractor, labor, vendor and adjustment bills"
      masterKey="billing_categories"
      singularLabel="Category"
      fields={[
        { key: "name", label: "Category Name", required: true },
        { key: "code", label: "Code" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}
