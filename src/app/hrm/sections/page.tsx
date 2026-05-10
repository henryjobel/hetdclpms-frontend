import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function Page() {
  return <SimpleMasterPage title="Sections" subtitle="Maintain section records within departments or business units" masterKey="sections" singularLabel="Section" fields={[
    { key: "name", label: "Section Name", required: true },
    { key: "code", label: "Code", required: true },
    { key: "department", label: "Department" },
    { key: "notes", label: "Notes", type: "textarea" },
  ]} />;
}
