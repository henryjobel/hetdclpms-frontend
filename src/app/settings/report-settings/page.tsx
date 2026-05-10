import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function Page() {
  return (
    <SimpleMasterPage
      title="Report Settings"
      subtitle="Store signature blocks and report footer configuration"
      masterKey="report_settings"
      singularLabel="Report Setting"
      fields={[
        { key: "name", label: "Signature Name", required: true },
        { key: "designation", label: "Designation", required: true },
        { key: "company", label: "Company" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
