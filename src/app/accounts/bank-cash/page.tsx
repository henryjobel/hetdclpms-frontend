"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { accountsApi } from "@/lib/api";
import { Banknote, DollarSign, Loader2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BankTransaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  balance: number;
  transDate: string;
}

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNo: string;
  type: string;
  balance: number;
  transactions: BankTransaction[];
}

export default function BankCashPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountsApi.getBankAccounts()
      .then((r) => setAccounts(r.data.data || []))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, []);

  const totalBank = accounts.filter((a) => a.type === "bank").reduce((s, a) => s + a.balance, 0);
  const totalCash = accounts.filter((a) => a.type === "cash").reduce((s, a) => s + a.balance, 0);
  const allTxns = accounts.flatMap((a) =>
    a.transactions.map((t) => ({ ...t, account: a.name }))
  ).sort((a, b) => new Date(b.transDate).getTime() - new Date(a.transDate).getTime());

  if (loading) {
    return (
      <MainLayout title="Bank & Cash Management" subtitle="Monitor bank accounts, cash, and transactions">
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Bank & Cash Management" subtitle="Monitor bank accounts, cash, and transactions">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Bank Balance" value={`৳${(totalBank / 1000000).toFixed(1)}M`} icon={Banknote} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Cash in Hand" value={`৳${(totalCash / 1000000).toFixed(1)}M`} icon={DollarSign} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Total Accounts" value={accounts.length} icon={Banknote} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="Total Balance" value={`৳${((totalBank + totalCash) / 1000000).toFixed(1)}M`} icon={DollarSign} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <Card className="mb-6">
          <CardContent className="py-12 text-center text-gray-400 text-sm">
            No bank accounts configured. Add bank accounts via the API.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {accounts.map((acc) => (
            <Card key={acc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge variant={acc.type === "bank" ? "info" : "success"}>
                    {acc.type === "bank" ? "Bank" : "Cash"}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">{acc.name}</p>
                <p className="text-xs text-gray-400 mb-1">{acc.bankName}</p>
                <p className="text-xs text-gray-400 mb-3">{acc.accountNo}</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(acc.balance)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent className="p-0">
          {allTxns.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No transactions recorded</p>
          ) : (
            <DataTable
              data={allTxns as unknown as Record<string, unknown>[]}
              columns={[
                { key: "id", header: "TXN ID", render: (v) => (v as string).substring(0, 8) },
                { key: "account", header: "Account" },
                { key: "type", header: "Type", render: (v) => (
                  <div className="flex items-center gap-1">
                    {v === "credit"
                      ? <ArrowDownLeft className="w-4 h-4 text-green-500" />
                      : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                    <Badge variant={v === "credit" ? "success" : "danger"}>{v as string}</Badge>
                  </div>
                )},
                { key: "description", header: "Description", render: (v) => <span>{(v as string) ?? "—"}</span> },
                { key: "amount", header: "Amount", render: (v, row) => (
                  <span className={row.type === "credit" ? "text-green-700 font-medium" : "text-red-600 font-medium"}>
                    {row.type === "credit" ? "+" : "-"}{formatCurrency(v as number)}
                  </span>
                )},
                { key: "transDate", header: "Date", render: (v) => formatDate(v as string) },
                { key: "balance", header: "Balance", render: (v) => formatCurrency(v as number) },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
