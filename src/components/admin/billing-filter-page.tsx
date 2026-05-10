"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { billsApi, operationsApi, projectsApi } from "@/lib/api";
import { FileText, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BillingFilterPageProps {
  title: string;
  subtitle: string;
  mode: "period" | "adjustment" | "labor-worker-bills" | "vendor-bills" | "contractor-work-orders" | "quotes";
}

export function BillingFilterPage({ title, subtitle, mode }: BillingFilterPageProps) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRows() {
      try {
        if (mode === "period" || mode === "adjustment" || mode === "labor-worker-bills") {
          const response = await operationsApi.getBilling();
          const data = response.data.data || [];
          const typeMap = {
            period: "PERCENTAGE",
            adjustment: "ADJUSTMENT",
            "labor-worker-bills": "LABOR",
          };
          setRows(data.filter((row: { billingType: string }) => row.billingType === typeMap[mode]));
        } else if (mode === "vendor-bills") {
          const response = await billsApi.getAll();
          setRows(response.data.data || []);
        } else if (mode === "contractor-work-orders") {
          const response = await projectsApi.getWorkOrders();
          setRows(response.data.data || []);
        } else if (mode === "quotes") {
          const response = await projectsApi.getQuotations();
          setRows(response.data.data || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchRows();
  }, [mode]);

  const totalAmount = rows.reduce((sum, row) =>
    sum + Number(row.amount || row.totalAmount || row.billedAmount || 0), 0);

  return (
    <MainLayout title={title} subtitle={subtitle}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Records" value={rows.length} icon={FileText} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Total Amount" value={formatCurrency(totalAmount)} icon={FileText} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Approved/Active" value={rows.filter((row) => ["APPROVED", "approved", "active", "draft"].includes(String(row.status || ""))).length} icon={FileText} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Pending" value={rows.filter((row) => String(row.status || "").toLowerCase().includes("pending") || String(row.status || "").toLowerCase().includes("draft")).length} icon={FileText} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader><CardTitle>{title} Register</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={rows}
              columns={Object.keys(rows[0] || {}).slice(0, 7).map((key) => ({
                key,
                header: key.replace(/([A-Z])/g, " $1").trim(),
                render: (value: unknown) => {
                  if (typeof value === "number") return formatCurrency(value);
                  if (String(key).toLowerCase().includes("date") && value) return formatDate(String(value));
                  if (typeof value === "object" && value !== null) {
                    return String((value as { name?: string; title?: string }).name ?? (value as { title?: string }).title ?? "-");
                  }
                  return String(value ?? "-");
                },
              }))}
            />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
