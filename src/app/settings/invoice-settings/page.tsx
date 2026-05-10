import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function Page() {
  return (
    <SimpleMasterPage
      title="Invoice Settings"
      subtitle="Configure prefixes, company mapping and invoice numbering rules"
      masterKey="invoice_settings"
      singularLabel="Invoice Setting"
      fields={[
        { key: "name", label: "Setting Name", required: true },
        { key: "company", label: "Company", required: true },
        { key: "prefix", label: "Prefix", required: true },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
