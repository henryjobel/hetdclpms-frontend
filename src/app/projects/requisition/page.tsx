"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { inventoryApi, projectsApi } from "@/lib/api";
import { ClipboardList, Plus, Search, Loader2, X, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Requisition {
  id: string;
  status: string;
  priority: string;
  requestedBy: string;
  requiredDate: string;
  remarks?: string;
  project: { name: string };
  items: Array<{ quantity: number; unit: string; product: { name: string; unit: string } }>;
}

interface Project { id: string; name: string }
interface Product { id: string; name: string; unit: string }

const statusVariant: Record<string, "warning" | "success" | "info" | "gray" | "danger"> = {
  PENDING: "warning", APPROVED: "success", FULFILLED: "gray", REJECTED: "danger",
};

const defaultForm = {
  projectId: "", requestedBy: "", requiredDate: "", priority: "MEDIUM", remarks: "",
  productId: "", quantity: "1",
};

export default function RequisitionPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
      const [rr, pr, pd] = await Promise.all([
        inventoryApi.getRequisitions(),
        projectsApi.getAll(),
        inventoryApi.getProducts(),
      ]);
      setRequisitions(rr.data.data || []);
      setProjects(pr.data.data || []);
      setProducts(pd.data.data || []);
    } catch {
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = requisitions.filter((r) =>
    r.project.name.toLowerCase().includes(search.toLowerCase()) ||
    r.requestedBy.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.projectId || !form.productId) {
      setError("Select a project and product");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const product = products.find((p) => p.id === form.productId);
      await inventoryApi.createRequisition({
        projectId: form.projectId,
        requestedBy: form.requestedBy,
        requiredDate: form.requiredDate,
        priority: form.priority,
        remarks: form.remarks,
        items: [{ productId: form.productId, quantity: parseFloat(form.quantity) || 1, unit: product?.unit ?? "pcs" }],
      });
      setShowModal(false);
      setForm(defaultForm);
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create requisition");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try { await inventoryApi.deleteRequisition(deleteId); setDeleteId(null); fetchAll(); }
    catch { /* noop */ } finally { setDeleting(false); }
  }

  async function handleApprove(id: string) {
    try {
      await inventoryApi.updateRequisitionStatus(id, "APPROVED");
      fetchAll();
    } catch { /* noop */ }
  }

  const tableData = filtered.map((r) => ({
    id: r.id,
    project: r.project.name,
    material: r.items.map((i) => i.product.name).join(", "),
    quantity: r.items.map((i) => `${i.quantity} ${i.unit}`).join(", "),
    requiredDate: r.requiredDate,
    priority: r.priority,
    requestedBy: r.requestedBy,
    status: r.status,
    _id: r.id,
  }));

  return (
    <MainLayout title="Material Requisition" subtitle="Track material requests from project sites">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Requisitions" value={requisitions.length} icon={ClipboardList} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Pending" value={requisitions.filter((r) => r.status === "PENDING").length} icon={ClipboardList} iconColor="text-yellow-600" iconBg="bg-yellow-50" />
        <StatCard title="Approved" value={requisitions.filter((r) => r.status === "APPROVED").length} icon={ClipboardList} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Fulfilled" value={requisitions.filter((r) => r.status === "FULFILLED").length} icon={ClipboardList} iconColor="text-gray-600" iconBg="bg-gray-100" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Requisition List</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> New Requisition
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
                { key: "project", header: "Project" },
                { key: "material", header: "Material" },
                { key: "quantity", header: "Quantity" },
                { key: "requiredDate", header: "Required By", render: (v) => formatDate(v as string) },
                { key: "priority", header: "Priority", render: (v) => (
                  <Badge variant={v === "HIGH" ? "danger" : v === "MEDIUM" ? "warning" : "default"}>{(v as string).toLowerCase()}</Badge>
                )},
                { key: "requestedBy", header: "Requested By" },
                { key: "status", header: "Status", render: (v) => <Badge variant={statusVariant[v as string] ?? "default"}>{(v as string).toLowerCase()}</Badge> },
                { key: "_id", header: "Actions", render: (v, row) => (
                  <div className="flex gap-1">
                    {row.status === "PENDING" && (
                      <button onClick={() => handleApprove(v as string)}
                        className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">Approve</button>
                    )}
                    <button onClick={() => setDeleteId(v as string)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Requisition?</h3>
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
              <h3 className="text-base font-semibold text-gray-900">New Material Requisition</h3>
              <button onClick={() => { setShowModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Project *</label>
                <select required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select Project —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Material / Product *</label>
                <select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select Product —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                  <input type="number" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Requested By *</label>
                <input required value={form.requestedBy} onChange={(e) => setForm({ ...form, requestedBy: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Required Date *</label>
                <input type="date" required value={form.requiredDate} onChange={(e) => setForm({ ...form, requiredDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
