"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { projectsApi } from "@/lib/api";
import { FileText, Plus, Loader2, X, Pencil, Trash2 } from "lucide-react";

interface Project { id: string; name: string; }
interface BOQItem {
  id: string;
  phase?: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  materialCost: number;
  laborCost: number;
  totalCost: number;
}

const defaultForm = {
  phase: "",
  description: "",
  unit: "",
  quantity: "",
  unitRate: "",
  materialCost: "0",
  laborCost: "0",
};

export default function BOQPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [items, setItems] = useState<BOQItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    projectsApi.getBOQ(selectedId)
      .then((r) => setItems(r.data.data ?? r.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [selectedId]);

  function openCreate() {
    setEditId(null);
    setForm(defaultForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(item: BOQItem) {
    setEditId(item.id);
    setForm({
      phase: item.phase || "",
      description: item.description,
      unit: item.unit,
      quantity: String(item.quantity),
      unitRate: String(item.unitRate),
      materialCost: String(item.materialCost),
      laborCost: String(item.laborCost),
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const qty = parseFloat(form.quantity) || 0;
      const unitRate = parseFloat(form.unitRate) || 0;
      const materialCost = parseFloat(form.materialCost) || 0;
      const laborCost = parseFloat(form.laborCost) || 0;
      const totalCost = qty * unitRate + materialCost + laborCost;
      const payload = {
        phase: form.phase || undefined,
        description: form.description,
        unit: form.unit,
        quantity: qty,
        unitRate,
        materialCost,
        laborCost,
        totalCost,
      };
      if (editId) await projectsApi.updateBOQ(editId, payload);
      else await projectsApi.createBOQ(selectedId, payload);
      setShowModal(false);
      const r = await projectsApi.getBOQ(selectedId);
      setItems(r.data.data ?? r.data ?? []);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to save BOQ item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(itemId: string) {
    if (!confirm("Delete this BOQ item?")) return;
    await projectsApi.deleteBOQItem(itemId);
    const r = await projectsApi.getBOQ(selectedId);
    setItems(r.data.data ?? r.data ?? []);
  }

  const total = items.reduce((a, b) => a + (b.totalCost || 0), 0);
  const selectedProject = projects.find((p) => p.id === selectedId);

  const previewTotal =
    (parseFloat(form.quantity) || 0) * (parseFloat(form.unitRate) || 0) +
    (parseFloat(form.materialCost) || 0) +
    (parseFloat(form.laborCost) || 0);

  return (
    <MainLayout title="Bill of Quantities (BOQ)" subtitle="Manage project BOQ items and cost estimates">
      {/* Project selector + total + add button */}
      <div className="flex items-center gap-4 flex-wrap mb-5">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Project:</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 min-w-50">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {selectedId && (
          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Total: <span className="font-bold text-amber-600">৳{total.toLocaleString()}</span>
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg font-medium">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <FileText className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-gray-700">
            BOQ Items{selectedProject ? ` — ${selectedProject.name}` : ""}
          </span>
          <span className="ml-auto text-xs text-gray-400">{items.length} items</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-amber-500 text-white">
                <th className="px-4 py-3 text-left text-xs font-semibold w-8">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">PHASE</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">DESCRIPTION</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">UNIT</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">QTY</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">UNIT RATE</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">MATERIAL</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">LABOUR</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">TOTAL COST</th>
                <th className="px-4 py-3 text-center text-xs font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-gray-400 text-sm">
                    No BOQ items yet. Click &quot;Add Item&quot; to start.
                  </td>
                </tr>
              )}
              {items.map((item, i) => (
                <tr key={item.id} className="hover:bg-amber-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 text-xs">
                    {item.phase ? (
                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-medium">{item.phase}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">{item.description}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{item.unit || "—"}</td>
                  <td className="px-4 py-3 text-xs text-right">{item.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-right">৳{item.unitRate.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-right">৳{item.materialCost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-right">৳{item.laborCost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-right font-semibold text-gray-800">
                    ৳{item.totalCost.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr className="bg-amber-50 border-t border-amber-100 font-semibold">
                  <td colSpan={8} className="px-4 py-3 text-xs text-gray-700">TOTAL</td>
                  <td className="px-4 py-3 text-xs text-right text-amber-700 font-bold">৳{total.toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit BOQ Item" : "Add BOQ Item"}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phase (optional)</label>
                  <input value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })}
                    placeholder="e.g. Foundation, Structure"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit (e.g. m², kg, pcs)</label>
                  <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="Unit"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Item description"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min="0" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit Rate (৳)</label>
                  <input type="number" min="0" step="any" value={form.unitRate} onChange={(e) => setForm({ ...form, unitRate: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Material Cost (৳)</label>
                  <input type="number" min="0" step="any" value={form.materialCost} onChange={(e) => setForm({ ...form, materialCost: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Labour Cost (৳)</label>
                  <input type="number" min="0" step="any" value={form.laborCost} onChange={(e) => setForm({ ...form, laborCost: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>

              {(form.quantity || form.unitRate || form.materialCost || form.laborCost) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                  <span className="text-sm text-amber-700">Total Cost: </span>
                  <span className="text-sm font-bold text-amber-800">
                    ৳{previewTotal.toLocaleString()}
                  </span>
                  <span className="text-xs text-amber-600 ml-2">
                    (qty × rate + material + labour)
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editId ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
