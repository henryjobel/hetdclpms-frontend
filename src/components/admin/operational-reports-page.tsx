"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { reportsApi } from "@/lib/api";
import { Download, FileText, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OperationalData {
  summary: Record<string, number>;
  receivables: Record<string, unknown>[];
  payables: Record<string, unknown>[];
  installments: Record<string, unknown>[];
  receipts: Record<string, unknown>[];
}

export function OperationalReportsPage() {
  const [data, setData] = useState<OperationalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.getOperational().then((response) => {
      setData(response.data.data || null);
    }).finally(() => setLoading(false));
  }, []);

  async function exportCsv(type: string, filename: string) {
    const response = await reportsApi.exportCsv(type);
    const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  const summary = data?.summary ?? {};

  return (
    <MainLayout title="Operational Reports" subtitle="Centralized operational bundle for receivable, payable, receipt and installment reporting">
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { type: "financial", label: "Financial" },
          { type: "installments", label: "Installments" },
          { type: "grn", label: "GRN" },
          { type: "profit-loss", label: "Profit & Loss" },
        ].map((item) => (
          <button key={item.type} onClick={() => exportCsv(item.type, `${item.type}.csv`)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4 text-amber-500" /> Export {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Receipts" value={formatCurrency(summary.totalReceipts ?? 0)} icon={FileText} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Payments" value={formatCurrency(summary.totalPayments ?? 0)} icon={FileText} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatCard title="Receivables" value={formatCurrency(summary.totalReceivables ?? 0)} icon={FileText} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Payables" value={formatCurrency(summary.totalPayables ?? 0)} icon={FileText} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ReportCard title="Receivable Snapshot" data={data?.receivables || []} />
          <ReportCard title="Payable Snapshot" data={data?.payables || []} />
          <ReportCard title="Installment Snapshot" data={data?.installments || []} />
          <ReportCard title="Receipt Snapshot" data={data?.receipts || []} />
        </div>
      )}
    </MainLayout>
  );
}

function ReportCard({ title, data }: { title: string; data: Record<string, unknown>[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <DataTable
          data={data.slice(0, 10)}
          columns={Object.keys(data[0] || {}).slice(0, 6).map((key) => ({
            key,
            header: key.replace(/([A-Z])/g, " $1").trim(),
            render: (value: unknown) => typeof value === "number" ? formatCurrency(value) : String(value ?? "-"),
          }))}
        />
      </CardContent>
    </Card>
  );
}
