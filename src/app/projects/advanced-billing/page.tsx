"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { contractorsApi, operationsApi, projectsApi, workersApi } from "@/lib/api";
import { CheckCircle, DollarSign, Loader2, Pencil, Plus, Receipt, Trash2, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Project { id: string; name: string }
interface Contractor { id: string; name: string }
interface Worker { id: string; name: string }
interface WorkOrder { id: string; workOrderNo: string; title: string }
interface BillingRow {
  id: string;
  billingNo: string;
  billingType: string;
  title: string;
  billedAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  billingDate: string;
  project?: { name: string };
  contractor?: { name: string };
  worker?: { name: string };
  workOrder?: { workOrderNo: string; title: string };
  projectId?: string;
  contractorId?: string;
  workerId?: string;
  workOrderId?: string;
  quantity?: number;
  unitRate?: number;
  percentage?: number;
  previousAmount?: number;
  adjustmentAmount?: number;
  retentionAmount?: number;
  dueDate?: string;
  remarks?: string;
}

const defaultForm = {
  billingType: "CONTRACTOR",
  title: "",
  projectId: "",
  contractorId: "",
  workerId: "",
  workOrderId: "",
  quantity: "",
  unitRate: "",
  percentage: "",
  previousAmount: "",
  adjustmentAmount: "",
  retentionAmount: "",
  billedAmount: "",
  paidAmount: "",
  billingDate: "",
  dueDate: "",
  remarks: "",
};

const statusVariant: Record<string, "default" | "warning" | "success" | "danger"> = {
  DRAFT: "default",
  SUBMITTED: "warning",
  APPROVED: "success",
  PARTIAL: "warning",
  PAID: "success",
  CANCELLED: "danger",
};

export default function AdvancedBillingPage() {
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    try {
      const [billingRes, projectsRes, contractorsRes, workersRes, workOrdersRes] = await Promise.all([
        operationsApi.getBilling(),
        projectsApi.getAll(),
        contractorsApi.getAll(),
        workersApi.getAll(),
        projectsApi.getWorkOrders(),
      ]);
      setRows(billingRes.data.data || []);
      setProjects(projectsRes.data.data || []);
      setContractors(contractorsRes.data.data || []);
      setWorkers(workersRes.data.data || []);
      setWorkOrders(workOrdersRes.data.data || []);
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

  function openEdit(row: BillingRow) {
    setEditId(row.id);
    setForm({
      billingType: row.billingType,
      title: row.title || "",
      projectId: row.projectId || "",
      contractorId: row.contractorId || "",
      workerId: row.workerId || "",
      workOrderId: row.workOrderId || "",
      quantity: String(row.quantity || ""),
      unitRate: String(row.unitRate || ""),
      percentage: String(row.percentage || ""),
      previousAmount: String(row.previousAmount || ""),
      adjustmentAmount: String(row.adjustmentAmount || ""),
      retentionAmount: String(row.retentionAmount || ""),
      billedAmount: String(row.billedAmount || ""),
      paidAmount: String(row.paidAmount || ""),
      billingDate: row.billingDate ? new Date(row.billingDate).toISOString().slice(0, 10) : "",
      dueDate: row.dueDate ? new Date(row.dueDate).toISOString().slice(0, 10) : "",
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
        quantity: parseFloat(form.quantity) || 0,
        unitRate: parseFloat(form.unitRate) || 0,
        percentage: form.percentage ? parseFloat(form.percentage) : undefined,
        previousAmount: parseFloat(form.previousAmount) || 0,
        adjustmentAmount: parseFloat(form.adjustmentAmount) || 0,
        retentionAmount: parseFloat(form.retentionAmount) || 0,
        billedAmount: parseFloat(form.billedAmount) || 0,
        paidAmount: parseFloat(form.paidAmount) || 0,
        billingDate: form.billingDate ? new Date(form.billingDate).toISOString() : undefined,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        contractorId: form.contractorId || undefined,
        workerId: form.workerId || undefined,
        workOrderId: form.workOrderId || undefined,
        projectId: form.projectId || undefined,
      };
      if (editId) await operationsApi.updateBilling(editId, payload);
      else await operationsApi.createBilling(payload);
      closeModal();
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this billing record?")) return;
    await operationsApi.deleteBilling(id);
    fetchAll();
  }

  async function handleApprove(row: BillingRow) {
    await operationsApi.updateBillingStatus(row.id, { status: "APPROVED", paidAmount: row.paidAmount });
    fetchAll();
  }

  const totalBilled = rows.reduce((sum, row) => sum + row.billedAmount, 0);
  const totalPaid = rows.reduce((sum, row) => sum + row.paidAmount, 0);
  const totalDue = rows.reduce((sum, row) => sum + row.dueAmount, 0);

  return (
    <MainLayout title="Advanced Billing" subtitle="Contractor, labor, adjustment and percentage billing management">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Billing Records" value={rows.length} icon={Receipt} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Total Billed" value={formatCurrency(totalBilled)} icon={DollarSign} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="Paid" value={formatCurrency(totalPaid)} icon={CheckCircle} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Due" value={formatCurrency(totalDue)} icon={DollarSign} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Billing Register</CardTitle>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> New Billing
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={rows as unknown as Record<string, unknown>[]}
              columns={[
                { key: "billingNo", header: "Billing No" },
                { key: "billingType", header: "Type" },
                { key: "title", header: "Title" },
                { key: "project", header: "Project", render: (_v, row) => (row as unknown as BillingRow).project?.name || "-" },
                { key: "billedAmount", header: "Billed", render: (v) => formatCurrency(v as number) },
                { key: "paidAmount", header: "Paid", render: (v) => <span className="text-green-700">{formatCurrency(v as number)}</span> },
                { key: "dueAmount", header: "Due", render: (v) => <span className="text-red-600">{formatCurrency(v as number)}</span> },
                { key: "billingDate", header: "Date", render: (v) => formatDate(v as string) },
                { key: "status", header: "Status", render: (v) => <Badge variant={statusVariant[v as string] ?? "default"}>{v as string}</Badge> },
                { key: "id", header: "Actions", render: (v, row) => {
                  const item = row as unknown as BillingRow;
                  return (
                    <div className="flex items-center gap-2">
                      {item.status === "SUBMITTED" || item.status === "DRAFT" ? (
                        <button onClick={() => handleApprove(item)} className="p-1.5 rounded-lg bg-green-50 text-green-600"><CheckCircle className="w-3.5 h-3.5" /></button>
                      ) : null}
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(v as string)} className="p-1.5 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  );
                } },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit Billing" : "New Billing"}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Billing Type *</label>
                  <select value={form.billingType} onChange={(e) => setForm({ ...form, billingType: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    {["CONTRACTOR", "LABOR", "ADJUSTMENT", "PERCENTAGE"].map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                  <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="">General</option>
                    {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contractor</label>
                  <select value={form.contractorId} onChange={(e) => setForm({ ...form, contractorId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="">None</option>
                    {contractors.map((contractor) => <option key={contractor.id} value={contractor.id}>{contractor.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Worker</label>
                  <select value={form.workerId} onChange={(e) => setForm({ ...form, workerId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="">None</option>
                    {workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}
                  </select>
                </div>
                <div className="lg:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Work Order</label>
                  <select value={form.workOrderId} onChange={(e) => setForm({ ...form, workOrderId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="">None</option>
                    {workOrders.map((order) => <option key={order.id} value={order.id}>{order.workOrderNo} - {order.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                  <input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit Rate</label>
                  <input value={form.unitRate} onChange={(e) => setForm({ ...form, unitRate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Percentage</label>
                  <input value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Previous Amount</label>
                  <input value={form.previousAmount} onChange={(e) => setForm({ ...form, previousAmount: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Adjustment</label>
                  <input value={form.adjustmentAmount} onChange={(e) => setForm({ ...form, adjustmentAmount: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Retention</label>
                  <input value={form.retentionAmount} onChange={(e) => setForm({ ...form, retentionAmount: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Billed Amount *</label>
                  <input required value={form.billedAmount} onChange={(e) => setForm({ ...form, billedAmount: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Paid Amount</label>
                  <input value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Billing Date</label>
                  <input type="date" value={form.billingDate} onChange={(e) => setForm({ ...form, billingDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                  <input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">
                  {saving && <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-2" />}{editId ? "Update Billing" : "Create Billing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
