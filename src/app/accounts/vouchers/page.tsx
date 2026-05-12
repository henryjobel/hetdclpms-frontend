"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { accountsApi, projectsApi } from "@/lib/api";
import { FileText, DollarSign, Plus, Search, Loader2, X, CheckCircle, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Voucher {
  id: string;
  voucherNo: string;
  type: string;
  amount: number;
  voucherDate: string;
  status: string;
  description?: string;
  project?: { name: string };
  createdBy?: { name: string };
}

interface Project { id: string; name: string }

const statusVariant: Record<string, "success" | "warning"> = {
  approved: "success", pending: "warning",
};

const defaultForm = { type: "PAYMENT", projectId: "", amount: "", description: "" };

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchAll() {
    try {
      const [vr, pr] = await Promise.all([accountsApi.getVouchers(), projectsApi.getAll()]);
      setVouchers(vr.data.data || []);
      setProjects(pr.data.data || []);
    } catch {
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = vouchers.filter((v) => {
    const matchSearch = (v.project?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      v.voucherNo.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || v.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalApproved = vouchers.filter((v) => v.status === "approved").reduce((a, v) => a + v.amount, 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await accountsApi.createVoucher({
        ...form,
        amount: parseFloat(form.amount) || 0,
        projectId: form.projectId || undefined,
        entries: [],
      });
      setShowModal(false);
      setForm(defaultForm);
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create voucher");
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await accountsApi.approveVoucher(id);
      fetchAll();
    } catch { /* noop */ }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await accountsApi.deleteVoucher(deleteId);
      setDeleteId(null);
      fetchAll();
    } catch { /* noop */ } finally { setDeleting(false); }
  }

  const tableData = filtered.map((v) => ({
    ...v,
    project: v.project?.name ?? "General",
    createdBy: v.createdBy?.name ?? "—",
    _id: v.id,
    _status: v.status,
  }));

  return (
    <MainLayout title="Vouchers" subtitle="Manage payment, receipt, journal and other vouchers">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Vouchers" value={vouchers.length} icon={FileText} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Approved" value={vouchers.filter((v) => v.status === "approved").length} icon={FileText} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Pending" value={vouchers.filter((v) => v.status === "pending").length} icon={FileText} iconColor="text-yellow-600" iconBg="bg-yellow-50" />
        <StatCard title="Approved Value" value={`৳${formatCurrency(totalApproved)}`} icon={DollarSign} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Voucher List</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="all">All Types</option>
              {["PAYMENT", "RECEIPT", "JOURNAL", "CONTRA", "ADJUSTMENT"].map((t) => (
                <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
              ))}
            </select>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> New Voucher
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={tableData as unknown as Record<string, unknown>[]}
              columns={[
                { key: "voucherNo", header: "Voucher No" },
                { key: "type", header: "Type", render: (v) => (v as string).toLowerCase() },
                { key: "project", header: "Project" },
                { key: "amount", header: "Amount", render: (v) => formatCurrency(v as number) },
                { key: "voucherDate", header: "Date", render: (v) => formatDate(v as string) },
                { key: "description", header: "Description", render: (v) => v ? (v as string) : "—" },
                { key: "status", header: "Status", render: (v) => <Badge variant={statusVariant[v as string] ?? "default"}>{v as string}</Badge> },
                {
                  key: "_id", header: "Actions",
                  render: (v, row) => (
                    <div className="flex gap-1.5 items-center">
                      {row._status === "pending" && (
                        <button onClick={() => handleApprove(v as string)}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                      )}
                      <button onClick={() => setDeleteId(v as string)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Voucher?</h3>
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
              <h3 className="text-base font-semibold text-gray-900">New Voucher</h3>
              <button onClick={() => { setShowModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Voucher Type *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {["PAYMENT", "RECEIPT", "JOURNAL", "CONTRA", "ADJUSTMENT"].map((t) => (
                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()} Voucher</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— General / No Project —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount (৳) *</label>
                <input type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
