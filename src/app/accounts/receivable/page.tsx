"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { accountsApi } from "@/lib/api";
import { Banknote, DollarSign, Loader2 } from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

interface Installment {
  id: string;
  client: string;
  unit: string;
  totalAmount: number;
  paid: number;
  status: string;
  project: { name: string };
  schedule: Array<{ dueDate: string; status: string }>;
}

const statusVariant: Record<string, "success" | "danger" | "gray"> = {
  ACTIVE: "success", OVERDUE: "danger", COMPLETED: "gray",
};

export default function ReceivablePage() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountsApi.getInstallments()
      .then((r) => setInstallments(r.data.data || []))
      .catch(() => setInstallments([]))
      .finally(() => setLoading(false));
  }, []);

  const total = installments.reduce((a, i) => a + i.totalAmount, 0);
  const collected = installments.reduce((a, i) => a + i.paid, 0);
  const remaining = installments.reduce((a, i) => a + (i.totalAmount - i.paid), 0);

  const tableData = installments.map((i) => ({
    client: i.client,
    project: i.project.name,
    unit: i.unit,
    totalAmount: i.totalAmount,
    collected: i.paid,
    remaining: i.totalAmount - i.paid,
    nextDue: i.schedule.find((s) => s.status === "unpaid")?.dueDate ?? null,
    status: i.status,
  }));

  return (
    <MainLayout title="Accounts Receivable" subtitle="Money owed by clients and buyers">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Receivable" value={`৳${formatNumber(total)}`} icon={Banknote} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Collected" value={`৳${formatNumber(collected)}`} icon={DollarSign} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Outstanding" value={`৳${formatNumber(remaining)}`} icon={DollarSign} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Overdue Clients" value={installments.filter((i) => i.status === "OVERDUE").length} icon={Banknote} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receivable List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : installments.length === 0 ? (
            <p className="px-6 py-12 text-sm text-gray-400 text-center">No receivables found. Create installment plans in Accounts → Installments.</p>
          ) : (
            <DataTable
              data={tableData as unknown as Record<string, unknown>[]}
              columns={[
                { key: "client", header: "Client" },
                { key: "project", header: "Project" },
                { key: "unit", header: "Unit" },
                { key: "totalAmount", header: "Total Amount", render: (v) => formatCurrency(v as number) },
                { key: "collected", header: "Collected", render: (v) => <span className="text-green-700 font-medium">{formatCurrency(v as number)}</span> },
                { key: "remaining", header: "Remaining", render: (v) => <span className="text-red-600 font-medium">{formatCurrency(v as number)}</span> },
                { key: "nextDue", header: "Next Due", render: (v) => v ? formatDate(v as string) : <span className="text-gray-400">—</span> },
                { key: "status", header: "Status", render: (v) => <Badge variant={statusVariant[v as string] ?? "default"}>{(v as string).toLowerCase()}</Badge> },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
