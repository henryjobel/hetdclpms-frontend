"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { workersApi } from "@/lib/api";
import { Users, DollarSign, Plus, Search, Loader2, X, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Worker {
  id: string;
  name: string;
  role: string;
  phone?: string;
  dailyWage: number;
  isActive: boolean;
  assignments: Array<{ project: { name: string }; daysWorked: number }>;
}

const defaultForm = { name: "", role: "", phone: "", dailyWage: "" };

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchAll() {
    try {
      const r = await workersApi.getAll();
      setWorkers(r.data.data || []);
    } catch { setWorkers([]); } finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = workers.filter(
    (w) => w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.role.toLowerCase().includes(search.toLowerCase())
  );

  function openEdit(w: Worker) {
    setForm({ name: w.name, role: w.role, phone: w.phone ?? "", dailyWage: String(w.dailyWage) });
    setEditId(w.id);
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); setForm(defaultForm); setEditId(null); setError(""); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const data = { ...form, dailyWage: parseFloat(form.dailyWage) || 0 };
      if (editId) await workersApi.update(editId, data);
      else await workersApi.create(data);
      closeModal(); fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to save");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this worker?")) return;
    try { await workersApi.delete(id); fetchAll(); } catch { /* silent */ }
  }

  const tableData = filtered.map((w) => ({
    id: w.id, _worker: w,
    name: w.name, role: w.role,
    phone: w.phone ?? "—",
    project: w.assignments[0]?.project?.name ?? "—",
    dailyWage: w.dailyWage,
    daysWorked: w.assignments[0]?.daysWorked ?? 0,
    totalWage: w.dailyWage * (w.assignments[0]?.daysWorked ?? 0),
    status: w.isActive ? "active" : "inactive",
  }));

  const totalWage = workers.reduce((a, w) => a + w.dailyWage * (w.assignments[0]?.daysWorked ?? 0), 0);

  return (
    <MainLayout title="Workers" subtitle="Manage daily labor and workers">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Workers" value={workers.length} icon={Users} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Active" value={workers.filter((w) => w.isActive).length} icon={Users} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Total Wage (Month)" value={`৳${totalWage.toLocaleString()}`} icon={DollarSign} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Avg Daily Wage" value={workers.length > 0 ? `৳${Math.round(workers.reduce((a, w) => a + w.dailyWage, 0) / workers.length)}` : "—"} icon={DollarSign} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Worker List</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Worker
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
                { key: "name", header: "Name" },
                { key: "role", header: "Role" },
                { key: "phone", header: "Phone" },
                { key: "project", header: "Project" },
                { key: "dailyWage", header: "Daily Wage", render: (v) => `৳${(v as number).toLocaleString()}` },
                { key: "daysWorked", header: "Days Worked" },
                { key: "totalWage", header: "Total Wage", render: (v) => formatCurrency(v as number) },
                { key: "status", header: "Status", render: (v) => <Badge variant={v === "active" ? "success" : "gray"}>{v as string}</Badge> },
                {
                  key: "id", header: "Actions",
                  render: (id, row) => (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(row._worker as Worker)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(id as string)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit Worker" : "Add Worker"}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              {[
                { label: "Full Name *", key: "name", type: "text", required: true },
                { label: "Role / Trade *", key: "role", type: "text", required: true },
                { label: "Phone", key: "phone", type: "tel", required: false },
                { label: "Daily Wage (৳) *", key: "dailyWage", type: "number", required: true },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} required={required} value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {editId ? "Update" : "Add Worker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
