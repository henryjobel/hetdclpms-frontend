"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { inventoryApi, projectsApi } from "@/lib/api";
import { ShoppingCart, DollarSign, Plus, Search, Loader2, X, Check, Send } from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

interface POItem {
  productId: string;
  quantity: number;
  unit: string;
  unitRate: number;
  totalAmount: number;
  product?: { name: string };
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  deliveryDate?: string;
  supplier: { name: string };
  project?: { name: string };
  items: POItem[];
}

interface Supplier { id: string; name: string }
interface Project { id: string; name: string }
interface Product { id: string; name: string; unit: string; purchasePrice: number }

const statusVariant: Record<string, "default" | "info" | "success" | "warning" | "danger" | "gray"> = {
  DRAFT: "default", SENT: "info", CONFIRMED: "success", RECEIVED: "gray", CANCELLED: "danger",
};

const defaultForm = {
  supplierId: "", projectId: "", deliveryDate: "", remarks: "",
  productId: "", quantity: "1", unitRate: "",
};

export default function PurchaseOrdersPage() {
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchAll() {
    try {
      const [pr, sr, pjr, pdr] = await Promise.all([
        inventoryApi.getPurchaseOrders(),
        inventoryApi.getSuppliers(),
        projectsApi.getAll(),
        inventoryApi.getProducts(),
      ]);
      setPOs(pr.data.data || []);
      setSuppliers(sr.data.data || []);
      setProjects(pjr.data.data || []);
      setProducts(pdr.data.data || []);
    } catch {
      setPOs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = pos.filter(
    (po) => po.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      po.poNumber.toLowerCase().includes(search.toLowerCase())
  );

  const total = pos.reduce((a, po) => a + po.totalAmount, 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.supplierId || !form.productId) { setError("Select supplier and product"); return; }
    setSaving(true);
    setError("");
    try {
      const product = products.find((p) => p.id === form.productId);
      const qty = parseFloat(form.quantity) || 1;
      const rate = parseFloat(form.unitRate) || (product?.purchasePrice ?? 0);
      await inventoryApi.createPurchaseOrder({
        supplierId: form.supplierId,
        projectId: form.projectId || undefined,
        deliveryDate: form.deliveryDate ? new Date(form.deliveryDate).toISOString() : undefined,
        remarks: form.remarks,
        items: [{ productId: form.productId, quantity: qty, unit: product?.unit ?? "pcs", unitRate: rate, totalAmount: qty * rate }],
      });
      setShowModal(false);
      setForm(defaultForm);
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create PO");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(id: string, status: "SENT" | "CONFIRMED") {
    try {
      await inventoryApi.updatePurchaseOrderStatus(id, status);
      fetchAll();
    } catch { /* noop */ }
  }

  const tableData = filtered.map((po) => ({
    id: po.id,
    poNumber: po.poNumber,
    supplier: po.supplier.name,
    items: po.items.map((i) => i.product?.name ?? "Item").join(", "),
    project: po.project?.name ?? "-",
    amount: po.totalAmount,
    date: po.createdAt,
    deliveryDate: po.deliveryDate,
    status: po.status,
  }));

  return (
    <MainLayout title="Purchase Orders" subtitle="Manage procurement purchase orders">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total POs" value={pos.length} icon={ShoppingCart} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Confirmed" value={pos.filter((p) => p.status === "CONFIRMED").length} icon={ShoppingCart} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Pending" value={pos.filter((p) => ["DRAFT", "SENT"].includes(p.status)).length} icon={ShoppingCart} iconColor="text-yellow-600" iconBg="bg-yellow-50" />
        <StatCard title="Total Value" value={`Tk ${formatNumber(total)}`} icon={DollarSign} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Purchase Order List</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> New PO
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
                { key: "poNumber", header: "PO Number" },
                { key: "supplier", header: "Supplier" },
                { key: "items", header: "Items" },
                { key: "project", header: "Project" },
                { key: "amount", header: "Amount", render: (v) => formatCurrency(v as number) },
                { key: "date", header: "Date", render: (v) => formatDate(v as string) },
                { key: "deliveryDate", header: "Delivery", render: (v) => v ? formatDate(v as string) : "-" },
                { key: "status", header: "Status", render: (v) => <Badge variant={statusVariant[v as string] ?? "default"}>{(v as string).toLowerCase()}</Badge> },
                {
                  key: "id", header: "Action",
                  render: (v, row) => (
                    <div className="flex gap-1">
                      {row.status === "DRAFT" ? (
                        <button onClick={() => handleStatus(v as string, "SENT")} className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg" title="Send">
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                      {row.status === "SENT" ? (
                        <button onClick={() => handleStatus(v as string, "CONFIRMED")} className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg" title="Approve">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">New Purchase Order</h3>
              <button onClick={() => { setShowModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Supplier *</label>
                <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">Optional</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product *</label>
                <select required value={form.productId} onChange={(e) => {
                  const p = products.find((x) => x.id === e.target.value);
                  setForm({ ...form, productId: e.target.value, unitRate: String(p?.purchasePrice ?? "") });
                }} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">Select Product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                  <input type="number" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit Rate</label>
                  <input type="number" value={form.unitRate} onChange={(e) => setForm({ ...form, unitRate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Date</label>
                <input type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
