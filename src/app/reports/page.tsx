"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { accountsApi, projectsApi, inventoryApi, reportsApi } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { Download, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

const COLORS = ["#818cf8", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  totalProfit: number;
  accountsReceivable: number;
  cashFlow?: Array<{ month: string; income: number; expense: number }>;
}

interface SalesForecastResponse {
  monthlyForecast: Array<{ month: string; expected: number; overdue: number; total: number }>;
  projectForecast: Array<{
    projectId: string;
    projectName: string;
    totalUnits: number;
    soldUnits: number;
    unsoldUnits: number;
    totalReceivable: number;
    overdueReceivable: number;
    nextExpected: number;
    collectionRate: number;
  }>;
  summary: {
    totalExpected: number;
    overdueAmount: number;
    totalOutstanding: number;
    totalUnsoldUnits: number;
  };
}

interface Project {
  id: string;
  name: string;
  type?: string;
  budget?: number;
}

interface Product {
  category: string;
  stock: number;
  purchasePrice: number;
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [projectPLs, setProjectPLs] = useState<Array<{ name: string; Income: number; Expense: number; Profit: number }>>([]);
  const [cashFlow, setCashFlow] = useState<Array<{ month: string; income: number; expense: number }>>([]);
  const [forecast, setForecast] = useState<SalesForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function handleExport(type: string, filename: string) {
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

  useEffect(() => {
    async function fetchAll() {
      try {
        const [sr, pr, inr, fr] = await Promise.all([
          accountsApi.getDashboardSummary(),
          projectsApi.getAll(),
          inventoryApi.getProducts(),
          accountsApi.getSalesForecast({ months: "6" }),
        ]);
        const s: DashboardSummary = sr.data.data || sr.data || {};
        const pList: Project[] = pr.data.data || [];
        const prdList: Product[] = inr.data.data || [];
        const f: SalesForecastResponse = fr.data.data || fr.data || {};

        setSummary(s);
        setProjects(pList);
        setProducts(prdList);
        setForecast(f);
        if (s.cashFlow) setCashFlow(s.cashFlow);

        // Fetch P&L per project
        const top = pList.slice(0, 5);
        const plResults = await Promise.allSettled(
          top.map((p) => accountsApi.getProfitLoss({ projectId: p.id }))
        );
        const plData = top.map((p, i) => {
          const r = plResults[i];
          const d = r.status === "fulfilled" ? (r.value.data.data || r.value.data || {}) : {};
          const inc = d.totalIncome ?? 0;
          const exp = d.totalExpense ?? 0;
          return {
            name: p.name.split(" ")[0],
            Income: Math.round(inc / 100000),
            Expense: Math.round(exp / 100000),
            Profit: Math.round((inc - exp) / 100000),
          };
        });
        setProjectPLs(plData);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // Build stock by category from products
  const categoryMap: Record<string, number> = {};
  products.forEach((p) => {
    const val = p.stock * p.purchasePrice;
    categoryMap[p.category] = (categoryMap[p.category] || 0) + val;
  });
  const totalStockValue = Object.values(categoryMap).reduce((a, b) => a + b, 0);
  const stockByCategory = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({
      name,
      value: totalStockValue > 0 ? Math.round((value / totalStockValue) * 100) : 0,
    }));

  // Build project type distribution
  const typeMap: Record<string, { count: number; budget: number }> = {};
  projects.forEach((p) => {
    const t = p.type ?? "Other";
    if (!typeMap[t]) typeMap[t] = { count: 0, budget: 0 };
    typeMap[t].count++;
    typeMap[t].budget += p.budget ?? 0;
  });
  const projectTypeData = Object.entries(typeMap).map(([name, d]) => ({
    name,
    count: d.count,
    value: Math.round(d.budget / 10000000),
  }));

  const income = summary?.totalIncome ?? 0;
  const profit = summary?.totalProfit ?? 0;
  const receivable = summary?.accountsReceivable ?? 0;
  const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : "0.0";
  const forecastSummary = forecast?.summary;

  return (
    <MainLayout title="Reports" subtitle="Company-wide analytics and business reports">
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: "P&L Report", type: "profit-loss", filename: "profit-loss.csv" },
          { label: "Project Summary", type: "projects", filename: "projects.csv" },
          { label: "Financial Data", type: "financial", filename: "financial.csv" },
          { label: "Stock Report", type: "inventory", filename: "inventory.csv" },
          { label: "Installment Report", type: "installments", filename: "installments.csv" },
          { label: "GRN Report", type: "grn", filename: "grn.csv" },
        ].map((r) => (
          <button key={r.type}
            onClick={() => handleExport(r.type, r.filename)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 text-amber-500" /> Export {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
              <p className="text-sm opacity-80 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold">৳{formatNumber(income)}</p>
              <p className="text-xs opacity-70 mt-1">All projects combined</p>
            </div>
            <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
              <p className="text-sm opacity-80 mb-1">Net Profit</p>
              <p className="text-2xl font-bold">৳{formatNumber(profit)}</p>
              <p className="text-xs opacity-70 mt-1">After all expenses</p>
            </div>
            <div className="bg-linear-to-br from-amber-500 to-orange-500 rounded-xl p-5 text-white">
              <p className="text-sm opacity-80 mb-1">Total Receivable</p>
              <p className="text-2xl font-bold">৳{formatNumber(receivable)}</p>
              <p className="text-xs opacity-70 mt-1">From clients</p>
            </div>
            <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
              <p className="text-sm opacity-80 mb-1">Profit Margin</p>
              <p className="text-2xl font-bold">{margin}%</p>
              <p className="text-xs opacity-70 mt-1">Company-wide</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-500 mb-1">Forecasted Collection</p>
              <p className="text-xl font-bold text-gray-900">৳{formatNumber(forecastSummary?.totalExpected ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-1">Upcoming 6 months</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-500 mb-1">Overdue Recovery</p>
              <p className="text-xl font-bold text-red-600">৳{formatNumber(forecastSummary?.overdueAmount ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-1">Past due installments</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-500 mb-1">Outstanding Receivable</p>
              <p className="text-xl font-bold text-blue-700">৳{formatNumber(forecastSummary?.totalOutstanding ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-1">Across all projects</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-500 mb-1">Unsold Units</p>
              <p className="text-xl font-bold text-amber-600">{formatNumber(forecastSummary?.totalUnsoldUnits ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-1">Project inventory left</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader><CardTitle>Monthly Revenue vs Expense</CardTitle></CardHeader>
              <CardContent>
                {cashFlow.length === 0 ? (
                  <p className="text-sm text-gray-400 py-10 text-center">No cash flow data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={cashFlow}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                      <YAxis tickFormatter={(v) => `${formatNumber(v)}`} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip formatter={(v) => [`৳${formatNumber(Number(v))}`, ""]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend />
                      <Area type="monotone" dataKey="income" name="Revenue" stroke="#10b981" fill="url(#rev)" strokeWidth={2} />
                      <Area type="monotone" dataKey="expense" name="Expense" stroke="#f59e0b" fill="url(#exp)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Project Type Distribution</CardTitle></CardHeader>
              <CardContent>
                {projectTypeData.length === 0 ? (
                  <p className="text-sm text-gray-400 py-10 text-center">No project data available</p>
                ) : (
                  <div className="flex items-center justify-between">
                    <ResponsiveContainer width="60%" height={200}>
                      <PieChart>
                        <Pie data={projectTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                          label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                          {projectTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => [`${Number(v)}Cr`, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3 flex-1">
                      {projectTypeData.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                          <div>
                            <p className="text-xs font-medium text-gray-700">{d.name}</p>
                            <p className="text-xs text-gray-400">{d.count} projects · ৳{d.value}Cr</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader><CardTitle>Project-wise P&L (Lakh ৳)</CardTitle></CardHeader>
              <CardContent>
                {projectPLs.length === 0 ? (
                  <p className="text-sm text-gray-400 py-10 text-center">No P&L data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={projectPLs}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend />
                      <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Expense" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Profit" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Stock Value by Category</CardTitle></CardHeader>
              <CardContent>
                {stockByCategory.length === 0 ? (
                  <p className="text-sm text-gray-400 py-10 text-center">No stock data available</p>
                ) : (
                  <div className="flex items-center justify-between">
                    <ResponsiveContainer width="55%" height={200}>
                      <PieChart>
                        <Pie data={stockByCategory} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                          {stockByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 flex-1">
                      {stockByCategory.map((d, i) => (
                        <div key={d.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                            <span className="text-xs text-gray-600">{d.name}</span>
                          </div>
                          <span className="text-xs font-medium text-gray-700">{d.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Sales Forecasting by Collection Plan</CardTitle></CardHeader>
              <CardContent>
                {!forecast || forecast.monthlyForecast.length === 0 ? (
                  <p className="text-sm text-gray-400 py-10 text-center">No forecast data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={forecast.monthlyForecast}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip formatter={(v) => [`৳${formatNumber(Number(v))}`, ""]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend />
                      <Bar dataKey="expected" name="Expected" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="overdue" name="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Project Forecast Priority</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {!forecast || forecast.projectForecast.length === 0 ? (
                  <p className="text-sm text-gray-400 py-10 text-center">No project forecast data available</p>
                ) : (
                  forecast.projectForecast.slice(0, 5).map((project) => (
                    <div key={project.projectId} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{project.projectName}</p>
                          <p className="text-xs text-gray-400">
                            Sold {project.soldUnits}/{project.totalUnits} units · Unsold {project.unsoldUnits}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                          {project.collectionRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-gray-400">Next Expected</p>
                          <p className="font-semibold text-gray-800">৳{formatNumber(project.nextExpected)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Outstanding</p>
                          <p className="font-semibold text-blue-700">৳{formatNumber(project.totalReceivable)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Overdue</p>
                          <p className="font-semibold text-red-600">৳{formatNumber(project.overdueReceivable)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </MainLayout>
  );
}
