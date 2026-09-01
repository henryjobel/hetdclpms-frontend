import { MainLayout } from "@/components/layout/main-layout";
import AssignSharePage from "@/app/project-module/share-project/assign-share/page";

export default function Page() {
  return (
    <MainLayout title="Owner vs Developer Share" subtitle="Manage owner, developer and investor share assignment">
      <AssignSharePage />
    </MainLayout>
  );
}
