"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { contractorsApi, projectsApi, projectsApi as projectApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Loader2, X, Pencil, Trash2 } from "lucide-react";

interface Project { id: string; name: string }
interface Contractor { id: string; name: string }
interface WorkOrder {
  id: string;
  workOrderNo: string;
  title: string;
  type: string;
  status: string;
  amount: number;
  startDate?: string;
  endDate?: string;
  vendorName?: string;
  project?: { name: string };
  contractor?: { name: string };
}

const defaultForm = {
  title: "", type: "General Work Order", status: "draft", amount: "", startDate: "", endDate: "", vendorName: "", projectId: "", contractorId: "", description: "",
};

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    try {
      const [wr, pr, cr] = await Promise.all([projectApi.getWorkOrders(), projectsApi.getAll(), contractorsApi.getAll()]);
      setWorkOrders(wr.data.data || []);
      setProjects(pr.data.data || []);
      setContractors(cr.data.data || []);
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

  function openEdit(item: WorkOrder) {
    setEditId(item.id);
    setForm({
      title: item.title,
      type: item.type,
      status: item.status,
      amount: String(item.amount),
      startDate: item.startDate?.slice(0, 10) || "",
      endDate: item.endDate?.slice(0, 10) || "",
      vendorName: item.vendorName || "",
      projectId: projects.find((p) => p.name === item.project?.name)?.id || "",
      contractorId: contractors.find((c) => c.name === item.contractor?.name)?.id || "",
      description: "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      amount: parseFloat(form.amount) || 0,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      projectId: form.projectId || undefined,
      contractorId: form.contractorId || undefined,
    };
    try {
      if (editId) await projectApi.updateWorkOrder(editId, payload);
      else await projectApi.createWorkOrder(payload);
      closeModal();
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this work order?")) return;
    await projectApi.deleteWorkOrder(id);
    fetchAll();
  }

  return (
    <MainLayout title="Work Orders" subtitle="Manage contractor and service work orders">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Work Order List</CardTitle>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> New Work Order
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div> : (
            <DataTable
              data={workOrders as unknown as Record<string, unknown>[]}
              columns={[
                { key: "workOrderNo", header: "WO No" },
                { key: "title", header: "Title" },
                { key: "type", header: "Type" },
                { key: "project", header: "Project", render: (_v, row) => (row as unknown as WorkOrder).project?.name || "General" },
                { key: "contractor", header: "Contractor", render: (_v, row) => (row as unknown as WorkOrder).contractor?.name || (row as unknown as WorkOrder).vendorName || "—" },
                { key: "amount", header: "Amount", render: (v) => formatCurrency(v as number) },
                { key: "startDate", header: "Start", render: (v) => v ? formatDate(v as string) : "—" },
                { key: "endDate", header: "End", render: (v) => v ? formatDate(v as string) : "—" },
                { key: "status", header: "Status" },
                { key: "id", header: "Actions", render: (v, row) => (
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(row as unknown as WorkOrder)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(v as string)} className="p-1.5 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )},
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit Work Order" : "New Work Order"}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    {["General Work Order", "Contractor Work Order", "Labor Work Order", "Service Work Order"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    {["draft", "approved", "running", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                  <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="">General</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contractor</label>
                  <select value={form.contractorId} onChange={(e) => setForm({ ...form, contractorId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="">Select contractor</option>
                    {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vendor / Service Name</label>
                  <input value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount *</label>
                  <input required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div></div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">{saving && <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-2" />}{editId ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
