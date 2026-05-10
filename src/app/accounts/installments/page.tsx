"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { ProgressBar } from "@/components/ui/progress-bar";
import { accountsApi, projectsApi } from "@/lib/api";
import { CreditCard, DollarSign, Plus, Search, Loader2, X } from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

interface Installment {
  id: string;
  client: string;
  clientPhone?: string;
  unit: string;
  totalAmount: number;
  paid: number;
  status: string;
  project: { name: string };
  schedule: Array<{ id: string; dueDate: string; amount: number; status: string }>;
}

interface Project { id: string; name: string }

const statusVariant: Record<string, "success" | "warning" | "danger" | "gray"> = {
  ACTIVE: "success", OVERDUE: "danger", COMPLETED: "gray",
};

const defaultForm = {
  client: "", clientPhone: "", projectId: "", unit: "",
  totalAmount: "", scheduleCount: "4",
};

export default function InstallmentsPage() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchAll() {
    try {
      const [ir, pr] = await Promise.all([accountsApi.getInstallments(), projectsApi.getAll()]);
      setInstallments(ir.data.data || []);
      setProjects(pr.data.data || []);
    } catch {
      setInstallments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = installments.filter(
    (i) => i.client.toLowerCase().includes(search.toLowerCase()) ||
      i.project.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalReceivable = installments.reduce((a, i) => a + (i.totalAmount - i.paid), 0);
  const totalCollected = installments.reduce((a, i) => a + i.paid, 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.projectId) { setError("Select a project"); return; }
    setSaving(true);
    setError("");
    try {
      const total = parseFloat(form.totalAmount) || 0;
      const count = parseInt(form.scheduleCount) || 4;
      const perInstallment = total / count;
      const today = new Date();
      const schedule = Array.from({ length: count }, (_, i) => {
        const due = new Date(today);
        due.setMonth(due.getMonth() + i + 1);
        return { dueDate: due.toISOString(), amount: perInstallment };
      });
      await accountsApi.createInstallment({
        client: form.client,
        clientPhone: form.clientPhone,
        projectId: form.projectId,
        unit: form.unit,
        totalAmount: total,
        schedule,
      });
      setShowModal(false);
      setForm(defaultForm);
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create installment");
    } finally {
      setSaving(false);
    }
  }

  const tableData = filtered.map((i) => ({
    client: i.client,
    project: i.project.name,
    unit: i.unit,
    totalAmount: i.totalAmount,
    paid: i.paid,
    due: i.totalAmount - i.paid,
    nextDue: i.schedule.find((s) => s.status === "unpaid")?.dueDate ?? null,
    status: i.status,
    _progress: { paid: i.paid, total: i.totalAmount },
  }));

  return (
    <MainLayout title="Installments" subtitle="Client installment schedules and payment tracking">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Clients" value={installments.length} icon={CreditCard} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Total Collected" value={`৳${formatNumber(totalCollected)}`} icon={DollarSign} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Total Receivable" value={`৳${formatNumber(totalReceivable)}`} icon={DollarSign} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Overdue" value={installments.filter((i) => i.status === "OVERDUE").length} icon={CreditCard} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Installment Schedule</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> New Installment
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
                { key: "client", header: "Client" },
                { key: "project", header: "Project" },
                { key: "unit", header: "Unit" },
                { key: "totalAmount", header: "Total Amount", render: (v) => formatCurrency(v as number) },
                { key: "paid", header: "Paid", render: (v) => <span className="text-green-700 font-medium">{formatCurrency(v as number)}</span> },
                { key: "due", header: "Due", render: (v) => <span className="text-red-600 font-medium">{formatCurrency(v as number)}</span> },
                { key: "_progress", header: "Progress", render: (v) => {
                  const { paid, total } = v as { paid: number; total: number };
                  return <div className="w-24"><ProgressBar value={paid} max={total} showLabel /></div>;
                }},
                { key: "nextDue", header: "Next Due", render: (v) => v ? formatDate(v as string) : <span className="text-gray-400">—</span> },
                { key: "status", header: "Status", render: (v) => <Badge variant={statusVariant[v as string] ?? "default"}>{(v as string).toLowerCase()}</Badge> },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">New Installment Plan</h3>
              <button onClick={() => { setShowModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Client Name *</label>
                  <input required value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Client Phone</label>
                  <input value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Project *</label>
                  <select required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="">— Select —</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit / Flat No *</label>
                  <input required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Amount (৳) *</label>
                  <input type="number" required value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">No. of Installments</label>
                  <input type="number" min={1} max={60} value={form.scheduleCount} onChange={(e) => setForm({ ...form, scheduleCount: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
