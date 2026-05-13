"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { projectsApi } from "@/lib/api";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Calendar, Users, Eye, Search } from "lucide-react";

interface Project {
  id: string;
  name: string;
  location: string;
  type: string;
  status: string;
  budget: number;
  startDate: string;
  endDate: string;
  manager: string;
  totalUnits: number;
  soldUnits: number;
  description?: string;
}

type TrafficStatus = "ON TRACK" | "AT RISK" | "IN TROUBLE";

function getTrafficStatus(project: Project): TrafficStatus {
  if (project.status === "CANCELLED") return "IN TROUBLE";
  if (project.status === "ON_HOLD") return "AT RISK";
  if (project.status === "PLANNING") return "AT RISK";
  return "ON TRACK";
}

function getDurationMonths(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
}

const STATUS_STYLE: Record<TrafficStatus, { bg: string; text: string }> = {
  "ON TRACK": { bg: "bg-green-500", text: "text-white" },
  "AT RISK": { bg: "bg-yellow-400", text: "text-white" },
  "IN TROUBLE": { bg: "bg-red-500", text: "text-white" },
};

const STATUS_BORDER: Record<TrafficStatus, string> = {
  "ON TRACK": "border-l-green-500",
  "AT RISK": "border-l-yellow-400",
  "IN TROUBLE": "border-l-red-500",
};

const DONUT_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

const PENDING_VOUCHERS = [
  {
    id: 1, type: "ServiceRequisition", ref: "100800", purRef: "PUR-756",
    project: "", contact: "", addedBy: "Admin", date: "12-May-2026",
  },
  {
    id: 2, type: "ServiceRequisition", ref: "404000", purRef: "PUR-599",
    project: "", contact: "", addedBy: "Admin", date: "12-May-2026",
  },
];

