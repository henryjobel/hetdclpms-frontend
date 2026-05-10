"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { realEstateApi, projectsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Plus, Loader2, X, Pencil, Trash2 } from "lucide-react";

interface Project { id: string; name: string }
interface UnitRow {
  id: string;
  unitNo: string;
  type: string;
  status: string;
  size?: number;
  sizeUnit?: string;
  price: number;
  project: { name: string };
  block?: { name: string } | null;
  road?: { name: string } | null;
}

const defaultForm = {
  projectId: "", unitNo: "", type: "FLAT", status: "AVAILABLE", size: "", sizeUnit: "SFT", price: "", facing: "", description: "",
};

export default function RealEstateUnitsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    try {
      const [pr, ur] = await Promise.all([projectsApi.getAll(), realEstateApi.getUnits()]);
      setProjects(pr.data.data || []);
      setUnits(ur.data.data || []);
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

  function openEdit(unit: UnitRow) {
    setEditId(unit.id);
    setForm({
      projectId: projects.find((p) => p.name === unit.project.name)?.id || "",
      unitNo: unit.unitNo,
      type: unit.type,
      status: unit.status,
      size: unit.size ? String(unit.size) : "",
      sizeUnit: unit.sizeUnit || "SFT",
      price: String(unit.price),
      facing: "",
      description: "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      size: form.size ? parseFloat(form.size) : undefined,
      price: parseFloat(form.price) || 0,
    };
    try {
      if (editId) await realEstateApi.updateUnit(editId, payload);
      else await realEstateApi.createUnit(payload);
      closeModal();
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this unit?")) return;
    await realEstateApi.deleteUnit(id);
    fetchAll();
  }

  return (
    <MainLayout title="Flat / Land Units" subtitle="Manage available, booked and sold units">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Unit List</CardTitle>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Unit
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={units as unknown as Record<string, unknown>[]}
              columns={[
                { key: "unitNo", header: "Unit No" },
                { key: "type", header: "Type" },
                { key: "project", header: "Project", render: (_v, row) => (row as unknown as UnitRow).project.name },
                { key: "block", header: "Block", render: (_v, row) => (row as unknown as UnitRow).block?.name || "—" },
                { key: "road", header: "Road", render: (_v, row) => (row as unknown as UnitRow).road?.name || "—" },
                { key: "size", header: "Size", render: (_v, row) => {
                  const item = row as unknown as UnitRow;
                  return item.size ? `${item.size} ${item.sizeUnit || ""}` : "—";
                } },
                { key: "price", header: "Price", render: (v) => formatCurrency(v as number) },
                { key: "status", header: "Status" },
                { key: "id", header: "Actions", render: (v, row) => (
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(row as unknown as UnitRow)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit Unit" : "Add Unit"}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Project *</label>
                  <select required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="">Select project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit No *</label>
                  <input required value={form.unitNo} onChange={(e) => setForm({ ...form, unitNo: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    {["FLAT", "LAND", "SHOP", "OFFICE"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                  <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Size Unit</label>
                  <input value={form.sizeUnit} onChange={(e) => setForm({ ...form, sizeUnit: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price *</label>
                  <input required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    {["AVAILABLE", "BOOKED", "SOLD", "HOLD"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">
                  {saving && <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-2" />}{editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
