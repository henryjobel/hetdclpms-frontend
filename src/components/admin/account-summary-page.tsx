"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { mastersApi } from "@/lib/api";
import { Building2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SummaryRow {
  [key: string]: unknown;
}

interface AccountSummaryPageProps {
  title: string;
  subtitle: string;
  type: "customers" | "suppliers";
}

export function AccountSummaryPage({ title, subtitle, type }: AccountSummaryPageProps) {
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const request = type === "customers" ? mastersApi.getCustomerAccounts() : mastersApi.getSupplierAccounts();
    request.then((response) => setRows(response.data.data || [])).finally(() => setLoading(false));
  }, [type]);

  const monetaryKeys = type === "customers"
    ? ["totalAmount", "paidAmount", "dueAmount"]
    : ["totalPO", "totalBills", "unpaidBills"];

  return (
    <MainLayout title={title} subtitle={subtitle}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Accounts" value={rows.length} icon={Building2} iconColor="text-blue-600" iconBg="bg-blue-50" />
        {monetaryKeys.map((key, index) => (
          <StatCard
            key={key}
            title={key.replace(/([A-Z])/g, " $1").trim()}
            value={formatCurrency(rows.reduce((sum, row) => sum + Number(row[key] || 0), 0))}
            icon={Building2}
            iconColor={index === 0 ? "text-purple-600" : index === 1 ? "text-green-600" : "text-amber-600"}
            iconBg={index === 0 ? "bg-purple-50" : index === 1 ? "bg-green-50" : "bg-amber-50"}
          />
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>{title} Summary</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={rows as Record<string, unknown>[]}
              columns={Object.keys(rows[0] || {}).map((key) => ({
                key,
                header: key.replace(/([A-Z])/g, " $1").trim(),
                render: (value: unknown) => (
                  typeof value === "number" && monetaryKeys.includes(key)
                    ? formatCurrency(value)
                    : String(value ?? "-")
                ),
                className: key === "projects" ? "whitespace-normal" : undefined,
              }))}
            />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
