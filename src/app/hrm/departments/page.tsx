import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function Page() {
  return <SimpleMasterPage title="Departments" subtitle="Maintain department master data for HR and workflow references" masterKey="departments" singularLabel="Department" fields={[
    { key: "name", label: "Department Name", required: true },
    { key: "code", label: "Code", required: true },
    { key: "head", label: "Department Head" },
    { key: "notes", label: "Notes", type: "textarea" },
  ]} />;
}
