import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function Page() {
  return (
    <SimpleMasterPage
      title="Currency"
      subtitle="Maintain supported currencies and display metadata"
      masterKey="currencies"
      singularLabel="Currency"
      fields={[
        { key: "name", label: "Currency Name", required: true },
        { key: "code", label: "Code", required: true },
        { key: "symbol", label: "Symbol", required: true },
        { key: "exchangeRate", label: "Exchange Rate", type: "number" },
      ]}
    />
  );
}
