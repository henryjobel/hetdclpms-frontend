"use client";
import { useEffect, useState } from "react";
import { shareProjectApi, projectsApi } from "@/lib/api";
import { confirmAction } from "@/lib/feedback";
import { Plus, Loader2, X, Pencil, Trash2, Settings } from "lucide-react";

interface Project { id: string; name: string }
interface Config { id: string; configName: string; totalShares: number; shareValue: number; projectId?: string; project?: { name: string } }

const defaultForm = { configName: "", projectId: "", totalShares: "", shareValue: "" };

export default function InvestmentConfigPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchAll() {
    try {
      const [cr, pr] = await Promise.all([shareProjectApi.getConfigs(), projectsApi.getAll()]);
      setConfigs(cr.data.data || []);
      setProjects(pr.data.data || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, totalShares: parseInt(form.totalShares) || 0, shareValue: parseFloat(form.shareValue) || 0, projectId: form.projectId || undefined };
      if (editId) await shareProjectApi.updateConfig(editId, payload);
      else await shareProjectApi.createConfig(payload);
      setShowModal(false); fetchAll();
    } catch (err: unknown) { setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Investment Configuration</h1>
          <p className="text-sm text-gray-500">Configure total shares and per-share value for each project</p>
        </div>
        <button onClick={() => { setEditId(null); setForm(defaultForm); setError(""); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg font-medium">
          <Plus className="w-4 h-4" /> New Configuration
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Settings className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-gray-700">Share Configurations</span>
          <span className="ml-auto text-xs text-gray-400">{configs.length} records</span>
        </div>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div> : (
          <table className="w-full text-sm">
            <thead><tr className="bg-amber-500 text-white text-xs">
              {["#","Config Name","Project","Total Shares","Share Value (৳)","Total Value","Actions"].map(h => <th key={h} className="px-4 py-3 text-left last:text-center">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {configs.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No configurations yet.</td></tr>}
              {configs.map((c, i) => (
                <tr key={c.id} className="hover:bg-amber-50">
                  <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 text-xs font-medium">{c.configName}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.project?.name || "General"}</td>
                  <td className="px-4 py-3 text-xs">{c.totalShares.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">৳{c.shareValue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs font-bold text-amber-700">৳{(c.totalShares * c.shareValue).toLocaleString()}</td>
                  <td className="px-4 py-3"><div className="flex justify-center gap-1">
                    <button onClick={() => { setEditId(c.id); setForm({ configName: c.configName, projectId: c.projectId ?? "", totalShares: String(c.totalShares), shareValue: String(c.shareValue) }); setError(""); setShowModal(true); }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={async () => { if (!(await confirmAction("Delete this configuration?"))) return; await shareProjectApi.deleteConfig(c.id); fetchAll(); }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold">{editId ? "Edit" : "New"} Configuration</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Configuration Name *</label>
                <input required value={form.configName} onChange={(e) => setForm({ ...form, configName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">General</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Total Shares</label>
                  <input type="number" min="0" value={form.totalShares} onChange={(e) => setForm({ ...form, totalShares: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Share Value (৳)</label>
                  <input type="number" min="0" value={form.shareValue} onChange={(e) => setForm({ ...form, shareValue: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
