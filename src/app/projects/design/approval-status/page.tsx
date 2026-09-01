import { MainLayout } from "@/components/layout/main-layout";
import { DesignRecordsPage } from "@/components/project-module/design-pages";

export default function Page() {
  return (
    <MainLayout title="Drawing Approval Status" subtitle="Monitor submitted, under review, approved, revision and rejected drawings">
      <DesignRecordsPage
        title="Drawing Approval Status"
        subtitle="Monitor submitted, under review, approved, revision and rejected drawings"
        defaultCategory="Drawing Approval"
        lockCategory
      />
    </MainLayout>
  );
}
