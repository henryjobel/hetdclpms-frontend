import { MainLayout } from "@/components/layout/main-layout";
import { DesignRecordsPage } from "@/components/project-module/design-pages";

export default function Page() {
  return (
    <MainLayout title="Approval Document Upload" subtitle="Upload and manage approval documents, permits and drawing files">
      <DesignRecordsPage
        title="Approval Document Upload"
        subtitle="Upload and manage approval documents, permits and drawing files"
        defaultCategory="Approval Document"
        lockCategory
      />
    </MainLayout>
  );
}
