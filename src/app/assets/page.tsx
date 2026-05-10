"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { operationsApi, projectsApi } from "@/lib/api";
import { Boxes, Landmark, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Project { id: string; name: string }
interface AssetRow {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  status: string;
  purchaseDate?: string;
  purchaseValue: number;
  currentValue: number;
  location?: string;
  project?: { name: string };
  projectId?: string;
  serialNo?: string;
  remarks?: string;
}

const defaultForm = {
  name: "",
  category: "",
  status: "ACTIVE",
  purchaseDate: "",
  purchaseValue: "",
  currentValue: "",
  location: "",
  projectId: "",
  serialNo: "",
  remarks: "",
};

export default function AssetsPage() {
  const [rows, setRows] = useState<AssetRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    try {
      const [assetsRes, projectsRes] = await Promise.all([
        operationsApi.getAssets(),
        projectsApi.getAll(),
      ]);
      setRows(assetsRes.data.data || []);
      setProjects(projectsRes.data.data || []);
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

  function openEdit(row: AssetRow) {
    setEditId(row.id);
    setForm({
      name: row.name || "",
      category: row.category || "",
      status: row.status || "ACTIVE",
      purchaseDate: row.purchaseDate ? new Date(row.purchaseDate).toISOString().slice(0, 10) : "",
      purchaseValue: String(row.purchaseValue || ""),
      currentValue: String(row.currentValue || ""),
      location: row.location || "",
      projectId: row.projectId || "",
      serialNo: row.serialNo || "",
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
        purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : undefined,
        purchaseValue: parseFloat(form.purchaseValue) || 0,
        currentValue: parseFloat(form.currentValue) || 0,
        projectId: form.projectId || undefined,
      };
      if (editId) await operationsApi.updateAsset(editId, payload);
      else await operationsApi.createAsset(payload);
      closeModal();
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this asset?")) return;
    await operationsApi.deleteAsset(id);
    fetchAll();
  }

  return (
    <MainLayout title="Assets" subtitle="Track office, project and site assets for real-estate construction operations">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Asset Count" value={rows.length} icon={Boxes} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Purchase Value" value={formatCurrency(rows.reduce((sum, row) => sum + row.purchaseValue, 0))} icon={Landmark} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="Current Value" value={formatCurrency(rows.reduce((sum, row) => sum + row.currentValue, 0))} icon={Landmark} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Disposed" value={rows.filter((row) => row.status === "DISPOSED").length} icon={Boxes} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Asset Register</CardTitle>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Asset
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={rows as unknown as Record<string, unknown>[]}
              columns={[
                { key: "assetCode", header: "Asset Code" },
                { key: "name", header: "Name" },
                { key: "category", header: "Category" },
                { key: "project", header: "Project", render: (_v, row) => (row as unknown as AssetRow).project?.name || "-" },
                { key: "purchaseDate", header: "Purchase Date", render: (v) => v ? formatDate(v as string) : "-" },
                { key: "purchaseValue", header: "Purchase Value", render: (v) => formatCurrency(v as number) },
                { key: "currentValue", header: "Current Value", render: (v) => formatCurrency(v as number) },
                { key: "status", header: "Status", render: (v) => <Badge variant={v === "DISPOSED" ? "danger" : v === "UNDER_MAINTENANCE" ? "warning" : "success"}>{v as string}</Badge> },
                { key: "id", header: "Actions", render: (v, row) => (
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(row as unknown as AssetRow)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(v as string)} className="p-1.5 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ) },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit Asset" : "Add Asset"}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Asset Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input required placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  <option value="">No Project</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  {["ACTIVE", "IN_USE", "UNDER_MAINTENANCE", "DISPOSED"].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input placeholder="Serial No" value={form.serialNo} onChange={(e) => setForm({ ...form, serialNo: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input placeholder="Purchase Value" value={form.purchaseValue} onChange={(e) => setForm({ ...form, purchaseValue: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input placeholder="Current Value" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="col-span-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="col-span-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">
                  {saving && <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-2" />}{editId ? "Update Asset" : "Create Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
