import { MainLayout } from "@/components/layout/main-layout";
import { DesignRecordsPage } from "@/components/project-module/design-pages";

export default function Page() {
  return (
    <MainLayout title="Structural / MEP / Soil Test Records" subtitle="Track structural design, MEP design and soil test consultant records">
      <DesignRecordsPage
        title="Structural / MEP / Soil Test Records"
        subtitle="Track structural design, MEP design and soil test consultant records"
      />
    </MainLayout>
  );
}
