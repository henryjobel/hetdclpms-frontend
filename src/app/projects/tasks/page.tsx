"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { projectsApi, usersApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { ClipboardList, Plus, Loader2, X } from "lucide-react";

interface Project { id: string; name: string }
interface User { id: string; name: string }
interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  progress: number;
  dueDate: string;
  assignedTo: { id: string; name: string };
}

const statusVariant: Record<string, "default" | "info" | "success" | "warning" | "danger" | "gray"> = {
  PENDING: "default", IN_PROGRESS: "info", COMPLETED: "success", CANCELLED: "gray",
};
const priorityVariant: Record<string, "default" | "info" | "success" | "warning" | "danger" | "gray"> = {
  LOW: "gray", MEDIUM: "default", HIGH: "warning", URGENT: "danger",
};

const defaultForm = { title: "", description: "", userId: "", priority: "MEDIUM", dueDate: "", progress: "0" };

export default function TasksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([projectsApi.getAll(), usersApi.getAll()]).then(([pr, ur]) => {
      const pList: Project[] = pr.data.data || [];
      setProjects(pList);
      setUsers(ur.data.data || []);
      if (pList.length > 0) setSelectedId(pList[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    projectsApi.getTasks(selectedId).then((r) => {
      setTasks(r.data.data || []);
    }).catch(() => setTasks([])).finally(() => setLoading(false));
  }, [selectedId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId) { setError("Select an assignee"); return; }
    setSaving(true);
    setError("");
    try {
      await projectsApi.createTask(selectedId, {
        title: form.title,
        description: form.description || undefined,
        userId: form.userId,
        priority: form.priority,
        dueDate: new Date(form.dueDate).toISOString(),
        progress: parseInt(form.progress) || 0,
      });
      setShowModal(false);
      setForm(defaultForm);
      const r = await projectsApi.getTasks(selectedId);
      setTasks(r.data.data || []);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create task");
    } finally {
      setSaving(false);
    }
  }

  const grouped = {
    PENDING: tasks.filter((t) => t.status === "PENDING"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    COMPLETED: tasks.filter((t) => t.status === "COMPLETED"),
  };

  return (
    <MainLayout title="Project Tasks" subtitle="Manage and track project tasks and assignments">
      <div className="mb-4 flex items-center gap-4 flex-wrap justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Project:</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {selectedId && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {(["PENDING", "IN_PROGRESS", "COMPLETED"] as const).map((status) => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-gray-700">{status.replace(/_/g, " ")}</h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{grouped[status].length}</span>
              </div>
              <div className="space-y-3">
                {grouped[status].length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <p className="text-xs text-gray-400">No tasks</p>
                  </div>
                ) : grouped[status].map((t) => (
                  <Card key={t.id} className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-gray-800 leading-tight">{t.title}</p>
                        <Badge variant={priorityVariant[t.priority] ?? "default"}>{t.priority}</Badge>
                      </div>
                      {t.description && <p className="text-xs text-gray-500 mb-2">{t.description}</p>}
                      <div className="space-y-1 mb-2">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Progress</span><span>{t.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${t.progress}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>👤 {t.assignedTo.name}</span>
                        <span>Due: {formatDate(t.dueDate)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Add Task</h3>
              <button onClick={() => { setShowModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Assignee *</label>
                  <select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="">— Select —</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Due Date *</label>
                  <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Progress %</label>
                  <input type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <ClipboardList className="w-3.5 h-3.5" /> Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