export default function ProjectModulePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [voucherSearch, setVoucherSearch] = useState("");

  useEffect(() => {
    projectsApi.getAll()
      .then((res) => setProjects(res.data.data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const totalProject = projects.length;
  const runningProject = projects.filter((p) => p.status === "ACTIVE").length;
  const unsoldFlat = projects.reduce((a, p) => a + Math.max(0, (p.totalUnits || 0) - (p.soldUnits || 0)), 0);

  const onTrackCount = projects.filter((p) => getTrafficStatus(p) === "ON TRACK").length;
  const atRiskCount = projects.filter((p) => getTrafficStatus(p) === "AT RISK").length;
  const inTroubleCount = projects.filter((p) => getTrafficStatus(p) === "IN TROUBLE").length;

  const donutData = [
    { name: "On Track", value: onTrackCount || 1 },
    { name: "At Risk", value: atRiskCount || 0 },
    { name: "In Trouble", value: inTroubleCount || 0 },
  ];

  const barData = projects.slice(0, 8).map((p) => ({
    name: p.name.length > 12 ? p.name.slice(0, 10) + "…" : p.name,
    running: Math.round(Math.random() * 30),
    financial: Math.round(Math.random() * 95),
  }));

  const STAT_CARDS = [
    { label: "Total Project", value: totalProject, bg: "bg-gradient-to-br from-yellow-600 to-yellow-800" },
    { label: "Running Project", value: runningProject, bg: "bg-gradient-to-br from-teal-500 to-teal-700" },
    { label: "Material Req.", value: 0, bg: "bg-gradient-to-br from-green-700 to-green-900" },
    { label: "Service Req.", value: 0, bg: "bg-gradient-to-br from-purple-500 to-purple-700" },
    { label: "Task", value: 0, bg: "bg-gradient-to-br from-orange-400 to-orange-600" },
    { label: "Unsold Flat", value: unsoldFlat, bg: "bg-gradient-to-br from-blue-700 to-blue-900" },
  ];

  return (
    <div className="p-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl text-white p-4 text-center`}>
            <p className="text-xs opacity-80 font-medium">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex gap-4">
        {/* Project List */}
        <div className="w-[42%] flex-shrink-0 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
          {loading && (
            <div className="text-center py-10 text-gray-400 text-sm">Loading projects...</div>
          )}
          {!loading && projects.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">No projects found</div>
          )}
          {projects.map((project) => {
            const status = getTrafficStatus(project);
            const style = STATUS_STYLE[status];
            const borderColor = STATUS_BORDER[status];
            const months = getDurationMonths(project.startDate, project.endDate);
            const budgetPct = 0;

            return (
              <div
                key={project.id}
                className={`bg-white rounded-xl border border-gray-100 border-l-4 ${borderColor} shadow-sm hover:shadow-md transition-shadow flex`}
              >
                {/* Status label - vertical */}
                <div className={`${style.bg} rounded-l-lg flex items-center justify-center px-2`} style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
                  <span className="text-white text-[10px] font-bold tracking-widest transform rotate-180 whitespace-nowrap">
                    {status}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      href={`/project-module/details-summary/${project.id}`}
                      className="text-sm font-semibold text-violet-700 hover:underline"
                    >
                      {project.name}
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-500 mb-2">
                    <div>
                      <p className="text-gray-400 text-[11px]">% Complete</p>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                        <div className="h-1.5 bg-gray-400 rounded-full" style={{ width: `${budgetPct}%` }} />
                      </div>
                      <p className="text-[11px] font-medium mt-0.5">0.00%</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[11px]">Project Budget</p>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                        <div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${budgetPct}%` }} />
                      </div>
                      <p className="text-[11px] font-medium mt-0.5">0%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Calendar className="w-3 h-3 text-white" />
                        </span>
                        {months} Month{months !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Users className="w-3 h-3 text-white" />
                        </span>
                        1 Member
                      </span>
                    </div>
                    <div className="text-right text-[11px]">
                      <span className="text-gray-500">Total Tasks </span>
                      <span className="text-violet-600 font-semibold">0</span>
                      <br />
                      <span className="text-gray-500">Completed </span>
                      <span className="bg-green-500 text-white text-[10px] rounded px-1">0</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Middle: Charts */}
        <div className="flex-1 space-y-4">
          {/* Status Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">PROJECT STATUS SUMMARY</h3>
            <p className="text-xs text-gray-400 mb-3">Current Overview</p>
            <div className="flex items-center justify-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-700">{totalProject} Total</p>
                {[
                  { label: "On Track", count: onTrackCount, pct: totalProject ? Math.round(onTrackCount * 100 / totalProject) : 0, color: "bg-green-500" },
                  { label: "At Risk", count: atRiskCount, pct: totalProject ? Math.round(atRiskCount * 100 / totalProject) : 0, color: "bg-yellow-400" },
                  { label: "In Trouble", count: inTroubleCount, pct: totalProject ? Math.round(inTroubleCount * 100 / totalProject) : 0, color: "bg-red-500" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-xs">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color}`} />
                    <span className="text-gray-600">{s.label}</span>
                    <span className="ml-auto font-semibold text-gray-700">{s.count} / {s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Working & Financial Progress */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Working & Financial Progress</h3>
            <div className="flex gap-3 text-xs text-gray-500 mb-2">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Running Progress (%)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Financial Progress (%)</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="running" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                <Bar dataKey="financial" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Pending Voucher/Invoice */}
        <div className="w-[22%] flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-full">
            <div className="px-3 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Pending Voucher/Invoice</h3>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={voucherSearch}
                  onChange={(e) => setVoucherSearch(e.target.value)}
                  placeholder="Search with Project/Code/Reference..."
                  className="pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              </div>
            </div>
            <div className="p-2 space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto">
              {PENDING_VOUCHERS.map((v) => (
                <div key={v.id} className="border border-gray-100 rounded-lg p-2.5 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="bg-orange-400 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      {v.type}
                    </span>
                    <span className="font-semibold text-gray-700">{v.ref}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 space-y-0.5">
                    <p>Project: <span className="font-medium text-gray-700">—</span></p>
                    <p>Contact: —</p>
                    <p>Added By: <span className="font-semibold text-gray-800">{v.addedBy}</span></p>
                    <p>{v.date}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="w-12 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                      <span className="text-[9px] text-gray-400">Doc</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                      <button className="text-[10px] text-red-500 font-medium">✕ Riva</button>
                    </div>
                  </div>
                </div>
              ))}
              {PENDING_VOUCHERS.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-xs">No pending vouchers</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
