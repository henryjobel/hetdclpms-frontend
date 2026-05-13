"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { projectsApi } from "@/lib/api";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Eye, Plus, Pencil, Trash2, X, Loader2,
  Download, FileSpreadsheet, FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Project {
  id: string; name: string; location: string; type: string; status: string;
  budget: number; startDate: string; endDate: string; manager: string;
  totalUnits: number; soldUnits: number; description?: string;
}
interface BOQItem {
  id: string; projectId: string; itemType: string; description: string;
  unit: string; quantity: number; rate: number; amount: number;
}
interface Task {
  id: string; projectId: string; name: string; description?: string;
  assignee?: string; status: string; priority: string;
  startDate?: string; dueDate?: string;
}
interface ProgressLog {
  id: string; projectId: string; date: string;
  workingProgress: number; financialProgress: number; notes?: string;
}
interface Quotation {
  id: string; projectId?: string; title?: string; vendor?: string;
  amount?: number; status?: string; date?: string; project?: { name: string };
}
interface ProjectDetails {
  areaOfLand: string; nameOfLandOwner: string; landOwnerDeveloperRatio: string;
  valueOfLand: string; buildArea: string; totalNoOfBuilding: string;
  totalFloorOfBuilding: string; noOfFlatInEachFloor: string;
  totalFlatInBuilding: string; flatSize: string; totalNoOfCarParking: string;
}

// ── Countdown Timer ───────────────────────────────────────────────────────────
function Countdown({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    function calc() {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endDate]);

  return (
    <span className="text-red-500 font-semibold text-sm">
      {timeLeft.d} Day : {timeLeft.h} Hour : {timeLeft.m} Minute : {timeLeft.s} Second
    </span>
  );
}

