import { MainLayout } from "@/components/layout/main-layout";
import { DesignRecordsPage } from "@/components/project-module/design-pages";

export default function Page() {
  return (
    <MainLayout title="Design Payment Tracking" subtitle="Track consultant fee, paid amount and outstanding design payment">
      <DesignRecordsPage
        title="Design Payment Tracking"
        subtitle="Track consultant fee, paid amount and outstanding design payment"
        defaultCategory="Design Payment"
        lockCategory
      />
    </MainLayout>
  );
}
