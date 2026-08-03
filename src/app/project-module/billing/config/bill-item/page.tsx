import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function BillItemPage() {
  return (
    <SimpleMasterPage
      title="Bill Items"
      subtitle="Configure reusable bill items and standard rates"
      masterKey="bill_items"
      singularLabel="Bill Item"
      fields={[
        { key: "name", label: "Item Name", required: true },
        { key: "code", label: "Code" },
        { key: "unit", label: "Unit" },
        { key: "defaultRate", label: "Default Rate", type: "number" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}
