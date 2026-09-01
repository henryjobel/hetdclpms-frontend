import { MainLayout } from "@/components/layout/main-layout";
import { DesignRecordsPage } from "@/components/project-module/design-pages";

export default function Page() {
  return (
    <MainLayout title="Drawing Submission" subtitle="Track architectural, structural and MEP drawing submissions by project">
      <DesignRecordsPage
        title="Drawing Submission"
        subtitle="Track architectural, structural and MEP drawing submissions by project"
        defaultCategory="Drawing Submission"
        lockCategory
      />
    </MainLayout>
  );
}
