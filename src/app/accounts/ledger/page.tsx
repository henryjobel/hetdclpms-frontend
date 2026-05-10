"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { accountsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ClipboardList, Loader2 } from "lucide-react";

interface Account { id: string; code: string; name: string; type: string }
interface LedgerEntry {
  id: string;
  debit: number;
  credit: number;
  description?: string;
  entryDate: string;
  account: { code: string; name: string; type: string };
  project?: { name: string };
  voucher?: { voucherNo: string; type: string };
}

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountId, setAccountId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function fetchEntries() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (accountId) params.accountId = accountId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const r = await accountsApi.getLedger(params);
      setEntries(r.data.data || []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    accountsApi.getChart().then((r) => setAccounts(r.data.data || [])).catch(() => {});
    fetchEntries();
  }, []);

  const totalDebit = entries.reduce((a, e) => a + e.debit, 0);
  const totalCredit = entries.reduce((a, e) => a + e.credit, 0);

  const tableData = entries.map((e) => ({
    date: e.entryDate,
    voucher: e.voucher?.voucherNo ?? "—",
    voucherType: e.voucher?.type ?? "—",
    account: `${e.account.code} – ${e.account.name}`,
    project: e.project?.name ?? "—",
    description: e.description ?? "—",
    debit: e.debit,
    credit: e.credit,
  }));

  return (
    <MainLayout title="General Ledger" subtitle="View all financial transactions and journal entries">
      <div className="flex flex-wrap gap-3 mb-5 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Account</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="">All Accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} – {a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <button onClick={fetchEntries}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
          Apply Filter
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">Total Debit</p>
          <p className="text-xl font-bold text-blue-700">{formatCurrency(totalDebit)}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs text-amber-600 font-medium mb-1">Total Credit</p>
          <p className="text-xl font-bold text-amber-700">{formatCurrency(totalCredit)}</p>
        </div>
        <div className={`${totalDebit >= totalCredit ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"} border rounded-xl p-4`}>
          <p className={`text-xs font-medium mb-1 ${totalDebit >= totalCredit ? "text-emerald-600" : "text-red-600"}`}>Balance</p>
          <p className={`text-xl font-bold ${totalDebit >= totalCredit ? "text-emerald-700" : "text-red-700"}`}>
            {formatCurrency(Math.abs(totalDebit - totalCredit))}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-amber-600" /> Ledger Entries ({entries.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No ledger entries found</p>
          ) : (
            <DataTable
              data={tableData as unknown as Record<string, unknown>[]}
              columns={[
                { key: "date", header: "Date", render: (v) => formatDate(v as string) },
                { key: "voucher", header: "Voucher" },
                { key: "voucherType", header: "Type", render: (v) => <span className="text-xs text-gray-500">{v as string}</span> },
                { key: "account", header: "Account" },
                { key: "project", header: "Project" },
                { key: "description", header: "Description" },
                { key: "debit", header: "Debit", render: (v) => v ? <span className="text-blue-700 font-medium">{formatCurrency(v as number)}</span> : <span className="text-gray-400">—</span> },
                { key: "credit", header: "Credit", render: (v) => v ? <span className="text-amber-700 font-medium">{formatCurrency(v as number)}</span> : <span className="text-gray-400">—</span> },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
