"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { accountsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Scale } from "lucide-react";

interface TrialRow {
  id: string;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function TrialBalancePage() {
  const [rows, setRows] = useState<TrialRow[]>([]);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountsApi.getTrialBalance().then((r) => {
      setRows(r.data.data.rows || []);
      setTotalDebit(r.data.data.totalDebit || 0);
      setTotalCredit(r.data.data.totalCredit || 0);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout title="Trial Balance" subtitle="Debit and credit balancing across all accounts">
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">Total Debit</p>
          <p className="text-xl font-bold text-blue-700">{formatCurrency(totalDebit)}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs text-amber-600 font-medium mb-1">Total Credit</p>
          <p className="text-xl font-bold text-amber-700">{formatCurrency(totalCredit)}</p>
        </div>
        <div className={`${Math.abs(totalDebit - totalCredit) < 0.01 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"} border rounded-xl p-4`}>
          <p className={`text-xs font-medium mb-1 ${Math.abs(totalDebit - totalCredit) < 0.01 ? "text-emerald-600" : "text-red-600"}`}>Difference</p>
          <p className={`text-xl font-bold ${Math.abs(totalDebit - totalCredit) < 0.01 ? "text-emerald-700" : "text-red-700"}`}>{formatCurrency(Math.abs(totalDebit - totalCredit))}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="w-4 h-4 text-amber-600" /> Trial Balance Rows</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div> : (
            <DataTable
              data={rows as unknown as Record<string, unknown>[]}
              columns={[
                { key: "code", header: "Code" },
                { key: "name", header: "Account" },
                { key: "type", header: "Type" },
                { key: "debit", header: "Debit", render: (v) => formatCurrency(v as number) },
                { key: "credit", header: "Credit", render: (v) => formatCurrency(v as number) },
                { key: "balance", header: "Balance", render: (v) => <span className={(v as number) >= 0 ? "text-emerald-700" : "text-red-600"}>{formatCurrency(Math.abs(v as number))}</span> },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
