"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { realEstateApi } from "@/lib/api";
import { Building2, Home, ClipboardList, DollarSign, Loader2 } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Summary {
  totalUnits: number;
  availableUnits: number;
  bookedUnits: number;
  soldUnits: number;
  totalBookings: number;
  totalSales: number;
  totalCollected: number;
  totalDue: number;
}

interface Sale {
  id: string;
  saleNo: string;
  customerName: string;
  saleAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  project: { name: string };
  unit: { unitNo: string; type: string };
}

export default function RealEstateOverviewPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sr, sal] = await Promise.all([
          realEstateApi.getSummary(),
          realEstateApi.getSales(),
        ]);
        setSummary(sr.data.data);
        setRecentSales((sal.data.data || []).slice(0, 8));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <MainLayout title="Real Estate Overview" subtitle="Flat, land, booking and sale management summary">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Units" value={summary?.totalUnits ?? "—"} icon={Building2} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Available" value={summary?.availableUnits ?? "—"} icon={Home} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="Booked" value={summary?.bookedUnits ?? "—"} icon={ClipboardList} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Sold" value={summary?.soldUnits ?? "—"} icon={DollarSign} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Bookings" value={summary?.totalBookings ?? "—"} icon={ClipboardList} iconColor="text-cyan-600" iconBg="bg-cyan-50" />
        <StatCard title="Total Sales" value={summary ? `৳${formatNumber(summary.totalSales)}` : "—"} icon={DollarSign} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Collected" value={summary ? `৳${formatNumber(summary.totalCollected)}` : "—"} icon={DollarSign} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Due" value={summary ? `৳${formatNumber(summary.totalDue)}` : "—"} icon={DollarSign} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Flat/Land Sales</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={recentSales as unknown as Record<string, unknown>[]}
              columns={[
                { key: "saleNo", header: "Sale No" },
                { key: "customerName", header: "Customer" },
                { key: "project", header: "Project", render: (_v, row) => (row as unknown as Sale).project.name },
                { key: "unit", header: "Unit", render: (_v, row) => `${(row as unknown as Sale).unit.unitNo} (${(row as unknown as Sale).unit.type})` },
                { key: "saleAmount", header: "Sale Amount", render: (v) => formatCurrency(v as number) },
                { key: "paidAmount", header: "Collected", render: (v) => <span className="text-green-700">{formatCurrency(v as number)}</span> },
                { key: "dueAmount", header: "Due", render: (v) => <span className="text-red-600">{formatCurrency(v as number)}</span> },
                { key: "status", header: "Status" },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
