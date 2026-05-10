"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { accountsApi } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Banknote, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  totalProfit: number;
  totalDue: number;
  accountsPayable: number;
  accountsReceivable: number;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

const typeVariant: Record<string, "success" | "danger" | "info" | "warning" | "default"> = {
  ASSET: "info", LIABILITY: "danger", INCOME: "success", EXPENSE: "warning", EQUITY: "default",
};

export default function AccountsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    accountsApi.getDashboardSummary().then((r) => setStats(r.data.data)).catch(() => {});
    accountsApi.getChart().then((r) => setAccounts(r.data.data || [])).catch(() => {});
  }, []);

  return (
    <MainLayout title="Accounts Overview" subtitle="Company financial summary and key metrics">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Income" value={stats ? `৳${formatNumber(stats.totalIncome)}` : "—"} icon={TrendingUp} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Total Expense" value={stats ? `৳${formatNumber(stats.totalExpense)}` : "—"} icon={TrendingDown} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatCard title="Net Profit" value={stats ? `৳${formatNumber(stats.totalProfit)}` : "—"} icon={BarChart3} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="Total Due" value={stats ? `৳${formatNumber(stats.totalDue)}` : "—"} icon={DollarSign} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Accounts Payable" value={stats ? `৳${formatNumber(stats.accountsPayable)}` : "—"} icon={CreditCard} iconColor="text-orange-600" iconBg="bg-orange-50" />
        <StatCard title="Accounts Receivable" value={stats ? `৳${formatNumber(stats.accountsReceivable)}` : "—"} icon={Banknote} iconColor="text-cyan-600" iconBg="bg-cyan-50" />
        <StatCard title="Profit Margin" value={stats && stats.totalIncome > 0 ? `${((stats.totalProfit / stats.totalIncome) * 100).toFixed(1)}%` : "—"} icon={BarChart3} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Net Profit" value={stats ? `৳${formatNumber(stats.totalProfit)}` : "—"} icon={TrendingUp} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      {/* P&L Summary */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Profit & Loss Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Income</span>
              <span className="text-sm font-semibold text-green-700">{stats ? formatCurrency(stats.totalIncome) : "—"}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Expense</span>
              <span className="text-sm font-semibold text-red-600">{stats ? `(${formatCurrency(stats.totalExpense)})` : "—"}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-emerald-50 rounded-xl px-4">
              <span className="text-sm font-semibold text-gray-700">Net Profit</span>
              <span className="text-base font-bold text-emerald-700">{stats ? formatCurrency(stats.totalProfit) : "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-gray-400">Profit Margin</span>
              <span className="text-sm font-semibold text-emerald-600">
                {stats && stats.totalIncome > 0 ? `${((stats.totalProfit / stats.totalIncome) * 100).toFixed(1)}%` : "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart of Accounts */}
      <Card>
        <CardHeader><CardTitle>Chart of Accounts — Summary</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={accounts as unknown as Record<string, unknown>[]}
            columns={[
              { key: "code", header: "Account Code" },
              { key: "name", header: "Account Name" },
              {
                key: "type",
                header: "Type",
                render: (v) => <Badge variant={typeVariant[v as string] ?? "default"}>{(v as string).toLowerCase()}</Badge>,
              },
            ]}
          />
        </CardContent>
      </Card>
    </MainLayout>
  );
}
