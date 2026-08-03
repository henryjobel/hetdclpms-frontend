"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { accountsApi, projectsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Banknote, BarChart3, ClipboardList, Loader2, TrendingDown, TrendingUp, Wallet } from "lucide-react";

type ReportMode = "accounting" | "income" | "expense" | "cost";

interface Project {
  id: string;
  name: string;
  type?: string;
  status: string;
  budget: number;
}

interface ProjectPL {
  projectId: string;
  projectName: string;
  income: number;
  materialExpense: number;
  laborCost: number;
  contractorCost: number;
  totalExpense: number;
  profit: number;
  margin: number;
}

interface LedgerEntry {
  id: string;
  debit: number;
  credit: number;
  description?: string;
  entryDate: string;
  account: { code: string; name: string; type: string };
  project?: { name: string };
  voucher?: { voucherNo: string; type: string };
}

interface ProjectFinanceReportPageProps {
  mode: ReportMode;
}

const copy: Record<ReportMode, { title: string; subtitle: string }> = {
  accounting: {
    title: "Project-Wise Accounting",
    subtitle: "Project ledger, debit-credit movement and accounting balance",
  },
  income: {
    title: "Project-Wise Income",
    subtitle: "Income collected from installments and project-linked receipts",
  },
  expense: {
    title: "Project Expense Tracking",
    subtitle: "Material, labor and contractor cost breakdown by project",
  },
  cost: {
    title: "Project Cost Report",
    subtitle: "Budget, actual cost, variance and profitability by project",
  },
};

function safePercent(value: number) {
  return Number.isFinite(value) ? `${value.toFixed(1)}%` : "0.0%";
}

