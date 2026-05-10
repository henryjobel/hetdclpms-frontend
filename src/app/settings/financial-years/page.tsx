import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function Page() {
  return (
    <SimpleMasterPage
      title="Financial Years"
      subtitle="Manage financial year master data used by reports and statements"
      masterKey="financial_years"
      singularLabel="Financial Year"
      fields={[
        { key: "name", label: "Title", required: true },
        { key: "startDate", label: "Start Date", type: "date", required: true },
        { key: "endDate", label: "End Date", type: "date", required: true },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
