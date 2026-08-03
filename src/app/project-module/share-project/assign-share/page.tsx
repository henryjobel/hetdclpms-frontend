"use client";
import { useEffect, useState } from "react";
import { shareProjectApi, investmentApi, projectsApi } from "@/lib/api";
import { confirmAction } from "@/lib/feedback";
import { Plus, Loader2, X, Pencil, Trash2, Share2 } from "lucide-react";

interface Project { id: string; name: string }
interface Investor { id: string; name: string }
interface Assignment { id: string; investorId: string; projectId: string; shareCount: number; shareValue: number; assignDate: string; status: string; remarks?: string; investor: { name: string }; project: { name: string } }

const defaultForm = { investorId: "", projectId: "", shareCount: "", shareValue: "", status: "active", remarks: "" };

export default function AssignSharePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchAll() {
    try {
      const [ar, ir, pr] = await Promise.all([shareProjectApi.getAssignments(), investmentApi.getInvestors(), projectsApi.getAll()]);
      setAssignments(ar.data.data || []);
      setInvestors(ir.data.data || []);
      setProjects(pr.data.data || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, shareCount: parseInt(form.shareCount) || 0, shareValue: parseFloat(form.shareValue) || 0 };
      if (editId) await shareProjectApi.updateAssignment(editId, payload);
      else await shareProjectApi.createAssignment(payload);
      setShowModal(false); fetchAll();
    } catch (err: unknown) { setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed"); }
    finally { setSaving(false); }
  }

  const totalValue = assignments.reduce((a, b) => a + b.shareCount * b.shareValue, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Assign Shares</h1>
          <p className="text-sm text-gray-500">Assign project shares to investors</p>
        </div>
        <button onClick={() => { setEditId(null); setForm(defaultForm); setError(""); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg font-medium">
          <Plus className="w-4 h-4" /> Assign Share
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{ label: "Total Assignments", value: assignments.length },
          { label: "Total Shares", value: assignments.reduce((a, b) => a + b.shareCount, 0).toLocaleString() },
          { label: "Total Value", value: `৳${totalValue.toLocaleString()}` }
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Share2 className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-gray-700">Share Assignment Register</span>
          <span className="ml-auto text-xs text-gray-400">{assignments.length} records</span>
        </div>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div> : (
          <table className="w-full text-sm">
            <thead><tr className="bg-amber-500 text-white text-xs">
              {["#","Investor","Project","Shares","Value/Share","Total Value","Status","Actions"].map(h => <th key={h} className="px-4 py-3 text-left last:text-center">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {assignments.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">No share assignments yet.</td></tr>}
              {assignments.map((a, i) => (
                <tr key={a.id} className="hover:bg-amber-50">
                  <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 text-xs font-medium">{a.investor.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{a.project.name}</td>
                  <td className="px-4 py-3 text-xs">{a.shareCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">৳{a.shareValue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs font-bold text-amber-700">৳{(a.shareCount * a.shareValue).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs"><span className={`px-2 py-0.5 rounded text-[10px] font-medium ${a.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{a.status}</span></td>
                  <td className="px-4 py-3"><div className="flex justify-center gap-1">
                    <button onClick={() => { setEditId(a.id); setForm({ investorId: a.investorId, projectId: a.projectId, shareCount: String(a.shareCount), shareValue: String(a.shareValue), status: a.status, remarks: a.remarks ?? "" }); setError(""); setShowModal(true); }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={async () => { if (!(await confirmAction("Delete this share assignment?"))) return; await shareProjectApi.deleteAssignment(a.id); fetchAll(); }}
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
              <h3 className="text-base font-semibold">{editId ? "Edit" : "Assign"} Share</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Investor *</label>
                <select required value={form.investorId} onChange={(e) => setForm({ ...form, investorId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select Investor —</option>
                  {investors.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Project *</label>
                <select required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select Project —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Share Count *</label>
                  <input type="number" required min="1" value={form.shareCount} onChange={(e) => setForm({ ...form, shareCount: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Value/Share (৳)</label>
                  <input type="number" min="0" value={form.shareValue} onChange={(e) => setForm({ ...form, shareValue: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                <input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" /></div>
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
