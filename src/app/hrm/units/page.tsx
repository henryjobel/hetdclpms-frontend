import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function Page() {
  return <SimpleMasterPage title="Units" subtitle="Maintain operational units or business vertical references" masterKey="units" singularLabel="Unit" fields={[
    { key: "name", label: "Unit Name", required: true },
    { key: "code", label: "Code", required: true },
    { key: "location", label: "Location" },
    { key: "notes", label: "Notes", type: "textarea" },
  ]} />;
}
