"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { inventoryApi } from "@/lib/api";
import { Truck, Plus, Search, Loader2, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface GRNItem {
  orderedQty: number;
  receivedQty: number;
  damagedQty: number;
  acceptedQty: number;
  unit: string;
  product: { name: string };
}

interface GRN {
  id: string;
  grnNumber: string;
  receivedDate: string;
  receivedBy: string;
  status: string;
  remarks?: string;
  po: { poNumber: string; supplier: { name: string } };
  items: GRNItem[];
}

interface PurchaseOrder { id: string; poNumber: string; supplier: { name: string }; items: Array<{ productId: string; quantity: number; unit: string; product?: { name: string } }> }

const defaultForm = { poId: "", receivedBy: "", remarks: "" };

export default function GRNPage() {
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [openPOs, setOpenPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchAll() {
    try {
      const [gr, pr] = await Promise.all([inventoryApi.getGRNs(), inventoryApi.getPurchaseOrders()]);
      setGRNs(gr.data.data || []);
      const allPOs = pr.data.data || [];
      setOpenPOs(allPOs.filter((po: { status: string }) => po.status !== "RECEIVED" && po.status !== "CANCELLED"));
    } catch {
      setGRNs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = grns.filter((g) =>
    g.po.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
    g.grnNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalDamaged = grns.flatMap((g) => g.items).reduce((a, i) => a + i.damagedQty, 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.poId) { setError("Select a Purchase Order"); return; }
    setSaving(true);
    setError("");
    try {
      const po = openPOs.find((p) => p.id === form.poId);
      if (!po) throw new Error("PO not found");
      const items = po.items.map((i) => ({
        productId: i.productId,
        orderedQty: i.quantity,
        receivedQty: i.quantity,
        damagedQty: 0,
        acceptedQty: i.quantity,
        unit: i.unit,
      }));
      await inventoryApi.createGRN({ poId: form.poId, receivedBy: form.receivedBy, remarks: form.remarks, items });
      setShowModal(false);
      setForm(defaultForm);
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create GRN");
    } finally {
      setSaving(false);
    }
  }

  const tableData = filtered.map((g) => ({
    grnNumber: g.grnNumber,
    poRef: g.po.poNumber,
    supplier: g.po.supplier.name,
    items: g.items.map((i) => i.product.name).join(", "),
    ordered: g.items.reduce((a, i) => a + i.orderedQty, 0),
    received: g.items.reduce((a, i) => a + i.receivedQty, 0),
    damaged: g.items.reduce((a, i) => a + i.damagedQty, 0),
    accepted: g.items.reduce((a, i) => a + i.acceptedQty, 0),
    date: g.receivedDate,
    status: g.status,
    receivedBy: g.receivedBy,
  }));

  return (
    <MainLayout title="Goods Receipt Note (GRN)" subtitle="Record and track received materials from suppliers">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total GRNs" value={grns.length} icon={Truck} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Complete" value={grns.filter((g) => g.status === "complete").length} icon={Truck} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Partial" value={grns.filter((g) => g.status === "partial").length} icon={Truck} iconColor="text-yellow-600" iconBg="bg-yellow-50" />
        <StatCard title="Total Damaged" value={`${totalDamaged} units`} icon={Truck} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>GRN List</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> New GRN
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
                { key: "grnNumber", header: "GRN No" },
                { key: "poRef", header: "PO Ref" },
                { key: "supplier", header: "Supplier" },
                { key: "items", header: "Items" },
                { key: "received", header: "Received" },
                { key: "damaged", header: "Damaged", render: (v) => <span className={v ? "text-red-600" : "text-gray-400"}>{v as number}</span> },
                { key: "accepted", header: "Accepted", render: (v) => <span className="text-green-700 font-medium">{v as number}</span> },
                { key: "receivedBy", header: "Received By" },
                { key: "date", header: "Date", render: (v) => formatDate(v as string) },
                { key: "status", header: "Status", render: (v) => <Badge variant={v === "complete" ? "success" : "warning"}>{v as string}</Badge> },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">New GRN</h3>
              <button onClick={() => { setShowModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Order *</label>
                <select required value={form.poId} onChange={(e) => setForm({ ...form, poId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select PO —</option>
                  {openPOs.map((po) => (
                    <option key={po.id} value={po.id}>{po.poNumber} — {po.supplier.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Received By *</label>
                <input required value={form.receivedBy} onChange={(e) => setForm({ ...form, receivedBy: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                <input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <p className="text-xs text-gray-400">All items from the PO will be received at full quantity. Adjust stock later if needed.</p>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create GRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
