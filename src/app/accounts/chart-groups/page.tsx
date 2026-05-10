import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function Page() {
  return (
    <SimpleMasterPage
      title="Chart Groups"
      subtitle="Maintain account grouping hierarchy for chart structure and statement mapping"
      masterKey="chart_groups"
      singularLabel="Chart Group"
      fields={[
        { key: "name", label: "Group Name", required: true },
        { key: "code", label: "Group Code", required: true },
        { key: "parentCode", label: "Parent Code" },
        { key: "nature", label: "Nature" },
      ]}
    />
  );
}
