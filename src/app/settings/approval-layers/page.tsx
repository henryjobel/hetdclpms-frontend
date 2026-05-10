"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { operationsApi } from "@/lib/api";
import { CheckCircle, Layers, Loader2, Pencil, Plus, Shield, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ApprovalLayer {
  id: string;
  module: string;
  level: number;
  roleName: string;
  minAmount?: number | null;
  maxAmount?: number | null;
  isActive: boolean;
}

const defaultForm = {
  module: "VOUCHER",
  level: "1",
  roleName: "admin",
  minAmount: "",
  maxAmount: "",
  isActive: true,
};

export default function ApprovalLayersPage() {
  const [rows, setRows] = useState<ApprovalLayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    try {
      const response = await operationsApi.getApprovalLayers();
      setRows(response.data.data || []);
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

  function openEdit(row: ApprovalLayer) {
    setEditId(row.id);
    setForm({
      module: row.module,
      level: String(row.level),
      roleName: row.roleName,
      minAmount: row.minAmount ? String(row.minAmount) : "",
      maxAmount: row.maxAmount ? String(row.maxAmount) : "",
      isActive: row.isActive,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        level: parseInt(form.level, 10) || 1,
        minAmount: form.minAmount ? parseFloat(form.minAmount) : undefined,
        maxAmount: form.maxAmount ? parseFloat(form.maxAmount) : undefined,
      };
      if (editId) await operationsApi.updateApprovalLayer(editId, payload);
      else await operationsApi.createApprovalLayer(payload);
      closeModal();
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this approval layer?")) return;
    await operationsApi.deleteApprovalLayer(id);
    fetchAll();
  }

  return (
    <MainLayout title="Approval Layers" subtitle="Configure module-wise approval hierarchy and amount thresholds">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Layers" value={rows.length} icon={Layers} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Modules" value={new Set(rows.map((row) => row.module)).size} icon={Shield} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="Active" value={rows.filter((row) => row.isActive).length} icon={CheckCircle} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Threshold Rules" value={rows.filter((row) => row.minAmount || row.maxAmount).length} icon={Shield} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Approval Configuration</CardTitle>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Layer
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={rows as unknown as Record<string, unknown>[]}
              columns={[
                { key: "module", header: "Module" },
                { key: "level", header: "Level" },
                { key: "roleName", header: "Role" },
                { key: "minAmount", header: "Min Amount", render: (v) => v ? formatCurrency(v as number) : "-" },
                { key: "maxAmount", header: "Max Amount", render: (v) => v ? formatCurrency(v as number) : "-" },
                { key: "isActive", header: "Status", render: (v) => <Badge variant={v ? "success" : "gray"}>{v ? "Active" : "Inactive"}</Badge> },
                { key: "id", header: "Actions", render: (v, row) => (
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(row as unknown as ApprovalLayer)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit Approval Layer" : "Add Approval Layer"}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <select value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  {["VOUCHER", "BILLING", "PURCHASE", "RECONCILIATION", "ASSET"].map((module) => <option key={module} value={module}>{module}</option>)}
                </select>
                <input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="Level" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input value={form.roleName} onChange={(e) => setForm({ ...form, roleName: e.target.value })} placeholder="Role Name" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <select value={form.isActive ? "true" : "false"} onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <input value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} placeholder="Min Amount" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value })} placeholder="Max Amount" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">
                  {saving && <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-2" />}{editId ? "Update Layer" : "Create Layer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
