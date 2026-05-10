"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { inventoryApi } from "@/lib/api";
import { Package, AlertTriangle, DollarSign, Plus, Search, Loader2, X, Pencil, Trash2 } from "lucide-react";
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

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

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

  function closeModal() {
    setShowModal(false);
    setForm(defaultForm);
    setEditId(null);
    setError("");
  }

  function openEdit(product: Product) {
    setEditId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      stock: String(product.stock),
      minStock: String(product.minStock),
      purchasePrice: String(product.purchasePrice),
    });
    setShowModal(true);
  }

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = products.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || item.category === catFilter;
    return matchSearch && matchCat;
  });

  const lowStock = products.filter((p) => p.stock < p.minStock);
  const totalValue = products.reduce((a, p) => a + p.stock * p.purchasePrice, 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        stock: parseFloat(form.stock) || 0,
        minStock: parseFloat(form.minStock) || 0,
        purchasePrice: parseFloat(form.purchasePrice) || 0,
      };
      if (editId) await inventoryApi.updateProduct(editId, payload);
      else await inventoryApi.createProduct(payload);
      closeModal();
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || `Failed to ${editId ? "update" : "add"} product`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      await inventoryApi.deleteProduct(id);
      fetchAll();
    } catch {
      setError("Failed to delete product");
    }
  }

  const tableData = filtered.map((item) => ({
    ...item,
    supplierName: item.supplier?.name ?? "—",
    totalValue: item.stock * item.purchasePrice,
    isLow: item.stock < item.minStock,
  }));

  return (
    <MainLayout title="Inventory" subtitle="Construction material stock management">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Items" value={products.length} icon={Package} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Low Stock" value={lowStock.length} subtitle="Below minimum level" icon={AlertTriangle} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatCard title="Total Stock Value" value={`৳${formatNumber(totalValue)}`} icon={DollarSign} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Categories" value={categories.length - 1} icon={Package} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stock Overview</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..."
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
              {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
            </select>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Item
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
                { key: "name", header: "Item Name" },
                { key: "category", header: "Category" },
                { key: "unit", header: "Unit" },
                { key: "stock", header: "Current Stock", render: (v, row) => (
                  <span className={row.isLow ? "text-red-600 font-semibold" : "text-gray-700"}>
                    {v as number} {row.unit as string}
                  </span>
                )},
                { key: "minStock", header: "Min Level", render: (v, row) => `${v} ${row.unit as string}` },
                { key: "purchasePrice", header: "Unit Price", render: (v) => formatCurrency(v as number) },
                { key: "totalValue", header: "Total Value", render: (v) => formatCurrency(v as number) },
                { key: "supplierName", header: "Supplier" },
                { key: "isLow", header: "Status", render: (v) => (
                  <Badge variant={v ? "danger" : "success"}>{v ? "Low Stock" : "OK"}</Badge>
                )},
                { key: "id", header: "Actions", render: (v, row) => (
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(row as unknown as Product)}
                      className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(v as string)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )},
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit Product / Material" : "Add Product / Material"}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
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
                    placeholder="e.g. Building Material"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit *</label>
                  <input required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="e.g. Bag, Ton, Pcs"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Opening Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Level</label>
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
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {editId ? "Update Product" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
