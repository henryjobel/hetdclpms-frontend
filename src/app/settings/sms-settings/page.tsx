import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function Page() {
  return (
    <SimpleMasterPage
      title="SMS Settings"
      subtitle="Maintain messaging provider credentials and sender information"
      masterKey="sms_settings"
      singularLabel="SMS Setting"
      fields={[
        { key: "name", label: "Provider Name", required: true },
        { key: "url", label: "API URL", required: true },
        { key: "apiKey", label: "API Key", required: true },
        { key: "senderId", label: "Sender ID" },
      ]}
    />
  );
}
