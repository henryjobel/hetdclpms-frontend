import { MainLayout } from "@/components/layout/main-layout";
import { ProjectReportsPage } from "@/components/project-module/native-pages";

export default function Page() {
  return (
    <MainLayout title="Site Report" subtitle="Project progress, cost and operational reporting">
      <ProjectReportsPage />
    </MainLayout>
  );
}