// ── Tab List ──────────────────────────────────────────────────────────────────
const TABS = ["Dashboard", "BOQ", "Task", "Users", "Details", "Flat/Land", "BOQ Comparison", "Quotation"];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState("Dashboard");
  const [project, setProject] = useState<Project | null>(null);
  const [boqItems, setBoqItems] = useState<BOQItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  // BOQ form
  const [showBoqForm, setShowBoqForm] = useState(false);
  const [editBoqId, setEditBoqId] = useState<string | null>(null);
  const [boqForm, setBoqForm] = useState({ itemType: "Material", description: "", unit: "", quantity: "", rate: "" });

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({ name: "", description: "", assignee: "", status: "PENDING", priority: "MEDIUM", startDate: "", dueDate: "" });

  // Progress form
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [progressForm, setProgressForm] = useState({ date: "", workingProgress: "", financialProgress: "", notes: "" });

  // Project details (land/building info) — saved in localStorage
  const defaultDetails: ProjectDetails = {
    areaOfLand: "", nameOfLandOwner: "", landOwnerDeveloperRatio: "",
    valueOfLand: "", buildArea: "", totalNoOfBuilding: "",
    totalFloorOfBuilding: "", noOfFlatInEachFloor: "",
    totalFlatInBuilding: "", flatSize: "", totalNoOfCarParking: "",
  };
  const [details, setDetails] = useState<ProjectDetails>(defaultDetails);
  const [detailsSaved, setDetailsSaved] = useState(false);

  // BOQ Comparison filters
  const [boqCompTitle, setBoqCompTitle] = useState("all");
  const [boqCompSearch, setBoqCompSearch] = useState("");
  const [boqCompShow, setBoqCompShow] = useState(10);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, boqRes, taskRes, progRes, quotRes] = await Promise.allSettled([
        projectsApi.getById(id),
        projectsApi.getBOQ(id),
        projectsApi.getTasks(id),
        projectsApi.getProgress(id),
        projectsApi.getQuotations(),
      ]);
      if (pRes.status === "fulfilled") setProject(pRes.value.data.data ?? pRes.value.data);
      if (boqRes.status === "fulfilled") setBoqItems(boqRes.value.data.data ?? boqRes.value.data ?? []);
      if (taskRes.status === "fulfilled") setTasks(taskRes.value.data.data ?? taskRes.value.data ?? []);
      if (progRes.status === "fulfilled") setProgressLogs(progRes.value.data.data ?? progRes.value.data ?? []);
      if (quotRes.status === "fulfilled") {
        const all: Quotation[] = quotRes.value.data.data ?? quotRes.value.data ?? [];
        setQuotations(all.filter((q) => q.projectId === id));
      }
    } finally {
      setLoading(false);
    }
    // Load details from localStorage
    try {
      const saved = localStorage.getItem(`project_details_${id}`);
      if (saved) setDetails(JSON.parse(saved));
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived values ───────────────────────────────────────────────────────
  const cost = boqItems.reduce((a, b) => a + (b.amount || b.quantity * b.rate || 0), 0);
  const budget = project?.budget ?? 0;
  const available = budget - cost;
  const salesRevenue = 0;
  const profitLoss = salesRevenue - cost;

  const chartData = progressLogs.length > 0
    ? progressLogs.map((l) => ({
        date: new Date(l.date).toLocaleDateString("en-BD", { month: "short", day: "numeric" }),
        working: l.workingProgress,
        financial: l.financialProgress,
      }))
    : Array.from({ length: 5 }, (_, i) => ({ date: `Week ${i + 1}`, working: 0, financial: 0 }));

  // ── BOQ handlers ─────────────────────────────────────────────────────────
  async function handleBoqSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...boqForm,
      quantity: parseFloat(boqForm.quantity) || 0,
      rate: parseFloat(boqForm.rate) || 0,
      amount: (parseFloat(boqForm.quantity) || 0) * (parseFloat(boqForm.rate) || 0),
    };
    try {
      if (editBoqId) await projectsApi.updateBOQ(editBoqId, payload);
      else await projectsApi.createBOQ(id, payload);
      setShowBoqForm(false);
      setEditBoqId(null);
      setBoqForm({ itemType: "Material", description: "", unit: "", quantity: "", rate: "" });
      fetchAll();
    } catch { /* handle silently */ }
  }

  function openEditBoq(item: BOQItem) {
    setEditBoqId(item.id);
    setBoqForm({ itemType: item.itemType, description: item.description, unit: item.unit, quantity: String(item.quantity), rate: String(item.rate) });
    setShowBoqForm(true);
  }

  async function handleDeleteBoq(itemId: string) {
    if (!confirm("Delete this BOQ item?")) return;
    await projectsApi.deleteBOQItem(itemId);
    fetchAll();
  }

  // ── Task handlers ─────────────────────────────────────────────────────────
  async function handleTaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...taskForm,
      startDate: taskForm.startDate ? new Date(taskForm.startDate).toISOString() : undefined,
      dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined,
    };
    try {
      if (editTaskId) await projectsApi.updateTask(id, editTaskId, payload);
      else await projectsApi.createTask(id, payload);
      setShowTaskForm(false);
      setEditTaskId(null);
      setTaskForm({ name: "", description: "", assignee: "", status: "PENDING", priority: "MEDIUM", startDate: "", dueDate: "" });
      fetchAll();
    } catch { /* handle silently */ }
  }

  function openEditTask(task: Task) {
    setEditTaskId(task.id);
    setTaskForm({
      name: task.name, description: task.description ?? "", assignee: task.assignee ?? "",
      status: task.status, priority: task.priority,
      startDate: task.startDate ? task.startDate.slice(0, 10) : "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
    setShowTaskForm(true);
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    await projectsApi.deleteTask(id, taskId);
    fetchAll();
  }

  // ── Progress handlers ──────────────────────────────────────────────────────
  async function handleProgressSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      date: new Date(progressForm.date).toISOString(),
      workingProgress: parseFloat(progressForm.workingProgress) || 0,
      financialProgress: parseFloat(progressForm.financialProgress) || 0,
      notes: progressForm.notes,
    };
    try {
      await projectsApi.createProgress(id, payload);
      setShowProgressForm(false);
      setProgressForm({ date: "", workingProgress: "", financialProgress: "", notes: "" });
      fetchAll();
    } catch { /* handle silently */ }
  }

  // ── Details save ──────────────────────────────────────────────────────────
  function handleDetailsSave(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem(`project_details_${id}`, JSON.stringify(details));
    setDetailsSaved(true);
    setTimeout(() => setDetailsSaved(false), 2500);
  }

  // ── BOQ Comparison data ───────────────────────────────────────────────────
  const compFiltered = boqItems
    .filter((b) => boqCompTitle === "all" || b.itemType === boqCompTitle)
    .filter((b) => b.description.toLowerCase().includes(boqCompSearch.toLowerCase()));

  const compSliced = compFiltered.slice(0, boqCompShow);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center text-gray-500">
        Project not found.{" "}
        <Link href="/project-module" className="text-violet-600 hover:underline">Back to list</Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Countdown endDate={project.endDate} />
        <h1 className="text-lg font-bold text-gray-800">{project.name}</h1>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center hover:bg-teal-600">
            <Eye className="w-4 h-4 text-white" />
          </button>
          <Link
            href={`/project-module/details-summary/${id}/report`}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Overall Report
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              tab === t
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD TAB ──────────────────────────────────────────────────────── */}
      {tab === "Dashboard" && (
        <div>
          {/* Budget metrics */}
          <div className="flex gap-4 mb-4">
            {[
              { label: "Budget", value: budget, icon: "🪙", color: "text-gray-700 bg-gray-50 border-gray-200" },
              { label: "Cost", value: cost, icon: "📺", color: "text-purple-700 bg-purple-50 border-purple-200" },
              { label: "Available", value: available, icon: "✅", color: "text-green-700 bg-green-50 border-green-200" },
              { label: "Sales/Revenue", value: salesRevenue, icon: "🛒", color: "text-teal-700 bg-teal-50 border-teal-200" },
              { label: "Profit/Loss", value: profitLoss, icon: "📦", color: profitLoss >= 0 ? "text-green-700 bg-green-50 border-green-200" : "text-orange-700 bg-orange-50 border-orange-200" },
            ].map((m) => (
              <div key={m.label} className={`flex-1 border rounded-xl p-3 ${m.color}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p className="text-xs opacity-70">{m.label}</p>
                    <p className="text-base font-bold">{m.value.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            {/* Left: Charts */}
            <div className="flex-1 space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Working Progress</h3>
                  <button
                    onClick={() => setShowProgressForm(true)}
                    className="flex items-center gap-1 text-xs text-violet-600 hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add Log
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="working" stroke="#8b5cf6" fill="url(#wg)" name="Working %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Financial Progress</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="financial" stroke="#3b82f6" fill="url(#fg)" name="Financial %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Working Schedule + Unsold + Most Expenses */}
            <div className="w-72 space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Working Schedule</h3>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Start Date</span>
                    <span className="font-medium">{new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>End Date</span>
                    <span className="font-medium">{new Date(project.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span className={cn("font-medium", project.status === "ACTIVE" ? "text-green-600" : "text-gray-500")}>{project.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Manager</span>
                    <span className="font-medium truncate ml-2">{project.manager}</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-500 rounded-xl p-3 text-center">
                <p className="text-white font-semibold text-sm">Unsold Property</p>
                <p className="text-white text-xl font-bold mt-1">
                  {Math.max(0, (project.totalUnits || 0) - (project.soldUnits || 0))}
                </p>
                <p className="text-red-100 text-xs">of {project.totalUnits || 0} units</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Most Expenses</h3>
                <div className="flex gap-1 mb-3">
                  {["ACCOUNTS DETAIL", "TOTAL"].map((t, i) => (
                    <button
                      key={t}
                      className={cn(
                        "flex-1 text-[10px] py-1 rounded font-medium border transition-colors",
                        i === 0 ? "bg-orange-400 border-orange-400 text-white" : "bg-violet-600 border-violet-600 text-white"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {boqItems.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No expense data</p>
                ) : (
                  <div className="space-y-1.5">
                    {boqItems.slice(0, 4).map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate flex-1">{b.description}</span>
                        <span className="font-semibold text-gray-800 ml-2">{(b.amount || b.quantity * b.rate).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress log form modal */}
          {showProgressForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Add Progress Log</h3>
                  <button onClick={() => setShowProgressForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <form onSubmit={handleProgressSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" required value={progressForm.date} onChange={(e) => setProgressForm({ ...progressForm, date: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Working Progress (%)</label>
                      <input type="number" min="0" max="100" value={progressForm.workingProgress} onChange={(e) => setProgressForm({ ...progressForm, workingProgress: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Financial Progress (%)</label>
                      <input type="number" min="0" max="100" value={progressForm.financialProgress} onChange={(e) => setProgressForm({ ...progressForm, financialProgress: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                    <textarea rows={2} value={progressForm.notes} onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setShowProgressForm(false)}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BOQ TAB ────────────────────────────────────────────────────────────── */}
      {tab === "BOQ" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Bill of Quantities (BOQ)</h2>
            <button
              onClick={() => { setEditBoqId(null); setBoqForm({ itemType: "Material", description: "", unit: "", quantity: "", rate: "" }); setShowBoqForm(true); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" /> Add BOQ Item
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-violet-600 text-white">
                  <th className="px-4 py-2.5 text-left text-xs font-medium">TYPE</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium">DESCRIPTION</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium">UNIT</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium">QTY</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium">RATE</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium">AMOUNT</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {boqItems.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No BOQ items added yet</td></tr>
                )}
                {boqItems.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2.5 text-xs">{item.itemType}</td>
                    <td className="px-4 py-2.5 text-xs">{item.description}</td>
                    <td className="px-4 py-2.5 text-xs">{item.unit}</td>
                    <td className="px-4 py-2.5 text-xs text-right">{item.quantity.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-xs text-right">{item.rate.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-xs text-right font-semibold">
                      {(item.amount || item.quantity * item.rate).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEditBoq(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteBoq(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {boqItems.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={5} className="px-4 py-2.5 text-xs">TOTAL</td>
                    <td className="px-4 py-2.5 text-xs text-right">
                      {boqItems.reduce((a, b) => a + (b.amount || b.quantity * b.rate), 0).toLocaleString()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {showBoqForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">{editBoqId ? "Edit BOQ Item" : "Add BOQ Item"}</h3>
                  <button onClick={() => setShowBoqForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <form onSubmit={handleBoqSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                      <select value={boqForm.itemType} onChange={(e) => setBoqForm({ ...boqForm, itemType: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400">
                        {["Material", "Labour", "Equipment", "Subcontract", "Overhead"].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                      <input value={boqForm.unit} onChange={(e) => setBoqForm({ ...boqForm, unit: e.target.value })}
                        placeholder="e.g. m², kg, pcs"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                      <input required value={boqForm.description} onChange={(e) => setBoqForm({ ...boqForm, description: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                      <input type="number" value={boqForm.quantity} onChange={(e) => setBoqForm({ ...boqForm, quantity: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Rate</label>
                      <input type="number" value={boqForm.rate} onChange={(e) => setBoqForm({ ...boqForm, rate: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                    {boqForm.quantity && boqForm.rate && (
                      <div className="col-span-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <span className="text-gray-500">Amount: </span>
                        <span className="font-bold text-gray-800">
                          {((parseFloat(boqForm.quantity) || 0) * (parseFloat(boqForm.rate) || 0)).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setShowBoqForm(false)}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                      {editBoqId ? "Update" : "Add"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TASK TAB ───────────────────────────────────────────────────────────── */}
      {tab === "Task" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Tasks</h2>
            <button
              onClick={() => { setEditTaskId(null); setTaskForm({ name: "", description: "", assignee: "", status: "PENDING", priority: "MEDIUM", startDate: "", dueDate: "" }); setShowTaskForm(true); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-violet-600 text-white">
                  <th className="px-4 py-2.5 text-left text-xs font-medium">#</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium">TASK NAME</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium">ASSIGNEE</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium">PRIORITY</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium">STATUS</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium">DUE DATE</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No tasks yet</td></tr>
                )}
                {tasks.map((task, i) => (
                  <tr key={task.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-800">{task.name}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{task.assignee || "—"}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold",
                        task.priority === "HIGH" ? "bg-red-100 text-red-700" :
                        task.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-600"
                      )}>{task.priority}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold",
                        task.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                        task.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-600"
                      )}>{task.status.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEditTask(task)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showTaskForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">{editTaskId ? "Edit Task" : "Add Task"}</h3>
                  <button onClick={() => setShowTaskForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <form onSubmit={handleTaskSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Task Name *</label>
                      <input required value={taskForm.name} onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Assignee</label>
                      <input value={taskForm.assignee} onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                      <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400">
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                      <input type="date" value={taskForm.startDate} onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                      <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <textarea rows={2} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setShowTaskForm(false)}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                      {editTaskId ? "Update" : "Add"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── USERS TAB ──────────────────────────────────────────────────────────── */}
      {tab === "Users" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Project Team Members</h2>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
                <span className="text-violet-700 font-bold text-sm">
                  {project.manager.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{project.manager}</p>
                <p className="text-xs text-gray-400">Project Manager</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">Additional team member management coming soon.</p>
        </div>
      )}

      {/* ── DETAILS TAB ────────────────────────────────────────────────────────── */}
      {tab === "Details" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-3xl">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">Add/Edit Project Details</h2>
          <form onSubmit={handleDetailsSave} className="grid grid-cols-2 gap-4">
            {[
              { key: "areaOfLand", label: "Area Of Land", placeholder: "Enter Land Area" },
              { key: "nameOfLandOwner", label: "Name Of Land Owner", placeholder: "Enter Land Owner Name" },
              { key: "landOwnerDeveloperRatio", label: "Land Owner/Developer Ratio", placeholder: "Enter Ratio" },
              { key: "valueOfLand", label: "Value Of Land", placeholder: "Enter Ratio" },
              { key: "buildArea", label: "Build Area", placeholder: "Enter Ratio" },
              { key: "totalNoOfBuilding", label: "Total No. Of Building", placeholder: "Enter Ratio" },
              { key: "totalFloorOfBuilding", label: "Total floor Of building", placeholder: "Enter Ratio" },
              { key: "noOfFlatInEachFloor", label: "No. of flat in each floor", placeholder: "Enter Ratio" },
              { key: "totalFlatInBuilding", label: "Total Flat in the building", placeholder: "Total Flat of the building" },
              { key: "flatSize", label: "Flat Size", placeholder: "Flat Size" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <input
                  value={details[f.key as keyof ProjectDetails]}
                  onChange={(e) => setDetails({ ...details, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 placeholder:text-gray-300"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Total No. of car parking</label>
              <input
                value={details.totalNoOfCarParking}
                onChange={(e) => setDetails({ ...details, totalNoOfCarParking: e.target.value })}
                placeholder="Total No. of car parking"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 placeholder:text-gray-300"
              />
            </div>
            <div className="col-span-2 flex items-center gap-3 pt-2">
              <button type="submit" className="px-6 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 font-medium">
                Submit
              </button>
              {detailsSaved && (
                <span className="text-green-600 text-xs font-medium">Saved successfully!</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── FLAT/LAND TAB ──────────────────────────────────────────────────────── */}
      {tab === "Flat/Land" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Flat/Land Units</h2>
          <div className="grid grid-cols-4 gap-3">
            {project.totalUnits > 0 ? (
              Array.from({ length: project.totalUnits }, (_, i) => (
                <div key={i} className={cn(
                  "rounded-lg border p-3 text-center text-xs font-medium",
                  i < project.soldUnits
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                )}>
                  <p>Unit {i + 1}</p>
                  <p className="text-[10px] mt-0.5">{i < project.soldUnits ? "SOLD" : "AVAILABLE"}</p>
                </div>
              ))
            ) : (
              <div className="col-span-4 text-center py-10 text-gray-400 text-sm">
                No units configured. Set total units in the project settings.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BOQ COMPARISON TAB ─────────────────────────────────────────────────── */}
      {tab === "BOQ Comparison" && (
        <div>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Title/Name of Work</label>
              <select value={boqCompTitle} onChange={(e) => setBoqCompTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400">
                <option value="all">Select Title/Name of Work</option>
                {["Material", "Labour", "Equipment", "Subcontract", "Overhead"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Task</label>
              <select className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400">
                <option>Select Task</option>
                {tasks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Table controls */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600">
                <FileDown className="w-3.5 h-3.5" /> PDF
              </button>
              <span className="text-xs text-gray-500 ml-2">Show</span>
              <select value={boqCompShow} onChange={(e) => setBoqCompShow(Number(e.target.value))}
                className="px-2 py-1 text-xs border border-gray-200 rounded">
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-xs text-gray-500">entries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Search:</span>
              <input value={boqCompSearch} onChange={(e) => setBoqCompSearch(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-200 rounded-lg w-32 focus:outline-none focus:ring-1 focus:ring-violet-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-violet-600 text-white">
                  {["TYPE", "DESCRIPTION", "BOQ QTY", "BOQ AMOUNT", "ISSUE QTY", "ISSUE AMOUNT", "QTY DIFF", "AMOUNT DIFF", "STATUS"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compSliced.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-10 text-gray-400">No BOQ data found</td></tr>
                )}
                {compSliced.map((item, i) => {
                  const boqQty = item.quantity;
                  const boqAmt = item.amount || item.quantity * item.rate;
                  const issueQty = 0;
                  const issueAmt = 0;
                  const qtyDiff = boqQty - issueQty;
                  const amtDiff = boqAmt - issueAmt;
                  const status = qtyDiff > 0 ? "Under" : qtyDiff < 0 ? "Over" : "Match";

                  return (
                    <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-2.5">{item.itemType}</td>
                      <td className="px-3 py-2.5">{item.description}</td>
                      <td className="px-3 py-2.5 text-right">{boqQty.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right">{boqAmt.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right">{issueQty}</td>
                      <td className="px-3 py-2.5 text-right">{issueAmt}</td>
                      <td className="px-3 py-2.5 text-right">{qtyDiff}</td>
                      <td className="px-3 py-2.5 text-right">{amtDiff.toLocaleString()}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn("font-semibold",
                          status === "Under" ? "text-orange-500" :
                          status === "Over" ? "text-red-600" : "text-green-600"
                        )}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {compSliced.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={2} className="px-3 py-2.5">TOTAL:</td>
                    <td className="px-3 py-2.5 text-right">{compFiltered.reduce((a, b) => a + b.quantity, 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right">{compFiltered.reduce((a, b) => a + (b.amount || b.quantity * b.rate), 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right">0</td>
                    <td className="px-3 py-2.5 text-right">0</td>
                    <td className="px-3 py-2.5 text-right">{compFiltered.reduce((a, b) => a + b.quantity, 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right">{compFiltered.reduce((a, b) => a + (b.amount || b.quantity * b.rate), 0).toLocaleString()}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>Showing 1 to {Math.min(boqCompShow, compFiltered.length)} of {compFiltered.length} entries</span>
            <div className="flex gap-1">
              <button className="px-2 py-1 border border-gray-200 rounded text-gray-400">Previous</button>
              <button className="px-2 py-1 border border-violet-500 bg-violet-600 text-white rounded">1</button>
              <button className="px-2 py-1 border border-gray-200 rounded text-gray-400">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUOTATION TAB ──────────────────────────────────────────────────────── */}
      {tab === "Quotation" && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Quotations</h2>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-violet-600 text-white">
                  <th className="px-4 py-2.5 text-left text-xs font-medium">#</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium">TITLE</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium">VENDOR</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium">AMOUNT</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium">STATUS</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium">DATE</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {quotations.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No quotations for this project</td></tr>
                )}
                {quotations.map((q, i) => (
                  <tr key={q.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2.5 text-xs font-medium">{q.title ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs">{q.vendor ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-right">{q.amount?.toLocaleString() ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-semibold">
                        {q.status ?? "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">
                      {q.date ? new Date(q.date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
