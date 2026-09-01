import { MainLayout } from "@/components/layout/main-layout";
import { DesignRecordsPage } from "@/components/project-module/design-pages";

export default function Page() {
  return (
    <MainLayout title="Design & Approval Records" subtitle="Track drawings, consultant submissions, approvals and payments">
      <DesignRecordsPage />
    </MainLayout>
  );
}
