"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { accountsApi, projectsApi } from "@/lib/api";
import { CheckCircle, FileText, Loader2, Plus, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ContraVoucher {
  id: string;
  voucherNo: string;
  amount: number;
  voucherDate: string;
  status: string;
  description?: string;
  project?: { name: string };
}

interface Project { id: string; name: string }

export function ContraVoucherPage() {
  const [rows, setRows] = useState<ContraVoucher[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ projectId: "", amount: "", description: "" });

  async function fetchAll() {
    try {
      const [vouchersRes, projectsRes] = await Promise.all([accountsApi.getVouchers({ type: "CONTRA" }), projectsApi.getAll()]);
      setRows(vouchersRes.data.data || []);
      setProjects(projectsRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await accountsApi.createVoucher({
      type: "CONTRA",
      projectId: form.projectId || undefined,
      amount: Number(form.amount || 0),
      description: form.description,
      entries: [],
    });
    setShowModal(false);
    setForm({ projectId: "", amount: "", description: "" });
    fetchAll();
  }

  async function handleApprove(id: string) {
    await accountsApi.approveVoucher(id);
    fetchAll();
  }

  return (
    <MainLayout title="Contra Vouchers" subtitle="Manage internal transfer and contra voucher transactions separately">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Contra Vouchers" value={rows.length} icon={FileText} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Approved" value={rows.filter((row) => row.status === "approved").length} icon={CheckCircle} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Pending" value={rows.filter((row) => row.status === "pending").length} icon={FileText} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Total Amount" value={formatCurrency(rows.reduce((sum, row) => sum + row.amount, 0))} icon={FileText} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contra Voucher List</CardTitle>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> New Contra
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={rows as unknown as Record<string, unknown>[]}
              columns={[
                { key: "voucherNo", header: "Voucher No" },
                { key: "project", header: "Project", render: (_value, row) => (row as unknown as ContraVoucher).project?.name || "General" },
                { key: "amount", header: "Amount", render: (value) => formatCurrency(Number(value)) },
                { key: "voucherDate", header: "Date", render: (value) => formatDate(String(value)) },
                { key: "description", header: "Description", render: (value) => String(value ?? "-") },
                { key: "status", header: "Status" },
                {
                  key: "id",
                  header: "Action",
                  render: (value, row) => (row as unknown as ContraVoucher).status === "pending" ? (
                    <button onClick={() => handleApprove(String(value))} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg">Approve</button>
                  ) : null,
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">New Contra Voucher</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">General</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              <input required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
