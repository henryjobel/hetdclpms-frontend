"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { inventoryApi } from "@/lib/api";
import { Package, Plus, Search, Loader2, X, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  purchasePrice: number;
  supplier?: { name: string };
}

const defaultForm = {
  name: "", category: "", unit: "", stock: "0", minStock: "0", purchasePrice: "",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchAll() {
    try {
      const res = await inventoryApi.getProducts();
      setProducts(res.data.data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const totalValue = products.reduce((a, p) => a + p.stock * p.purchasePrice, 0);

  function openCreate() {
    setEditingId(null);
    setForm(defaultForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      unit: p.unit,
      stock: String(p.stock),
      minStock: String(p.minStock),
      purchasePrice: String(p.purchasePrice),
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      stock: parseFloat(form.stock) || 0,
      minStock: parseFloat(form.minStock) || 0,
      purchasePrice: parseFloat(form.purchasePrice) || 0,
    };
    try {
      if (editingId) {
        await inventoryApi.updateProduct(editingId, payload);
      } else {
        await inventoryApi.createProduct(payload);
      }
      setShowModal(false);
      setForm(defaultForm);
      setEditingId(null);
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await inventoryApi.deleteProduct(deleteId);
      setDeleteId(null);
      fetchAll();
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }

  const tableData = filtered.map((p) => ({
    ...p,
    supplierName: p.supplier?.name ?? "—",
    isLow: p.stock < p.minStock,
  }));

  return (
    <MainLayout title="Products / Materials" subtitle="Manage construction material catalog">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Products" value={products.length} icon={Package} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Low Stock" value={products.filter((p) => p.stock < p.minStock).length} icon={Package} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatCard title="Total Stock Value" value={`৳${formatNumber(totalValue)}`} icon={Package} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Categories" value={new Set(products.map((p) => p.category)).size} icon={Package} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Product List</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Product
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
                { key: "name", header: "Product Name" },
                { key: "category", header: "Category" },
                { key: "unit", header: "Unit" },
                { key: "stock", header: "Stock", render: (v, row) => {
                  const isLow = row.isLow as boolean;
                  return <span className={isLow ? "text-red-600 font-semibold" : ""}>{v as number} {row.unit as string}</span>;
                }},
                { key: "minStock", header: "Min Level", render: (v, row) => `${v} ${row.unit as string}` },
                { key: "purchasePrice", header: "Unit Price", render: (v) => formatCurrency(v as number) },
                { key: "supplierName", header: "Supplier" },
                { key: "isLow", header: "Status", render: (v) => (
                  <Badge variant={v ? "danger" : "success"}>{v ? "Low Stock" : "In Stock"}</Badge>
                )},
                { key: "id", header: "Actions", render: (_, row) => (
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(row as unknown as Product)}
                      className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(row.id as string)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )},
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editingId ? "Edit Product" : "Add Product"}</h3>
              <button onClick={() => { setShowModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                  <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit *</label>
                  <input required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Stock Level</label>
                  <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Price (৳) *</label>
                  <input type="number" required value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {editingId ? "Update Product" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Product?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium flex items-center gap-2">
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
