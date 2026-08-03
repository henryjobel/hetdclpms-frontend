"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  accountsApi,
  documentsApi,
  investmentApi,
  projectsApi,
  realEstateApi,
  shareProjectApi,
  sitesApi,
} from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { confirmAction } from "@/lib/feedback";
import {
  AlertTriangle,
  Building2,
  FileText,
  Landmark,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Share2,
  Trash2,
  X,
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  type: string;
  status: string;
  budget: number;
  totalUnits: number;
  soldUnits: number;
  location?: string;
};

type ProjectOption = { id: string; name: string };

function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-amber-600" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function EmptyRow({ colSpan, text = "No records found" }: { colSpan: number; text?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-12 text-sm text-gray-400">
        {text}
      </td>
    </tr>
  );
}

function Actions({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex justify-center gap-1">
      {onEdit && (
        <button onClick={onEdit} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function ProjectSelect({
  value,
  onChange,
  projects,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  projects: ProjectOption[];
  required?: boolean;
}) {
  return (
    <select
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
    >
      <option value="">Select Project</option>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  );
}

export function ProjectTypePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.getAll({ limit: "200" })
      .then((res) => setProjects(res.data.data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    const map = new Map<string, { type: string; count: number; active: number; budget: number; units: number; sold: number }>();
    projects.forEach((project) => {
      const item = map.get(project.type) ?? { type: project.type, count: 0, active: 0, budget: 0, units: 0, sold: 0 };
      item.count += 1;
      item.active += project.status === "ACTIVE" ? 1 : 0;
      item.budget += project.budget || 0;
      item.units += project.totalUnits || 0;
      item.sold += project.soldUnits || 0;
      map.set(project.type, item);
    });
    return Array.from(map.values());
  }, [projects]);

  return (
    <div className="p-6">
      <PageHeader title="Project Types" subtitle="Project type summary from live project records" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Project Types" value={rows.length} icon={Building2} />
        <Stat label="Total Projects" value={projects.length} icon={FileText} />
        <Stat label="Total Budget" value={formatCurrency(projects.reduce((sum, item) => sum + (item.budget || 0), 0))} icon={Landmark} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-amber-500 text-white text-xs">
              {["Type", "Projects", "Active", "Total Units", "Sold Units", "Budget"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 && <EmptyRow colSpan={6} />}
              {rows.map((row) => (
                <tr key={row.type} className="hover:bg-amber-50">
                  <td className="px-4 py-3 font-medium">{row.type}</td>
                  <td className="px-4 py-3">{row.count}</td>
                  <td className="px-4 py-3">{row.active}</td>
                  <td className="px-4 py-3">{row.units}</td>
                  <td className="px-4 py-3">{row.sold}</td>
                  <td className="px-4 py-3 font-semibold text-amber-700">{formatCurrency(row.budget)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

type SiteRow = {
  id: string;
  projectId?: string;
  name: string;
  address?: string;
  area?: number;
  areaUnit?: string;
  siteType: string;
  status: string;
  description?: string;
  project?: { name: string };
};

const emptySite = { projectId: "", name: "", address: "", area: "", areaUnit: "SFT", siteType: "Construction", status: "Active", description: "" };

export function SiteManagementPage() {
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptySite);

  async function fetchAll() {
    try {
      const [siteRes, projectRes] = await Promise.all([sitesApi.getAll(), projectsApi.getAll({ limit: "200" })]);
      setSites(siteRes.data.data || []);
      setProjects(projectRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, projectId: form.projectId || undefined, area: form.area ? Number(form.area) : undefined };
    if (editId) await sitesApi.update(editId, payload);
    else await sitesApi.create(payload);
    setShowModal(false);
    setEditId(null);
    setForm(emptySite);
    fetchAll();
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Site Management"
        subtitle="Manage project sites, location, area and active status"
        action={<button onClick={() => { setEditId(null); setForm(emptySite); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm rounded-lg"><Plus className="w-4 h-4" /> New Site</button>}
      />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Total Sites" value={sites.length} icon={MapPin} />
        <Stat label="Active Sites" value={sites.filter((site) => site.status === "Active").length} icon={Building2} />
        <Stat label="Mapped Projects" value={new Set(sites.map((site) => site.project?.name).filter(Boolean)).size} icon={FileText} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div> : (
          <table className="w-full text-sm">
            <thead><tr className="bg-amber-500 text-white text-xs">
              {["Site", "Project", "Address", "Area", "Type", "Status", "Actions"].map((h) => <th key={h} className="px-4 py-3 text-left last:text-center">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {sites.length === 0 && <EmptyRow colSpan={7} />}
              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-amber-50">
                  <td className="px-4 py-3 font-medium">{site.name}</td>
                  <td className="px-4 py-3 text-gray-500">{site.project?.name || "General"}</td>
                  <td className="px-4 py-3 text-gray-500">{site.address || "-"}</td>
                  <td className="px-4 py-3">{site.area ? `${site.area} ${site.areaUnit || ""}` : "-"}</td>
                  <td className="px-4 py-3">{site.siteType}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-green-50 text-green-700">{site.status}</span></td>
                  <td className="px-4 py-3">
                    <Actions
                      onEdit={() => {
                        setEditId(site.id);
                        setForm({
                          projectId: site.projectId || "",
                          name: site.name,
                          address: site.address || "",
                          area: site.area ? String(site.area) : "",
                          areaUnit: site.areaUnit || "SFT",
                          siteType: site.siteType,
                          status: site.status,
                          description: site.description || "",
                        });
                        setShowModal(true);
                      }}
                      onDelete={async () => { if (await confirmAction("Delete this site?")) { await sitesApi.delete(site.id); fetchAll(); } }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={save} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold">{editId ? "Edit" : "New"} Site</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Project</label><ProjectSelect value={form.projectId} onChange={(projectId) => setForm({ ...form, projectId })} projects={projects} /></div>
              <input required placeholder="Site Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="col-span-2 px-3 py-2 text-sm border rounded-lg" />
              <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="col-span-2 px-3 py-2 text-sm border rounded-lg" />
              <input type="number" placeholder="Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="px-3 py-2 text-sm border rounded-lg" />
              <input placeholder="Area Unit" value={form.areaUnit} onChange={(e) => setForm({ ...form, areaUnit: e.target.value })} className="px-3 py-2 text-sm border rounded-lg" />
              <input placeholder="Site Type" value={form.siteType} onChange={(e) => setForm({ ...form, siteType: e.target.value })} className="px-3 py-2 text-sm border rounded-lg" />
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="px-3 py-2 text-sm border rounded-lg">
                {["Active", "On Hold", "Completed", "Closed"].map((status) => <option key={status}>{status}</option>)}
              </select>
              <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="col-span-2 px-3 py-2 text-sm border rounded-lg" />
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

type DocumentRow = {
  id: string;
  projectId?: string;
  title: string;
  documentType: string;
  fileUrl?: string;
  description?: string;
  uploadedBy?: string;
  createdAt: string;
  project?: { name: string };
};

const emptyDocument = { projectId: "", title: "", documentType: "General", fileUrl: "", description: "", uploadedBy: "" };

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyDocument);

  async function fetchAll() {
    try {
      const [docRes, projectRes] = await Promise.all([documentsApi.getAll(), projectsApi.getAll({ limit: "200" })]);
      setDocuments(docRes.data.data || []);
      setProjects(projectRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, projectId: form.projectId || undefined };
    if (editId) await documentsApi.update(editId, payload);
    else await documentsApi.create(payload);
    setShowModal(false);
    setEditId(null);
    setForm(emptyDocument);
    fetchAll();
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Project Documentation List"
        subtitle="Register project documents, file links and document ownership"
        action={<button onClick={() => { setEditId(null); setForm(emptyDocument); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm rounded-lg"><Plus className="w-4 h-4" /> Add Document</button>}
      />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Documents" value={documents.length} icon={FileText} />
        <Stat label="Projects Covered" value={new Set(documents.map((doc) => doc.project?.name).filter(Boolean)).size} icon={Building2} />
        <Stat label="Document Types" value={new Set(documents.map((doc) => doc.documentType)).size} icon={Landmark} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div> : (
          <table className="w-full text-sm">
            <thead><tr className="bg-amber-500 text-white text-xs">
              {["Title", "Type", "Project", "Uploaded By", "Date", "File", "Actions"].map((h) => <th key={h} className="px-4 py-3 text-left last:text-center">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {documents.length === 0 && <EmptyRow colSpan={7} />}
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-amber-50">
                  <td className="px-4 py-3 font-medium">{doc.title}</td>
                  <td className="px-4 py-3">{doc.documentType}</td>
                  <td className="px-4 py-3 text-gray-500">{doc.project?.name || "General"}</td>
                  <td className="px-4 py-3 text-gray-500">{doc.uploadedBy || "-"}</td>
                  <td className="px-4 py-3">{formatDate(doc.createdAt)}</td>
                  <td className="px-4 py-3">{doc.fileUrl ? <Link className="text-blue-600 hover:underline" href={doc.fileUrl}>Open</Link> : "-"}</td>
                  <td className="px-4 py-3">
                    <Actions
                      onEdit={() => {
                        setEditId(doc.id);
                        setForm({
                          projectId: doc.projectId || "",
                          title: doc.title,
                          documentType: doc.documentType,
                          fileUrl: doc.fileUrl || "",
                          description: doc.description || "",
                          uploadedBy: doc.uploadedBy || "",
                        });
                        setShowModal(true);
                      }}
                      onDelete={async () => { if (await confirmAction("Delete this document?")) { await documentsApi.delete(doc.id); fetchAll(); } }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={save} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold">{editId ? "Edit" : "Add"} Document</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Project</label><ProjectSelect value={form.projectId} onChange={(projectId) => setForm({ ...form, projectId })} projects={projects} /></div>
              <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="col-span-2 px-3 py-2 text-sm border rounded-lg" />
              <input placeholder="Document Type" value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })} className="px-3 py-2 text-sm border rounded-lg" />
              <input placeholder="Uploaded By" value={form.uploadedBy} onChange={(e) => setForm({ ...form, uploadedBy: e.target.value })} className="px-3 py-2 text-sm border rounded-lg" />
              <input placeholder="File URL" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} className="col-span-2 px-3 py-2 text-sm border rounded-lg" />
              <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="col-span-2 px-3 py-2 text-sm border rounded-lg" />
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function ProjectReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.getAll({ limit: "200" })
      .then((res) => setProjects(res.data.data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <PageHeader title="Project Reports" subtitle="Project portfolio report with budget and unit sales summary" />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Stat label="Projects" value={projects.length} icon={Building2} />
        <Stat label="Running" value={projects.filter((p) => p.status === "ACTIVE").length} icon={FileText} />
        <Stat label="Unsold Units" value={projects.reduce((sum, p) => sum + Math.max(0, (p.totalUnits || 0) - (p.soldUnits || 0)), 0)} icon={Landmark} />
        <Stat label="Budget" value={formatCurrency(projects.reduce((sum, p) => sum + (p.budget || 0), 0))} icon={MapPin} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div> : (
          <table className="w-full text-sm">
            <thead><tr className="bg-amber-500 text-white text-xs">
              {["Project", "Type", "Location", "Status", "Budget", "Units", "Sold", "Unsold"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {projects.length === 0 && <EmptyRow colSpan={8} />}
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-amber-50">
                  <td className="px-4 py-3 font-medium">{project.name}</td>
                  <td className="px-4 py-3">{project.type}</td>
                  <td className="px-4 py-3 text-gray-500">{project.location || "-"}</td>
                  <td className="px-4 py-3">{project.status}</td>
                  <td className="px-4 py-3 text-amber-700 font-semibold">{formatCurrency(project.budget || 0)}</td>
                  <td className="px-4 py-3">{project.totalUnits || 0}</td>
                  <td className="px-4 py-3">{project.soldUnits || 0}</td>
                  <td className="px-4 py-3">{Math.max(0, (project.totalUnits || 0) - (project.soldUnits || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

type ShareAssignment = {
  id: string;
  shareCount: number;
  shareValue: number;
  status: string;
  investor: { name: string; phone?: string };
  project: { name: string };
};

export function ShareReportPage() {
  const [rows, setRows] = useState<ShareAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shareProjectApi.getAssignments()
      .then((res) => setRows(res.data.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <PageHeader title="Share Report" subtitle="Assigned share count, value and investor/project distribution" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Assignments" value={rows.length} icon={Share2} />
        <Stat label="Total Shares" value={rows.reduce((sum, row) => sum + row.shareCount, 0).toLocaleString()} icon={FileText} />
        <Stat label="Share Value" value={formatCurrency(rows.reduce((sum, row) => sum + row.shareCount * row.shareValue, 0))} icon={Landmark} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div> : (
          <table className="w-full text-sm">
            <thead><tr className="bg-amber-500 text-white text-xs">
              {["Investor", "Project", "Shares", "Value/Share", "Total", "Status"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 && <EmptyRow colSpan={6} />}
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-amber-50">
                  <td className="px-4 py-3 font-medium">{row.investor.name}</td>
                  <td className="px-4 py-3">{row.project.name}</td>
                  <td className="px-4 py-3">{row.shareCount.toLocaleString()}</td>
                  <td className="px-4 py-3">{formatCurrency(row.shareValue)}</td>
                  <td className="px-4 py-3 font-semibold text-amber-700">{formatCurrency(row.shareCount * row.shareValue)}</td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function ShareholderPointReportPage() {
  const [assignments, setAssignments] = useState<ShareAssignment[]>([]);
  const [investors, setInvestors] = useState<Array<{ id: string; name: string; phone?: string; email?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([shareProjectApi.getAssignments(), investmentApi.getInvestors()])
      .then(([assignmentRes, investorRes]) => {
        setAssignments(assignmentRes.data.data || []);
        setInvestors(investorRes.data.data || []);
      })
      .catch(() => {
        setAssignments([]);
        setInvestors([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const rows = investors.map((investor) => {
    const mine = assignments.filter((assignment) => assignment.investor.name === investor.name);
    return {
      investor,
      projects: new Set(mine.map((assignment) => assignment.project.name)).size,
      shares: mine.reduce((sum, assignment) => sum + assignment.shareCount, 0),
      value: mine.reduce((sum, assignment) => sum + assignment.shareCount * assignment.shareValue, 0),
    };
  });

  return (
    <div className="p-6">
      <PageHeader title="ShareHolder Point Report" subtitle="Investor-wise share points and total share value" />
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div> : (
          <table className="w-full text-sm">
            <thead><tr className="bg-amber-500 text-white text-xs">
              {["Investor", "Phone", "Email", "Projects", "Share Points", "Total Value"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 && <EmptyRow colSpan={6} />}
              {rows.map((row) => (
                <tr key={row.investor.id} className="hover:bg-amber-50">
                  <td className="px-4 py-3 font-medium">{row.investor.name}</td>
                  <td className="px-4 py-3">{row.investor.phone || "-"}</td>
                  <td className="px-4 py-3">{row.investor.email || "-"}</td>
                  <td className="px-4 py-3">{row.projects}</td>
                  <td className="px-4 py-3">{row.shares.toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold text-amber-700">{formatCurrency(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function PenaltyReportPage() {
  const [installments, setInstallments] = useState<Array<{
    id: string;
    client: string;
    clientPhone?: string;
    project?: { name: string };
    unit: string;
    totalAmount: number;
    paid: number;
    schedule?: Array<{ dueDate: string; amount: number; paidAmount: number; status: string }>;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountsApi.getInstallments()
      .then((res) => setInstallments(res.data.data || []))
      .catch(() => setInstallments([]))
      .finally(() => setLoading(false));
  }, []);

  const rows = installments.flatMap((installment) =>
    (installment.schedule || [])
      .filter((item) => item.status !== "paid" && new Date(item.dueDate).getTime() < Date.now())
      .map((item) => {
        const due = Math.max(0, item.amount - item.paidAmount);
        const days = Math.floor((Date.now() - new Date(item.dueDate).getTime()) / 86400000);
        return { installment, item, due, days, penalty: due * 0.02 };
      })
  );

  return (
    <div className="p-6">
      <PageHeader title="Penalty Report" subtitle="Overdue installments with estimated 2% penalty amount" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Overdue Items" value={rows.length} icon={AlertTriangle} />
        <Stat label="Overdue Due" value={formatCurrency(rows.reduce((sum, row) => sum + row.due, 0))} icon={FileText} />
        <Stat label="Estimated Penalty" value={formatCurrency(rows.reduce((sum, row) => sum + row.penalty, 0))} icon={Landmark} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div> : (
          <table className="w-full text-sm">
            <thead><tr className="bg-amber-500 text-white text-xs">
              {["Client", "Project", "Unit", "Due Date", "Days", "Due", "Penalty"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 && <EmptyRow colSpan={7} text="No overdue installments found" />}
              {rows.map((row) => (
                <tr key={`${row.installment.id}-${row.item.dueDate}`} className="hover:bg-amber-50">
                  <td className="px-4 py-3 font-medium">{row.installment.client}</td>
                  <td className="px-4 py-3">{row.installment.project?.name || "-"}</td>
                  <td className="px-4 py-3">{row.installment.unit}</td>
                  <td className="px-4 py-3">{formatDate(row.item.dueDate)}</td>
                  <td className="px-4 py-3">{row.days}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">{formatCurrency(row.due)}</td>
                  <td className="px-4 py-3 text-amber-700 font-semibold">{formatCurrency(row.penalty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function FlatReportPage({ mode }: { mode: "sale" | "collection" | "aging" | "installment" | "plot" }) {
  const [sales, setSales] = useState<Array<{
    id: string;
    saleNo: string;
    customerName: string;
    saleAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: string;
    saleDate: string;
    project?: { name: string };
    unit?: { unitNo: string; type: string };
  }>>([]);
  const [units, setUnits] = useState<Array<{
    id: string;
    unitNo: string;
    type: string;
    status: string;
    price: number;
    project?: { name: string };
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([realEstateApi.getSales(), realEstateApi.getUnits()])
      .then(([saleRes, unitRes]) => {
        setSales(saleRes.data.data || []);
        setUnits(unitRes.data.data || []);
      })
      .catch(() => {
        setSales([]);
        setUnits([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const titleMap = {
    sale: "Flat / Land Sale Report",
    collection: "Sale Collection Report",
    aging: "Aging Report",
    installment: "Installment Report",
    plot: "Plot Distribution Report",
  };

  const subtitleMap = {
    sale: "Sale register with amount, paid and due values",
    collection: "Collection summary by sale and project",
    aging: "Due amount grouped by age from sale date",
    installment: "Installment-linked sales and outstanding collection view",
    plot: "Unit distribution by project, type and status",
  };

  const rows = mode === "plot" ? units : sales;

  return (
    <div className="p-6">
      <PageHeader title={titleMap[mode]} subtitle={subtitleMap[mode]} />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Stat label="Sales" value={sales.length} icon={FileText} />
        <Stat label="Total Sales" value={formatCurrency(sales.reduce((sum, row) => sum + row.saleAmount, 0))} icon={Landmark} />
        <Stat label="Collected" value={formatCurrency(sales.reduce((sum, row) => sum + row.paidAmount, 0))} icon={Share2} />
        <Stat label="Due" value={formatCurrency(sales.reduce((sum, row) => sum + row.dueAmount, 0))} icon={AlertTriangle} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div> : mode === "plot" ? (
          <table className="w-full text-sm">
            <thead><tr className="bg-amber-500 text-white text-xs">
              {["Project", "Unit", "Type", "Status", "Price"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 && <EmptyRow colSpan={5} />}
              {units.map((unit) => (
                <tr key={unit.id} className="hover:bg-amber-50">
                  <td className="px-4 py-3">{unit.project?.name || "-"}</td>
                  <td className="px-4 py-3 font-medium">{unit.unitNo}</td>
                  <td className="px-4 py-3">{unit.type}</td>
                  <td className="px-4 py-3">{unit.status}</td>
                  <td className="px-4 py-3 font-semibold text-amber-700">{formatCurrency(unit.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-amber-500 text-white text-xs">
              {["Sale No", "Customer", "Project", "Unit", "Date", "Sales", "Collected", "Due", "Status"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {sales.length === 0 && <EmptyRow colSpan={9} />}
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-amber-50">
                  <td className="px-4 py-3 font-medium">{sale.saleNo}</td>
                  <td className="px-4 py-3">{sale.customerName}</td>
                  <td className="px-4 py-3">{sale.project?.name || "-"}</td>
                  <td className="px-4 py-3">{sale.unit?.unitNo || "-"}</td>
                  <td className="px-4 py-3">{formatDate(sale.saleDate)}</td>
                  <td className="px-4 py-3">{formatCurrency(sale.saleAmount)}</td>
                  <td className="px-4 py-3 text-green-700">{formatCurrency(sale.paidAmount)}</td>
                  <td className="px-4 py-3 text-red-600">{formatCurrency(sale.dueAmount)}</td>
                  <td className="px-4 py-3">{sale.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
