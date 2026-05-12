"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { accountsApi } from "@/lib/api";
import { ArrowDownLeft, ArrowUpRight, Banknote, Loader2, Plus, Wallet, X, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNo: string;
  type: string;
}

interface CashBookRow {
  id: string;
  type: string;
  amount: number;
  description?: string;
  balance: number;
  transDate: string;
  bankAccount: { id: string; name: string; bankName: string; type: string };
}

const defaultForm = {
  bankAccountId: "",
  type: "credit",
  amount: "",
  description: "",
  transDate: "",
};

export default function CashBookPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [rows, setRows] = useState<CashBookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchAll() {
    try {
      const [accountRes, cashBookRes] = await Promise.all([
        accountsApi.getBankAccounts(),
        accountsApi.getCashBook(),
      ]);
      setAccounts(accountRes.data.data || []);
      setRows(cashBookRes.data.data.rows || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await accountsApi.createBankTransaction({
        ...form,
        amount: parseFloat(form.amount) || 0,
        transDate: form.transDate ? new Date(form.transDate).toISOString() : undefined,
      });
      setShowModal(false);
      setForm(defaultForm);
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try { await accountsApi.deleteBankTransaction(deleteId); setDeleteId(null); fetchAll(); }
    catch { /* noop */ } finally { setDeleting(false); }
  }

  const totalCredit = rows.filter((row) => row.type === "credit").reduce((sum, row) => sum + row.amount, 0);
  const totalDebit = rows.filter((row) => row.type === "debit").reduce((sum, row) => sum + row.amount, 0);

  return (
    <MainLayout title="Cash Book" subtitle="Detailed bank and cash transaction register with running balances">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Transactions" value={rows.length} icon={Wallet} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Total Credit" value={formatCurrency(totalCredit)} icon={ArrowDownLeft} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Total Debit" value={formatCurrency(totalDebit)} icon={ArrowUpRight} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatCard title="Accounts" value={accounts.length} icon={Banknote} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaction Book</CardTitle>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Transaction
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={rows as unknown as Record<string, unknown>[]}
              columns={[
                { key: "transDate", header: "Date", render: (v) => formatDate(v as string) },
                { key: "bankAccount", header: "Account", render: (_v, row) => (row as unknown as CashBookRow).bankAccount.name },
                { key: "type", header: "Type", render: (v) => (
                  <span className={v === "credit" ? "text-green-700" : "text-red-600"}>{String(v).toUpperCase()}</span>
                ) },
                { key: "description", header: "Description", render: (v) => String(v || "-") },
                { key: "amount", header: "Amount", render: (v, row) => (
                  <span className={(row as unknown as CashBookRow).type === "credit" ? "text-green-700" : "text-red-600"}>
                    {formatCurrency(v as number)}
                  </span>
                ) },
                { key: "balance", header: "Running Balance", render: (v) => formatCurrency(v as number) },
                { key: "id", header: "Actions", render: (v) => (
                  <button onClick={() => setDeleteId(v as string)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )},
              ]}
            />
          )}
        </CardContent>
      </Card>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Transaction?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium flex items-center gap-2">
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Add Transaction</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <select required value={form.bankAccountId} onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">Select account</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} - {account.accountNo}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
                <input required placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              <input type="date" value={form.transDate} onChange={(e) => setForm({ ...form, transDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">
                  {saving && <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-2" />}Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
