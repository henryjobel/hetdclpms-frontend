"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { contractorsApi } from "@/lib/api";
import { HardHat, DollarSign, Plus, Search, Loader2, X } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface ContractorAssignment {
  contractValue: number;
  paid: number;
  project: { name: string };
}

interface Contractor {
  id: string;
  name: string;
  specialty: string;
  phone?: string;
  isActive: boolean;
  assignments: ContractorAssignment[];
}

const defaultForm = { name: "", specialty: "", phone: "", email: "", address: "" };

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchAll() {
    try {
      const res = await contractorsApi.getAll();
      setContractors(res.data.data || []);
    } catch {
      setContractors([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = contractors.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const tableData = filtered.map((c) => {
    const activeAssign = c.assignments[0];
    const totalContract = c.assignments.reduce((a, x) => a + x.contractValue, 0);
    const totalPaid = c.assignments.reduce((a, x) => a + x.paid, 0);
    return {
      id: c.id,
      name: c.name,
      specialty: c.specialty,
      phone: c.phone ?? "—",
      project: activeAssign?.project?.name ?? "—",
      contractValue: totalContract,
      paid: totalPaid,
      due: totalContract - totalPaid,
      status: c.isActive ? "active" : "inactive",
    };
  });

  const totalContract = tableData.reduce((a, c) => a + c.contractValue, 0);
  const totalDue = tableData.reduce((a, c) => a + c.due, 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await contractorsApi.create(form);
      setShowModal(false);
      setForm(defaultForm);
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to add contractor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout title="Contractors" subtitle="Manage contractor profiles, contracts, and payments">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Contractors" value={contractors.length} icon={HardHat} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Active" value={contractors.filter((c) => c.isActive).length} icon={HardHat} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Total Contract Value" value={`৳${formatNumber(totalContract)}`} icon={DollarSign} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="Total Due" value={`৳${formatNumber(totalDue)}`} icon={DollarSign} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contractor List</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Contractor
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={tableData as unknown as Record<string, unknown>[]}
              columns={[
                { key: "name", header: "Contractor Name" },
                { key: "specialty", header: "Specialty" },
                { key: "phone", header: "Phone" },
                { key: "project", header: "Project" },
                { key: "contractValue", header: "Contract Value", render: (v) => formatCurrency(v as number) },
                { key: "paid", header: "Paid", render: (v) => <span className="text-green-700">{formatCurrency(v as number)}</span> },
                { key: "due", header: "Due", render: (v) => <span className="text-red-600 font-medium">{formatCurrency(v as number)}</span> },
                { key: "status", header: "Status", render: (v) => <Badge variant={v === "active" ? "success" : "gray"}>{v as string}</Badge> },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Add Contractor</h3>
              <button onClick={() => { setShowModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              {[
                { label: "Company / Name *", key: "name", type: "text", required: true },
                { label: "Specialty *", key: "specialty", type: "text", required: true },
                { label: "Phone", key: "phone", type: "tel", required: false },
                { label: "Email", key: "email", type: "email", required: false },
                { label: "Address", key: "address", type: "text", required: false },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type} required={required}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add Contractor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
