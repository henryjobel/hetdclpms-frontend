"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { realEstateApi } from "@/lib/api";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { AlertTriangle, Clock3, Loader2, Receipt, Wallet } from "lucide-react";

interface AgingBucket {
  bucket: string;
  amount: number;
}

interface AgingRow {
  id: string;
  saleNo: string;
  customerName: string;
  projectName: string;
  unitNo: string;
  unitType: string;
  saleDate: string;
  saleAmount: number;
  paidAmount: number;
  dueAmount: number;
  daysOverdue: number;
  agingBucket: string;
}

interface AgingSummary {
  totalDue: number;
  overdueAccounts: number;
  buckets: AgingBucket[];
  rows: AgingRow[];
}

export default function AgingReportPage() {
  const [summary, setSummary] = useState<AgingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await realEstateApi.getAgingReport();
        setSummary(response.data.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <MainLayout title="Aging Report" subtitle="Outstanding flat and land dues grouped by aging bucket">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Due" value={summary ? formatCurrency(summary.totalDue) : "-"} icon={Wallet} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatCard title="Overdue Accounts" value={summary ? formatNumber(summary.overdueAccounts) : "-"} icon={Receipt} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="31-60 Days" value={summary ? formatCurrency(summary.buckets.find((item) => item.bucket === "31-60 Days")?.amount || 0) : "-"} icon={Clock3} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="90+ Days" value={summary ? formatCurrency(summary.buckets.find((item) => item.bucket === "90+ Days")?.amount || 0) : "-"} icon={AlertTriangle} iconColor="text-rose-600" iconBg="bg-rose-50" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <CardHeader><CardTitle>Aging Buckets</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
            ) : (
              <DataTable
                data={(summary?.buckets || []) as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "bucket", header: "Bucket" },
                  { key: "amount", header: "Due Amount", render: (v) => formatCurrency(v as number) },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Outstanding Sale List</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
            ) : (
              <DataTable
                data={(summary?.rows || []) as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "saleNo", header: "Sale No" },
                  { key: "customerName", header: "Customer" },
                  { key: "projectName", header: "Project" },
                  { key: "unitNo", header: "Unit" },
                  { key: "saleDate", header: "Sale Date", render: (v) => formatDate(v as string) },
                  { key: "daysOverdue", header: "Days" },
                  { key: "agingBucket", header: "Bucket" },
                  { key: "dueAmount", header: "Due", render: (v) => <span className="text-red-600">{formatCurrency(v as number)}</span> },
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
