"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { projectsApi, realEstateApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Loader2, X, Trash2, Pencil, Ban } from "lucide-react";

interface Project { id: string; name: string }
interface Unit { id: string; unitNo: string; type: string; status: string; project: { name: string } }
interface Booking {
  id: string;
  bookingNo: string;
  projectId?: string;
  unitId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  bookingDate: string;
  bookingAmount: number;
  status: string;
  remarks?: string;
  project: { name: string };
  unit: { unitNo: string; type: string };
}

const defaultForm = {
  projectId: "", unitId: "", customerName: "", customerPhone: "", customerEmail: "", bookingDate: "", bookingAmount: "", remarks: "",
};

export default function RealEstateBookingsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    try {
      const [pr, ur, br] = await Promise.all([projectsApi.getAll(), realEstateApi.getUnits(), realEstateApi.getBookings()]);
      setProjects(pr.data.data || []);
      setUnits(ur.data.data || []);
      setBookings(br.data.data || []);
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

  function openEdit(booking: Booking) {
    setEditId(booking.id);
    setForm({
      projectId: booking.projectId || "",
      unitId: booking.unitId || "",
      customerName: booking.customerName || "",
      customerPhone: booking.customerPhone || "",
      customerEmail: booking.customerEmail || "",
      bookingDate: booking.bookingDate ? new Date(booking.bookingDate).toISOString().slice(0, 10) : "",
      bookingAmount: String(booking.bookingAmount || ""),
      remarks: booking.remarks || "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        bookingAmount: parseFloat(form.bookingAmount) || 0,
        bookingDate: form.bookingDate ? new Date(form.bookingDate).toISOString() : undefined,
      };
      if (editId) await realEstateApi.updateBooking(editId, payload);
      else await realEstateApi.createBooking(payload);
      closeModal();
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this booking?")) return;
    await realEstateApi.deleteBooking(id);
    fetchAll();
  }

  async function handleCancelBooking(booking: Booking) {
    if (!confirm("Cancel this booking and release the unit?")) return;
    await realEstateApi.cancelBooking(booking.id, {
      refundAmount: booking.bookingAmount || 0,
      remarks: "Cancelled from booking screen",
    });
    fetchAll();
  }

  const projectUnits = units.filter((unit) => {
    const sameProject = !form.projectId || projects.find((p) => p.id === form.projectId)?.name === unit.project.name;
    return sameProject && unit.status !== "SOLD";
  });

  return (
    <MainLayout title="Flat / Land Bookings" subtitle="Manage booking entries before final sale">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Booking List</CardTitle>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> New Booking
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={bookings as unknown as Record<string, unknown>[]}
              columns={[
                { key: "bookingNo", header: "Booking No" },
                { key: "customerName", header: "Customer" },
                { key: "project", header: "Project", render: (_v, row) => (row as unknown as Booking).project.name },
                { key: "unit", header: "Unit", render: (_v, row) => `${(row as unknown as Booking).unit.unitNo} (${(row as unknown as Booking).unit.type})` },
                { key: "bookingDate", header: "Date", render: (v) => formatDate(v as string) },
                { key: "bookingAmount", header: "Amount", render: (v) => formatCurrency(v as number) },
                { key: "status", header: "Status" },
                { key: "id", header: "Actions", render: (v, row) => (
                  <div className="flex items-center gap-2">
                    {(row as unknown as Booking).status === "ACTIVE" ? (
                      <button onClick={() => handleCancelBooking(row as unknown as Booking)} className="p-1.5 rounded-lg bg-amber-50 text-amber-600"><Ban className="w-3.5 h-3.5" /></button>
                    ) : null}
                    <button onClick={() => openEdit(row as unknown as Booking)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
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
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit Booking" : "New Booking"}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Project *</label>
                  <select required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value, unitId: "" })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="">Select project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit *</label>
                  <select required value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="">Select unit</option>
                    {projectUnits.map((u) => <option key={u.id} value={u.id}>{u.unitNo} ({u.type})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Customer *</label>
                  <input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Booking Date</label>
                  <input type="date" value={form.bookingDate} onChange={(e) => setForm({ ...form, bookingDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Booking Amount</label>
                  <input value={form.bookingAmount} onChange={(e) => setForm({ ...form, bookingAmount: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">
                  {saving && <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-2" />}{editId ? "Update Booking" : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
