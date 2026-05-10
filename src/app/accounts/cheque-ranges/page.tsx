import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function Page() {
  return (
    <SimpleMasterPage
      title="Cheque Ranges"
      subtitle="Register cheque books, ranges and current usage tracking by bank account"
      masterKey="cheque_ranges"
      singularLabel="Cheque Range"
      fields={[
        { key: "name", label: "Range Name", required: true },
        { key: "bankName", label: "Bank Name", required: true },
        { key: "startNo", label: "Start No", required: true },
        { key: "endNo", label: "End No", required: true },
      ]}
    />
  );
}
