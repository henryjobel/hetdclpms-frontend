"use client";
import { useEffect, useState } from "react";
import { investmentApi, projectsApi } from "@/lib/api";
import { confirmAction } from "@/lib/feedback";
import { Plus, Loader2, X, Pencil, Trash2, TrendingUp, Users, DollarSign } from "lucide-react";

interface Project { id: string; name: string }
interface Investor { id: string; name: string; phone?: string; email?: string; address?: string; investorType: string; isActive: boolean; investments: Array<{ amount: number }> }
interface Investment { id: string; investorId: string; projectId: string; amount: number; percentage: number; status: string; remarks?: string; investor: { name: string }; project: { name: string } }

const defaultInvestorForm = { name: "", phone: "", email: "", address: "", nidNumber: "", investorType: "Individual" };
const defaultInvestForm = { investorId: "", projectId: "", amount: "", percentage: "", status: "active", remarks: "" };

export default function InvestorPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"investors" | "investments">("investors");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [investorForm, setInvestorForm] = useState(defaultInvestorForm);
  const [investForm, setInvestForm] = useState(defaultInvestForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchAll() {
    try {
      const [iv, im, pr] = await Promise.all([investmentApi.getInvestors(), investmentApi.getInvestments(), projectsApi.getAll()]);
      setInvestors(iv.data.data || []);
      setInvestments(im.data.data || []);
      setProjects(pr.data.data || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleInvestorSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (editId) await investmentApi.updateInvestor(editId, investorForm);
      else await investmentApi.createInvestor(investorForm);
      setShowModal(false); fetchAll();
    } catch (err: unknown) { setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to save"); }
    finally { setSaving(false); }
  }

  async function handleInvestSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...investForm, amount: parseFloat(investForm.amount) || 0, percentage: parseFloat(investForm.percentage) || 0 };
      if (editId) await investmentApi.updateInvestment(editId, payload);
      else await investmentApi.createInvestment(payload);
      setShowModal(false); fetchAll();
    } catch (err: unknown) { setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to save"); }
    finally { setSaving(false); }
  }

  const totalInvested = investments.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Investment Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage investors and project investments</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{ label: "Total Investors", value: investors.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Investments", value: investments.length, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Invested", value: `৳${totalInvested.toLocaleString()}`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" }
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}><Icon className={`w-5 h-5 ${color}`} /></div>
            <div><p className="text-xs text-gray-400">{label}</p><p className="text-lg font-bold text-gray-900">{value}</p></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(["investors", "investments"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium capitalize ${tab === t ? "border-b-2 border-amber-500 text-amber-700 bg-amber-50" : "text-gray-600 hover:bg-gray-50"}`}>
              {t}
            </button>
          ))}
          <div className="ml-auto flex items-center px-4">
            <button onClick={() => { setEditId(null); setInvestorForm(defaultInvestorForm); setInvestForm(defaultInvestForm); setError(""); setShowModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Add {tab === "investors" ? "Investor" : "Investment"}
            </button>
          </div>
        </div>

        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          : tab === "investors" ? (
            <table className="w-full text-sm">
              <thead><tr className="bg-amber-500 text-white text-xs">
                {["#","Name","Type","Phone","Email","Total Invested","Actions"].map(h => <th key={h} className="px-4 py-3 text-left last:text-center">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {investors.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No investors yet. Add one to start.</td></tr>}
                {investors.map((inv, i) => (
                  <tr key={inv.id} className="hover:bg-amber-50">
                    <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 text-xs font-medium">{inv.name}</td>
                    <td className="px-4 py-3 text-xs"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px]">{inv.investorType}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{inv.phone || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{inv.email || "—"}</td>
                    <td className="px-4 py-3 text-xs text-right font-semibold text-amber-700">৳{inv.investments.reduce((a, b) => a + b.amount, 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><div className="flex justify-center gap-1">
                      <button onClick={() => { setEditId(inv.id); setInvestorForm({ name: inv.name, phone: inv.phone ?? "", email: inv.email ?? "", address: inv.address ?? "", nidNumber: "", investorType: inv.investorType }); setError(""); setShowModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { if (!(await confirmAction("Delete this investor?"))) return; await investmentApi.deleteInvestor(inv.id); fetchAll(); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="bg-amber-500 text-white text-xs">
                {["#","Investor","Project","Amount","Share %","Status","Actions"].map(h => <th key={h} className="px-4 py-3 text-left last:text-center">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {investments.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No investments yet.</td></tr>}
                {investments.map((im, i) => (
                  <tr key={im.id} className="hover:bg-amber-50">
                    <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 text-xs font-medium">{im.investor.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{im.project.name}</td>
                    <td className="px-4 py-3 text-xs font-bold text-amber-700">৳{im.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs">{im.percentage}%</td>
                    <td className="px-4 py-3 text-xs"><span className={`px-2 py-0.5 rounded text-[10px] font-medium ${im.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{im.status}</span></td>
                    <td className="px-4 py-3"><div className="flex justify-center gap-1">
                      <button onClick={() => { setEditId(im.id); setInvestForm({ investorId: im.investorId, projectId: im.projectId, amount: String(im.amount), percentage: String(im.percentage), status: im.status, remarks: im.remarks ?? "" }); setError(""); setShowModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { if (!(await confirmAction("Delete this investment?"))) return; await investmentApi.deleteInvestment(im.id); fetchAll(); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
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
              <h3 className="text-base font-semibold">{editId ? "Edit" : "Add"} {tab === "investors" ? "Investor" : "Investment"}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            {tab === "investors" ? (
              <form onSubmit={handleInvestorSave} className="p-6 space-y-3">
                {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
                {[["Full Name *","name","text"],["Phone","phone","tel"],["Email","email","email"],["Address","address","text"],["NID Number","nidNumber","text"]].map(([label,key,type]) => (
                  <div key={key}><label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                    <input type={type} required={key==="name"} value={investorForm[key as keyof typeof investorForm]} onChange={(e) => setInvestorForm({...investorForm,[key]:e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" /></div>
                ))}
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Investor Type</label>
                  <select value={investorForm.investorType} onChange={(e) => setInvestorForm({...investorForm,investorType:e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {["Individual","Company","Partnership","Trust"].map(t=><option key={t}>{t}</option>)}
                  </select></div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg flex items-center gap-2">
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleInvestSave} className="p-6 space-y-3">
                {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Investor *</label>
                  <select required value={investForm.investorId} onChange={(e) => setInvestForm({...investForm,investorId:e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="">— Select Investor —</option>
                    {investors.map(inv=><option key={inv.id} value={inv.id}>{inv.name}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Project *</label>
                  <select required value={investForm.projectId} onChange={(e) => setInvestForm({...investForm,projectId:e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="">— Select Project —</option>
                    {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Amount (৳) *</label>
                    <input type="number" required value={investForm.amount} onChange={(e) => setInvestForm({...investForm,amount:e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Share %</label>
                    <input type="number" min="0" max="100" value={investForm.percentage} onChange={(e) => setInvestForm({...investForm,percentage:e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" /></div>
                </div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                  <input value={investForm.remarks} onChange={(e) => setInvestForm({...investForm,remarks:e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" /></div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg flex items-center gap-2">
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
