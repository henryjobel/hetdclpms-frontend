"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { adminApi } from "@/lib/api";
import { Activity, Loader2, Shield, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ActivityRow {
  id: string;
  source: string;
  module: string;
  action: string;
  message: string;
  userName?: string;
  userEmail?: string;
  createdAt: string;
}

export function ActivityLogPage() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getActivity().then((response) => {
      setRows(response.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout title="User Activity" subtitle="Track authentication, configuration changes and approval actions">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Events" value={rows.length} icon={Activity} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="System Logs" value={rows.filter((row) => row.source === "SYSTEM").length} icon={Shield} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="Approval Logs" value={rows.filter((row) => row.source === "APPROVAL").length} icon={Shield} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Users Touched" value={new Set(rows.map((row) => row.userEmail).filter(Boolean)).size} icon={UserCheck} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={rows as unknown as Record<string, unknown>[]}
              columns={[
                { key: "createdAt", header: "Date", render: (value) => formatDate(String(value)) },
                { key: "source", header: "Source" },
                { key: "module", header: "Module" },
                { key: "action", header: "Action" },
                { key: "message", header: "Message", className: "whitespace-normal" },
                { key: "userName", header: "User", render: (_value, row) => (row as unknown as ActivityRow).userName || (row as unknown as ActivityRow).userEmail || "-" },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
