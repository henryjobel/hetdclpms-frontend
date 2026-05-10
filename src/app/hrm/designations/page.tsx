import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function Page() {
  return <SimpleMasterPage title="Designations" subtitle="Maintain employee designations and reporting structure labels" masterKey="designations" singularLabel="Designation" fields={[
    { key: "name", label: "Designation Name", required: true },
    { key: "code", label: "Code", required: true },
    { key: "grade", label: "Grade" },
    { key: "notes", label: "Notes", type: "textarea" },
  ]} />;
}
