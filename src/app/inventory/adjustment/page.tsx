"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { inventoryApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, Plus, Loader2, X } from "lucide-react";

interface Product { id: string; name: string; unit: string; stock: number }
interface Adjustment {
  id: string;
  type: string;
  quantity: number;
  reason?: string;
  adjustedBy: string;
  createdAt: string;
  product: { name: string; unit: string };
}

const defaultForm = { productId: "", type: "add", quantity: "1", reason: "", adjustedBy: "" };
const REASONS = ["Damage", "Loss/Theft", "Return to Supplier", "Stocktake Correction", "Expiry", "Transfer", "Other"];

export default function StockAdjustmentPage() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchAll() {
    try {
      const [ar, pr] = await Promise.all([inventoryApi.getAdjustments(), inventoryApi.getProducts()]);
      setAdjustments(ar.data.data || []);
      setProducts(pr.data.data || []);
    } catch {
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productId) { setError("Select a product"); return; }
    setSaving(true);
    setError("");
    try {
      await inventoryApi.adjustStock(form.productId, {
        type: form.type,
        quantity: parseFloat(form.quantity) || 1,
        reason: form.reason || undefined,
        adjustedBy: form.adjustedBy,
      });
      setShowModal(false);
      setForm(defaultForm);
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to adjust stock");
    } finally {
      setSaving(false);
    }
  }

  const additions = adjustments.filter((a) => a.type === "add");
  const deductions = adjustments.filter((a) => a.type === "deduct");

  const tableData = adjustments.map((a) => ({
    product: a.product.name,
    type: a.type,
    quantity: a.quantity,
    unit: a.product.unit,
    reason: a.reason ?? "—",
    adjustedBy: a.adjustedBy,
    date: a.createdAt,
  }));

  return (
    <MainLayout title="Stock Adjustment" subtitle="Record stock additions, deductions and corrections">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">Total Adjustments</p>
          <p className="text-2xl font-bold text-blue-700">{adjustments.length}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-xs text-emerald-600 font-medium mb-1">Additions</p>
          <p className="text-2xl font-bold text-emerald-700">{additions.length}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-xs text-red-600 font-medium mb-1">Deductions</p>
          <p className="text-2xl font-bold text-red-700">{deductions.length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs text-amber-600 font-medium mb-1">Products</p>
          <p className="text-2xl font-bold text-amber-700">{products.length}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Adjustment History</CardTitle>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> New Adjustment
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : adjustments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No adjustments recorded</p>
          ) : (
            <DataTable
              data={tableData as unknown as Record<string, unknown>[]}
              columns={[
                { key: "product", header: "Product" },
                { key: "type", header: "Type", render: (v) => (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${v === "add" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {v === "add" ? "Addition" : "Deduction"}
                  </span>
                )},
                { key: "quantity", header: "Qty", render: (v, row) => <span className={row.type === "add" ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}>{row.type === "add" ? "+" : "-"}{v as number} {row.unit as string}</span> },
                { key: "reason", header: "Reason" },
                { key: "adjustedBy", header: "Adjusted By" },
                { key: "date", header: "Date", render: (v) => formatDate(v as string) },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">New Stock Adjustment</h3>
              <button onClick={() => { setShowModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product *</label>
                <select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select Product —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} {p.unit})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="add">Addition (+)</option>
                    <option value="deduct">Deduction (−)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                  <input type="number" required min="0.01" step="0.01" value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
                <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select Reason —</option>
                  {REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Adjusted By *</label>
                <input required value={form.adjustedBy} onChange={(e) => setForm({ ...form, adjustedBy: e.target.value })}
                  placeholder="Name of person adjusting"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
