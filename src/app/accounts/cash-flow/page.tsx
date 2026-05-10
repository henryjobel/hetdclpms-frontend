"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { accountsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Loader2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface CashFlowEntry { month: string; inflow: number; outflow: number; net: number }

export default function CashFlowPage() {
  const [data, setData] = useState<CashFlowEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountsApi.getCashFlow().then((r) => {
      setData(r.data.data || []);
    }).catch(() => setData([])).finally(() => setLoading(false));
  }, []);

  const totalInflow = data.reduce((a, d) => a + d.inflow, 0);
  const totalOutflow = data.reduce((a, d) => a + d.outflow, 0);
  const netCashFlow = totalInflow - totalOutflow;

  return (
    <MainLayout title="Cash Flow Statement" subtitle="Track cash inflows and outflows over time">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80 mb-1">Total Inflow</p>
          <p className="text-2xl font-bold">{formatCurrency(totalInflow)}</p>
          <p className="text-xs opacity-70 mt-1">Cash received from clients</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80 mb-1">Total Outflow</p>
          <p className="text-2xl font-bold">{formatCurrency(totalOutflow)}</p>
          <p className="text-xs opacity-70 mt-1">Payments made</p>
        </div>
        <div className={`bg-gradient-to-br ${netCashFlow >= 0 ? "from-blue-500 to-blue-600" : "from-orange-500 to-orange-600"} rounded-xl p-5 text-white`}>
          <p className="text-sm opacity-80 mb-1">Net Cash Flow</p>
          <p className="text-2xl font-bold">{netCashFlow >= 0 ? "+" : ""}{formatCurrency(netCashFlow)}</p>
          <p className="text-xs opacity-70 mt-1">{netCashFlow >= 0 ? "Positive" : "Negative"} cash position</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader><CardTitle>Cash Flow Chart</CardTitle></CardHeader>
            <CardContent>
              {data.length === 0 ? (
                <p className="text-sm text-gray-400 py-10 text-center">No cash flow data available yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="inflow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="outflow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip formatter={(v) => [formatCurrency(Number(v)), ""]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend />
                    <Area type="monotone" dataKey="inflow" name="Inflow" stroke="#10b981" fill="url(#inflow)" strokeWidth={2} />
                    <Area type="monotone" dataKey="outflow" name="Outflow" stroke="#ef4444" fill="url(#outflow)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-600" /> Monthly Breakdown</CardTitle></CardHeader>
            <CardContent className="p-0">
              {data.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">No data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Month</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Inflow</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Outflow</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.map((d) => (
                        <tr key={d.month} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{d.month}</td>
                          <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(d.inflow)}</td>
                          <td className="px-4 py-3 text-right text-red-500">{formatCurrency(d.outflow)}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${d.net >= 0 ? "text-blue-700" : "text-orange-600"}`}>
                            {d.net >= 0 ? "+" : ""}{formatCurrency(d.net)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(totalInflow)}</td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(totalOutflow)}</td>
                        <td className={`px-4 py-3 text-right font-bold ${netCashFlow >= 0 ? "text-blue-700" : "text-orange-600"}`}>
                          {netCashFlow >= 0 ? "+" : ""}{formatCurrency(netCashFlow)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </MainLayout>
  );
}
