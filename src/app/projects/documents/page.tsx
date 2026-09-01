import { MainLayout } from "@/components/layout/main-layout";
import { DocumentsPage } from "@/components/project-module/native-pages";

export default function Page() {
  return (
    <MainLayout title="Project Documents" subtitle="Deed, mutation, approval and project document register">
      <DocumentsPage />
    </MainLayout>
  );
}
