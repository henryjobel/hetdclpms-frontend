import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function Page() {
  return <SimpleMasterPage title="Shifts" subtitle="Maintain daily shift schedule master data for staff allocation" masterKey="shifts" singularLabel="Shift" fields={[
    { key: "name", label: "Shift Name", required: true },
    { key: "startTime", label: "Start Time", required: true },
    { key: "endTime", label: "End Time", required: true },
    { key: "notes", label: "Notes", type: "textarea" },
  ]} />;
}
