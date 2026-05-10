"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { realEstateApi } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { BarChart3, Banknote, DollarSign, Loader2, Wallet } from "lucide-react";

interface Totals {
  totalSales: number;
  totalCollected: number;
  totalDue: number;
  fullyPaid: number;
  partial: number;
  due: number;
}

interface MonthlyCollection {
  period: string;
  collected: number;
  sales: number;
  due: number;
}

interface ProjectSummary {
  projectId: string;
  projectName: string;
  totalSales: number;
  collected: number;
  due: number;
  units: number;
}

export default function CollectionReportPage() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [monthlyCollections, setMonthlyCollections] = useState<MonthlyCollection[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await realEstateApi.getCollectionReport();
        const payload = response.data.data;
        setTotals(payload.totals);
        setMonthlyCollections(payload.monthlyCollections || []);
        setProjects(payload.projects || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <MainLayout title="Collection Report" subtitle="Flat and land sale collection, due and project-wise realization summary">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Sales" value={totals ? formatCurrency(totals.totalSales) : "-"} icon={DollarSign} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="Collected" value={totals ? formatCurrency(totals.totalCollected) : "-"} icon={Banknote} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Outstanding Due" value={totals ? formatCurrency(totals.totalDue) : "-"} icon={Wallet} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatCard title="Fully Paid Sales" value={totals ? formatNumber(totals.fullyPaid) : "-"} icon={BarChart3} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Monthly Collection Trend</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
            ) : (
              <DataTable
                data={monthlyCollections as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "period", header: "Month" },
                  { key: "sales", header: "Sales", render: (v) => formatCurrency(v as number) },
                  { key: "collected", header: "Collected", render: (v) => <span className="text-green-700">{formatCurrency(v as number)}</span> },
                  { key: "due", header: "Due", render: (v) => <span className="text-red-600">{formatCurrency(v as number)}</span> },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Project-wise Collection</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
            ) : (
              <DataTable
                data={projects as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "projectName", header: "Project" },
                  { key: "units", header: "Units Sold" },
                  { key: "totalSales", header: "Sales", render: (v) => formatCurrency(v as number) },
                  { key: "collected", header: "Collected", render: (v) => <span className="text-green-700">{formatCurrency(v as number)}</span> },
                  { key: "due", header: "Due", render: (v) => <span className="text-red-600">{formatCurrency(v as number)}</span> },
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
