import { MainLayout } from "@/components/layout/main-layout";
import { SiteManagementPage } from "@/components/project-module/native-pages";

export default function Page() {
  return (
    <MainLayout title="Project Team & Site" subtitle="Track site engineer, supervisor, safety officer and site setup">
      <SiteManagementPage />
    </MainLayout>
  );
}
