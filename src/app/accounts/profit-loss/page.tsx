"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { accountsApi, projectsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  totalProfit: number;
}

interface ProjectPL {
  projectId: string;
  projectName: string;
  income: number;
  materialExpense: number;
  laborCost: number;
  contractorCost: number;
  totalExpense: number;
  profit: number;
  margin: number;
}

interface Project { id: string; name: string; type: string; status: string }

export default function ProfitLossPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectPLs, setProjectPLs] = useState<ProjectPL[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [sr, pr] = await Promise.all([
          accountsApi.getDashboardSummary(),
          projectsApi.getAll(),
        ]);
        setStats(sr.data.data);
        const allProjects: Project[] = pr.data.data || [];
        setProjects(allProjects);

        const pls = await Promise.all(
          allProjects.map((p) =>
            accountsApi.getProfitLoss({ projectId: p.id })
              .then((r) => r.data.data as ProjectPL)
              .catch(() => null)
          )
        );
        setProjectPLs(pls.filter(Boolean) as ProjectPL[]);
      } catch { /* noop */ }
      finally { setLoading(false); }
    }
    fetchAll();
  }, []);

  const chartData = projectPLs.map((pl) => ({
    name: pl.projectName.split(" ")[0],
    Income: Math.round(pl.income / 100000),
    Expense: Math.round(pl.totalExpense / 100000),
    Profit: Math.round(pl.profit / 100000),
  }));

  if (loading) {
    return (
      <MainLayout title="Profit & Loss" subtitle="Company-wide and project-wise profit/loss analysis">
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Profit & Loss" subtitle="Company-wide and project-wise profit/loss analysis">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Company P&L Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <span className="text-sm font-semibold text-green-700">{stats ? formatCurrency(stats.totalIncome) : "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Total Expenses</span>
              <span className="text-sm font-semibold text-red-600">{stats ? `(${formatCurrency(stats.totalExpense)})` : "—"}</span>
            </div>
            <div className="flex justify-between py-3 bg-emerald-50 rounded-xl px-3">
              <span className="text-sm font-bold text-gray-800">Net Profit</span>
              <span className="text-sm font-bold text-emerald-700">{stats ? formatCurrency(stats.totalProfit) : "—"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-xs text-gray-400">Profit Margin</span>
              <span className="text-sm font-semibold text-emerald-600">
                {stats && stats.totalIncome > 0 ? `${((stats.totalProfit / stats.totalIncome) * 100).toFixed(1)}%` : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Project-wise P&L (Lakh ৳)</CardTitle></CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">No project P&L data available yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip formatter={(v) => [`${Number(v)}L`, ""]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Profit" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project-wise P&L Table */}
      <Card>
        <CardHeader><CardTitle>Project-wise Profit & Loss Detail</CardTitle></CardHeader>
        <CardContent className="p-0">
          {projectPLs.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No project data found</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Project", "Income", "Material", "Labor", "Contractor", "Total Expense", "Net P&L", "Margin"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {projectPLs.map((pl) => (
                  <tr key={pl.projectId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{pl.projectName}</td>
                    <td className="px-4 py-3 text-sm text-green-700 font-medium">{formatCurrency(pl.income)}</td>
                    <td className="px-4 py-3 text-sm text-red-600">{formatCurrency(pl.materialExpense)}</td>
                    <td className="px-4 py-3 text-sm text-red-600">{formatCurrency(pl.laborCost)}</td>
                    <td className="px-4 py-3 text-sm text-red-600">{formatCurrency(pl.contractorCost)}</td>
                    <td className="px-4 py-3 text-sm text-red-600 font-medium">{formatCurrency(pl.totalExpense)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {pl.profit >= 0
                          ? <TrendingUp className="w-4 h-4 text-green-500" />
                          : <TrendingDown className="w-4 h-4 text-red-500" />}
                        <span className={`text-sm font-bold ${pl.profit >= 0 ? "text-green-700" : "text-red-600"}`}>
                          {formatCurrency(Math.abs(pl.profit))}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{pl.margin.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
