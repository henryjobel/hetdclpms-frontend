"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { billsApi } from "@/lib/api";
import { CreditCard, DollarSign, Loader2 } from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

interface Bill {
  id: string;
  billNumber: string;
  type: string;
  amount: number;
  status: string;
  dueDate?: string;
  billDate: string;
  project?: { name: string };
  supplier?: { name: string };
  contractor?: { name: string };
}

const statusVariant: Record<string, "success" | "warning" | "danger" | "info"> = {
  paid: "success", unpaid: "warning", overdue: "danger",
};

export default function PayablePage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    billsApi.getAll()
      .then((r) => setBills(r.data.data || []))
      .catch(() => setBills([]))
      .finally(() => setLoading(false));
  }, []);

  const totalAmount = bills.reduce((a, b) => a + b.amount, 0);
  const totalDue = bills.filter((b) => b.status !== "paid").reduce((a, b) => a + b.amount, 0);

  const tableData = bills.map((b) => ({
    billNumber: b.billNumber,
    party: b.supplier?.name ?? b.contractor?.name ?? "—",
    type: b.type,
    project: b.project?.name ?? "—",
    amount: b.amount,
    dueDate: b.dueDate,
    status: b.status,
    _bill: b,
  }));

  return (
    <MainLayout title="Accounts Payable" subtitle="Money owed to suppliers, contractors and service providers">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Payable" value={`৳${formatNumber(totalAmount)}`} icon={CreditCard} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Outstanding Due" value={`৳${formatNumber(totalDue)}`} icon={DollarSign} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatCard title="Overdue" value={bills.filter((b) => b.status === "overdue").length} icon={CreditCard} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Paid" value={bills.filter((b) => b.status === "paid").length} icon={DollarSign} iconColor="text-green-600" iconBg="bg-green-50" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payable List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : bills.length === 0 ? (
            <p className="px-6 py-12 text-sm text-gray-400 text-center">No payables found. Bills created in Project Bills will appear here.</p>
          ) : (
            <DataTable
              data={tableData as unknown as Record<string, unknown>[]}
              columns={[
                { key: "billNumber", header: "Bill No" },
                { key: "party", header: "Party" },
                { key: "type", header: "Type", render: (v) => <Badge variant="default">{v as string}</Badge> },
                { key: "project", header: "Project" },
                { key: "amount", header: "Amount", render: (v) => formatCurrency(v as number) },
                { key: "dueDate", header: "Due Date", render: (v) => v ? formatDate(v as string) : "—" },
                { key: "status", header: "Status", render: (v) => <Badge variant={statusVariant[v as string] ?? "default"}>{v as string}</Badge> },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
