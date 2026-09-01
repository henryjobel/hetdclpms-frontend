import { MainLayout } from "@/components/layout/main-layout";
import { DesignRecordsPage } from "@/components/project-module/design-pages";

export default function Page() {
  return (
    <MainLayout title="Design Contract / Fee" subtitle="Track design contract value, fee amount, paid amount and due amount">
      <DesignRecordsPage
        title="Design Contract / Fee"
        subtitle="Track design contract value, fee amount, paid amount and due amount"
        defaultCategory="Design Contract / Fee"
        lockCategory
      />
    </MainLayout>
  );
}
