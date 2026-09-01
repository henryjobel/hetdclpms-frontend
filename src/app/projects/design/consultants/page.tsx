import { MainLayout } from "@/components/layout/main-layout";
import { DesignConsultantsPage } from "@/components/project-module/design-pages";

export default function Page() {
  return (
    <MainLayout title="Architect / Consultant Profile" subtitle="Manage architect, design firm and engineering consultant profiles">
      <DesignConsultantsPage />
    </MainLayout>
  );
}
