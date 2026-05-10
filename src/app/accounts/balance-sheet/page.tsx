"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { accountsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, Loader2 } from "lucide-react";

interface BalanceItem { name: string; amount: number }
interface BalanceSheet {
  assets: BalanceItem[];
  liabilities: BalanceItem[];
  equity: number;
  totalAssets: number;
  totalLiabilities: number;
}

export default function BalanceSheetPage() {
  const [data, setData] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountsApi.getBalanceSheet().then((r) => {
      setData(r.data.data || null);
    }).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <MainLayout title="Balance Sheet" subtitle="Financial position overview">
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      </MainLayout>
    );
  }

  const totalAssets = data?.totalAssets ?? 0;
  const totalLiabilities = data?.totalLiabilities ?? 0;
  const equity = data?.equity ?? 0;

  return (
    <MainLayout title="Balance Sheet" subtitle="Financial position as of today">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80 mb-1">Total Assets</p>
          <p className="text-2xl font-bold">{formatCurrency(totalAssets)}</p>
          <p className="text-xs opacity-70 mt-1">Cash, Receivables & more</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80 mb-1">Total Liabilities</p>
          <p className="text-2xl font-bold">{formatCurrency(totalLiabilities)}</p>
          <p className="text-xs opacity-70 mt-1">Payables & obligations</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80 mb-1">Net Equity</p>
          <p className="text-2xl font-bold">{formatCurrency(equity)}</p>
          <p className="text-xs opacity-70 mt-1">Assets minus liabilities</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle>Assets</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(data?.assets ?? []).map((item) => (
                <div key={item.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className="text-sm font-semibold text-blue-700">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2 mt-2 border-t-2 border-blue-200">
                <span className="text-sm font-bold text-gray-900">Total Assets</span>
                <span className="text-sm font-bold text-blue-700">{formatCurrency(totalAssets)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-red-500" />
                </div>
                <CardTitle>Liabilities</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(data?.liabilities ?? []).map((item) => (
                  <div key={item.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <span className="text-sm font-semibold text-red-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 mt-2 border-t-2 border-red-200">
                  <span className="text-sm font-bold text-gray-900">Total Liabilities</span>
                  <span className="text-sm font-bold text-red-600">{formatCurrency(totalLiabilities)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                </div>
                <CardTitle>Equity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-700">Owner&apos;s Equity</span>
                <span className="text-sm font-semibold text-emerald-700">{formatCurrency(equity)}</span>
              </div>
              <div className="flex items-center justify-between py-2 mt-2 border-t-2 border-emerald-200">
                <span className="text-sm font-bold text-gray-900">Total Equity</span>
                <span className="text-sm font-bold text-emerald-700">{formatCurrency(equity)}</span>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Accounting Equation: Assets = Liabilities + Equity</p>
                <p className="text-xs font-medium text-gray-700 mt-1">
                  {formatCurrency(totalAssets)} = {formatCurrency(totalLiabilities)} + {formatCurrency(equity)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
