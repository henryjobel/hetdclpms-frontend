"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { accountsApi } from "@/lib/api";
import { CreditCard, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNo: string;
}

interface ChequeRow {
  id: string;
  chequeNo: string;
  bankAccountId: string;
  type: string;
  status: string;
  payeeName: string;
  amount: number;
  issueDate: string;
  chequeDate: string;
  clearedDate?: string;
  remarks?: string;
  bankAccount: { name: string; bankName: string; accountNo: string };
}

const defaultForm = {
  bankAccountId: "",
  type: "ISSUED",
  status: "PENDING",
  payeeName: "",
  amount: "",
  issueDate: "",
  chequeDate: "",
  clearedDate: "",
  remarks: "",
};

export default function ChequesPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [rows, setRows] = useState<ChequeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    try {
      const [accountRes, chequeRes] = await Promise.all([
        accountsApi.getBankAccounts(),
        accountsApi.getCheques(),
      ]);
      setAccounts(accountRes.data.data || []);
      setRows(chequeRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(defaultForm);
  }

  function openEdit(row: ChequeRow) {
    setEditId(row.id);
    setForm({
      bankAccountId: row.bankAccountId,
      type: row.type,
      status: row.status,
      payeeName: row.payeeName,
      amount: String(row.amount),
      issueDate: row.issueDate ? new Date(row.issueDate).toISOString().slice(0, 10) : "",
      chequeDate: row.chequeDate ? new Date(row.chequeDate).toISOString().slice(0, 10) : "",
      clearedDate: row.clearedDate ? new Date(row.clearedDate).toISOString().slice(0, 10) : "",
      remarks: row.remarks || "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount) || 0,
        issueDate: form.issueDate ? new Date(form.issueDate).toISOString() : undefined,
        chequeDate: form.chequeDate ? new Date(form.chequeDate).toISOString() : undefined,
        clearedDate: form.clearedDate ? new Date(form.clearedDate).toISOString() : undefined,
      };
      if (editId) await accountsApi.updateCheque(editId, payload);
      else await accountsApi.createCheque(payload);
      closeModal();
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this cheque entry?")) return;
    await accountsApi.deleteCheque(id);
    fetchAll();
  }

  return (
    <MainLayout title="Cheque Management" subtitle="Track received and issued cheques, clearance and status movement">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Cheque Entries" value={rows.length} icon={CreditCard} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Pending" value={rows.filter((row) => row.status === "PENDING").length} icon={CreditCard} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Cleared" value={rows.filter((row) => row.status === "CLEARED").length} icon={CreditCard} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Total Amount" value={formatCurrency(rows.reduce((sum, row) => sum + row.amount, 0))} icon={CreditCard} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cheque Register</CardTitle>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Cheque
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={rows as unknown as Record<string, unknown>[]}
              columns={[
                { key: "chequeNo", header: "Cheque No" },
                { key: "bankAccount", header: "Bank", render: (_v, row) => (row as unknown as ChequeRow).bankAccount.name },
                { key: "type", header: "Type" },
                { key: "payeeName", header: "Payee" },
                { key: "amount", header: "Amount", render: (v) => formatCurrency(v as number) },
                { key: "chequeDate", header: "Cheque Date", render: (v) => formatDate(v as string) },
                { key: "status", header: "Status", render: (v) => <Badge variant={v === "CLEARED" ? "success" : v === "BOUNCED" ? "danger" : "warning"}>{v as string}</Badge> },
                { key: "id", header: "Actions", render: (v, row) => (
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(row as unknown as ChequeRow)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(v as string)} className="p-1.5 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ) },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit Cheque" : "Add Cheque"}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <select required value={form.bankAccountId} onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">Select bank account</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} - {account.accountNo}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  <option value="ISSUED">ISSUED</option>
                  <option value="RECEIVED">RECEIVED</option>
                </select>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  {["PENDING", "DEPOSITED", "CLEARED", "BOUNCED", "CANCELLED"].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <input required placeholder="Payee Name" value={form.payeeName} onChange={(e) => setForm({ ...form, payeeName: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input required placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input type="date" value={form.chequeDate} onChange={(e) => setForm({ ...form, chequeDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input type="date" value={form.clearedDate} onChange={(e) => setForm({ ...form, clearedDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">
                  {saving && <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-2" />}{editId ? "Update Cheque" : "Create Cheque"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
