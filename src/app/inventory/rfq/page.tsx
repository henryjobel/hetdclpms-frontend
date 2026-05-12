"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { inventoryApi, projectsApi } from "@/lib/api";
import { FileText, Plus, Search, Loader2, X, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RFQ {
  id: string;
  status: string;
  sentDate: string;
  deadline?: string;
  remarks?: string;
  quotedAmount?: number;
  deliveryDays?: number;
  paymentTerms?: string;
  comparisonNotes?: string;
  isSelected: boolean;
  supplier: { name: string };
  project?: { name: string };
  supplierId?: string;
  projectId?: string;
}

interface Supplier { id: string; name: string }
interface Project { id: string; name: string }

const statusVariant: Record<string, "warning" | "info" | "success" | "default" | "danger"> = {
  PENDING: "warning", SENT: "info", RECEIVED: "success", APPROVED: "default", REJECTED: "danger",
};

const defaultForm = {
  supplierId: "", projectId: "", deadline: "", remarks: "", quotedAmount: "", deliveryDays: "", paymentTerms: "", comparisonNotes: "",
};

export default function RFQPage() {
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchAll() {
    try {
      const [rr, sr, pr] = await Promise.all([
        inventoryApi.getRFQs(),
        inventoryApi.getSuppliers(),
        projectsApi.getAll(),
      ]);
      setRFQs(rr.data.data || []);
      setSuppliers(sr.data.data || []);
      setProjects(pr.data.data || []);
    } catch {
      setRFQs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = rfqs.filter((r) =>
    r.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.project?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setError("");
    setForm(defaultForm);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try { await inventoryApi.deleteRFQ(deleteId); setDeleteId(null); fetchAll(); }
    catch { /* noop */ } finally { setDeleting(false); }
  }

  function openEdit(rfq: RFQ) {
    setEditId(rfq.id);
    setForm({
      supplierId: rfq.supplierId || "",
      projectId: rfq.projectId || "",
      deadline: rfq.deadline ? new Date(rfq.deadline).toISOString().slice(0, 10) : "",
      remarks: rfq.remarks || "",
      quotedAmount: rfq.quotedAmount ? String(rfq.quotedAmount) : "",
      deliveryDays: rfq.deliveryDays ? String(rfq.deliveryDays) : "",
      paymentTerms: rfq.paymentTerms || "",
      comparisonNotes: rfq.comparisonNotes || "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.supplierId) { setError("Select a supplier"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        supplierId: form.supplierId,
        projectId: form.projectId || undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        remarks: form.remarks,
        quotedAmount: form.quotedAmount ? parseFloat(form.quotedAmount) : undefined,
        deliveryDays: form.deliveryDays ? parseInt(form.deliveryDays, 10) : undefined,
        paymentTerms: form.paymentTerms || undefined,
        comparisonNotes: form.comparisonNotes || undefined,
      };
      if (editId) await inventoryApi.updateRFQ(editId, payload);
      else await inventoryApi.createRFQ(payload);
      closeModal();
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to save RFQ");
    } finally {
      setSaving(false);
    }
  }

  const tableData = filtered.map((r) => ({
    ...r,
    rfqNo: r.id.substring(0, 8),
    supplierName: r.supplier.name,
    projectName: r.project?.name ?? "-",
  }));

  return (
    <MainLayout title="Request for Quotation (RFQ)" subtitle="Send RFQs to suppliers and compare prices">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total RFQs" value={rfqs.length} icon={FileText} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Pending" value={rfqs.filter((r) => r.status === "PENDING").length} icon={FileText} iconColor="text-yellow-600" iconBg="bg-yellow-50" />
        <StatCard title="Selected" value={rfqs.filter((r) => r.isSelected).length} icon={FileText} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Quoted Value" value={formatCurrency(rfqs.reduce((sum, row) => sum + (row.quotedAmount || 0), 0))} icon={FileText} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>RFQ List</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Create RFQ
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
                { key: "rfqNo", header: "RFQ No" },
                { key: "supplierName", header: "Supplier" },
                { key: "projectName", header: "Project" },
                { key: "quotedAmount", header: "Quoted", render: (v) => v ? formatCurrency(v as number) : "-" },
                { key: "deliveryDays", header: "Delivery", render: (v) => v ? `${v} days` : "-" },
                { key: "paymentTerms", header: "Terms", render: (v) => String(v || "-") },
                { key: "deadline", header: "Deadline", render: (v) => v ? formatDate(v as string) : "-" },
                { key: "status", header: "Status", render: (v, row) => <Badge variant={(row as unknown as RFQ).isSelected ? "success" : statusVariant[v as string] ?? "default"}>{(row as unknown as RFQ).isSelected ? "selected" : (v as string).toLowerCase()}</Badge> },
                { key: "id", header: "Actions", render: (v, row) => (
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(row as unknown as RFQ)} className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(v as string)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )},
              ]}
            />
          )}
        </CardContent>
      </Card>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete RFQ?</h3>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit RFQ" : "Create RFQ"}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Supplier *</label>
                  <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                  <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="">Optional</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quoted Amount</label>
                  <input value={form.quotedAmount} onChange={(e) => setForm({ ...form, quotedAmount: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Days</label>
                  <input value={form.deliveryDays} onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
                  <input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Deadline</label>
                  <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                  <input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Comparison Notes</label>
                  <textarea rows={3} value={form.comparisonNotes} onChange={(e) => setForm({ ...form, comparisonNotes: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">
                  {saving && <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-2" />}{editId ? "Update RFQ" : "Create RFQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
