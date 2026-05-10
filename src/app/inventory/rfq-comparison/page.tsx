"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { inventoryApi, projectsApi } from "@/lib/api";
import { CheckCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Project { id: string; name: string }
interface RFQRow {
  id: string;
  status: string;
  quotedAmount?: number;
  deliveryDays?: number;
  paymentTerms?: string;
  comparisonNotes?: string;
  isSelected: boolean;
  supplier: { name: string };
  project?: { name: string };
}

export default function RFQComparisonPage() {
  const [rows, setRows] = useState<RFQRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchAll(selectedProjectId?: string) {
    try {
      const [rfqRes, projectRes] = await Promise.all([
        inventoryApi.getRFQComparison(selectedProjectId ? { projectId: selectedProjectId } : undefined),
        projectsApi.getAll(),
      ]);
      setRows(rfqRes.data.data.rows || []);
      setProjects(projectRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleSelect(id: string) {
    await inventoryApi.selectRFQ(id);
    fetchAll(projectId || undefined);
  }

  const filtered = rows.filter((row) => !projectId || row.project?.name === projects.find((p) => p.id === projectId)?.name);

  return (
    <MainLayout title="RFQ Comparison" subtitle="Compare supplier quotations by amount, delivery and terms before final selection">
      <div className="mb-6">
        <select value={projectId} onChange={(e) => { setProjectId(e.target.value); fetchAll(e.target.value || undefined); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
          <option value="">All Projects</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
      </div>

      <Card>
        <CardHeader><CardTitle>Supplier Comparison Matrix</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={filtered as unknown as Record<string, unknown>[]}
              columns={[
                { key: "project", header: "Project", render: (_v, row) => (row as unknown as RFQRow).project?.name || "General" },
                { key: "supplier", header: "Supplier", render: (_v, row) => (row as unknown as RFQRow).supplier.name },
                { key: "quotedAmount", header: "Quoted Amount", render: (v) => v ? formatCurrency(v as number) : "-" },
                { key: "deliveryDays", header: "Delivery Days", render: (v) => v ? `${v} days` : "-" },
                { key: "paymentTerms", header: "Payment Terms", render: (v) => String(v || "-") },
                { key: "status", header: "Status", render: (v, row) => (
                  <Badge variant={(row as unknown as RFQRow).isSelected ? "success" : v === "APPROVED" ? "info" : "warning"}>
                    {(row as unknown as RFQRow).isSelected ? "selected" : String(v).toLowerCase()}
                  </Badge>
                ) },
                { key: "comparisonNotes", header: "Notes", render: (v) => String(v || "-") },
                { key: "id", header: "Action", render: (v, row) => (
                  (row as unknown as RFQRow).isSelected ? (
                    <span className="text-green-700 text-sm font-medium">Selected</span>
                  ) : (
                    <button onClick={() => handleSelect(v as string)} className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                  )
                ) },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
