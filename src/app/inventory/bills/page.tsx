"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { billsApi, inventoryApi } from "@/lib/api";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { Receipt, Plus, Search, Loader2, X, Check } from "lucide-react";

interface Bill {
  id: string;
  billNumber: string;
  type: string;
  amount: number;
  status: string;
  billDate: string;
  dueDate?: string;
  supplier?: { name: string };
}
interface Supplier { id: string; name: string }

const defaultForm = { supplierId: "", amount: "", dueDate: "", type: "purchase" };

export default function InventoryBillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchAll() {
    try {
      const [br, sr] = await Promise.all([billsApi.getAll(), inventoryApi.getSuppliers()]);
      const allBills: Bill[] = br.data.data || [];
      setBills(allBills.filter((b) => b.supplier));
      setSuppliers(sr.data.data || []);
    } catch {
      setBills([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = bills.filter(
    (b) => (b.supplier?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      b.billNumber.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.supplierId) { setError("Select a supplier"); return; }
    setSaving(true);
    setError("");
    try {
      await billsApi.create({
        type: form.type,
        supplierId: form.supplierId,
        amount: parseFloat(form.amount) || 0,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      });
      setShowModal(false);
      setForm(defaultForm);
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create bill");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      await billsApi.updateStatus(id, "paid");
      fetchAll();
    } catch { /* silent */ }
  }

  const unpaid = filtered.filter((b) => b.status === "unpaid");
  const totalAmount = filtered.reduce((a, b) => a + b.amount, 0);
  const unpaidAmount = unpaid.reduce((a, b) => a + b.amount, 0);

  const tableData = filtered.map((b) => ({
    id: b.id,
    billNumber: b.billNumber,
    supplier: b.supplier?.name ?? "—",
    type: b.type,
    amount: b.amount,
    date: b.billDate,
    dueDate: b.dueDate,
    status: b.status,
  }));

  return (
    <MainLayout title="Purchase Bills" subtitle="Manage supplier bills and payables">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Bills" value={bills.length} icon={Receipt} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Unpaid" value={unpaid.length} icon={Receipt} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatCard title="Total Amount" value={`৳${formatNumber(totalAmount)}`} icon={Receipt} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Outstanding" value={`৳${formatNumber(unpaidAmount)}`} icon={Receipt} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bill List</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> New Bill
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
                { key: "billNumber", header: "Bill No" },
                { key: "supplier", header: "Supplier" },
                { key: "type", header: "Type", render: (v) => <span className="text-xs text-gray-500 capitalize">{v as string}</span> },
                { key: "amount", header: "Amount", render: (v) => formatCurrency(v as number) },
                { key: "date", header: "Bill Date", render: (v) => formatDate(v as string) },
                { key: "dueDate", header: "Due Date", render: (v) => v ? formatDate(v as string) : "—" },
                { key: "status", header: "Status", render: (v) => <Badge variant={v === "paid" ? "success" : "warning"}>{v as string}</Badge> },
                {
                  key: "id", header: "Action",
                  render: (id, row) => row.status === "unpaid" ? (
                    <button onClick={() => handleMarkPaid(id as string)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-lg">
                      <Check className="w-3 h-3" /> Mark Paid
                    </button>
                  ) : null,
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">New Bill</h3>
              <button onClick={() => { setShowModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Supplier *</label>
                <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select Supplier —</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bill Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="purchase">Purchase</option>
                  <option value="material">Material</option>
                  <option value="service">Service</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount (৳) *</label>
                  <input type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
