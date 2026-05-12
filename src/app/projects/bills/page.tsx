"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { billsApi, projectsApi } from "@/lib/api";
import { Receipt, DollarSign, Plus, Search, Loader2, X, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Bill {
  id: string;
  billNumber: string;
  type: string;
  amount: number;
  billDate: string;
  dueDate?: string;
  status: string;
  project?: { name: string };
  supplier?: { name: string };
  contractor?: { name: string };
}

interface Project { id: string; name: string }

const statusVariant: Record<string, "success" | "danger" | "warning" | "default"> = {
  paid: "success", unpaid: "warning", overdue: "danger",
};

const defaultForm = {
  type: "Contractor Bill", amount: "", dueDate: "", projectId: "", status: "unpaid",
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchAll() {
    try {
      const [br, pr] = await Promise.all([billsApi.getAll(), projectsApi.getAll()]);
      setBills(br.data.data || []);
      setProjects(pr.data.data || []);
    } catch {
      setBills([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = bills.filter((b) =>
    (b.project?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    b.type.toLowerCase().includes(search.toLowerCase()) ||
    b.billNumber.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await billsApi.create({
        ...form,
        amount: parseFloat(form.amount) || 0,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        projectId: form.projectId || undefined,
      });
      setShowModal(false);
      setForm(defaultForm);
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create bill");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try { await billsApi.delete(deleteId); setDeleteId(null); fetchAll(); }
    catch { /* noop */ } finally { setDeleting(false); }
  }

  async function handleMarkPaid(bill: Bill) {
    try {
      await billsApi.updateStatus(bill.id, "paid");
      fetchAll();
    } catch { /* noop */ }
  }

  const tableData = filtered.map((b) => ({
    ...b,
    billNo: b.billNumber,
    vendor: b.supplier?.name ?? b.contractor?.name ?? "—",
    project: b.project?.name ?? "—",
    date: b.billDate,
    due: b.dueDate,
    _raw: b,
  }));

  return (
    <MainLayout title="Project Bills" subtitle="Manage contractor, supplier, and labor bills">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Bills" value={bills.length} icon={Receipt} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Total Amount" value={`৳${bills.reduce((a, b) => a + b.amount, 0).toLocaleString()}`} icon={DollarSign} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="Unpaid" value={bills.filter((b) => b.status === "unpaid").length} icon={Receipt} iconColor="text-yellow-600" iconBg="bg-yellow-50" />
        <StatCard title="Overdue" value={bills.filter((b) => b.status === "overdue").length} icon={Receipt} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bill List</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> New Bill
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
                { key: "billNo", header: "Bill No" },
                { key: "type", header: "Type" },
                { key: "vendor", header: "Vendor" },
                { key: "project", header: "Project" },
                { key: "amount", header: "Amount", render: (v) => formatCurrency(v as number) },
                { key: "date", header: "Bill Date", render: (v) => formatDate(v as string) },
                { key: "due", header: "Due Date", render: (v) => v ? formatDate(v as string) : "—" },
                { key: "status", header: "Status", render: (v) => <Badge variant={statusVariant[v as string] ?? "default"}>{v as string}</Badge> },
                {
                  key: "_raw", header: "Actions",
                  render: (v) => {
                    const b = v as Bill;
                    return (
                      <div className="flex gap-1">
                        {b.status !== "paid" && (
                          <button onClick={() => handleMarkPaid(b)}
                            className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">
                            Mark Paid
                          </button>
                        )}
                        <button onClick={() => setDeleteId(b.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  }
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Bill?</h3>
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
              <h3 className="text-base font-semibold text-gray-900">New Bill</h3>
              <button onClick={() => { setShowModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bill Type *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {["Contractor Bill", "Supplier Bill", "Labor Bill", "Equipment Bill", "Utility Bill"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select Project —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount (৳) *</label>
                <input type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
