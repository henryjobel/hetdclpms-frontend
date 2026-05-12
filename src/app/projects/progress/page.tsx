"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { projectsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { TrendingUp, Plus, Loader2, X, Trash2 } from "lucide-react";

interface Project { id: string; name: string }
interface ProgressLog {
  id: string;
  phase: string;
  percentage: number;
  remarks?: string;
  logDate: string;
}

const defaultForm = { phase: "", percentage: "0", remarks: "" };

const PHASES = ["Land Development", "Foundation", "Structure", "Brickwork", "Plaster", "Plumbing", "Electrical", "Finishing", "Handover"];

export default function ProgressPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
    projectsApi.getProgress(selectedId).then((r) => {
      setLogs(r.data.data || []);
    }).catch(() => setLogs([])).finally(() => setLoading(false));
  }, [selectedId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await projectsApi.createProgress(selectedId, {
        phase: form.phase,
        percentage: parseFloat(form.percentage) || 0,
        remarks: form.remarks || undefined,
      });
      setShowModal(false);
      setForm(defaultForm);
      const r = await projectsApi.getProgress(selectedId);
      setLogs(r.data.data || []);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to log progress");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await projectsApi.deleteProgress(selectedId, deleteId);
      setDeleteId(null);
      const r = await projectsApi.getProgress(selectedId);
      setLogs(r.data.data || []);
    } catch { /* noop */ } finally { setDeleting(false); }
  }

  // Latest progress per phase
  const phaseMap: Record<string, number> = {};
  logs.forEach((l) => {
    if (phaseMap[l.phase] === undefined || l.percentage > phaseMap[l.phase]) {
      phaseMap[l.phase] = l.percentage;
    }
  });
  const overallProgress = Object.keys(phaseMap).length > 0
    ? Math.round(Object.values(phaseMap).reduce((a, b) => a + b, 0) / Object.keys(phaseMap).length)
    : 0;

  return (
    <MainLayout title="Progress Monitor" subtitle="Track project phases and construction progress">
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
            <Plus className="w-4 h-4" /> Log Progress
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Overall Progress" value={`${overallProgress}%`} icon={TrendingUp} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Total Logs" value={logs.length} icon={TrendingUp} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Phases Tracked" value={Object.keys(phaseMap).length} icon={TrendingUp} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="Latest Entry" value={logs.length > 0 ? formatDate(logs[0].logDate) : "—"} icon={TrendingUp} iconColor="text-green-600" iconBg="bg-green-50" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Phase Progress Overview</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(phaseMap).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No progress logged yet</p>
              ) : Object.entries(phaseMap).map(([phase, pct]) => (
                <div key={phase}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{phase}</span>
                    <span className="text-gray-500">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-blue-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Progress Log History</CardTitle></CardHeader>
            <CardContent className="p-0">
              {logs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">No logs yet</p>
              ) : (
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {logs.map((l) => (
                    <div key={l.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{l.phase}</p>
                        {l.remarks && <p className="text-xs text-gray-500 mt-0.5">{l.remarks}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-amber-600">{l.percentage}%</p>
                          <p className="text-xs text-gray-400">{formatDate(l.logDate)}</p>
                        </div>
                        <button onClick={() => setDeleteId(l.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Progress Log?</h3>
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
              <h3 className="text-base font-semibold text-gray-900">Log Progress</h3>
              <button onClick={() => { setShowModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phase *</label>
                <select required value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select Phase —</option>
                  {PHASES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Completion % *</label>
                <input type="number" required min="0" max="100" value={form.percentage}
                  onChange={(e) => setForm({ ...form, percentage: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
