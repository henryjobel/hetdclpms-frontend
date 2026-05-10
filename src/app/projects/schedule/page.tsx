"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { projectsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { CalendarDays, Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  location: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  manager: string;
  totalUnits: number;
  soldUnits: number;
}

const statusVariant: Record<string, "default" | "info" | "success" | "warning" | "danger" | "gray"> = {
  PLANNING: "default",
  ACTIVE: "info",
  ON_HOLD: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
};

function getDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const days = Math.round(ms / 86400000);
  if (days >= 365) return `${Math.round(days / 365)}y ${Math.round((days % 365) / 30)}m`;
  if (days >= 30) return `${Math.round(days / 30)} months`;
  return `${days} days`;
}

function getTimelineProgress(start: string, end: string) {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

export default function SchedulePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.getAll().then((r) => {
      setProjects(r.data.data || []);
    }).catch(() => setProjects([])).finally(() => setLoading(false));
  }, []);

  const active = projects.filter((p) => p.status === "ACTIVE");
  const planning = projects.filter((p) => p.status === "PLANNING");
  const completed = projects.filter((p) => p.status === "COMPLETED");

  return (
    <MainLayout title="Project Schedule" subtitle="Timeline and schedule of all projects">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Projects" value={projects.length} icon={CalendarDays} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Active" value={active.length} icon={CalendarDays} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Planning" value={planning.length} icon={CalendarDays} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Completed" value={completed.length} icon={CalendarDays} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader><CardTitle>Project Timeline</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No projects found</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {projects.map((p) => {
                const progress = getTimelineProgress(p.startDate, p.endDate);
                return (
                  <div key={p.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{p.name}</p>
                          <Badge variant={statusVariant[p.status] ?? "default"}>{p.status.replace(/_/g, " ")}</Badge>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{p.type}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{p.location} · Manager: {p.manager}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500">
                          {formatDate(p.startDate)} → {formatDate(p.endDate)}
                        </p>
                        <p className="text-xs text-gray-400">Duration: {getDuration(p.startDate, p.endDate)}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Timeline progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            p.status === "COMPLETED" ? "bg-green-500" :
                            p.status === "CANCELLED" ? "bg-red-400" :
                            p.status === "ON_HOLD" ? "bg-yellow-400" : "bg-amber-500"
                          }`}
                          style={{ width: `${p.status === "COMPLETED" ? 100 : progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-gray-500">
                      <span>Units: {p.soldUnits}/{p.totalUnits} sold</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