export function ProjectFinanceReportPage({ mode }: ProjectFinanceReportPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectPLs, setProjectPLs] = useState<ProjectPL[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [projectId, setProjectId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const loadProjectSummaries = useCallback(async () => {
    setLoading(true);
    try {
      const projectRes = await projectsApi.getAll();
      const projectRows: Project[] = projectRes.data.data || [];
      setProjects(projectRows);

      const plResults = await Promise.allSettled(
        projectRows.map((project) =>
          accountsApi.getProfitLoss({ projectId: project.id })
        )
      );

      setProjectPLs(
        plResults
          .map((result) => result.status === "fulfilled" ? result.value.data.data : null)
          .filter(Boolean) as ProjectPL[]
      );
    } catch {
      setProjects([]);
      setProjectPLs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLedger = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const params: Record<string, string> = {};
      if (projectId) params.projectId = projectId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const ledgerRes = await accountsApi.getLedger(params);
      setLedgerEntries(ledgerRes.data.data || []);
    } catch {
      setLedgerEntries([]);
    } finally {
      setLedgerLoading(false);
    }
  }, [endDate, projectId, startDate]);

  useEffect(() => {
    loadProjectSummaries();
  }, [loadProjectSummaries]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const rows = useMemo(() => {
    return projects.map((project) => {
      const pl = projectPLs.find((item) => item.projectId === project.id);
      const income = pl?.income ?? 0;
      const totalExpense = pl?.totalExpense ?? 0;
      return {
        id: project.id,
        project: project.name,
        status: project.status,
        budget: project.budget,
        income,
        materialExpense: pl?.materialExpense ?? 0,
        laborCost: pl?.laborCost ?? 0,
        contractorCost: pl?.contractorCost ?? 0,
        totalExpense,
        profit: income - totalExpense,
        variance: project.budget - totalExpense,
        margin: pl?.margin ?? 0,
      };
    });
  }, [projects, projectPLs]);

  const totalBudget = rows.reduce((sum, row) => sum + row.budget, 0);
  const totalIncome = rows.reduce((sum, row) => sum + row.income, 0);
  const totalExpense = rows.reduce((sum, row) => sum + row.totalExpense, 0);
  const totalProfit = totalIncome - totalExpense;
  const ledgerDebit = ledgerEntries.reduce((sum, row) => sum + row.debit, 0);
  const ledgerCredit = ledgerEntries.reduce((sum, row) => sum + row.credit, 0);

  const columns = mode === "income"
    ? [
        { key: "project", header: "Project" },
        { key: "status", header: "Status" },
        { key: "income", header: "Collected Income", render: (value: unknown) => formatCurrency(Number(value)) },
        { key: "budget", header: "Budget", render: (value: unknown) => formatCurrency(Number(value)) },
        { key: "margin", header: "Margin", render: (value: unknown) => safePercent(Number(value)) },
      ]
    : mode === "expense"
      ? [
          { key: "project", header: "Project" },
          { key: "materialExpense", header: "Material", render: (value: unknown) => formatCurrency(Number(value)) },
          { key: "laborCost", header: "Labor", render: (value: unknown) => formatCurrency(Number(value)) },
          { key: "contractorCost", header: "Contractor", render: (value: unknown) => formatCurrency(Number(value)) },
          { key: "totalExpense", header: "Total Expense", render: (value: unknown) => formatCurrency(Number(value)) },
        ]
      : [
          { key: "project", header: "Project" },
          { key: "budget", header: "Budget", render: (value: unknown) => formatCurrency(Number(value)) },
          { key: "income", header: "Income", render: (value: unknown) => formatCurrency(Number(value)) },
          { key: "totalExpense", header: "Cost", render: (value: unknown) => formatCurrency(Number(value)) },
          { key: "variance", header: "Budget Variance", render: (value: unknown) => formatCurrency(Number(value)) },
          { key: "profit", header: "Profit/Loss", render: (value: unknown) => (
            <span className={Number(value) >= 0 ? "text-green-700 font-semibold" : "text-red-600 font-semibold"}>
              {formatCurrency(Number(value))}
            </span>
          ) },
        ];

  return (
    <MainLayout title={copy[mode].title} subtitle={copy[mode].subtitle}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Projects" value={projects.length} icon={BarChart3} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Total Budget" value={formatCurrency(totalBudget)} icon={Wallet} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="Total Income" value={formatCurrency(totalIncome)} icon={TrendingUp} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title={mode === "income" ? "Total Profit" : "Total Expense"} value={formatCurrency(mode === "income" ? totalProfit : totalExpense)} icon={mode === "income" ? Banknote : TrendingDown} iconColor={mode === "income" ? "text-emerald-600" : "text-red-600"} iconBg={mode === "income" ? "bg-emerald-50" : "bg-red-50"} />
      </div>

      {mode === "accounting" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-600" /> Ledger Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Project</label>
                <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">All Projects</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <button onClick={loadLedger} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
                Apply
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium">Debit</p>
                <p className="text-lg font-bold text-blue-700">{formatCurrency(ledgerDebit)}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <p className="text-xs text-amber-600 font-medium">Credit</p>
                <p className="text-lg font-bold text-amber-700">{formatCurrency(ledgerCredit)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-600 font-medium">Balance</p>
                <p className="text-lg font-bold text-gray-800">{formatCurrency(ledgerDebit - ledgerCredit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader><CardTitle>{mode === "accounting" ? "Project Finance Summary" : copy[mode].title}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable data={rows as unknown as Record<string, unknown>[]} columns={columns} />
          )}
        </CardContent>
      </Card>

      {mode === "accounting" && (
        <Card>
          <CardHeader><CardTitle>Ledger Entries</CardTitle></CardHeader>
          <CardContent className="p-0">
            {ledgerLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
            ) : (
              <DataTable
                data={ledgerEntries as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "entryDate", header: "Date", render: (value: unknown) => formatDate(String(value)) },
                  { key: "voucher", header: "Voucher", render: (_value: unknown, row: Record<string, unknown>) => (row.voucher as { voucherNo?: string })?.voucherNo ?? "-" },
                  { key: "account", header: "Account", render: (_value: unknown, row: Record<string, unknown>) => {
                    const account = row.account as { code?: string; name?: string };
                    return `${account?.code ?? ""} ${account?.name ?? ""}`.trim();
                  } },
                  { key: "project", header: "Project", render: (_value: unknown, row: Record<string, unknown>) => (row.project as { name?: string })?.name ?? "General" },
                  { key: "description", header: "Description", render: (value: unknown) => String(value ?? "-") },
                  { key: "debit", header: "Debit", render: (value: unknown) => formatCurrency(Number(value || 0)) },
                  { key: "credit", header: "Credit", render: (value: unknown) => formatCurrency(Number(value || 0)) },
                ]}
              />
            )}
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
}
