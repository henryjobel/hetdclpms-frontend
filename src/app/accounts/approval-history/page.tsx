"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { accountsApi } from "@/lib/api";
import { Shield, Loader2, CheckCircle, Clock3 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ApprovalLog {
  id: string;
  module: string;
  entityType: string;
  entityId: string;
  action: string;
  status: string;
  remarks?: string;
  amount?: number;
  createdAt: string;
  actedBy?: { name: string; email: string; role: { name: string } };
}

export default function ApprovalHistoryPage() {
  const [rows, setRows] = useState<ApprovalLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountsApi.getApprovalLogs()
      .then((response) => setRows(response.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout title="Approval History" subtitle="Audit trail of voucher, purchase and billing approvals">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Log Entries" value={rows.length} icon={Shield} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Approved" value={rows.filter((row) => row.action === "APPROVE").length} icon={CheckCircle} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Modules" value={new Set(rows.map((row) => row.module)).size} icon={Shield} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="Amount Logged" value={formatCurrency(rows.reduce((sum, row) => sum + (row.amount || 0), 0))} icon={Clock3} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      <Card>
        <CardHeader><CardTitle>Approval Audit Trail</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={rows as unknown as Record<string, unknown>[]}
              columns={[
                { key: "module", header: "Module" },
                { key: "entityType", header: "Entity" },
                { key: "action", header: "Action", render: (v) => <Badge variant={v === "APPROVE" ? "success" : "info"}>{v as string}</Badge> },
                { key: "status", header: "Status", render: (v) => <Badge variant={v === "APPROVED" || v === "approved" ? "success" : "warning"}>{v as string}</Badge> },
                { key: "amount", header: "Amount", render: (v) => v ? formatCurrency(v as number) : "-" },
                { key: "actedBy", header: "By", render: (_v, row) => (row as unknown as ApprovalLog).actedBy?.name || "-" },
                { key: "createdAt", header: "Date", render: (v) => formatDate(v as string) },
                { key: "remarks", header: "Remarks", render: (v) => String(v || "-") },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
