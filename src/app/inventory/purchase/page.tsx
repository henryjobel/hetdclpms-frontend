"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { inventoryApi, billsApi } from "@/lib/api";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { ShoppingCart, Plus, Loader2, X } from "lucide-react";

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
interface Product { id: string; name: string; unit: string; purchasePrice: number }
interface Supplier { id: string; name: string }

const defaultForm = {
  supplierId: "", productId: "", quantity: "1", unitRate: "", dueDate: "",
};

export default function PurchasePage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchAll() {
    try {
      const [br, pr, sr] = await Promise.all([
        billsApi.getAll({ type: "purchase" }),
        inventoryApi.getProducts(),
        inventoryApi.getSuppliers(),
      ]);
      setBills((br.data.data || []).filter((b: Bill) => b.supplier));
      setProducts(pr.data.data || []);
      setSuppliers(sr.data.data || []);
    } catch {
      setBills([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.supplierId || !form.productId) { setError("Select supplier and product"); return; }
    setSaving(true);
    setError("");
    try {
      const product = products.find((p) => p.id === form.productId);
      const qty = parseFloat(form.quantity) || 1;
      const rate = parseFloat(form.unitRate) || (product?.purchasePrice ?? 0);
      const total = qty * rate;

      await Promise.all([
        billsApi.create({
          type: "purchase",
          supplierId: form.supplierId,
          amount: total,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        }),
        inventoryApi.adjustStock(form.productId, {
          type: "add",
          quantity: qty,
          reason: `Direct purchase from supplier`,
          adjustedBy: "System",
        }),
      ]);

      setShowModal(false);
      setForm(defaultForm);
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to record purchase");
    } finally {
      setSaving(false);
    }
  }

  const totalAmount = bills.reduce((a, b) => a + b.amount, 0);
  const unpaid = bills.filter((b) => b.status === "unpaid");

  const tableData = bills.map((b) => ({
    billNumber: b.billNumber,
    supplier: b.supplier?.name ?? "—",
    amount: b.amount,
    dueDate: b.dueDate,
    date: b.billDate,
    status: b.status,
  }));

  return (
    <MainLayout title="Direct Purchase" subtitle="Record direct material purchases from suppliers">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Purchases" value={bills.length} icon={ShoppingCart} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Unpaid Bills" value={unpaid.length} icon={ShoppingCart} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatCard title="Total Amount" value={`৳${formatNumber(totalAmount)}`} icon={ShoppingCart} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Outstanding" value={`৳${formatNumber(unpaid.reduce((a, b) => a + b.amount, 0))}`} icon={ShoppingCart} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Purchase Bills</CardTitle>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> New Purchase
          </button>
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
                { key: "amount", header: "Amount", render: (v) => formatCurrency(v as number) },
                { key: "date", header: "Purchase Date", render: (v) => formatDate(v as string) },
                { key: "dueDate", header: "Due Date", render: (v) => v ? formatDate(v as string) : "—" },
                { key: "status", header: "Status", render: (v) => <Badge variant={v === "paid" ? "success" : "warning"}>{v as string}</Badge> },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Record Purchase</h3>
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Product *</label>
                <select required value={form.productId} onChange={(e) => {
                  const p = products.find((x) => x.id === e.target.value);
                  setForm({ ...form, productId: e.target.value, unitRate: String(p?.purchasePrice ?? "") });
                }} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select Product —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                  <input type="number" required min="0.01" step="0.01" value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit Rate (৳)</label>
                  <input type="number" value={form.unitRate} onChange={(e) => setForm({ ...form, unitRate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              {form.quantity && form.unitRate && (
                <div className="bg-amber-50 rounded-lg px-4 py-2 text-sm">
                  Total: <span className="font-semibold text-amber-700">
                    {formatCurrency((parseFloat(form.quantity) || 0) * (parseFloat(form.unitRate) || 0))}
                  </span>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Record Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
