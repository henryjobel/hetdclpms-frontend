import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function BOQTitlePage() {
  return (
    <SimpleMasterPage
      title="BOQ Titles"
      subtitle="Configure BOQ phases and title groups used for construction estimates"
      masterKey="boq_titles"
      singularLabel="BOQ Title"
      fields={[
        { key: "name", label: "Title", required: true },
        { key: "phase", label: "Phase" },
        { key: "sortOrder", label: "Sort Order", type: "number" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}
