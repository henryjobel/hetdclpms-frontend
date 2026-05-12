"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { projectsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { FileText, Plus, Loader2, X, Pencil, Trash2 } from "lucide-react";

interface Project { id: string; name: string }
interface BOQItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  materialCost: number;
  laborCost: number;
  totalCost: number;
  phase?: string;
}

const defaultForm = { description: "", unit: "sqft", quantity: "1", unitRate: "", materialCost: "0", laborCost: "0", phase: "" };

export default function BOQPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [items, setItems] = useState<BOQItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    projectsApi.getAll().then((r) => {
      const list: Project[] = r.data.data || [];
      setProjects(list);
      if (list.length > 0) setSelectedId(list[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    projectsApi.getBOQ(selectedId).then((r) => {
      setItems(r.data.data || []);
    }).catch(() => setItems([])).finally(() => setLoading(false));
  }, [selectedId]);

  function openCreate() {
    setEditingId(null);
    setForm(defaultForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(item: BOQItem) {
    setEditingId(item.id);
    setForm({
      description: item.description,
      unit: item.unit,
      quantity: String(item.quantity),
      unitRate: String(item.unitRate),
      materialCost: String(item.materialCost),
      laborCost: String(item.laborCost),
      phase: item.phase ?? "",
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const qty = parseFloat(form.quantity) || 1;
      const rate = parseFloat(form.unitRate) || 0;
      const mat = parseFloat(form.materialCost) || 0;
      const lab = parseFloat(form.laborCost) || 0;
      const payload = {
        description: form.description,
        unit: form.unit,
        quantity: qty,
        unitRate: rate,
        materialCost: mat,
        laborCost: lab,
        totalCost: qty * rate + mat + lab,
        phase: form.phase || undefined,
      };
      if (editingId) {
        await projectsApi.updateBOQ(editingId, payload);
      } else {
        await projectsApi.createBOQ(selectedId, payload);
      }
      setShowModal(false);
      setForm(defaultForm);
      const r = await projectsApi.getBOQ(selectedId);
      setItems(r.data.data || []);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to save BOQ item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await projectsApi.deleteBOQItem(deleteId);
      setDeleteId(null);
      const r = await projectsApi.getBOQ(selectedId);
      setItems(r.data.data || []);
    } catch { /* noop */ } finally { setDeleting(false); }
  }

  const total = items.reduce((a, i) => a + i.totalCost, 0);
  const tableData = items.map((i) => ({ ...i, _raw: i }));

  return (
    <MainLayout title="Bill of Quantities (BOQ)" subtitle="Manage project BOQ items and cost estimates">
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Project:</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {selectedId && (
          <div className="ml-auto flex items-center gap-3">
            <div className="text-sm font-semibold text-gray-700">
              Total Estimated Cost: <span className="text-amber-600">{formatCurrency(total)}</span>
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4 text-amber-600" /> BOQ Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No BOQ items. Select a project and add items.</p>
          ) : (
            <DataTable
              data={tableData as unknown as Record<string, unknown>[]}
              columns={[
                { key: "phase", header: "Phase", render: (v) => v ? <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{v as string}</span> : <span className="text-gray-400">—</span> },
                { key: "description", header: "Description" },
                { key: "unit", header: "Unit" },
                { key: "quantity", header: "Qty", render: (v) => <span>{Number(v).toLocaleString()}</span> },
                { key: "unitRate", header: "Unit Rate", render: (v) => formatCurrency(v as number) },
                { key: "materialCost", header: "Material", render: (v) => formatCurrency(v as number) },
                { key: "laborCost", header: "Labour", render: (v) => formatCurrency(v as number) },
                { key: "totalCost", header: "Total", render: (v) => <span className="font-semibold text-amber-700">{formatCurrency(v as number)}</span> },
                {
                  key: "_raw", header: "Actions",
                  render: (v) => {
                    const item = v as BOQItem;
                    return (
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg">
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
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete BOQ Item?</h3>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editingId ? "Edit BOQ Item" : "Add BOQ Item"}</h3>
              <button onClick={() => { setShowModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                  <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phase</label>
                  <input value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })}
                    placeholder="e.g. Foundation"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                  <input type="number" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit Rate (৳)</label>
                  <input type="number" value={form.unitRate} onChange={(e) => setForm({ ...form, unitRate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Material Cost (৳)</label>
                  <input type="number" value={form.materialCost} onChange={(e) => setForm({ ...form, materialCost: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Labour Cost (৳)</label>
                  <input type="number" value={form.laborCost} onChange={(e) => setForm({ ...form, laborCost: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {editingId ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
