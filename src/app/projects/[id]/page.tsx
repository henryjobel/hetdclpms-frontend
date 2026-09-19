"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/contexts/auth-context";
import { projectsApi, usersApi, accountsApi } from "@/lib/api";
import { confirmAction } from "@/lib/feedback";
import { exportRowsToPdf, exportRowsToXlsx, type ExportColumn } from "@/lib/export-utils";
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import {
  Plus, Pencil, Trash2, X, Loader2,
  FileSpreadsheet, FileDown, ArrowLeft,
  DollarSign, Receipt, CheckCircle, Clock,
  FolderTree, Layers, ChevronDown, ChevronRight,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { PROJECT_PHASES, getSubcategoriesForPhase, normalizePhaseName } from "@/lib/constants";

// ─────────────────────── Types (matching Prisma schema exactly) ───────────────
interface ProjectDetail {
  id: string; name: string; location: string; type: string;
  status: string; budget: number; startDate: string;
  endDate: string; manager: string; totalUnits: number;
  soldUnits: number; description?: string;
  totalIncome: number; totalExpense: number; profit: number;
  boqItems: BOQItem[];
  tasks: Task[];
  progressLogs: ProgressLog[];
  contractorAssigns: { contractor: { id: string; name: string; specialty: string } }[];
  workerAssigns: { worker: { id: string; name: string; role: string } }[];
  vouchers?: VoucherItem[];
}
interface VoucherItem {
  id: string;
  voucherNo: string;
  type: string;
  amount: number;
  description?: string;
  status: string;
  voucherDate: string;
  createdBy?: { name: string };
}
interface BOQItem {
  id: string; projectId: string; description: string; unit: string;
  quantity: number; unitRate: number; materialCost: number;
  laborCost: number; totalCost: number; phase?: string;
  subcategory?: string;
}
interface Task {
  id: string; projectId: string; title: string; description?: string;
  assignedTo: { name: string }; userId: string;
  status: string; priority: string; progress: number; dueDate: string;
}
interface ProgressLog {
  id: string; projectId: string; phase: string; percentage: number;
  remarks?: string; logDate: string;
}
interface Quotation {
  id: string; projectId?: string; quotationNo?: string; client?: string;
  description?: string; amount?: number; status?: string;
  validUntil?: string; createdAt?: string;
}
interface User { id: string; name: string; email: string; }

// ─────────────────────── Countdown ───────────────────────────────────────────
function Countdown({ endDate }: { endDate: string }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    function calc() {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setT({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setT({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    }
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id);
  }, [endDate]);
  const isPast = new Date(endDate) < new Date();
  return (
    <span className={cn("font-semibold text-sm", isPast ? "text-red-500" : "text-amber-600")}>
      {isPast ? "Overdue by " : ""}{t.d}d : {t.h}h : {t.m}m : {t.s}s {isPast ? "" : "remaining"}
    </span>
  );
}

// ─────────────────────── Status badge helpers ─────────────────────────────────
const STATUS_MAP: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  ACTIVE: "bg-green-100 text-green-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
};
const PRIORITY_MAP: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
};

const TABS = ["Dashboard", "BOQ", "Task", "Expenses", "Users", "Details", "Flat/Land", "BOQ Comparison", "Quotation"];

