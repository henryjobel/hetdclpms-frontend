"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { accountsApi } from "@/lib/api";
import { CheckCircle, Clock3, Loader2, Shield } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PendingApprovalRow {
  id: string;
  module: string;
  type: string;
  reference: string;
  project: string;
  party: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function PendingApprovalsPage() {
  const [rows, setRows] = useState<PendingApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountsApi.getPendingApprovals()
      .then((response) => setRows(response.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout title="Pending Approvals" subtitle="Central inbox for vouchers, purchase approvals and billing approvals">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Pending" value={rows.length} icon={Clock3} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Voucher Queue" value={rows.filter((row) => row.module === "VOUCHER").length} icon={Shield} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Purchase Queue" value={rows.filter((row) => row.module === "PURCHASE").length} icon={CheckCircle} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Billing Queue" value={rows.filter((row) => row.module === "BILLING").length} icon={Shield} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader><CardTitle>Approval Queue</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={rows as unknown as Record<string, unknown>[]}
              columns={[
                { key: "module", header: "Module" },
                { key: "type", header: "Type" },
                { key: "reference", header: "Reference" },
                { key: "project", header: "Project" },
                { key: "party", header: "Requested By / Party" },
                { key: "amount", header: "Amount", render: (v) => v ? formatCurrency(v as number) : "-" },
                { key: "status", header: "Status", render: (v) => <Badge variant="warning">{String(v)}</Badge> },
                { key: "createdAt", header: "Created", render: (v) => formatDate(v as string) },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
