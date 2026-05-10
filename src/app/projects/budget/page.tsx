"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectsApi, accountsApi } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Wallet, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface Project {
  id: string;
  name: string;
  budget: number;
  status: string;
}

interface PLData {
  totalIncome?: number;
  totalExpense?: number;
  profit?: number;
}

interface BudgetRow {
  name: string;
  Budget: number;
  Expense: number;
  Income: number;
  status: string;
  variance: number;
}

export default function BudgetPage() {
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const pr = await projectsApi.getAll();
        const projects: Project[] = pr.data.data || [];
        const top = projects.slice(0, 8);
        const plResults = await Promise.allSettled(
          top.map((p) => accountsApi.getProfitLoss({ projectId: p.id }))
        );
        const data = top.map((p, i) => {
          const r = plResults[i];
          const d: PLData = r.status === "fulfilled" ? (r.value.data.data || r.value.data || {}) : {};
          const inc = d.totalIncome ?? 0;
          const exp = d.totalExpense ?? 0;
          return {
            name: p.name.split(" ").slice(0, 2).join(" "),
            Budget: Math.round(p.budget / 100000),
            Expense: Math.round(exp / 100000),
            Income: Math.round(inc / 100000),
            status: p.status,
            variance: p.budget - exp,
          };
        });
        setRows(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalBudget = rows.reduce((a, r) => a + r.Budget * 100000, 0);
  const totalExpense = rows.reduce((a, r) => a + r.Expense * 100000, 0);
  const totalIncome = rows.reduce((a, r) => a + r.Income * 100000, 0);
  const utilized = totalBudget > 0 ? ((totalExpense / totalBudget) * 100).toFixed(1) : "0.0";

  return (
    <MainLayout title="Project Budget" subtitle="Budget allocation and expenditure analysis">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80 mb-1">Total Budget</p>
          <p className="text-xl font-bold">৳{formatNumber(totalBudget)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80 mb-1">Total Expense</p>
          <p className="text-xl font-bold">৳{formatNumber(totalExpense)}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80 mb-1">Total Revenue</p>
          <p className="text-xl font-bold">৳{formatNumber(totalIncome)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80 mb-1">Budget Utilized</p>
          <p className="text-xl font-bold">{utilized}%</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader><CardTitle>Budget vs Expense vs Income (Lakh ৳)</CardTitle></CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <p className="text-sm text-gray-400 py-10 text-center">No project data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="Budget" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expense" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="w-4 h-4 text-amber-600" /> Budget Details</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Project</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Budget</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Expense</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Revenue</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Variance</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((r) => {
                      const util = r.Budget > 0 ? Math.min(100, Math.round((r.Expense / r.Budget) * 100)) : 0;
                      return (
                        <tr key={r.name} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(r.Budget * 100000)}</td>
                          <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(r.Expense * 100000)}</td>
                          <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(r.Income * 100000)}</td>
                          <td className={`px-4 py-3 text-right font-medium ${r.variance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {r.variance >= 0 ? "+" : ""}{formatCurrency(r.variance)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${util > 90 ? "bg-red-500" : util > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                  style={{ width: `${util}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 w-8">{util}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </MainLayout>
  );
}
