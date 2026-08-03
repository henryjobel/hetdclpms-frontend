import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function ServiceWorkNamePage() {
  return (
    <SimpleMasterPage
      title="Service / Work Names"
      subtitle="Configure reusable service and work names for requisition, work order and billing"
      masterKey="service_work_names"
      singularLabel="Service/Work"
      fields={[
        { key: "name", label: "Service/Work Name", required: true },
        { key: "code", label: "Code" },
        { key: "unit", label: "Unit" },
        { key: "defaultRate", label: "Default Rate", type: "number" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}
