"use client";
import { useEffect, useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { projectsApi } from "@/lib/api";
import { confirmAction } from "@/lib/feedback";
import { exportRowsToPdf, exportRowsToXlsx, type ExportColumn } from "@/lib/export-utils";
import {
  FileText, Plus, Loader2, X, Pencil, Trash2,
  DollarSign, Receipt, CheckCircle, FileSpreadsheet, FileDown, Search,
  ChevronDown, ChevronRight, Layers, FolderTree
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  PROJECT_PHASES,
  getSubcategoriesForPhase,
  normalizePhaseName,
  getSubcategoryProfile,
} from "@/lib/constants";

interface Project { id: string; name: string; }
interface BOQItem {
  id: string;
  projectId: string;
  phase?: string;
  subcategory?: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  materialCost: number;
  laborCost: number;
  totalCost: number;
}

const defaultForm = {
  phase: "",
  subcategory: "",
  description: "",
  unit: "",
  quantity: "",
  unitRate: "",
  materialCost: "",
  laborCost: "",
};

export default function BOQPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [items, setItems] = useState<BOQItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});

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
    projectsApi.getBOQ(selectedId)
      .then((r) => setItems(r.data.data ?? r.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [selectedId]);

  function openCreate() {
    setEditId(null);
    setForm(defaultForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(item: BOQItem) {
    setEditId(item.id);
    setForm({
      phase: item.phase || "",
      subcategory: item.subcategory || "",
      description: item.description,
      unit: item.unit || "",
      quantity: String(item.quantity || ""),
      unitRate: String(item.unitRate || ""),
      materialCost: String(item.materialCost || ""),
      laborCost: String(item.laborCost || ""),
    });
    setError("");
    setShowModal(true);
  }

  function handlePhaseChange(newPhase: string) {
    const validSubs = getSubcategoriesForPhase(newPhase);
    const subStillValid = validSubs.includes(form.subcategory);
    const chosenSub = subStillValid ? form.subcategory : (validSubs[0] || "");
    const profile = getSubcategoryProfile(newPhase, chosenSub);
    setForm({
      ...form,
      phase: newPhase,
      subcategory: chosenSub,
      unit: (!form.unit || form.unit === "1") ? profile.defaultUnit : form.unit,
    });
  }

  function handleSubcategoryChange(newSub: string) {
    const profile = getSubcategoryProfile(form.phase, newSub);
    setForm({
      ...form,
      subcategory: newSub,
      unit: (!form.unit || form.unit === "1") ? profile.defaultUnit : form.unit,
    });
  }

  const activeFormProfile = useMemo(() => {
    return getSubcategoryProfile(form.phase, form.subcategory);
  }, [form.phase, form.subcategory]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const qty = parseFloat(form.quantity) || 0;
      const unitRate = parseFloat(form.unitRate) || 0;
      const materialCost = parseFloat(form.materialCost) || 0;
      const laborCost = parseFloat(form.laborCost) || 0;
      const totalCost = (materialCost + laborCost > 0) ? (materialCost + laborCost) : (qty * unitRate);
      
      const payload = {
        phase: form.phase || undefined,
        subcategory: form.subcategory || undefined,
        description: form.description,
        unit: form.unit,
        quantity: qty,
        unitRate,
        materialCost,
        laborCost,
        totalCost,
      };
      if (editId) await projectsApi.updateBOQ(editId, payload);
      else await projectsApi.createBOQ(selectedId, payload);
      setShowModal(false);
      const r = await projectsApi.getBOQ(selectedId);
      setItems(r.data.data ?? r.data ?? []);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to save BOQ item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(itemId: string) {
    if (!(await confirmAction("Delete this BOQ item?"))) return;
    await projectsApi.deleteBOQItem(itemId);
    const r = await projectsApi.getBOQ(selectedId);
    setItems(r.data.data ?? r.data ?? []);
  }

  const selectedProject = projects.find((p) => p.id === selectedId);
  const availableFormSubcategories = useMemo(() => getSubcategoriesForPhase(form.phase), [form.phase]);

  // Derived filter options
  const uniquePhases = useMemo(() => {
    const fromItems = items.map((b) => b.phase).filter(Boolean) as string[];
    return Array.from(new Set([...PROJECT_PHASES, ...fromItems]));
  }, [items]);

  const availableFilterSubcategories = useMemo(() => {
    if (phaseFilter === "all") {
      const allSubs = items.map((b) => b.subcategory).filter(Boolean) as string[];
      return Array.from(new Set(allSubs));
    }
    return getSubcategoriesForPhase(phaseFilter);
  }, [phaseFilter, items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const normItemPhase = normalizePhaseName(item.phase);
      const normFilterPhase = phaseFilter === "all" ? "all" : normalizePhaseName(phaseFilter);
      const matchPhase = phaseFilter === "all" || normItemPhase === normFilterPhase || item.phase === phaseFilter;
      const matchSub = subcategoryFilter === "all" || item.subcategory === subcategoryFilter;
      const matchSearch =
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        (item.phase || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.subcategory || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.unit || "").toLowerCase().includes(search.toLowerCase());
      return matchPhase && matchSub && matchSearch;
    });
  }, [items, phaseFilter, subcategoryFilter, search]);

  const totalEstBudget = filteredItems.reduce((a, b) => a + (b.quantity * b.unitRate), 0);
  const totalMaterial = filteredItems.reduce((a, b) => a + (b.materialCost || 0), 0);
  const totalLabour = filteredItems.reduce((a, b) => a + (b.laborCost || 0), 0);
  const totalActual = filteredItems.reduce((a, b) => a + (b.totalCost || 0), 0);
  const totalVariance = totalEstBudget - totalActual;
  const variancePct = totalEstBudget > 0 ? ((totalVariance / totalEstBudget) * 100).toFixed(1) : "0";

  // Hierarchical Cost Breakdown: Phase -> Subcategory -> Items
  const phaseHierarchy = useMemo(() => {
    const map = new Map<string, {
      phase: string;
      totalBudget: number;
      totalCost: number;
      materialCost: number;
      laborCost: number;
      subcategories: Map<string, {
        subcategory: string;
        budget: number;
        cost: number;
        materialCost: number;
        laborCost: number;
        items: BOQItem[];
      }>;
    }>();

    filteredItems.forEach((item) => {
      const phaseName = item.phase ? normalizePhaseName(item.phase) : "General / Other";
      const subName = item.subcategory || "General Items";
      const itemBudget = item.quantity * item.unitRate;
      const itemCost = item.totalCost;

      if (!map.has(phaseName)) {
        map.set(phaseName, {
          phase: phaseName,
          totalBudget: 0,
          totalCost: 0,
          materialCost: 0,
          laborCost: 0,
          subcategories: new Map(),
        });
      }

      const pGroup = map.get(phaseName)!;
      pGroup.totalBudget += itemBudget;
      pGroup.totalCost += itemCost;
      pGroup.materialCost += (item.materialCost || 0);
      pGroup.laborCost += (item.laborCost || 0);

      if (!pGroup.subcategories.has(subName)) {
        pGroup.subcategories.set(subName, {
          subcategory: subName,
          budget: 0,
          cost: 0,
          materialCost: 0,
          laborCost: 0,
          items: [],
        });
      }

      const sGroup = pGroup.subcategories.get(subName)!;
      sGroup.budget += itemBudget;
      sGroup.cost += itemCost;
      sGroup.materialCost += (item.materialCost || 0);
      sGroup.laborCost += (item.laborCost || 0);
      sGroup.items.push(item);
    });

    return Array.from(map.values()).map((p) => ({
      ...p,
      subcategories: Array.from(p.subcategories.values()),
    }));
  }, [filteredItems]);

  function togglePhase(phase: string) {
    setExpandedPhases((prev) => ({ ...prev, [phase]: !prev[phase] }));
  }

  const boqExportColumns: ExportColumn<BOQItem>[] = [
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

  function handleExport(format: "xlsx" | "pdf") {
    if (!selectedProject) return;
    const filename = `${selectedProject.name}-boq-breakdown`;
    const subtitle = `Phase: ${phaseFilter === "all" ? "All Phases" : phaseFilter} | Est. Budget: ৳${formatCurrency(totalEstBudget)} | Total Cost: ৳${formatCurrency(totalActual)}`;
    if (format === "xlsx") {
      exportRowsToXlsx({ filename, sheetName: "BOQ Items", columns: boqExportColumns, rows: filteredItems });
    } else {
      exportRowsToPdf({ filename, title: `${selectedProject.name} - Bill of Quantities (BOQ)`, subtitle, columns: boqExportColumns, rows: filteredItems });
    }
  }

  // Live calculation values for modal
  const formQty = parseFloat(form.quantity) || 0;
  const formRate = parseFloat(form.unitRate) || 0;
  const formMat = parseFloat(form.materialCost) || 0;
  const formLab = parseFloat(form.laborCost) || 0;
  const formEstBudget = formQty * formRate;
  const formBreakdown = formMat + formLab;
  const formGrandTotal = formEstBudget > 0 ? (formMat > 0 || formLab > 0 ? formBreakdown : formEstBudget) : formBreakdown;
  const formDiff = formEstBudget - formGrandTotal;

  return (
    <MainLayout title="Bill of Quantities (BOQ)" subtitle="Manage construction costs transparently with Phase / Stage → Subcategory breakdown">
      {/* Project Selector Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-5 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-gray-700">Selected Project:</label>
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setPhaseFilter("all");
              setSubcategoryFilter("all");
            }}
            className="px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold text-gray-800 min-w-64 bg-gray-50"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        {selectedId && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg font-bold shadow transition-all"
          >
            <Plus className="w-4 h-4" /> + Add BOQ Item
          </button>
        )}
      </div>

      {selectedId && (
        <div className="space-y-5">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-blue-700">Estimated BOQ Budget</p>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-blue-950 mt-1">৳{formatCurrency(totalEstBudget)}</p>
              <p className="text-[11px] text-blue-600 mt-0.5">{filteredItems.length} items in estimate</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-700">Material Cost (কাঁচামাল)</p>
                <Receipt className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-amber-950 mt-1">৳{formatCurrency(totalMaterial)}</p>
              <p className="text-[11px] text-amber-600 mt-0.5">
                {totalActual > 0 ? Math.round((totalMaterial / totalActual) * 100) : 0}% of total cost
              </p>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-teal-700">Labour Cost (মজুরি)</p>
                <Receipt className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-xl font-bold text-teal-950 mt-1">৳{formatCurrency(totalLabour)}</p>
              <p className="text-[11px] text-teal-600 mt-0.5">
                {totalActual > 0 ? Math.round((totalLabour / totalActual) * 100) : 0}% of total cost
              </p>
            </div>

            <div className={cn(
              "border rounded-xl p-4 shadow-sm",
              totalVariance >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            )}>
              <div className="flex items-center justify-between">
                <p className={cn("text-xs font-semibold", totalVariance >= 0 ? "text-green-700" : "text-red-700")}>
                  {totalVariance >= 0 ? "Budget Variance (Saved)" : "Budget Variance (Over)"}
                </p>
                <CheckCircle className={cn("w-4 h-4", totalVariance >= 0 ? "text-green-600" : "text-red-600")} />
              </div>
              <p className={cn("text-xl font-bold mt-1", totalVariance >= 0 ? "text-green-950" : "text-red-950")}>
                {totalVariance >= 0 ? "+" : "-"}৳{formatCurrency(Math.abs(totalVariance))}
              </p>
              <p className={cn("text-[11px] font-medium mt-0.5", totalVariance >= 0 ? "text-green-700" : "text-red-700")}>
                Total Cost: ৳{formatCurrency(totalActual)} ({variancePct}% {totalVariance >= 0 ? "saved" : "over"})
              </p>
            </div>
          </div>

          {/* ══ Phase → Subcategory Cost Transparency Tree Widget ══════════════ */}
          {phaseHierarchy.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-gray-800">
                    Phase → Subcategory Transparent Cost Hierarchy
                  </h3>
                  <span className="text-xs text-gray-400">({phaseHierarchy.length} phases active)</span>
                </div>
                <div className="text-xs text-gray-500">
                  Click any phase to inspect subcategories & cost breakdown
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {phaseHierarchy.map((p) => {
                  const isExpanded = expandedPhases[p.phase] !== false; // default expanded
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

                          {/* Phase Total Footer */}
                          <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between font-bold text-xs text-gray-900">
                            <span>Total {p.phase}:</span>
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

          {/* Filter & Export Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-[320px] flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search item, spec, phase, subcategory..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Phase Filter Dropdown */}
              <select
                value={phaseFilter}
                onChange={(e) => {
                  setPhaseFilter(e.target.value);
                  setSubcategoryFilter("all");
                }}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50 font-medium text-gray-800"
              >
                <option value="all">All Phases ({uniquePhases.length})</option>
                {uniquePhases.map((phase) => (
                  <option key={phase} value={phase}>{phase}</option>
                ))}
              </select>

              {/* Subcategory Filter Dropdown */}
              <select
                value={subcategoryFilter}
                onChange={(e) => setSubcategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50 text-gray-700"
              >
                <option value="all">All Subcategories</option>
                {availableFilterSubcategories.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport("xlsx")}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          {/* 12-Column Detailed Table with Subcategory */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto shadow-sm">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-gray-700">
                BOQ Detailed Items & Breakdown {selectedProject ? `— ${selectedProject.name}` : ""}
              </span>
              <span className="ml-auto text-xs text-gray-400">{filteredItems.length} items</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-amber-500 text-white divide-x divide-amber-400/30">
                    <th className="px-3 py-3 text-center font-semibold w-8">#</th>
                    <th className="px-3 py-3 text-left font-semibold">PHASE / STAGE</th>
                    <th className="px-3 py-3 text-left font-semibold">SUBCATEGORY</th>
                    <th className="px-3 py-3 text-left font-semibold min-w-[180px]">ITEM & SPECIFICATION</th>
                    <th className="px-3 py-3 text-center font-semibold">UNIT</th>
                    <th className="px-3 py-3 text-right font-semibold">EST. QTY</th>
                    <th className="px-3 py-3 text-right font-semibold">UNIT RATE (৳)</th>
                    <th className="px-3 py-3 text-right font-semibold bg-amber-600/60">
                      EST. BUDGET (৳)<br />
                      <span className="text-[10px] font-normal text-amber-100">(Qty × Rate)</span>
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      MATERIAL (৳)<br />
                      <span className="text-[10px] font-normal text-amber-100">(কাঁচামাল)</span>
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      LABOUR (৳)<br />
                      <span className="text-[10px] font-normal text-amber-100">(মজুরি)</span>
                    </th>
                    <th className="px-3 py-3 text-right font-semibold bg-amber-600/60">
                      TOTAL COST (৳)<br />
                      <span className="text-[10px] font-normal text-amber-100">(Mat + Lab)</span>
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">VARIANCE & STATUS</th>
                    <th className="px-3 py-3 text-center font-semibold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={13} className="text-center py-16 text-gray-400 text-sm">
                        No BOQ items found. Click &quot;+ Add BOQ Item&quot; to start.
                      </td>
                    </tr>
                  )}
                  {filteredItems.map((item, i) => {
                    const estBudget = item.quantity * item.unitRate;
                    const actualCost = item.totalCost;
                    const diff = estBudget - actualCost;
                    const isSaved = diff > 0.01;
                    const isOver = diff < -0.01;
                    const diffPct = estBudget > 0 ? ((Math.abs(diff) / estBudget) * 100).toFixed(1) : "0";

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
                        <td className="px-3 py-2.5">
                          {item.subcategory ? (
                            <span className="bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap">
                              {item.subcategory}
                            </span>
                          ) : <span className="text-gray-400 italic">General</span>}
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
                              🟢 Saved ৳{formatCurrency(diff)} ({diffPct}%)
                            </span>
                          ) : isOver ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                              🔴 Over ৳{formatCurrency(Math.abs(diff))} ({diffPct}%)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                              🔵 Matched 100%
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEdit(item)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit Item"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {filteredItems.length > 0 && (
                  <tfoot>
                    <tr className="bg-amber-50 font-bold border-t border-amber-200 text-gray-800 divide-x divide-amber-200/50">
                      <td colSpan={5} className="px-3 py-3 text-right">TOTAL SUMMARY:</td>
                      <td className="px-3 py-3 text-right">{filteredItems.reduce((a, b) => a + b.quantity, 0).toLocaleString()}</td>
                      <td className="px-3 py-3 text-right">—</td>
                      <td className="px-3 py-3 text-right text-blue-900 font-extrabold text-sm">৳{formatCurrency(totalEstBudget)}</td>
                      <td className="px-3 py-3 text-right text-amber-900 font-bold">৳{formatCurrency(totalMaterial)}</td>
                      <td className="px-3 py-3 text-right text-teal-900 font-bold">৳{formatCurrency(totalLabour)}</td>
                      <td className="px-3 py-3 text-right text-gray-900 font-extrabold text-sm">৳{formatCurrency(totalActual)}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-bold",
                          totalVariance >= 0 ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
                        )}>
                          {totalVariance >= 0 ? `Saved ৳${formatCurrency(totalVariance)}` : `Over ৳${formatCurrency(Math.abs(totalVariance))}`}
                        </span>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal for Add / Edit with Dynamic Subcategory */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit BOQ Item" : "Add BOQ Item"}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              {/* Trade Intelligence Badge */}
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200/80 rounded-xl px-3.5 py-2">
                <span className="text-xs font-semibold text-gray-500">Trade Classification:</span>
                <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs", activeFormProfile.badgeColor)}>
                  {activeFormProfile.workTypeLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Phase Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Phase / Stage *
                  </label>
                  <select
                    required
                    value={form.phase}
                    onChange={(e) => handlePhaseChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white font-medium"
                  >
                    <option value="">Select Phase / Stage...</option>
                    {PROJECT_PHASES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Dependent Subcategory Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Subcategory {form.phase ? `(${availableFormSubcategories.length})` : ""}
                  </label>
                  <select
                    value={form.subcategory}
                    onChange={(e) => handleSubcategoryChange(e.target.value)}
                    disabled={!form.phase}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
                  >
                    <option value="">
                      {form.phase ? "-- Select Subcategory --" : "← Choose Phase first"}
                    </option>
                    {availableFormSubcategories.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Item Description & Specification *
                  </label>
                  <input
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={activeFormProfile.descPlaceholder}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Unit Field with 1-Click Quick Selector Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-700">
                      Unit (একক) *
                    </label>
                    <span className="text-[11px] text-gray-400">Quick select or type below:</span>
                  </div>
                  <input
                    required
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder={`e.g. ${activeFormProfile.defaultUnit}`}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[11px] text-gray-500 font-medium mr-0.5">Suggested:</span>
                    {activeFormProfile.suggestedUnits.map((u) => (
                      <button
                        type="button"
                        key={u}
                        onClick={() => setForm({ ...form, unit: u })}
                        className={cn(
                          "px-2.5 py-0.5 text-xs rounded-md font-medium transition-all border",
                          form.unit === u
                            ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                            : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-amber-100 hover:border-amber-300"
                        )}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Quantity (পরিমাণ)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Unit Rate (৳ একক দর)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.unitRate}
                    onChange={(e) => setForm({ ...form, unitRate: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {activeFormProfile.materialLabel}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.materialCost}
                    onChange={(e) => setForm({ ...form, materialCost: e.target.value })}
                    placeholder={activeFormProfile.materialPlaceholder}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {activeFormProfile.laborLabel}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.laborCost}
                    onChange={(e) => setForm({ ...form, laborCost: e.target.value })}
                    placeholder={activeFormProfile.laborPlaceholder}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Real-time Calculation Card */}
              {(form.quantity || form.unitRate || form.materialCost || form.laborCost) && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3.5 text-xs space-y-1.5 shadow-sm">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-600">
                      Estimated BOQ Budget ({form.phase || "Phase"} → {form.subcategory || "Item"}):
                    </span>
                    <span className="font-bold text-blue-900">৳{formatCurrency(formEstBudget)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-600">Material + Labour Breakdown:</span>
                    <span className="font-bold text-gray-800">৳{formatCurrency(formMat)} + ৳{formatCurrency(formLab)} = ৳{formatCurrency(formBreakdown)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-amber-200/60">
                    <span className="text-gray-800">Total Cost:</span>
                    <span className="text-amber-900 font-extrabold text-sm">৳{formatCurrency(formGrandTotal)}</span>
                  </div>
                  {formEstBudget > 0 && formBreakdown > 0 && (
                    <div className="flex justify-between items-center pt-1 text-[11px]">
                      <span className="text-gray-500">Budget vs Actual Status:</span>
                      <span className={cn(
                        "font-bold px-2 py-0.5 rounded-full",
                        formDiff >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {formDiff >= 0 ? `🟢 Saved ৳${formatCurrency(formDiff)}` : `🔴 Over by ৳${formatCurrency(Math.abs(formDiff))}`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-bold flex items-center gap-2 shadow"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editId ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
