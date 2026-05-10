"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import { projectsApi } from "@/lib/api";
import { Building2, TrendingUp, DollarSign, CheckCircle, Plus, Search, Loader2, X, Pencil, Trash2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  location: string;
  type: string;
  status: string;
  budget: number;
  startDate: string;
  endDate: string;
  manager: string;
  totalUnits: number;
  soldUnits: number;
  description?: string;
}

const statusVariant: Record<string, "success" | "warning" | "gray" | "info" | "danger" | "default"> = {
  ACTIVE: "success",
  PLANNING: "info",
  ON_HOLD: "warning",
  COMPLETED: "gray",
  CANCELLED: "danger",
};

const defaultForm = {
  name: "", location: "", type: "Residential", status: "PLANNING",
  budget: "", startDate: "", endDate: "", manager: "",
  totalUnits: "", description: "",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  async function fetchProjects() {
    try {
      const res = await projectsApi.getAll();
      setProjects(res.data.data || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProjects(); }, []);

  function closeModal() {
    setShowModal(false);
    setForm(defaultForm);
    setEditId(null);
    setError("");
  }

  function openEdit(project: Project) {
    setEditId(project.id);
    setForm({
      name: project.name,
      location: project.location,
      type: project.type,
      status: project.status,
      budget: String(project.budget),
      startDate: project.startDate.slice(0, 10),
      endDate: project.endDate.slice(0, 10),
      manager: project.manager,
      totalUnits: String(project.totalUnits),
      description: project.description || "",
    });
    setShowModal(true);
  }

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        budget: parseFloat(form.budget) || 0,
        totalUnits: parseInt(form.totalUnits) || 0,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      };
      if (editId) await projectsApi.update(editId, payload);
      else await projectsApi.create(payload);
      closeModal();
      fetchProjects();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || `Failed to ${editId ? "update" : "create"} project`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return;
    try {
      await projectsApi.delete(id);
      fetchProjects();
    } catch {
      setError("Failed to delete project");
    }
  }

  return (
    <MainLayout title="Projects" subtitle="Manage all real estate & construction projects">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Projects" value={projects.length} icon={Building2} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Running" value={projects.filter((p) => p.status === "ACTIVE").length} icon={TrendingUp} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Completed" value={projects.filter((p) => p.status === "COMPLETED").length} icon={CheckCircle} iconColor="text-gray-600" iconBg="bg-gray-100" />
        <StatCard
          title="Total Budget"
          value={`৳${formatNumber(projects.reduce((a, p) => a + p.budget, 0))}`}
          icon={DollarSign} iconColor="text-purple-600" iconBg="bg-purple-50"
        />
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="all">All Status</option>
                <option value="ACTIVE">Running</option>
                <option value="PLANNING">Planning</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Project Cards */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.length === 0 && (
            <div className="col-span-3 py-20 text-center text-gray-400 text-sm">No projects found</div>
          )}
          {filtered.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{p.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{p.location}</p>
                  </div>
                  <Badge variant={statusVariant[p.status] ?? "default"}>
                    {PROJECT_STATUS_LABELS[p.status.toLowerCase()] ?? p.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">{p.type}</span>
                  <span className="text-xs text-gray-400">Manager: {p.manager.split(" ").slice(-1)[0]}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-400">Budget</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">৳{formatNumber(p.budget)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-400">Units Sold</p>
                    <p className="text-sm font-bold text-blue-700 mt-0.5">{p.soldUnits} / {p.totalUnits}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <span>Start: {formatDate(p.startDate)}</span>
                  <span>End: {formatDate(p.endDate)}</span>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 hover:bg-red-100 text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit Project" : "New Project"}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Project Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location *</label>
                  <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {["Residential", "Commercial", "Industrial", "Mixed Use"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Budget (৳)</label>
                  <input type="number" required value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Units</label>
                  <input type="number" value={form.totalUnits} onChange={(e) => setForm({ ...form, totalUnits: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date *</label>
                  <input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Manager Name *</label>
                  <input required value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {editId ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
