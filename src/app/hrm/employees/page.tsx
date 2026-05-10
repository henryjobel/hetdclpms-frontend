import { SimpleMasterPage } from "@/components/admin/simple-master-page";

export default function Page() {
  return <SimpleMasterPage title="Employees" subtitle="Maintain lightweight employee master data for admin and HR references" masterKey="employees" singularLabel="Employee" fields={[
    { key: "name", label: "Employee Name", required: true },
    { key: "employeeId", label: "Employee ID", required: true },
    { key: "phone", label: "Phone" },
    { key: "designation", label: "Designation" },
  ]} />;
}
