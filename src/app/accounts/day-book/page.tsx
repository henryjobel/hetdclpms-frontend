"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { accountsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ClipboardList, Loader2 } from "lucide-react";

interface DayBookRow {
  id: string;
  date: string;
  voucherNo: string;
  voucherType: string;
  account: string;
  project: string;
  description: string;
  debit: number;
  credit: number;
}

export default function DayBookPage() {
  const [rows, setRows] = useState<DayBookRow[]>([]);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function fetchRows() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const r = await accountsApi.getDayBook(params);
      setRows(r.data.data.rows || []);
      setTotalDebit(r.data.data.totalDebit || 0);
      setTotalCredit(r.data.data.totalCredit || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRows(); }, []);

  return (
    <MainLayout title="Day Book" subtitle="Chronological daily accounting book from voucher entries">
      <div className="flex gap-3 mb-5 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
        </div>
        <button onClick={fetchRows} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium">Apply Filter</button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-amber-600" /> Day Book Entries</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div> : (
            <DataTable
              data={rows as unknown as Record<string, unknown>[]}
              columns={[
                { key: "date", header: "Date", render: (v) => formatDate(v as string) },
                { key: "voucherNo", header: "Voucher No" },
                { key: "voucherType", header: "Type" },
                { key: "account", header: "Account" },
                { key: "project", header: "Project" },
                { key: "description", header: "Description" },
                { key: "debit", header: "Debit", render: (v) => formatCurrency(v as number) },
                { key: "credit", header: "Credit", render: (v) => formatCurrency(v as number) },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 mt-5">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">Total Debit</p>
          <p className="text-xl font-bold text-blue-700">{formatCurrency(totalDebit)}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs text-amber-600 font-medium mb-1">Total Credit</p>
          <p className="text-xl font-bold text-amber-700">{formatCurrency(totalCredit)}</p>
        </div>
      </div>
    </MainLayout>
  );
}
