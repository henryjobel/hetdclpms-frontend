"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { realEstateApi } from "@/lib/api";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { Plus, Loader2, X, Trash2, Pencil, CalendarPlus } from "lucide-react";

interface BookingOption {
  id: string;
  bookingNo: string;
  customerName: string;
  project: { name: string };
  projectId: string;
  unit: { unitNo: string; type: string };
  unitId: string;
}

interface Sale {
  id: string;
  saleNo: string;
  bookingId?: string | null;
  projectId?: string;
  unitId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  saleDate: string;
  saleAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  remarks?: string;
  project: { name: string };
  unit: { unitNo: string; type: string };
}

const defaultForm = {
  bookingId: "", projectId: "", unitId: "", customerName: "", customerPhone: "", customerEmail: "",
  saleDate: "", saleAmount: "", paidAmount: "", remarks: "",
};

export default function RealEstateSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    try {
      const [sr, br] = await Promise.all([realEstateApi.getSales(), realEstateApi.getBookings()]);
      setSales(sr.data.data || []);
      setBookings((br.data.data || []).filter((item: BookingOption & { status: string }) => item.status === "ACTIVE"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(defaultForm);
  }

  function openEdit(sale: Sale) {
    setEditId(sale.id);
    setForm({
      bookingId: sale.bookingId || "",
      projectId: sale.projectId || "",
      unitId: sale.unitId || "",
      customerName: sale.customerName || "",
      customerPhone: sale.customerPhone || "",
      customerEmail: sale.customerEmail || "",
      saleDate: sale.saleDate ? new Date(sale.saleDate).toISOString().slice(0, 10) : "",
      saleAmount: String(sale.saleAmount || ""),
      paidAmount: String(sale.paidAmount || ""),
      remarks: sale.remarks || "",
    });
    setShowModal(true);
  }

  function handleBookingSelect(id: string) {
    const booking = bookings.find((item) => item.id === id);
    setForm({
      ...form,
      bookingId: id,
      projectId: booking?.projectId || "",
      unitId: booking?.unitId || "",
      customerName: booking?.customerName || "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        saleDate: form.saleDate ? new Date(form.saleDate).toISOString() : undefined,
        saleAmount: parseFloat(form.saleAmount) || 0,
        paidAmount: parseFloat(form.paidAmount) || 0,
      };
      if (editId) await realEstateApi.updateSale(editId, payload);
      else await realEstateApi.createSale(payload);
      closeModal();
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this sale?")) return;
    await realEstateApi.deleteSale(id);
    fetchAll();
  }

  async function handleInstallmentPlan(sale: Sale) {
    if (sale.dueAmount <= 0) {
      alert("This sale has no due amount.");
      return;
    }
    await realEstateApi.createSaleInstallmentPlan(sale.id, { months: 6 });
    alert("Installment plan created in Accounts > Installments");
  }

  const totalSales = sales.reduce((sum, item) => sum + item.saleAmount, 0);
  const totalDue = sales.reduce((sum, item) => sum + item.dueAmount, 0);

  return (
    <MainLayout title="Flat / Land Sales" subtitle="Convert bookings into final property sales">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">Total Sales</p>
          <p className="text-xl font-bold text-gray-900">৳{formatNumber(totalSales)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">Total Due</p>
          <p className="text-xl font-bold text-red-600">৳{formatNumber(totalDue)}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sale List</CardTitle>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> New Sale
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={sales as unknown as Record<string, unknown>[]}
              columns={[
                { key: "saleNo", header: "Sale No" },
                { key: "customerName", header: "Customer" },
                { key: "project", header: "Project", render: (_v, row) => (row as unknown as Sale).project.name },
                { key: "unit", header: "Unit", render: (_v, row) => `${(row as unknown as Sale).unit.unitNo} (${(row as unknown as Sale).unit.type})` },
                { key: "saleDate", header: "Date", render: (v) => formatDate(v as string) },
                { key: "saleAmount", header: "Sale Amount", render: (v) => formatCurrency(v as number) },
                { key: "paidAmount", header: "Paid", render: (v) => <span className="text-green-700">{formatCurrency(v as number)}</span> },
                { key: "dueAmount", header: "Due", render: (v) => <span className="text-red-600">{formatCurrency(v as number)}</span> },
                { key: "status", header: "Status" },
                { key: "id", header: "Actions", render: (v, row) => (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleInstallmentPlan(row as unknown as Sale)} className="p-1.5 rounded-lg bg-amber-50 text-amber-600"><CalendarPlus className="w-3.5 h-3.5" /></button>
                    <button onClick={() => openEdit(row as unknown as Sale)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(v as string)} className="p-1.5 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )},
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit Sale" : "New Sale"}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">From Booking *</label>
                  <select required={!editId} value={form.bookingId} onChange={(e) => handleBookingSelect(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="">Select booking</option>
                    {bookings.map((b) => <option key={b.id} value={b.id}>{b.bookingNo} - {b.customerName} - {b.unit.unitNo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Customer *</label>
                  <input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sale Date</label>
                  <input type="date" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sale Amount *</label>
                  <input required value={form.saleAmount} onChange={(e) => setForm({ ...form, saleAmount: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Paid Amount</label>
                  <input value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">
                  {saving && <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-2" />}{editId ? "Update Sale" : "Create Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
