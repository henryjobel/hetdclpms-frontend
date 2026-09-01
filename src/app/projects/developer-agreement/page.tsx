import { MainLayout } from "@/components/layout/main-layout";
import { DocumentsPage } from "@/components/project-module/native-pages";

export default function Page() {
  return (
    <MainLayout title="Developer Agreement" subtitle="Upload and track developer agreements with project documents">
      <DocumentsPage />
    </MainLayout>
  );
}
