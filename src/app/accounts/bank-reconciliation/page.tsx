"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { accountsApi } from "@/lib/api";
import { ArrowLeftRight, Banknote, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNo: string;
  type: string;
  balance: number;
}

interface Reconciliation {
  id: string;
  bankAccountId: string;
  statementDate: string;
  bookBalance: number;
  statementBalance: number;
  difference: number;
  notes?: string;
  status: string;
  bankAccount: { name: string; bankName: string; accountNo: string };
}

const reconciliationFormDefault = {
  bankAccountId: "",
  statementDate: "",
  bookBalance: "",
  statementBalance: "",
  notes: "",
  status: "PENDING",
};

const bankFormDefault = {
  name: "",
  bankName: "",
  accountNo: "",
  type: "bank",
  balance: "",
};

export default function BankReconciliationPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [rows, setRows] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReconModal, setShowReconModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [reconForm, setReconForm] = useState(reconciliationFormDefault);
  const [bankForm, setBankForm] = useState(bankFormDefault);
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    try {
      const [accountsRes, rowsRes] = await Promise.all([
        accountsApi.getBankAccounts(),
        accountsApi.getBankReconciliations(),
      ]);
      setAccounts(accountsRes.data.data || []);
      setRows(rowsRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  function closeReconModal() {
    setShowReconModal(false);
    setEditId(null);
    setReconForm(reconciliationFormDefault);
  }

  function openEdit(row: Reconciliation) {
    setEditId(row.id);
    setReconForm({
      bankAccountId: row.bankAccountId,
      statementDate: new Date(row.statementDate).toISOString().slice(0, 10),
      bookBalance: String(row.bookBalance),
      statementBalance: String(row.statementBalance),
      notes: row.notes || "",
      status: row.status,
    });
    setShowReconModal(true);
  }

  async function handleReconSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...reconForm,
        statementDate: reconForm.statementDate ? new Date(reconForm.statementDate).toISOString() : undefined,
        bookBalance: parseFloat(reconForm.bookBalance) || 0,
        statementBalance: parseFloat(reconForm.statementBalance) || 0,
      };
      if (editId) await accountsApi.updateBankReconciliation(editId, payload);
      else await accountsApi.createBankReconciliation(payload);
      closeReconModal();
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleBankSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await accountsApi.createBankAccount({
        ...bankForm,
        balance: parseFloat(bankForm.balance) || 0,
      });
      setShowBankModal(false);
      setBankForm(bankFormDefault);
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this reconciliation?")) return;
    await accountsApi.deleteBankReconciliation(id);
    fetchAll();
  }

  return (
    <MainLayout title="Bank Reconciliation" subtitle="Compare book balance and bank statement balance with adjustment tracking">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Bank Accounts" value={accounts.length} icon={Banknote} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Reconciliations" value={rows.length} icon={ArrowLeftRight} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="Pending" value={rows.filter((row) => row.status === "PENDING").length} icon={ArrowLeftRight} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Total Difference" value={formatCurrency(rows.reduce((sum, row) => sum + row.difference, 0))} icon={Banknote} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bank Accounts</CardTitle>
            <button onClick={() => setShowBankModal(true)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm">
              <Plus className="w-4 h-4" /> Add
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
            ) : accounts.length === 0 ? (
              <p className="text-sm text-gray-400">No bank account configured</p>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="rounded-xl border border-gray-200 p-4">
                  <p className="font-medium text-gray-900">{account.name}</p>
                  <p className="text-sm text-gray-500">{account.bankName}</p>
                  <p className="text-xs text-gray-400">{account.accountNo}</p>
                  <p className="text-sm font-semibold text-blue-700 mt-2">{formatCurrency(account.balance)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Reconciliation Register</CardTitle>
            <button onClick={() => setShowReconModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
              <Plus className="w-4 h-4" /> New Reconciliation
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
            ) : (
              <DataTable
                data={rows as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "bankAccount", header: "Account", render: (_v, row) => (row as unknown as Reconciliation).bankAccount.name },
                  { key: "statementDate", header: "Statement Date", render: (v) => formatDate(v as string) },
                  { key: "bookBalance", header: "Book", render: (v) => formatCurrency(v as number) },
                  { key: "statementBalance", header: "Statement", render: (v) => formatCurrency(v as number) },
                  { key: "difference", header: "Difference", render: (v) => <span className={(v as number) === 0 ? "text-green-700" : "text-red-600"}>{formatCurrency(v as number)}</span> },
                  { key: "status", header: "Status", render: (v) => <Badge variant={v === "MATCHED" ? "success" : v === "ADJUSTED" ? "info" : "warning"}>{v as string}</Badge> },
                  { key: "id", header: "Actions", render: (v, row) => (
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(row as unknown as Reconciliation)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(v as string)} className="p-1.5 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ) },
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {showReconModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit Reconciliation" : "New Reconciliation"}</h3>
              <button onClick={closeReconModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleReconSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bank Account *</label>
                <select required value={reconForm.bankAccountId} onChange={(e) => setReconForm({ ...reconForm, bankAccountId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  <option value="">Select bank account</option>
                  {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} - {account.accountNo}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Statement Date</label>
                  <input type="date" value={reconForm.statementDate} onChange={(e) => setReconForm({ ...reconForm, statementDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select value={reconForm.status} onChange={(e) => setReconForm({ ...reconForm, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    {["PENDING", "MATCHED", "ADJUSTED"].map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Book Balance</label>
                  <input value={reconForm.bookBalance} onChange={(e) => setReconForm({ ...reconForm, bookBalance: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Statement Balance</label>
                  <input value={reconForm.statementBalance} onChange={(e) => setReconForm({ ...reconForm, statementBalance: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <input value={reconForm.notes} onChange={(e) => setReconForm({ ...reconForm, notes: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeReconModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">
                  {saving && <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-2" />}{editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">New Bank Account</h3>
              <button onClick={() => setShowBankModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleBankSubmit} className="p-6 space-y-4">
              <input required placeholder="Account Name" value={bankForm.name} onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <input required placeholder="Bank Name" value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <input required placeholder="Account No" value={bankForm.accountNo} onChange={(e) => setBankForm({ ...bankForm, accountNo: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <div className="grid grid-cols-2 gap-3">
                <select value={bankForm.type} onChange={(e) => setBankForm({ ...bankForm, type: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  <option value="bank">Bank</option>
                  <option value="cash">Cash</option>
                </select>
                <input placeholder="Opening Balance" value={bankForm.balance} onChange={(e) => setBankForm({ ...bankForm, balance: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowBankModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
