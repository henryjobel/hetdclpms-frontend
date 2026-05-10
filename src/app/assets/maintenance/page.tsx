"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { operationsApi } from "@/lib/api";
import { Loader2, Pencil, Plus, Settings, Trash2, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Asset {
  id: string;
  assetCode: string;
  name: string;
}

interface MaintenanceRow {
  id: string;
  assetId: string;
  maintenanceDate: string;
  description: string;
  vendorName?: string;
  cost: number;
  status: string;
  nextDueDate?: string;
  remarks?: string;
  asset: { id: string; assetCode: string; name: string; category: string };
}

interface DepSummaryRow {
  id: string;
  assetCode: string;
  name: string;
  purchaseValue: number;
  currentValue: number;
  depreciation: number;
  depreciationRate: number;
}

const defaultForm = {
  assetId: "",
  maintenanceDate: "",
  description: "",
  vendorName: "",
  cost: "",
  status: "completed",
  nextDueDate: "",
  remarks: "",
};

export default function AssetMaintenancePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [rows, setRows] = useState<MaintenanceRow[]>([]);
  const [depRows, setDepRows] = useState<DepSummaryRow[]>([]);
  const [depSummary, setDepSummary] = useState({ totalPurchaseValue: 0, totalCurrentValue: 0, totalDepreciation: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    try {
      const [assetsRes, maintenanceRes, depreciationRes] = await Promise.all([
        operationsApi.getAssets(),
        operationsApi.getAssetMaintenance(),
        operationsApi.getDepreciationSummary(),
      ]);
      setAssets(assetsRes.data.data || []);
      setRows(maintenanceRes.data.data || []);
      setDepRows(depreciationRes.data.data.rows || []);
      setDepSummary({
        totalPurchaseValue: depreciationRes.data.data.totalPurchaseValue || 0,
        totalCurrentValue: depreciationRes.data.data.totalCurrentValue || 0,
        totalDepreciation: depreciationRes.data.data.totalDepreciation || 0,
      });
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

  function openEdit(row: MaintenanceRow) {
    setEditId(row.id);
    setForm({
      assetId: row.assetId,
      maintenanceDate: row.maintenanceDate ? new Date(row.maintenanceDate).toISOString().slice(0, 10) : "",
      description: row.description || "",
      vendorName: row.vendorName || "",
      cost: String(row.cost || ""),
      status: row.status || "completed",
      nextDueDate: row.nextDueDate ? new Date(row.nextDueDate).toISOString().slice(0, 10) : "",
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
        maintenanceDate: form.maintenanceDate ? new Date(form.maintenanceDate).toISOString() : undefined,
        nextDueDate: form.nextDueDate ? new Date(form.nextDueDate).toISOString() : undefined,
        cost: parseFloat(form.cost) || 0,
      };
      if (editId) await operationsApi.updateAssetMaintenance(editId, payload);
      else await operationsApi.createAssetMaintenance(payload);
      closeModal();
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this maintenance log?")) return;
    await operationsApi.deleteAssetMaintenance(id);
    fetchAll();
  }

  return (
    <MainLayout title="Asset Maintenance" subtitle="Maintenance history, upcoming service schedule and depreciation summary">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Maintenance Logs" value={rows.length} icon={Settings} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Maintenance Cost" value={formatCurrency(rows.reduce((sum, row) => sum + row.cost, 0))} icon={Settings} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatCard title="Purchase Value" value={formatCurrency(depSummary.totalPurchaseValue)} icon={Settings} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="Total Depreciation" value={formatCurrency(depSummary.totalDepreciation)} icon={Settings} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Maintenance Register</CardTitle>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Log
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
            ) : (
              <DataTable
                data={rows as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "asset", header: "Asset", render: (_v, row) => (row as unknown as MaintenanceRow).asset.name },
                  { key: "maintenanceDate", header: "Date", render: (v) => formatDate(v as string) },
                  { key: "description", header: "Work" },
                  { key: "cost", header: "Cost", render: (v) => formatCurrency(v as number) },
                  { key: "status", header: "Status" },
                  { key: "id", header: "Actions", render: (v, row) => (
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(row as unknown as MaintenanceRow)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(v as string)} className="p-1.5 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ) },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Depreciation Summary</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
            ) : (
              <DataTable
                data={depRows as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "assetCode", header: "Code" },
                  { key: "name", header: "Asset" },
                  { key: "purchaseValue", header: "Purchase", render: (v) => formatCurrency(v as number) },
                  { key: "currentValue", header: "Current", render: (v) => formatCurrency(v as number) },
                  { key: "depreciation", header: "Depreciation", render: (v) => <span className="text-red-600">{formatCurrency(v as number)}</span> },
                  { key: "depreciationRate", header: "Rate", render: (v) => `${Number(v).toFixed(1)}%` },
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit Maintenance" : "Add Maintenance"}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <select required value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">Select asset</option>
                {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.assetCode} - {asset.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={form.maintenanceDate} onChange={(e) => setForm({ ...form, maintenanceDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input placeholder="Vendor Name" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="col-span-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input placeholder="Cost" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input placeholder="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input type="date" value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">
                  {saving && <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-2" />}{editId ? "Update Log" : "Create Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
