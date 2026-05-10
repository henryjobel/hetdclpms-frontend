"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { projectsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Plus, Loader2, X } from "lucide-react";

interface Project { id: string; name: string }
interface Quotation {
  id: string;
  quotationNo: string;
  client?: string;
  description?: string;
  amount: number;
  status: string;
  validUntil?: string;
  createdAt: string;
  project?: { name: string };
}

const statusVariant: Record<string, "default" | "info" | "success" | "warning" | "danger" | "gray"> = {
  draft: "default", sent: "info", accepted: "success", rejected: "danger", expired: "gray",
};

const defaultForm = { projectId: "", client: "", description: "", amount: "", validUntil: "" };

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchAll() {
    try {
      const [qr, pr] = await Promise.all([projectsApi.getQuotations(), projectsApi.getAll()]);
      setQuotations(qr.data.data || []);
      setProjects(pr.data.data || []);
    } catch {
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await projectsApi.createQuotation({
        projectId: form.projectId || undefined,
        client: form.client || undefined,
        description: form.description || undefined,
        amount: parseFloat(form.amount) || 0,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
      });
      setShowModal(false);
      setForm(defaultForm);
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create quotation");
    } finally {
      setSaving(false);
    }
  }

  const tableData = quotations.map((q) => ({
    quotationNo: q.quotationNo,
    client: q.client ?? "—",
    project: q.project?.name ?? "—",
    description: q.description ?? "—",
    amount: q.amount,
    validUntil: q.validUntil,
    status: q.status,
    date: q.createdAt,
  }));

  const accepted = quotations.filter((q) => q.status === "accepted");
  const totalAccepted = accepted.reduce((a, q) => a + q.amount, 0);

  return (
    <MainLayout title="Quotations" subtitle="Manage project quotations and proposals">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Quotations" value={quotations.length} icon={FileText} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Accepted" value={accepted.length} icon={FileText} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Pending/Sent" value={quotations.filter((q) => ["draft", "sent"].includes(q.status)).length} icon={FileText} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Accepted Value" value={`৳${formatCurrency(totalAccepted).replace("৳", "")}`} icon={FileText} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quotation List</CardTitle>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> New Quotation
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={tableData as unknown as Record<string, unknown>[]}
              columns={[
                { key: "quotationNo", header: "Quotation No" },
                { key: "client", header: "Client" },
                { key: "project", header: "Project" },
                { key: "description", header: "Description" },
                { key: "amount", header: "Amount", render: (v) => formatCurrency(v as number) },
                { key: "validUntil", header: "Valid Until", render: (v) => v ? formatDate(v as string) : "—" },
                { key: "date", header: "Date", render: (v) => formatDate(v as string) },
                { key: "status", header: "Status", render: (v) => <Badge variant={statusVariant[v as string] ?? "default"}>{v as string}</Badge> },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">New Quotation</h3>
              <button onClick={() => { setShowModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Client Name</label>
                <input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Optional —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount (৳) *</label>
                  <input type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Valid Until</label>
                  <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