// ─────────────────────── Input helpers ───────────────────────────────────────
function Inp(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input {...rest} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" />
    </div>
  );
}
function Sel({ label, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <select {...p} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
        {children}
      </select>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user: authUser } = useAuth();
  const [tab, setTab] = useState("Dashboard");
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // BOQ form
  const emptyBoq = { phase: "", subcategory: "", description: "", unit: "", quantity: "", unitRate: "", materialCost: "0", laborCost: "0" };
  const [showBoqForm, setShowBoqForm] = useState(false);
  const [editBoqId, setEditBoqId] = useState<string | null>(null);
  const [boqForm, setBoqForm] = useState(emptyBoq);

  // Task form
  const emptyTask = { title: "", description: "", userId: "", status: "PENDING", priority: "MEDIUM", progress: "0", dueDate: "" };
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState(emptyTask);

  // Progress form
  const emptyProg = { phase: "", percentage: "", remarks: "", logDate: new Date().toISOString().slice(0, 10) };
  const [showProgForm, setShowProgForm] = useState(false);
  const [progForm, setProgForm] = useState(emptyProg);

  // Expense / Voucher form
  const emptyExpense = {
    type: "PAYMENT",
    category: "Material",
    amount: "",
    payee: "",
    description: "",
    voucherDate: new Date().toISOString().slice(0, 10),
  };
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");
  const [expenseSearch, setExpenseSearch] = useState("");

  // Project details (land/building info) — localStorage
  const blank = { areaOfLand: "", nameOfLandOwner: "", landOwnerDeveloperRatio: "", valueOfLand: "", buildArea: "", totalNoOfBuilding: "", totalFloorOfBuilding: "", noOfFlatInEachFloor: "", totalFlatInBuilding: "", flatSize: "", totalNoOfCarParking: "" };
  const [details, setDetails] = useState(blank);
  const [detailsSaved, setDetailsSaved] = useState(false);

  // BOQ comparison filters
  const [compPhase, setCompPhase] = useState("all");
  const [compSubcategory, setCompSubcategory] = useState("all");
  const [compSearch, setCompSearch] = useState("");
  const [compShow, setCompShow] = useState(10);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, quotRes, usersRes] = await Promise.allSettled([
        projectsApi.getById(id),
        projectsApi.getQuotations(),
        usersApi.getAll(),
      ]);
      if (projRes.status === "fulfilled") {
        const d = projRes.value.data.data ?? projRes.value.data;
        setProject(d);
      }
      if (quotRes.status === "fulfilled") {
        const all: Quotation[] = quotRes.value.data.data ?? quotRes.value.data ?? [];
        setQuotations(all.filter((q) => q.projectId === id));
      }
      if (usersRes.status === "fulfilled") {
        setUsers(usersRes.value.data.data ?? usersRes.value.data ?? []);
      }
    } finally {
      setLoading(false);
    }
    try {
      const saved = localStorage.getItem(`project_details_${id}`);
      if (saved) setDetails(JSON.parse(saved));
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  // ── Derived values ───────────────────────────────────────────────────────
  const boqItems = project?.boqItems ?? [];
  const tasks = project?.tasks ?? [];
  const progressLogs = project?.progressLogs ?? [];

  const budget = project?.budget ?? 0;
  const totalExpense = project?.totalExpense ?? 0;
  const totalIncome = project?.totalIncome ?? 0;
  const profit = project?.profit ?? 0;
  const available = budget - totalExpense;

  // Chart data: progress logs sorted by date ascending
  const chartData = [...progressLogs]
    .sort((a, b) => new Date(a.logDate).getTime() - new Date(b.logDate).getTime())
    .map((l) => ({
      date: new Date(l.logDate).toLocaleDateString("en", { month: "short", day: "numeric" }),
      phase: l.phase,
      pct: l.percentage,
    }));

  // ── BOQ handlers ─────────────────────────────────────────────────────────
  async function submitBoq(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(boqForm.quantity) || 0;
    const rate = parseFloat(boqForm.unitRate) || 0;
    const mat = parseFloat(boqForm.materialCost) || 0;
    const lab = parseFloat(boqForm.laborCost) || 0;
    const totalCost = (mat + lab > 0) ? (mat + lab) : (qty * rate);
    const payload = {
      description: boqForm.description,
      unit: boqForm.unit,
      quantity: qty,
      unitRate: rate,
      materialCost: mat,
      laborCost: lab,
      totalCost,
      phase: boqForm.phase || undefined,
      subcategory: boqForm.subcategory || undefined,
    };
    try {
      if (editBoqId) await projectsApi.updateBOQ(editBoqId, payload);
      else await projectsApi.createBOQ(id, payload);
      setShowBoqForm(false); setEditBoqId(null); setBoqForm(emptyBoq);
      fetchProject();
    } catch { /* handle silently */ }
  }
  function openEditBoq(b: BOQItem) {
    setEditBoqId(b.id);
    setBoqForm({
      phase: b.phase ?? "",
      subcategory: b.subcategory ?? "",
      description: b.description,
      unit: b.unit,
      quantity: String(b.quantity),
      unitRate: String(b.unitRate),
      materialCost: String(b.materialCost),
      laborCost: String(b.laborCost),
    });
    setShowBoqForm(true);
  }
  async function deleteBoq(itemId: string) {
    if (!(await confirmAction("Delete this BOQ item?"))) return;
    await projectsApi.deleteBOQItem(itemId); fetchProject();
  }

  // ── Task handlers ─────────────────────────────────────────────────────────
  async function submitTask(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: taskForm.title,
      description: taskForm.description || undefined,
      userId: taskForm.userId || authUser?.id,
      status: taskForm.status,
      priority: taskForm.priority,
      progress: parseInt(taskForm.progress) || 0,
      dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : new Date(project?.endDate ?? Date.now()).toISOString(),
    };
    try {
      if (editTaskId) await projectsApi.updateTask(id, editTaskId, payload);
      else await projectsApi.createTask(id, payload);
      setShowTaskForm(false); setEditTaskId(null); setTaskForm(emptyTask);
      fetchProject();
    } catch { /* handle silently */ }
  }
  function openEditTask(t: Task) {
    setEditTaskId(t.id);
    setTaskForm({ title: t.title, description: t.description ?? "", userId: t.userId, status: t.status, priority: t.priority, progress: String(t.progress), dueDate: t.dueDate ? t.dueDate.slice(0, 10) : "" });
    setShowTaskForm(true);
  }
  async function deleteTask(taskId: string) {
    if (!(await confirmAction("Delete this task?"))) return;
    await projectsApi.deleteTask(id, taskId); fetchProject();
  }

  // ── Progress handlers ─────────────────────────────────────────────────────
  async function submitProgress(e: React.FormEvent) {
    e.preventDefault();
    try {
      await projectsApi.createProgress(id, {
        phase: progForm.phase,
        percentage: parseFloat(progForm.percentage) || 0,
        remarks: progForm.remarks || undefined,
        logDate: new Date(progForm.logDate).toISOString(),
      });
      setShowProgForm(false); setProgForm(emptyProg); fetchProject();
    } catch { /* handle silently */ }
  }
  async function deleteProgress(logId: string) {
    if (!(await confirmAction("Delete this log?"))) return;
    await projectsApi.deleteProgress(id, logId); fetchProject();
  }

  // ── Expense handlers ──────────────────────────────────────────────────────
  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    setSavingExpense(true);
    setExpenseError("");
    try {
      const amt = parseFloat(expenseForm.amount) || 0;
      if (amt <= 0) {
        setExpenseError("Please enter a valid expense amount");
        setSavingExpense(false);
        return;
      }
      const fullDesc = `[${expenseForm.category}] ${expenseForm.payee ? `Payee: ${expenseForm.payee} — ` : ""}${expenseForm.description || ""}`.trim();
      await accountsApi.createVoucher({
        type: expenseForm.type,
        projectId: id,
        amount: amt,
        description: fullDesc,
        entries: [],
      });
      setShowExpenseForm(false);
      setExpenseForm(emptyExpense);
      fetchProject();
    } catch (err: unknown) {
      setExpenseError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to create expense voucher"
      );
    } finally {
      setSavingExpense(false);
    }
  }

  async function approveExpense(voucherId: string) {
    try {
      await accountsApi.approveVoucher(voucherId);
      fetchProject();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to approve voucher");
    }
  }

  async function deleteExpense(voucherId: string) {
    if (!(await confirmAction("Delete this expense voucher?"))) return;
    try {
      await accountsApi.deleteVoucher(voucherId);
      fetchProject();
    } catch { /* noop */ }
  }

  const projectVouchers = project?.vouchers ?? [];
  const approvedVouchers = projectVouchers.filter((v) => v.status === "approved");
  const pendingVouchers = projectVouchers.filter((v) => v.status === "pending");
  const approvedExpenseSum = approvedVouchers.reduce((a, v) => a + v.amount, 0);
  const pendingExpenseSum = pendingVouchers.reduce((a, v) => a + v.amount, 0);

  const filteredExpenses = projectVouchers.filter((v) => {
    const matchSearch =
      (v.voucherNo || "").toLowerCase().includes(expenseSearch.toLowerCase()) ||
      (v.description || "").toLowerCase().includes(expenseSearch.toLowerCase()) ||
      (v.createdBy?.name || "").toLowerCase().includes(expenseSearch.toLowerCase());
    const matchCategory =
      expenseCategoryFilter === "all" ||
      (v.description || "").toLowerCase().includes(`[${expenseCategoryFilter.toLowerCase()}]`);
    return matchSearch && matchCategory;
  });

  const expenseExportColumns: ExportColumn<VoucherItem>[] = [
    { header: "Voucher No", value: (r) => r.voucherNo },
    { header: "Date", value: (r) => formatDate(r.voucherDate) },
    { header: "Type", value: (r) => r.type },
    { header: "Description", value: (r) => r.description || "—" },
    { header: "Amount (৳)", value: (r) => r.amount },
    { header: "Status", value: (r) => r.status },
  ];

  function exportExpenses(format: "xlsx" | "pdf") {
    if (!project) return;
    const filename = `${project.name}-expenses`;
    const subtitle = `Total Project Expenses: ৳${formatCurrency(totalExpense)}`;
    if (format === "xlsx") {
      exportRowsToXlsx({ filename, sheetName: "Expenses", columns: expenseExportColumns, rows: filteredExpenses });
    } else {
      exportRowsToPdf({ filename, title: `${project.name} - Expenses`, subtitle, columns: expenseExportColumns, rows: filteredExpenses });
    }
  }

  // ── Details save ──────────────────────────────────────────────────────────
  function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem(`project_details_${id}`, JSON.stringify(details));
    setDetailsSaved(true); setTimeout(() => setDetailsSaved(false), 2500);
  }

  // ── BOQ comparison & hierarchy ───────────────────────────────────────────
  const uniquePhases = useMemo(() => {
    const fromItems = boqItems.map((b) => b.phase).filter(Boolean) as string[];
    return Array.from(new Set([...PROJECT_PHASES, ...fromItems]));
  }, [boqItems]);

  const availableCompSubcategories = useMemo(() => {
    if (compPhase === "all") {
      const allSubs = boqItems.map((b) => b.subcategory).filter(Boolean) as string[];
      return Array.from(new Set(allSubs));
    }
    return getSubcategoriesForPhase(compPhase);
  }, [compPhase, boqItems]);

  const compFiltered = useMemo(() => {
    return boqItems.filter((b) => {
      const normItemPhase = normalizePhaseName(b.phase);
      const normFilterPhase = compPhase === "all" ? "all" : normalizePhaseName(compPhase);
      const matchPhase = compPhase === "all" || normItemPhase === normFilterPhase || b.phase === compPhase;
      const matchSub = compSubcategory === "all" || b.subcategory === compSubcategory;
      const matchSearch =
        (b.description || "").toLowerCase().includes(compSearch.toLowerCase()) ||
        (b.phase || "").toLowerCase().includes(compSearch.toLowerCase()) ||
        (b.subcategory || "").toLowerCase().includes(compSearch.toLowerCase()) ||
        (b.unit || "").toLowerCase().includes(compSearch.toLowerCase());
      return matchPhase && matchSub && matchSearch;
    });
  }, [boqItems, compPhase, compSubcategory, compSearch]);

  const compTotalBudget = compFiltered.reduce((a, b) => a + (b.quantity * b.unitRate), 0);
  const compTotalMaterial = compFiltered.reduce((a, b) => a + (b.materialCost || 0), 0);
  const compTotalLabour = compFiltered.reduce((a, b) => a + (b.laborCost || 0), 0);
  const compTotalActual = compFiltered.reduce((a, b) => a + (b.totalCost || 0), 0);
  const compVariance = compTotalBudget - compTotalActual;
  const compVariancePct = compTotalBudget > 0 ? ((compVariance / compTotalBudget) * 100).toFixed(1) : "0";

  // Transparent Hierarchy: Phase -> Subcategory -> Total Cost
  const phaseHierarchy = useMemo(() => {
    const map = new Map<string, {
      phase: string;
      totalBudget: number;
      totalCost: number;
      subcategories: Map<string, {
        subcategory: string;
        budget: number;
        cost: number;
        items: BOQItem[];
      }>;
    }>();

    compFiltered.forEach((item) => {
      const pName = item.phase ? normalizePhaseName(item.phase) : "General / Other";
      const sName = item.subcategory || "General Items";
      const budget = item.quantity * item.unitRate;
      const cost = item.totalCost;

      if (!map.has(pName)) {
        map.set(pName, {
          phase: pName,
          totalBudget: 0,
          totalCost: 0,
          subcategories: new Map(),
        });
      }

      const pObj = map.get(pName)!;
      pObj.totalBudget += budget;
      pObj.totalCost += cost;

      if (!pObj.subcategories.has(sName)) {
        pObj.subcategories.set(sName, {
          subcategory: sName,
          budget: 0,
          cost: 0,
          items: [],
        });
      }

      const sObj = pObj.subcategories.get(sName)!;
      sObj.budget += budget;
      sObj.cost += cost;
      sObj.items.push(item);
    });

    return Array.from(map.values()).map((p) => ({
      ...p,
      subcategories: Array.from(p.subcategories.values()),
    }));
  }, [compFiltered]);

  function togglePhase(phaseName: string) {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseName]: prev[phaseName] === false ? true : false,
    }));
  }

  const boqComparisonColumns: ExportColumn<BOQItem>[] = [
    { header: "Phase / Stage", value: (row) => row.phase || "General" },
    { header: "Subcategory", value: (row) => row.subcategory || "General" },
    { header: "Item & Specification", value: (row) => row.description },
    { header: "Unit", value: (row) => row.unit || "-" },
    { header: "Est. Qty", value: (row) => row.quantity },
    { header: "Unit Rate (৳)", value: (row) => row.unitRate },
    { header: "Est. Budget (৳)", value: (row) => row.quantity * row.unitRate },
    { header: "Material Cost (৳)", value: (row) => row.materialCost },
    { header: "Labour Cost (৳)", value: (row) => row.laborCost },
    { header: "Total Cost (৳)", value: (row) => row.totalCost },
    { header: "Variance (৳)", value: (row) => (row.quantity * row.unitRate) - row.totalCost },
    {
      header: "Status",
      value: (row) => {
        const est = row.quantity * row.unitRate;
        const diff = est - row.totalCost;
        if (Math.abs(diff) < 0.01) return "Matched (100%)";
        if (diff > 0) return `Saved (+৳${diff.toLocaleString()})`;
        return `Over Budget (-৳${Math.abs(diff).toLocaleString()})`;
      },
    },
  ];

  function exportBoqComparison(format: "xlsx" | "pdf") {
    if (!project) return;
    const filename = `${project.name}-boq-budget-vs-cost-comparison`;
    const subtitle = `Phase: ${compPhase === "all" ? "All Phases" : compPhase} | Total Est. Budget: ৳${formatCurrency(compTotalBudget)} | Total Cost: ৳${formatCurrency(compTotalActual)}`;
    if (format === "xlsx") {
      exportRowsToXlsx({ filename, sheetName: "BOQ Comparison", columns: boqComparisonColumns, rows: compFiltered });
    } else {
      exportRowsToPdf({ filename, title: `${project.name} - BOQ Budget vs Cost Comparison`, subtitle, columns: boqComparisonColumns, rows: compFiltered });
    }
  }

  // Loading / not-found
  if (loading) return (
    <MainLayout title="Project Detail">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
      </div>
    </MainLayout>
  );
  if (!project) return (
    <MainLayout title="Project Detail">
      <div className="text-center py-20 text-gray-400">
        Project not found. <Link href="/projects" className="text-amber-600 hover:underline">Back</Link>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout title={project.name} subtitle={`${project.type} · ${project.location}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <Countdown endDate={project.endDate} />
        </div>
        <span className={cn("px-3 py-1 rounded-full text-xs font-bold", STATUS_MAP[project.status] ?? "bg-gray-100 text-gray-600")}>
          {project.status}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              tab === t ? "border-b-2 border-amber-500 text-amber-600" : "text-gray-500 hover:text-gray-700"
            )}>
            {t}
          </button>
        ))}
      </div>

      {/* ══ DASHBOARD ══════════════════════════════════════════════════════════ */}
      {tab === "Dashboard" && (
        <div className="space-y-5">
          {/* Quick Action bar for Expenses */}
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-200 rounded-xl p-3 px-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-800 block">Project Expense Quick Entry</span>
                <span className="text-[11px] text-gray-500">Record designer fees, labour wages, materials & site expenses directly for {project.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setExpenseForm(emptyExpense); setShowExpenseForm(true); }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> + Add Expense
              </button>
              <button
                onClick={() => setTab("Expenses")}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm"
              >
                Expenses Tab ({projectVouchers.length}) →
              </button>
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Budget", value: budget, cls: "bg-gray-50 border-gray-200 text-gray-700", onClick: undefined },
              { label: "Cost / Expense", value: totalExpense, cls: "bg-purple-50 border-purple-200 text-purple-700 cursor-pointer hover:border-purple-400 transition-all", onClick: () => setTab("Expenses") },
              { label: "Available", value: available, cls: available >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700", onClick: undefined },
              { label: "Sales / Revenue", value: totalIncome, cls: "bg-teal-50 border-teal-200 text-teal-700", onClick: undefined },
              { label: "Profit / Loss", value: profit, cls: profit >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-orange-50 border-orange-200 text-orange-700", onClick: undefined },
            ].map((m) => (
              <div key={m.label} onClick={m.onClick} className={`border rounded-xl p-4 ${m.cls}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs opacity-60 font-medium">{m.label}</p>
                  {m.onClick && <span className="text-[10px] text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded font-bold">View</span>}
                </div>
                <p className="text-xl font-bold mt-1">{m.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Charts (left 2/3) */}
            <div className="col-span-2 space-y-4">
              {/* Working Progress */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Working Progress</h3>
                  <button onClick={() => setShowProgForm(true)}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:underline font-medium">
                    <Plus className="w-3.5 h-3.5" /> Add Log
                  </button>
                </div>
                {chartData.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">No progress logs yet. Click &quot;Add Log&quot; to record progress.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                      <Tooltip formatter={(v) => [`${v}%`, "Progress"]} />
                      <Area type="monotone" dataKey="pct" stroke="#f59e0b" fill="url(#pg)" name="Progress %" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Financial Progress */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Financial Progress</h3>
                <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                  <span>Budget Used: <span className="font-bold text-amber-600">{budget ? Math.round((totalExpense / budget) * 100) : 0}%</span></span>
                  <span>Income vs Expense: <span className={cn("font-bold", profit >= 0 ? "text-green-600" : "text-red-500")}>{profit.toLocaleString()}</span></span>
                </div>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={[
                    { label: "Budget", value: budget },
                    { label: "Expense", value: totalExpense },
                    { label: "Income", value: totalIncome },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Working Schedule</h3>
                <div className="space-y-2 text-xs">
                  {[
                    ["Start", new Date(project.startDate).toLocaleDateString()],
                    ["End", new Date(project.endDate).toLocaleDateString()],
                    ["Manager", project.manager],
                    ["Location", project.location],
                    ["Type", project.type],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-400">{k}</span>
                      <span className="font-medium text-gray-700 text-right ml-2 truncate max-w-32">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-red-500 rounded-xl p-4 text-center text-white">
                <p className="text-sm font-semibold">Unsold Property</p>
                <p className="text-3xl font-bold mt-1">{Math.max(0, (project.totalUnits || 0) - (project.soldUnits || 0))}</p>
                <p className="text-red-100 text-xs mt-0.5">of {project.totalUnits || 0} units</p>
              </div>

              {/* Most Expenses (BOQ) */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Most Expenses</h3>
                {boqItems.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No BOQ items</p>
                ) : (
                  <div className="space-y-2">
                    {[...boqItems].sort((a, b) => b.totalCost - a.totalCost).slice(0, 5).map((b) => (
                      <div key={b.id} className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-600 flex-1 truncate">{b.description}</span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                          <div className="h-1.5 bg-amber-400 rounded-full" style={{ width: `${Math.min(100, budget ? (b.totalCost / budget) * 100 : 0)}%` }} />
                        </div>
                        <span className="text-[11px] font-semibold text-gray-700 w-16 text-right">{b.totalCost.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress log list */}
          {progressLogs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Progress Logs</h3>
              </div>
              <table className="w-full text-xs">
                <thead><tr className="bg-amber-50 text-gray-600">
                  <th className="px-4 py-2 text-left font-medium">DATE</th>
                  <th className="px-4 py-2 text-left font-medium">PHASE</th>
                  <th className="px-4 py-2 text-right font-medium">%</th>
                  <th className="px-4 py-2 text-left font-medium">REMARKS</th>
                  <th className="px-4 py-2 text-center font-medium">ACTION</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {progressLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-amber-50">
                      <td className="px-4 py-2">{new Date(l.logDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2 font-medium">{l.phase}</td>
                      <td className="px-4 py-2 text-right font-bold text-amber-700">{l.percentage}%</td>
                      <td className="px-4 py-2 text-gray-500">{l.remarks || "—"}</td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => deleteProgress(l.id)} className="p-1 text-red-400 hover:text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ BOQ ════════════════════════════════════════════════════════════════ */}
      {tab === "BOQ" && (
        <div className="space-y-4">
          {/* Top KPI Cards for BOQ */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-blue-700">Estimated BOQ Budget</p>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-blue-950 mt-1">৳{formatCurrency(compTotalBudget)}</p>
              <p className="text-[11px] text-blue-600 mt-0.5">{boqItems.length} items estimated</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-700">Material Cost (কাঁচামাল)</p>
                <Receipt className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-amber-950 mt-1">৳{formatCurrency(compTotalMaterial)}</p>
              <p className="text-[11px] text-amber-600 mt-0.5">
                {compTotalActual > 0 ? Math.round((compTotalMaterial / compTotalActual) * 100) : 0}% of actual cost
              </p>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-teal-700">Labour Cost (মজুরি)</p>
                <Receipt className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-xl font-bold text-teal-950 mt-1">৳{formatCurrency(compTotalLabour)}</p>
              <p className="text-[11px] text-teal-600 mt-0.5">
                {compTotalActual > 0 ? Math.round((compTotalLabour / compTotalActual) * 100) : 0}% of actual cost
              </p>
            </div>

            <div className={cn(
              "border rounded-xl p-4 shadow-sm",
              compVariance >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            )}>
              <div className="flex items-center justify-between">
                <p className={cn("text-xs font-semibold", compVariance >= 0 ? "text-green-700" : "text-red-700")}>
                  {compVariance >= 0 ? "Budget Savings" : "Budget Overrun"}
                </p>
                <CheckCircle className={cn("w-4 h-4", compVariance >= 0 ? "text-green-600" : "text-red-600")} />
              </div>
              <p className={cn("text-xl font-bold mt-1", compVariance >= 0 ? "text-green-950" : "text-red-950")}>
                {compVariance >= 0 ? "+" : "-"}৳{formatCurrency(Math.abs(compVariance))}
              </p>
              <p className={cn("text-[11px] font-medium mt-0.5", compVariance >= 0 ? "text-green-700" : "text-red-700")}>
                Actual Cost: ৳{formatCurrency(compTotalActual)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <input
                value={compSearch}
                onChange={(e) => setCompSearch(e.target.value)}
                placeholder="Search BOQ item by name or specification..."
                className="w-full max-w-sm px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <select
                value={compPhase}
                onChange={(e) => setCompPhase(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="all">All Phases</option>
                {uniquePhases.map((phase) => (
                  <option key={phase} value={phase}>{phase}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportBoqComparison("xlsx")}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={() => exportBoqComparison("pdf")}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                onClick={() => { setEditBoqId(null); setBoqForm(emptyBoq); setShowBoqForm(true); }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" /> + Add BOQ Item
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-amber-500 text-white divide-x divide-amber-400/30">
                  <th className="px-3 py-3 text-left font-semibold w-8">#</th>
                  <th className="px-3 py-3 text-left font-semibold">PHASE / STAGE</th>
                  <th className="px-3 py-3 text-left font-semibold">ITEM & SPECIFICATION</th>
                  <th className="px-3 py-3 text-center font-semibold">UNIT</th>
                  <th className="px-3 py-3 text-right font-semibold">EST. QTY</th>
                  <th className="px-3 py-3 text-right font-semibold">UNIT RATE (৳)</th>
                  <th className="px-3 py-3 text-right font-semibold bg-amber-600/60">EST. BUDGET (৳)<br /><span className="text-[10px] font-normal text-amber-100">(Qty × Rate)</span></th>
                  <th className="px-3 py-3 text-right font-semibold">MATERIAL (৳)<br /><span className="text-[10px] font-normal text-amber-100">(কাঁচামাল)</span></th>
                  <th className="px-3 py-3 text-right font-semibold">LABOUR (৳)<br /><span className="text-[10px] font-normal text-amber-100">(মজুরি)</span></th>
                  <th className="px-3 py-3 text-right font-semibold bg-amber-600/60">TOTAL COST (৳)<br /><span className="text-[10px] font-normal text-amber-100">(Mat + Lab)</span></th>
                  <th className="px-3 py-3 text-center font-semibold">VARIANCE & STATUS</th>
                  <th className="px-3 py-3 text-center font-semibold">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {compFiltered.length === 0 && (
                  <tr>
                    <td colSpan={12} className="text-center py-12 text-gray-400 text-sm">
                      No BOQ items found. Click &quot;+ Add BOQ Item&quot; to add materials and labour.
                    </td>
                  </tr>
                )}
                {compFiltered.map((item, i) => {
                  const estBudget = item.quantity * item.unitRate;
                  const actualCost = item.totalCost;
                  const variance = estBudget - actualCost;
                  const variancePct = estBudget > 0 ? ((variance / estBudget) * 100).toFixed(1) : "0";
                  const isSaved = variance > 0.01;
                  const isOver = variance < -0.01;

                  return (
                    <tr key={item.id} className="hover:bg-amber-50/50 transition-colors divide-x divide-gray-50">
                      <td className="px-3 py-2.5 text-gray-400 text-center">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        {item.phase ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap">
                            {item.phase}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[200px] truncate" title={item.description}>
                        {item.description}
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{item.unit || "—"}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gray-700">{item.quantity.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-gray-700">৳{formatCurrency(item.unitRate)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-blue-900 bg-blue-50/30">৳{formatCurrency(estBudget)}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-amber-800">৳{formatCurrency(item.materialCost)}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-teal-800">৳{formatCurrency(item.laborCost)}</td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-gray-900 bg-gray-50/50">৳{formatCurrency(actualCost)}</td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        {isSaved ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                            🟢 Saved ৳{formatCurrency(variance)} ({variancePct}%)
                          </span>
                        ) : isOver ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                            🔴 Over ৳{formatCurrency(Math.abs(variance))} ({Math.abs(Number(variancePct))}%)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                            🔵 Matched 100%
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditBoq(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit Item">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteBoq(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Delete Item">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {compFiltered.length > 0 && (
                <tfoot>
                  <tr className="bg-amber-50 font-bold border-t border-amber-200 text-gray-800 divide-x divide-amber-200/50">
                    <td colSpan={4} className="px-3 py-3 text-right">TOTAL SUMMARY:</td>
                    <td className="px-3 py-3 text-right">{compFiltered.reduce((a, b) => a + b.quantity, 0).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">—</td>
                    <td className="px-3 py-3 text-right text-blue-900 font-extrabold text-sm">৳{formatCurrency(compTotalBudget)}</td>
                    <td className="px-3 py-3 text-right text-amber-900 font-bold">৳{formatCurrency(compTotalMaterial)}</td>
                    <td className="px-3 py-3 text-right text-teal-900 font-bold">৳{formatCurrency(compTotalLabour)}</td>
                    <td className="px-3 py-3 text-right text-gray-900 font-extrabold text-sm">৳{formatCurrency(compTotalActual)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-bold",
                        compVariance >= 0 ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
                      )}>
                        {compVariance >= 0 ? `Saved ৳${formatCurrency(compVariance)}` : `Over ৳${formatCurrency(Math.abs(compVariance))}`}
                      </span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ══ TASK ═══════════════════════════════════════════════════════════════ */}
      {tab === "Task" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Tasks</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {tasks.filter((t) => t.status === "COMPLETED").length} of {tasks.length} completed
              </p>
            </div>
            <button onClick={() => { setEditTaskId(null); setTaskForm({ ...emptyTask, dueDate: project.endDate.slice(0, 10) }); setShowTaskForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg font-medium">
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-500 text-white">
                  {["#", "TITLE", "ASSIGNED TO", "PRIORITY", "STATUS", "PROGRESS", "DUE DATE", "ACTIONS"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">No tasks yet.</td></tr>}
                {tasks.map((task, i) => (
                  <tr key={task.id} className="hover:bg-amber-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-800">{task.title}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{task.assignedTo?.name || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold", PRIORITY_MAP[task.priority] ?? "bg-gray-100 text-gray-600")}>{task.priority}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold", STATUS_MAP[task.status] ?? "bg-gray-100 text-gray-600")}>{task.status.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                          <div className="h-1.5 bg-amber-400 rounded-full" style={{ width: `${task.progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{task.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{new Date(task.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditTask(task)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteTask(task.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ EXPENSES ══════════════════════════════════════════════════════════ */}
      {tab === "Expenses" && (
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-purple-700">Total Project Expense</p>
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-purple-900 mt-1">৳{formatCurrency(totalExpense)}</p>
              <p className="text-[11px] text-purple-600 mt-0.5">{budget ? Math.round((totalExpense / budget) * 100) : 0}% of total budget</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-green-700">Approved Expenses</p>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xl font-bold text-green-900 mt-1">৳{formatCurrency(approvedExpenseSum)}</p>
              <p className="text-[11px] text-green-600 mt-0.5">{approvedVouchers.length} vouchers posted</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-700">Pending Approval</p>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-amber-900 mt-1">৳{formatCurrency(pendingExpenseSum)}</p>
              <p className="text-[11px] text-amber-600 mt-0.5">{pendingVouchers.length} vouchers pending</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Remaining Budget</p>
                <Receipt className="w-4 h-4 text-gray-600" />
              </div>
              <p className={cn("text-xl font-bold mt-1", available >= 0 ? "text-green-700" : "text-red-600")}>
                ৳{formatCurrency(available)}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">Budget: ৳{formatCurrency(budget)}</p>
            </div>
          </div>

          {/* Action and Filter Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <input
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                placeholder="Search by voucher no, description, payee, created by..."
                className="w-full max-w-sm px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="all">All Categories</option>
                <option value="Material">Material (কাঁচামাল)</option>
                <option value="Labour">Labour / Worker (মজুরি)</option>
                <option value="Designer">Designer / Architect Fee</option>
                <option value="Contractor">Contractor (কন্ট্রাক্টর বিল)</option>
                <option value="Utilities">Utilities & Fuel</option>
                <option value="Site Logistics">Site Office & Logistics</option>
                <option value="Other">Other / অন্যান্য</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportExpenses("xlsx")}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={() => exportExpenses("pdf")}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                onClick={() => { setExpenseForm(emptyExpense); setShowExpenseForm(true); }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" /> + Add Expense / Voucher
              </button>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-amber-500 text-white">
                  <th className="px-4 py-3 text-left font-semibold">#</th>
                  <th className="px-4 py-3 text-left font-semibold">VOUCHER NO</th>
                  <th className="px-4 py-3 text-left font-semibold">DATE</th>
                  <th className="px-4 py-3 text-left font-semibold">TYPE</th>
                  <th className="px-4 py-3 text-left font-semibold">CATEGORY & DESCRIPTION</th>
                  <th className="px-4 py-3 text-left font-semibold">CREATED BY</th>
                  <th className="px-4 py-3 text-right font-semibold">AMOUNT (৳)</th>
                  <th className="px-4 py-3 text-center font-semibold">STATUS</th>
                  <th className="px-4 py-3 text-center font-semibold">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-400">
                      No expense vouchers recorded for this project yet. Click &quot;+ Add Expense / Voucher&quot; to record your first expense.
                    </td>
                  </tr>
                )}
                {filteredExpenses.map((v, i) => (
                  <tr key={v.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">{v.voucherNo}</td>
                    <td className="px-4 py-2.5 text-gray-600">{formatDate(v.voucherDate)}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        {v.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-800 max-w-xs truncate" title={v.description}>
                      {v.description || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{v.createdBy?.name || "System"}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                      ৳{formatCurrency(v.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                        v.status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      )}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {v.status === "pending" && (
                          <button
                            onClick={() => approveExpense(v.id)}
                            className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-green-50 text-green-700 rounded hover:bg-green-100 font-semibold"
                            title="Approve Voucher"
                          >
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                        )}
                        <button
                          onClick={() => deleteExpense(v.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Delete Voucher"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filteredExpenses.length > 0 && (
                <tfoot>
                  <tr className="bg-amber-50 font-bold border-t border-amber-200 text-gray-800">
                    <td colSpan={6} className="px-4 py-3 text-right">TOTAL EXPENSE:</td>
                    <td className="px-4 py-3 text-right text-purple-900 font-extrabold text-sm">
                      ৳{formatCurrency(filteredExpenses.reduce((a, b) => a + b.amount, 0))}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ══ USERS ══════════════════════════════════════════════════════════════ */}
      {tab === "Users" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Project Team</h2>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-700 font-bold">{project.manager.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{project.manager}</p>
                <p className="text-xs text-gray-400">Project Manager</p>
              </div>
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">Manager</span>
            </div>
            {(project.contractorAssigns ?? []).map((a) => (
              <div key={a.contractor.id} className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-bold">{a.contractor.name.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{a.contractor.name}</p>
                  <p className="text-xs text-gray-400">{a.contractor.specialty}</p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Contractor</span>
              </div>
            ))}
            {(project.workerAssigns ?? []).map((a) => (
              <div key={a.worker.id} className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-700 font-bold">{a.worker.name.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{a.worker.name}</p>
                  <p className="text-xs text-gray-400">{a.worker.role}</p>
                </div>
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Worker</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ DETAILS ════════════════════════════════════════════════════════════ */}
      {tab === "Details" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">Add/Edit Project Details</h2>
          <form onSubmit={saveDetails} className="grid grid-cols-2 gap-4 max-w-3xl">
            <Inp label="Area Of Land" placeholder="e.g. 5 Katha" value={details.areaOfLand} onChange={(e) => setDetails({ ...details, areaOfLand: e.target.value })} />
            <Inp label="Name Of Land Owner" placeholder="Owner name" value={details.nameOfLandOwner} onChange={(e) => setDetails({ ...details, nameOfLandOwner: e.target.value })} />
            <Inp label="Land Owner / Developer Ratio" placeholder="e.g. 50:50" value={details.landOwnerDeveloperRatio} onChange={(e) => setDetails({ ...details, landOwnerDeveloperRatio: e.target.value })} />
            <Inp label="Value Of Land" placeholder="e.g. 1,00,00,000" value={details.valueOfLand} onChange={(e) => setDetails({ ...details, valueOfLand: e.target.value })} />
            <Inp label="Build Area" placeholder="e.g. 2500 sqft" value={details.buildArea} onChange={(e) => setDetails({ ...details, buildArea: e.target.value })} />
            <Inp label="Total No. of Building" placeholder="e.g. 1" value={details.totalNoOfBuilding} onChange={(e) => setDetails({ ...details, totalNoOfBuilding: e.target.value })} />
            <Inp label="Total Floor of Building" placeholder="e.g. 10" value={details.totalFloorOfBuilding} onChange={(e) => setDetails({ ...details, totalFloorOfBuilding: e.target.value })} />
            <Inp label="No. of Flat in Each Floor" placeholder="e.g. 4" value={details.noOfFlatInEachFloor} onChange={(e) => setDetails({ ...details, noOfFlatInEachFloor: e.target.value })} />
            <Inp label="Total Flat in the Building" placeholder="Auto: floor × flat/floor" value={details.totalFlatInBuilding} onChange={(e) => setDetails({ ...details, totalFlatInBuilding: e.target.value })} />
            <Inp label="Flat Size" placeholder="e.g. 1200 sqft" value={details.flatSize} onChange={(e) => setDetails({ ...details, flatSize: e.target.value })} />
            <Inp label="Total No. of Car Parking" placeholder="e.g. 20" value={details.totalNoOfCarParking} onChange={(e) => setDetails({ ...details, totalNoOfCarParking: e.target.value })} />
            <div className="col-span-2 flex items-center gap-3 pt-2">
              <button type="submit" className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg font-medium">Submit</button>
              {detailsSaved && <span className="text-green-600 text-xs font-medium">✓ Saved!</span>}
            </div>
          </form>
        </div>
      )}

      {/* ══ FLAT/LAND ══════════════════════════════════════════════════════════ */}
      {tab === "Flat/Land" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Flat / Land Units</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-400" /> Sold ({project.soldUnits})</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200" /> Available ({Math.max(0, (project.totalUnits || 0) - (project.soldUnits || 0))})</span>
            </div>
          </div>
          {project.totalUnits > 0 ? (
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: project.totalUnits }, (_, i) => (
                <div key={i} className={cn("rounded-lg border p-3 text-center text-xs font-medium cursor-pointer hover:shadow-sm transition-shadow",
                  i < project.soldUnits ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-amber-300"
                )}>
                  <p className="font-bold">#{i + 1}</p>
                  <p className="text-[10px] mt-0.5">{i < project.soldUnits ? "SOLD" : "AVAILABLE"}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">No units configured. Update total units in the project to see the unit grid.</div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href={`/real-estate/units?projectId=${project.id}`} className="text-sm text-amber-600 hover:underline font-medium">
              → Manage detailed units in Real Estate module
            </Link>
          </div>
        </div>
      )}

      {/* ══ BOQ COMPARISON ═════════════════════════════════════════════════════ */}
      {tab === "BOQ Comparison" && (
        <div className="space-y-4">
          {/* Top KPI Cards for BOQ Comparison */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-blue-700">Estimated BOQ Budget</p>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-blue-950 mt-1">৳{formatCurrency(compTotalBudget)}</p>
              <p className="text-[11px] text-blue-600 mt-0.5">{compFiltered.length} items in scope</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-700">Material Cost (কাঁচামাল)</p>
                <Receipt className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-amber-950 mt-1">৳{formatCurrency(compTotalMaterial)}</p>
              <p className="text-[11px] text-amber-600 mt-0.5">
                {compTotalActual > 0 ? Math.round((compTotalMaterial / compTotalActual) * 100) : 0}% of actual cost
              </p>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-teal-700">Labour Cost (মজুরি)</p>
                <Receipt className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-xl font-bold text-teal-950 mt-1">৳{formatCurrency(compTotalLabour)}</p>
              <p className="text-[11px] text-teal-600 mt-0.5">
                {compTotalActual > 0 ? Math.round((compTotalLabour / compTotalActual) * 100) : 0}% of actual cost
              </p>
            </div>

            <div className={cn(
              "border rounded-xl p-4 shadow-sm",
              compVariance >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            )}>
              <div className="flex items-center justify-between">
                <p className={cn("text-xs font-semibold", compVariance >= 0 ? "text-green-700" : "text-red-700")}>
                  {compVariance >= 0 ? "Budget Variance (Saved)" : "Budget Variance (Over)"}
                </p>
                <CheckCircle className={cn("w-4 h-4", compVariance >= 0 ? "text-green-600" : "text-red-600")} />
              </div>
              <p className={cn("text-xl font-bold mt-1", compVariance >= 0 ? "text-green-950" : "text-red-950")}>
                {compVariance >= 0 ? "+" : "-"}৳{formatCurrency(Math.abs(compVariance))}
              </p>
              <p className={cn("text-[11px] font-medium mt-0.5", compVariance >= 0 ? "text-green-700" : "text-red-700")}>
                Total Cost: ৳{formatCurrency(compTotalActual)} ({compVariancePct}% {compVariance >= 0 ? "under" : "over"})
              </p>
            </div>
          </div>

          {/* Filter Bar & Quick Phase Selector */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            {/* Quick Phase Selection Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-gray-600 whitespace-nowrap mr-1">Phase Filter:</span>
              <button
                onClick={() => { setCompPhase("all"); setCompSubcategory("all"); }}
                className={cn(
                  "px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-all",
                  compPhase === "all"
                    ? "bg-amber-500 text-white shadow-sm font-semibold"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                All Phases ({boqItems.length})
              </button>
              {uniquePhases.map((p) => {
                const phaseItemCount = boqItems.filter((b) => b.phase === p).length;
                return (
                  <button
                    key={p}
                    onClick={() => { setCompPhase(p as string); setCompSubcategory("all"); }}
                    className={cn(
                      "px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-all",
                      compPhase === p
                        ? "bg-amber-500 text-white shadow-sm font-semibold"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {p} ({phaseItemCount})
                  </button>
                );
              })}
            </div>

            {/* Subcategory Filter & Search & Actions */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-gray-50">
              <div className="flex items-center gap-2 flex-1 min-w-[260px] flex-wrap">
                <input
                  value={compSearch}
                  onChange={(e) => setCompSearch(e.target.value)}
                  placeholder="Search item, specification, or category..."
                  className="w-full max-w-xs px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />

                {availableCompSubcategories.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Subcategory:</span>
                    <select
                      value={compSubcategory}
                      onChange={(e) => setCompSubcategory(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-gray-700"
                    >
                      <option value="all">All Subcategories ({availableCompSubcategories.length})</option>
                      {availableCompSubcategories.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                )}

                <span className="text-xs text-gray-400">Showing {compFiltered.length} items</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportBoqComparison("xlsx")}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                </button>
                <button
                  onClick={() => exportBoqComparison("pdf")}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  onClick={() => { setEditBoqId(null); setBoqForm(emptyBoq); setShowBoqForm(true); }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> + Add BOQ Item
                </button>
              </div>
            </div>
          </div>

          {/* ══ Phase → Subcategory Cost Transparency Tree Widget ══════════════ */}
          {phaseHierarchy.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-gray-800">
                    Phase → Subcategory Cost Transparency Breakdown
                  </h3>
                  <span className="text-xs text-gray-400">({phaseHierarchy.length} phases active)</span>
                </div>
                <div className="text-xs text-gray-500">
                  Click phase to view subcategory breakdown
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {phaseHierarchy.map((p) => {
                  const isExpanded = expandedPhases[p.phase] !== false;
                  const phaseDiff = p.totalBudget - p.totalCost;
                  const isPhaseSaved = phaseDiff >= 0;

                  return (
                    <div key={p.phase} className="border border-gray-200 rounded-xl bg-gray-50/60 overflow-hidden shadow-xs">
                      {/* Phase Header */}
                      <div
                        onClick={() => togglePhase(p.phase)}
                        className="p-3 bg-white border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-amber-50/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Layers className="w-4 h-4 text-amber-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-gray-900 block truncate" title={p.phase}>
                              {p.phase}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Budget: ৳{formatCurrency(p.totalBudget)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-2">
                          <div>
                            <span className="font-bold text-xs text-amber-900 block">
                              ৳{formatCurrency(p.totalCost)}
                            </span>
                            <span className={cn("text-[10px] font-semibold", isPhaseSaved ? "text-green-700" : "text-red-600")}>
                              {isPhaseSaved ? `+৳${formatCurrency(phaseDiff)}` : `-৳${formatCurrency(Math.abs(phaseDiff))}`}
                            </span>
                          </div>
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>

                      {/* Subcategories Tree List */}
                      {isExpanded && (
                        <div className="p-3 space-y-2 text-xs">
                          {p.subcategories.map((sub, idx) => {
                            const pctOfPhase = p.totalCost > 0 ? ((sub.cost / p.totalCost) * 100).toFixed(0) : "0";
                            const isLast = idx === p.subcategories.length - 1;

                            return (
                              <div key={sub.subcategory} className="space-y-1">
                                <div className="flex items-center justify-between font-mono text-[11px]">
                                  <span className="text-gray-700 font-sans font-medium flex items-center gap-1.5">
                                    <span className="text-gray-400 font-mono">{isLast ? "└──" : "├──"}</span>
                                    {sub.subcategory}
                                    <span className="text-[10px] text-gray-400 font-sans font-normal">
                                      ({sub.items.length} {sub.items.length === 1 ? "item" : "items"})
                                    </span>
                                  </span>
                                  <span className="font-bold text-gray-900 font-sans">
                                    ৳{formatCurrency(sub.cost)}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1 ml-5 max-w-[calc(100%-20px)]">
                                  <div
                                    className="bg-amber-500 h-1 rounded-full"
                                    style={{ width: `${Math.min(100, Math.max(2, Number(pctOfPhase)))}%` }}
                                    title={`${pctOfPhase}% of phase cost`}
                                  />
                                </div>
                              </div>
                            );
                          })}

                          <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-[11px] font-bold text-gray-800">
                            <span>Phase Total Cost:</span>
                            <span className="text-amber-900">৳{formatCurrency(p.totalCost)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed 12-Column Comparison Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                    <th className="px-3 py-3 text-left font-semibold">#</th>
                    <th className="px-3 py-3 text-left font-semibold">PHASE / STAGE</th>
                    <th className="px-3 py-3 text-left font-semibold">SUBCATEGORY</th>
                    <th className="px-3 py-3 text-left font-semibold min-w-[200px]">ITEM & SPECIFICATION</th>
                    <th className="px-3 py-3 text-center font-semibold">UNIT</th>
                    <th className="px-3 py-3 text-right font-semibold">EST. QTY</th>
                    <th className="px-3 py-3 text-right font-semibold">UNIT RATE (৳)</th>
                    <th className="px-3 py-3 text-right font-semibold bg-amber-700/30">EST. BUDGET (৳)</th>
                    <th className="px-3 py-3 text-right font-semibold bg-amber-800/30">MATERIAL (৳)</th>
                    <th className="px-3 py-3 text-right font-semibold bg-amber-800/30">LABOUR (৳)</th>
                    <th className="px-3 py-3 text-right font-semibold bg-amber-900/40">TOTAL COST (৳)</th>
                    <th className="px-3 py-3 text-center font-semibold min-w-[140px]">VARIANCE & STATUS</th>
                    <th className="px-3 py-3 text-center font-semibold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {compFiltered.length === 0 && (
                    <tr>
                      <td colSpan={13} className="text-center py-12 text-gray-400">
                        No BOQ items match your filter. Click &quot;+ Add BOQ Item&quot; to add an item.
                      </td>
                    </tr>
                  )}
                  {compFiltered.slice(0, compShow).map((item, i) => {
                    const estBudget = item.quantity * item.unitRate;
                    const diff = estBudget - item.totalCost;
                    const isMatch = Math.abs(diff) < 0.01;
                    const isSaved = diff > 0;
                    const diffPct = estBudget > 0 ? Math.abs((diff / estBudget) * 100).toFixed(1) : "0";

                    return (
                      <tr key={item.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="px-3 py-2.5 text-gray-400 font-medium">{i + 1}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                            {item.phase || "General"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap">
                            {item.subcategory || "General"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-gray-800">
                          {item.description}
                        </td>
                        <td className="px-3 py-2.5 text-center text-gray-500 font-mono">
                          {item.unit || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-700">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600">
                          ৳{formatCurrency(item.unitRate)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-blue-900 bg-blue-50/30">
                          ৳{formatCurrency(estBudget)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-amber-900 bg-amber-50/20">
                          ৳{formatCurrency(item.materialCost)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-teal-900 bg-teal-50/20">
                          ৳{formatCurrency(item.laborCost)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-extrabold text-gray-950 bg-gray-50">
                          ৳{formatCurrency(item.totalCost)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {isMatch ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                              Matched 100%
                            </span>
                          ) : isSaved ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 inline-flex items-center gap-1">
                              🟢 Saved ৳{formatCurrency(diff)} ({diffPct}%)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 inline-flex items-center gap-1">
                              🔴 Over ৳{formatCurrency(Math.abs(diff))} ({diffPct}%)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditBoq(item)}
                              title="Edit"
                              className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteBoq(item.id)}
                              title="Delete"
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {compFiltered.length > 0 && (
                  <tfoot>
                    <tr className="bg-amber-50/80 font-bold border-t-2 border-amber-200 text-gray-900">
                      <td colSpan={5} className="px-3 py-3 text-right font-extrabold text-gray-800">
                        TOTAL ({compPhase === "all" ? "ALL PHASES" : compPhase}):
                      </td>
                      <td className="px-3 py-3 text-right">
                        {compFiltered.reduce((a, b) => a + b.quantity, 0).toLocaleString()}
                      </td>
                      <td />
                      <td className="px-3 py-3 text-right text-blue-900 font-extrabold">
                        ৳{formatCurrency(compTotalBudget)}
                      </td>
                      <td className="px-3 py-3 text-right text-amber-900 font-bold">
                        ৳{formatCurrency(compTotalMaterial)}
                      </td>
                      <td className="px-3 py-3 text-right text-teal-900 font-bold">
                        ৳{formatCurrency(compTotalLabour)}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-950 font-extrabold text-sm">
                        ৳{formatCurrency(compTotalActual)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-extrabold inline-block",
                          compVariance >= 0
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-red-100 text-red-800 border border-red-300"
                        )}>
                          {compVariance >= 0
                            ? `Net Savings: +৳${formatCurrency(compVariance)}`
                            : `Over Budget: -৳${formatCurrency(Math.abs(compVariance))}`}
                        </span>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ QUOTATION ══════════════════════════════════════════════════════════ */}
      {tab === "Quotation" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Quotations</h2>
            <Link href="/projects/quotations" className="text-xs text-amber-600 hover:underline font-medium">
              + Add Quotation →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-500 text-white">
                  {["#", "QUOT. NO", "CLIENT", "DESCRIPTION", "AMOUNT", "STATUS", "VALID UNTIL"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quotations.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No quotations for this project.</td></tr>}
                {quotations.map((q, i) => (
                  <tr key={q.id} className="hover:bg-amber-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-700">{q.quotationNo ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs font-medium">{q.client ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-600 max-w-44 truncate">{q.description ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-right font-bold">{q.amount?.toLocaleString() ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold",
                        q.status === "approved" ? "bg-green-100 text-green-700" :
                        q.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      )}>{q.status ?? "draft"}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{q.validUntil ? new Date(q.validUntil).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ MODALS ══════════════════════════════════════════════════════════════ */}

      {/* BOQ Form Modal */}
      {showBoqForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold">{editBoqId ? "Edit BOQ Item" : "Add BOQ Item"}</h3>
              <button onClick={() => setShowBoqForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={submitBoq} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phase / Stage <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={boqForm.phase}
                    onChange={(e) => setBoqForm({ ...boqForm, phase: e.target.value, subcategory: "" })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  >
                    <option value="">— Select Phase —</option>
                    {PROJECT_PHASES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Subcategory {boqForm.phase ? <span className="text-amber-600">({getSubcategoriesForPhase(boqForm.phase).length} available)</span> : ""}
                  </label>
                  <select
                    value={boqForm.subcategory}
                    onChange={(e) => setBoqForm({ ...boqForm, subcategory: e.target.value })}
                    disabled={!boqForm.phase}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">— Select Subcategory —</option>
                    {getSubcategoriesForPhase(boqForm.phase).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <Inp label="Item Description & Specification *" required placeholder="e.g. 500W Grade BSRM Rebar supply & binding" value={boqForm.description} onChange={(e) => setBoqForm({ ...boqForm, description: e.target.value })} />
                </div>
                <Inp label="Unit (e.g. Ton, Bags, Piles, m³, Sqft)" placeholder="Unit" value={boqForm.unit} onChange={(e) => setBoqForm({ ...boqForm, unit: e.target.value })} />
                <Inp label="Estimated Quantity" type="number" min="0" placeholder="0" value={boqForm.quantity} onChange={(e) => setBoqForm({ ...boqForm, quantity: e.target.value })} />
                <Inp label="Estimated Unit Rate (৳)" type="number" min="0" placeholder="0" value={boqForm.unitRate} onChange={(e) => setBoqForm({ ...boqForm, unitRate: e.target.value })} />
                <Inp label="Material Cost (৳ - রড, সিমেন্ট)" type="number" min="0" placeholder="0" value={boqForm.materialCost} onChange={(e) => setBoqForm({ ...boqForm, materialCost: e.target.value })} />
                <Inp label="Labour Cost (৳ - মজুরি)" type="number" min="0" placeholder="0" value={boqForm.laborCost} onChange={(e) => setBoqForm({ ...boqForm, laborCost: e.target.value })} />
              </div>
              
              {/* Real-Time Live Calculation & Variance Card */}
              {(boqForm.quantity || boqForm.unitRate || boqForm.materialCost || boqForm.laborCost) && (
                (() => {
                  const qty = parseFloat(boqForm.quantity) || 0;
                  const rate = parseFloat(boqForm.unitRate) || 0;
                  const mat = parseFloat(boqForm.materialCost) || 0;
                  const lab = parseFloat(boqForm.laborCost) || 0;
                  const estBudget = qty * rate;
                  const totalBreakdown = mat + lab;
                  const grandTotal = estBudget > 0 ? (mat > 0 || lab > 0 ? totalBreakdown : estBudget) : totalBreakdown;
                  const diff = estBudget - grandTotal;

                  return (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3.5 text-xs space-y-1.5 shadow-sm">
                      <div className="flex justify-between font-medium">
                        <span className="text-gray-600">Estimated BOQ Budget (Qty × Rate):</span>
                        <span className="font-bold text-blue-900">৳{formatCurrency(estBudget)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-gray-600">Material + Labour Breakdown:</span>
                        <span className="font-bold text-gray-800">৳{formatCurrency(mat)} + ৳{formatCurrency(lab)} = ৳{formatCurrency(totalBreakdown)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-amber-200/60">
                        <span className="text-gray-800">Calculated Item Cost:</span>
                        <span className="text-amber-900 font-extrabold text-sm">৳{formatCurrency(grandTotal)}</span>
                      </div>
                      {estBudget > 0 && totalBreakdown > 0 && (
                        <div className="flex justify-between items-center pt-1 text-[11px]">
                          <span className="text-gray-500">Budget vs Breakdown Status:</span>
                          <span className={cn("font-bold px-2 py-0.5 rounded-full",
                            diff >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {diff >= 0 ? `🟢 Saved ৳${formatCurrency(diff)}` : `🔴 Over by ৳${formatCurrency(Math.abs(diff))}`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowBoqForm(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">Cancel</button>
                <button type="submit" className="px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow-sm">{editBoqId ? "Update Item" : "Add to BOQ"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold">{editTaskId ? "Edit Task" : "Add Task"}</h3>
              <button onClick={() => setShowTaskForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={submitTask} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Inp label="Task Title *" required placeholder="Task name" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
              </div>
              <Sel label="Assign To" value={taskForm.userId} onChange={(e) => setTaskForm({ ...taskForm, userId: e.target.value })}>
                <option value="">— Current User ({authUser?.name}) —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Sel>
              <Inp label="Due Date *" type="date" required value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              <Sel label="Priority" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
              </Sel>
              <Sel label="Status" value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                <option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option>
              </Sel>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Progress: {taskForm.progress}%</label>
                <input type="range" min="0" max="100" value={taskForm.progress} onChange={(e) => setTaskForm({ ...taskForm, progress: e.target.value })}
                  className="w-full accent-amber-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={2} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="col-span-2 flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowTaskForm(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium">{editTaskId ? "Update" : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Form Modal */}
      {showProgForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold">Add Progress Log</h3>
              <button onClick={() => setShowProgForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={submitProgress} className="space-y-4">
              <Inp label="Phase / Activity *" required list="phase-suggestions" placeholder="e.g. Foundation & Substructure" value={progForm.phase} onChange={(e) => setProgForm({ ...progForm, phase: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Progress: {progForm.percentage}%</label>
                  <input type="range" min="0" max="100" value={progForm.percentage} onChange={(e) => setProgForm({ ...progForm, percentage: e.target.value })}
                    className="w-full accent-amber-500 mt-2" />
                </div>
                <Inp label="Log Date" type="date" value={progForm.logDate} onChange={(e) => setProgForm({ ...progForm, logDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                <textarea rows={2} value={progForm.remarks} onChange={(e) => setProgForm({ ...progForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowProgForm(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-amber-500/10 rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-600" /> Add Project Expense
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Project: <span className="font-semibold text-gray-800">{project.name}</span></p>
              </div>
              <button onClick={() => { setShowExpenseForm(false); setExpenseError(""); }}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={submitExpense} className="p-6 space-y-4">
              {expenseError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {expenseError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Expense Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  >
                    <option value="Material">🧱 Material / Construction কাঁচামাল</option>
                    <option value="Labour">👷 Labour / Worker মজুরি</option>
                    <option value="Designer">📐 Designer / Architect Fee</option>
                    <option value="Contractor">🏗️ Contractor বিল</option>
                    <option value="Utilities">⛽ Utilities & Fuel</option>
                    <option value="Site Logistics">🏢 Site Office & Logistics</option>
                    <option value="Other">📌 Other / অন্যান্য</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Voucher Type *</label>
                  <select
                    value={expenseForm.type}
                    onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  >
                    <option value="PAYMENT">Payment Voucher</option>
                    <option value="JOURNAL">Journal Voucher</option>
                    <option value="ADJUSTMENT">Adjustment Voucher</option>
                  </select>
                </div>

                <div>
                  <Inp
                    label="Amount (৳) *"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 50000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>

                <div>
                  <Inp
                    label="Date *"
                    type="date"
                    required
                    value={expenseForm.voucherDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, voucherDate: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Inp
                    label="Payee / Paid To (Name of Worker / Designer / Vendor)"
                    placeholder="e.g. Architect Kamal / Rod Supplier Meghna / Head Mason"
                    value={expenseForm.payee}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payee: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description / Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 500 bags cement delivery bill paid via cheque"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowExpenseForm(false); setExpenseError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-bold flex items-center gap-2 shadow-sm"
                >
                  {savingExpense && <Loader2 className="w-4 h-4 animate-spin" />} Save Project Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
