"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { accountsApi } from "@/lib/api";
import { Layers, Plus, Search, Loader2, X, Pencil, Trash2 } from "lucide-react";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  description?: string;
  isActive: boolean;
}

const typeVariant: Record<string, "success" | "danger" | "info" | "warning" | "default" | "gray"> = {
  ASSET: "info", LIABILITY: "danger", INCOME: "success", EXPENSE: "warning",
  EQUITY: "default", BANK: "gray", CASH: "gray",
};

const accountTypes = ["ASSET", "LIABILITY", "INCOME", "EXPENSE", "EQUITY", "BANK", "CASH"];
const defaultForm = { code: "", name: "", type: "ASSET", description: "" };

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  async function fetchAll() {
    try {
      const res = await accountsApi.getChart();
      setAccounts(res.data.data || []);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  function closeModal() {
    setShowModal(false);
    setForm(defaultForm);
    setEditId(null);
    setError("");
  }

  function openEdit(account: Account) {
    setEditId(account.id);
    setForm({
      code: account.code,
      name: account.name,
      type: account.type,
      description: account.description || "",
    });
    setShowModal(true);
  }

  const filtered = accounts.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search);
    const matchType = typeFilter === "all" || a.type === typeFilter;
    return matchSearch && matchType;
  });

  const totals = accounts.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editId) await accountsApi.updateAccount(editId, form);
      else await accountsApi.createAccount(form);
      closeModal();
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || `Failed to ${editId ? "update" : "create"} account`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this account?")) return;
    try {
      await accountsApi.deleteAccount(id);
      fetchAll();
    } catch {
      setError("Failed to delete account");
    }
  }

  return (
    <MainLayout title="Chart of Accounts" subtitle="Structured hierarchy of all financial accounts">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Accounts" value={accounts.length} icon={Layers} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Asset Accounts" value={totals["ASSET"] ?? 0} icon={Layers} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Income Accounts" value={totals["INCOME"] ?? 0} icon={Layers} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="Expense Accounts" value={totals["EXPENSE"] ?? 0} icon={Layers} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Account List</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none">
              <option value="all">All Types</option>
              {accountTypes.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
            </select>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Account
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={filtered as unknown as Record<string, unknown>[]}
              columns={[
                { key: "code", header: "Account Code" },
                { key: "name", header: "Account Name" },
                { key: "description", header: "Description", render: (v) => v ? (v as string) : "—" },
                { key: "type", header: "Type", render: (v) => <Badge variant={typeVariant[v as string] ?? "default"}>{(v as string).toLowerCase()}</Badge> },
                { key: "isActive", header: "Status", render: (v) => <Badge variant={v ? "success" : "gray"}>{v ? "Active" : "Inactive"}</Badge> },
                { key: "id", header: "Actions", render: (v, row) => (
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(row as unknown as Account)}
                      className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(v as string)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )},
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit Account" : "Add Account"}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Account Code *</label>
                <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. 1001"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Account Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {accountTypes.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
