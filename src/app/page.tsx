"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import { accountsApi, projectsApi, inventoryApi } from "@/lib/api";
import {
  Building2, TrendingUp, TrendingDown, DollarSign, AlertTriangle,
  ClipboardList, CreditCard, Banknote, Package, ShoppingCart,
  CheckCircle, Clock,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";

interface DashboardStats {
  totalProjects: number;
  runningProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalIncome: number;
  totalExpense: number;
  totalProfit: number;
  accountsPayable: number;
  accountsReceivable: number;
  totalDue: number;
  lowStockItems: number;
  pendingRequisitions: number;
  pendingRFQ: number;
  pendingPurchaseOrders: number;
}

interface Project {
  id: string;
  name: string;
  location: string;
  status: string;
  budget: number;
  manager: string;
  totalUnits: number;
  soldUnits: number;
}

interface Voucher {
  id: string;
  voucherNo: string;
  type: string;
  amount: number;
  voucherDate: string;
  project?: { name: string };
  status: string;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);

  useEffect(() => {
    accountsApi.getDashboardSummary().then((r) => setStats(r.data.data)).catch(() => {});
    projectsApi.getAll({ limit: "10" }).then((r) => setProjects(r.data.data || [])).catch(() => {});
    accountsApi.getVouchers({ limit: "5" } as Record<string, string>).then((r) => setVouchers((r.data.data || []).slice(0, 5))).catch(() => {});
    inventoryApi.getProducts({ lowStock: "true" }).then((r) => setLowStock(r.data.data || [])).catch(() => {});
  }, []);

  const activeProjects = projects.filter((p) => p.status === "ACTIVE");
  const planningCount = projects.filter((p) => p.status === "PLANNING").length;

  return (
    <MainLayout title="Dashboard" subtitle="Real Estate & Construction ERP Overview">
      {/* Stats Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Projects"
          value={stats?.totalProjects ?? "—"}
          subtitle={`${stats?.runningProjects ?? 0} Running · ${stats?.completedProjects ?? 0} Completed`}
          icon={Building2} iconColor="text-blue-600" iconBg="bg-blue-50"
        />
        <StatCard
          title="Total Budget"
          value={stats ? `৳${formatNumber(stats.totalBudget)}` : "—"}
          subtitle="Across all projects"
          icon={DollarSign} iconColor="text-purple-600" iconBg="bg-purple-50"
        />
        <StatCard
          title="Total Income"
          value={stats ? `৳${formatNumber(stats.totalIncome)}` : "—"}
          subtitle="All project income"
          icon={TrendingUp} iconColor="text-green-600" iconBg="bg-green-50"
        />
        <StatCard
          title="Total Expense"
          value={stats ? `৳${formatNumber(stats.totalExpense)}` : "—"}
          subtitle="All project expenses"
          icon={TrendingDown} iconColor="text-red-600" iconBg="bg-red-50"
        />
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Net Profit"
          value={stats ? `৳${formatNumber(stats.totalProfit)}` : "—"}
          subtitle="Income minus Expense"
          icon={TrendingUp} iconColor="text-emerald-600" iconBg="bg-emerald-50"
        />
        <StatCard
          title="Accounts Payable"
          value={stats ? `৳${formatNumber(stats.accountsPayable)}` : "—"}
          subtitle="To suppliers/contractors"
          icon={CreditCard} iconColor="text-orange-600" iconBg="bg-orange-50"
        />
        <StatCard
          title="Total Due"
          value={stats ? `৳${formatNumber(stats.totalDue)}` : "—"}
          subtitle="Overdue installments"
          icon={AlertTriangle} iconColor="text-amber-600" iconBg="bg-amber-50"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockItems ?? "—"}
          subtitle="Need reorder"
          icon={Package} iconColor="text-red-600" iconBg="bg-red-50"
        />
      </div>

      {/* Stats Row 3 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Pending Requisitions" value={stats?.pendingRequisitions ?? "—"} subtitle="Awaiting approval" icon={ClipboardList} iconColor="text-yellow-600" iconBg="bg-yellow-50" />
        <StatCard title="Pending RFQ" value={stats?.pendingRFQ ?? "—"} subtitle="Awaiting quotation" icon={ClipboardList} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Pending Orders" value={stats?.pendingPurchaseOrders ?? "—"} subtitle="Purchase orders" icon={ShoppingCart} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard
          title="Banknote Receivable"
          value={stats ? `৳${formatNumber(stats.accountsReceivable)}` : "—"}
          subtitle="From clients"
          icon={Banknote} iconColor="text-cyan-600" iconBg="bg-cyan-50"
        />
      </div>

      {/* Projects & Vouchers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Projects</CardTitle>
              <a href="/projects" className="text-xs text-amber-600 hover:underline font-medium">View All</a>
            </CardHeader>
            <div className="divide-y divide-gray-50">
              {activeProjects.length === 0 && (
                <p className="px-6 py-8 text-sm text-gray-400 text-center">No active projects</p>
              )}
              {activeProjects.slice(0, 5).map((p) => (
                <div key={p.id} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.location} · {p.manager}</p>
                    </div>
                    <Badge variant="success">{PROJECT_STATUS_LABELS[p.status.toLowerCase()] ?? p.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Budget: {formatCurrency(p.budget)}</span>
                    <span>Units: {p.soldUnits}/{p.totalUnits}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Vouchers</CardTitle>
            <a href="/accounts/vouchers" className="text-xs text-amber-600 hover:underline font-medium">View All</a>
          </CardHeader>
          <div className="divide-y divide-gray-50">
            {vouchers.length === 0 && (
              <p className="px-4 py-8 text-sm text-gray-400 text-center">No vouchers yet</p>
            )}
            {vouchers.map((v) => (
              <div key={v.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{v.voucherNo}</span>
                  <Badge variant={v.status === "approved" ? "success" : "warning"}>{v.status}</Badge>
                </div>
                <p className="text-xs text-gray-500">{v.type}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatCurrency(v.amount)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{v.project?.name ?? "General"}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Low Stock & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <CardTitle>Low Stock Alert</CardTitle>
            </div>
            <a href="/inventory" className="text-xs text-amber-600 hover:underline font-medium">View Inventory</a>
          </CardHeader>
          <CardContent className="p-0">
            {lowStock.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">All stock levels OK</p>
            ) : (
              <DataTable
                data={lowStock as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "name", header: "Item" },
                  { key: "stock", header: "Stock", render: (val, row) => (
                    <span className="text-red-600 font-medium">{val as number} {row.unit as string}</span>
                  )},
                  { key: "minStock", header: "Min Level", render: (val, row) => `${val} ${row.unit as string}` },
                  { key: "id", header: "Status", render: () => <Badge variant="danger">Low Stock</Badge> },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Completed Projects</p>
                    <p className="text-xs text-gray-400">Fully handed over</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats?.completedProjects ?? "—"}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Running Projects</p>
                    <p className="text-xs text-gray-400">Currently active</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats?.runningProjects ?? "—"}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Planning Stage</p>
                    <p className="text-xs text-gray-400">Not yet started</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-900">{planningCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Profit Margin</p>
                    <p className="text-xs text-gray-400">Overall company</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-emerald-700">
                  {stats && stats.totalIncome > 0
                    ? `${((stats.totalProfit / stats.totalIncome) * 100).toFixed(1)}%`
                    : "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
