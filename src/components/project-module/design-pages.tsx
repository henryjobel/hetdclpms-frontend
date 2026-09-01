"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { designApi, projectsApi } from "@/lib/api";
import { confirmAction } from "@/lib/feedback";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Building2, ClipboardCheck, FileText, Loader2, Pencil, Plus, Search, Trash2, Upload, UserRoundCheck, X } from "lucide-react";

interface Consultant {
  id: string;
  name: string;
  company?: string;
  consultantType: string;
  specialty?: string;
  phone?: string;
  email?: string;
  address?: string;
  licenseNo?: string;
  isActive: boolean;
  designRecords?: Array<{ feeAmount: number; paidAmount: number; status: string }>;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface DesignRecord {
  id: string;
  projectId: string;
  consultantId?: string;
  category: string;
  title: string;
  status: string;
  submissionDate?: string;
  approvalDate?: string;
  feeAmount: number;
  paidAmount: number;
  documentUrl?: string;
  remarks?: string;
  project?: { id: string; name: string };
  consultant?: { id: string; name: string; company?: string; consultantType: string };
}

const consultantTypes = ["Architect", "Structural Engineer", "MEP Engineer", "Soil Test Consultant", "Interior Designer", "Approval Consultant"];
const designCategories = [
  "Design Contract / Fee",
  "Drawing Submission",
  "Drawing Approval",
  "Architectural Design",
  "Structural Design",
  "MEP Design",
  "Soil Test",
  "Approval Document",
  "Design Payment",
  "RAJUK Approval",
  "Fire Approval",
  "Utility Approval",
  "Interior Design",
];
const statuses = ["PENDING", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REVISION_REQUIRED", "REJECTED"];

const emptyConsultantForm = {
  name: "",
  company: "",
  consultantType: "Architect",
  specialty: "",
  phone: "",
  email: "",
  address: "",
  licenseNo: "",
};

const emptyRecordForm = {
  projectId: "",
  consultantId: "",
  category: "Architectural Design",
  title: "",
  status: "PENDING",
  submissionDate: "",
  approvalDate: "",
  feeAmount: "",
  paidAmount: "",
  documentUrl: "",
  remarks: "",
};

interface DesignRecordsPageProps {
  title?: string;
  subtitle?: string;
  defaultCategory?: string;
  lockCategory?: boolean;
}

const statusVariant: Record<string, "default" | "info" | "success" | "warning" | "danger" | "gray"> = {
  PENDING: "warning",
  SUBMITTED: "info",
  UNDER_REVIEW: "info",
  APPROVED: "success",
  REVISION_REQUIRED: "warning",
  REJECTED: "danger",
};

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function textInput(value: string, onChange: (value: string) => void, required = false, type = "text") {
  return (
    <input
      type={type}
      required={required}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
    />
  );
}

export function DesignConsultantsPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyConsultantForm);
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    try {
      const response = await designApi.getConsultants();
      setConsultants(response.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = consultants.filter((consultant) =>
    [consultant.name, consultant.company, consultant.consultantType, consultant.specialty, consultant.phone]
      .some((value) => String(value || "").toLowerCase().includes(search.toLowerCase()))
  );

  const activeCount = consultants.filter((consultant) => consultant.isActive).length;
  const totalFee = consultants.reduce((sum, consultant) => sum + (consultant.designRecords || []).reduce((inner, record) => inner + Number(record.feeAmount || 0), 0), 0);
  const totalDue = consultants.reduce((sum, consultant) => sum + (consultant.designRecords || []).reduce((inner, record) => inner + Number(record.feeAmount || 0) - Number(record.paidAmount || 0), 0), 0);

  function openCreate() {
    setEditId(null);
    setForm(emptyConsultantForm);
    setShowModal(true);
  }

  function openEdit(consultant: Consultant) {
    setEditId(consultant.id);
    setForm({
      name: consultant.name || "",
      company: consultant.company || "",
      consultantType: consultant.consultantType || "Architect",
      specialty: consultant.specialty || "",
      phone: consultant.phone || "",
      email: consultant.email || "",
      address: consultant.address || "",
      licenseNo: consultant.licenseNo || "",
    });
    setShowModal(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      if (editId) await designApi.updateConsultant(editId, form);
      else await designApi.createConsultant(form);
      setShowModal(false);
      setForm(emptyConsultantForm);
      setEditId(null);
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!(await confirmAction("Deactivate this consultant?", "Confirm"))) return;
    await designApi.deleteConsultant(id);
    fetchAll();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Architects & Consultants</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage architects, engineers, designers and approval consultants</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">
          <Plus className="w-4 h-4" /> New Consultant
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Consultants" value={consultants.length} icon={UserRoundCheck} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Active" value={activeCount} icon={ClipboardCheck} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Design Fees" value={formatCurrency(totalFee)} icon={FileText} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="Due" value={formatCurrency(totalDue)} icon={Building2} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Consultant Directory</CardTitle>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..."
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={filtered as unknown as Record<string, unknown>[]}
              columns={[
                { key: "name", header: "Name" },
                { key: "company", header: "Company", render: (value) => String(value || "-") },
                { key: "consultantType", header: "Type" },
                { key: "specialty", header: "Specialty", render: (value) => String(value || "-") },
                { key: "phone", header: "Phone", render: (value) => String(value || "-") },
                { key: "isActive", header: "Status", render: (value) => <Badge variant={value ? "success" : "gray"}>{value ? "Active" : "Inactive"}</Badge> },
                {
                  key: "id",
                  header: "Actions",
                  render: (value, row) => (
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openEdit(row as unknown as Consultant)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(String(value))} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <ModalShell title={editId ? "Edit Consultant" : "New Consultant"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name *">{textInput(form.name, (value) => setForm({ ...form, name: value }), true)}</Field>
              <Field label="Company / Firm">{textInput(form.company, (value) => setForm({ ...form, company: value }))}</Field>
              <Field label="Consultant Type">
                <select value={form.consultantType} onChange={(event) => setForm({ ...form, consultantType: event.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {consultantTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </Field>
              <Field label="Specialty">{textInput(form.specialty, (value) => setForm({ ...form, specialty: value }))}</Field>
              <Field label="Phone">{textInput(form.phone, (value) => setForm({ ...form, phone: value }))}</Field>
              <Field label="Email">{textInput(form.email, (value) => setForm({ ...form, email: value }), false, "email")}</Field>
              <Field label="License / Registration No">{textInput(form.licenseNo, (value) => setForm({ ...form, licenseNo: value }))}</Field>
              <Field label="Address">{textInput(form.address, (value) => setForm({ ...form, address: value }))}</Field>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editId ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}

export function DesignRecordsPage({
  title = "Design & Approval Records",
  subtitle = "Track drawings, consultant submissions, approval status and design payments",
  defaultCategory = "",
  lockCategory = false,
}: DesignRecordsPageProps = {}) {
  const [records, setRecords] = useState<DesignRecord[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(defaultCategory);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyRecordForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function fetchAll() {
    try {
      const params: Record<string, string> = {};
      if (projectFilter) params.projectId = projectFilter;
      if (categoryFilter) params.category = categoryFilter;
      const [recordsRes, projectsRes, consultantsRes] = await Promise.all([
        designApi.getRecords(Object.keys(params).length ? params : undefined),
        projectsApi.getAll(),
        designApi.getConsultants(),
      ]);
      const projectRows = projectsRes.data.data || [];
      setRecords(recordsRes.data.data || []);
      setProjects(projectRows);
      setConsultants((consultantsRes.data.data || []).filter((consultant: Consultant) => consultant.isActive));
      if (!form.projectId && projectRows[0]?.id) setForm((current) => ({ ...current, projectId: projectRows[0].id }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, [projectFilter, categoryFilter]);

  const filtered = records.filter((record) =>
    [record.title, record.category, record.status, record.project?.name, record.consultant?.name]
      .some((value) => String(value || "").toLowerCase().includes(search.toLowerCase()))
  );

  const summary = useMemo(() => {
    const fee = records.reduce((sum, record) => sum + Number(record.feeAmount || 0), 0);
    const paid = records.reduce((sum, record) => sum + Number(record.paidAmount || 0), 0);
    const approved = records.filter((record) => record.status === "APPROVED").length;
    return { fee, paid, due: fee - paid, approved };
  }, [records]);

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyRecordForm, category: categoryFilter || defaultCategory || "Drawing Submission", projectId: projectFilter || projects[0]?.id || "" });
    setShowModal(true);
  }

  function openEdit(record: DesignRecord) {
    setEditId(record.id);
    setForm({
      projectId: record.projectId || "",
      consultantId: record.consultantId || "",
      category: record.category || "Architectural Design",
      title: record.title || "",
      status: record.status || "PENDING",
      submissionDate: record.submissionDate ? record.submissionDate.slice(0, 10) : "",
      approvalDate: record.approvalDate ? record.approvalDate.slice(0, 10) : "",
      feeAmount: String(record.feeAmount || ""),
      paidAmount: String(record.paidAmount || ""),
      documentUrl: record.documentUrl || "",
      remarks: record.remarks || "",
    });
    setShowModal(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        consultantId: form.consultantId || undefined,
        feeAmount: Number(form.feeAmount || 0),
        paidAmount: Number(form.paidAmount || 0),
        submissionDate: form.submissionDate || undefined,
        approvalDate: form.approvalDate || undefined,
      };
      if (editId) await designApi.updateRecord(editId, payload);
      else await designApi.createRecord(payload);
      setShowModal(false);
      setEditId(null);
      setForm(emptyRecordForm);
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!(await confirmAction("Delete this design record?"))) return;
    await designApi.deleteRecord(id);
    fetchAll();
  }

  async function handleFileUpload(file: File | null) {
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    setUploading(true);
    try {
      const response = await designApi.uploadDocument(data);
      setForm((current) => ({ ...current, documentUrl: response.data.data?.fileUrl || "" }));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">
          <Plus className="w-4 h-4" /> New Design Record
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Records" value={records.length} icon={FileText} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Approved" value={summary.approved} icon={ClipboardCheck} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Fees" value={formatCurrency(summary.fee)} icon={Building2} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="Due" value={formatCurrency(summary.due)} icon={UserRoundCheck} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Design Register</CardTitle>
          <div className="flex items-center gap-2">
            <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">All Projects</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            {!lockCategory && (
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="">All Design Types</option>
                {designCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            )}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..."
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={filtered as unknown as Record<string, unknown>[]}
              columns={[
                { key: "project", header: "Project", render: (_value, row) => (row as unknown as DesignRecord).project?.name || "-" },
                { key: "category", header: "Category" },
                { key: "title", header: "Title" },
                { key: "consultant", header: "Consultant", render: (_value, row) => (row as unknown as DesignRecord).consultant?.name || "-" },
                { key: "status", header: "Status", render: (value) => <Badge variant={statusVariant[String(value)] ?? "default"}>{String(value).replace(/_/g, " ")}</Badge> },
                { key: "feeAmount", header: "Fee", render: (value) => formatCurrency(Number(value || 0)) },
                { key: "paidAmount", header: "Paid", render: (value) => <span className="text-green-700">{formatCurrency(Number(value || 0))}</span> },
                { key: "documentUrl", header: "Document", render: (value) => value ? <a href={String(value)} target="_blank" className="text-blue-600 hover:underline">Open</a> : "-" },
                { key: "approvalDate", header: "Approval", render: (value) => value ? formatDate(String(value)) : "-" },
                {
                  key: "id",
                  header: "Actions",
                  render: (value, row) => (
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openEdit(row as unknown as DesignRecord)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(String(value))} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <ModalShell title={editId ? "Edit Design Record" : "New Design Record"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Project *">
                <select required value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">Select Project</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </Field>
              <Field label="Consultant">
                <select value={form.consultantId} onChange={(event) => setForm({ ...form, consultantId: event.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">Not assigned</option>
                  {consultants.map((consultant) => <option key={consultant.id} value={consultant.id}>{consultant.name} - {consultant.consultantType}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select disabled={lockCategory} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {designCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {statuses.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
                </select>
              </Field>
              <div className="md:col-span-2">
                <Field label="Title *">{textInput(form.title, (value) => setForm({ ...form, title: value }), true)}</Field>
              </div>
              <Field label="Submission Date">{textInput(form.submissionDate, (value) => setForm({ ...form, submissionDate: value }), false, "date")}</Field>
              <Field label="Approval Date">{textInput(form.approvalDate, (value) => setForm({ ...form, approvalDate: value }), false, "date")}</Field>
              <Field label="Fee Amount">{textInput(form.feeAmount, (value) => setForm({ ...form, feeAmount: value }), false, "number")}</Field>
              <Field label="Paid Amount">{textInput(form.paidAmount, (value) => setForm({ ...form, paidAmount: value }), false, "number")}</Field>
              <div className="md:col-span-2">
                <Field label="Approval Document Upload / URL">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                    {textInput(form.documentUrl, (value) => setForm({ ...form, documentUrl: value }))}
                    <label className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" onChange={(event) => handleFileUpload(event.target.files?.[0] || null)} />
                    </label>
                  </div>
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Remarks">
                  <textarea value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editId ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}
