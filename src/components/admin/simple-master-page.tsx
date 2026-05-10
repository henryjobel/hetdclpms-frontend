"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { mastersApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";

type FieldType = "text" | "number" | "email" | "textarea" | "date";

export interface MasterField {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
}

interface MasterRecord {
  id: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface SimpleMasterPageProps {
  title: string;
  subtitle: string;
  masterKey: string;
  singularLabel: string;
  fields: MasterField[];
}

function createEmptyForm(fields: MasterField[]) {
  return fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = "";
    return acc;
  }, {});
}

export function SimpleMasterPage({
  title,
  subtitle,
  masterKey,
  singularLabel,
  fields,
}: SimpleMasterPageProps) {
  const [rows, setRows] = useState<MasterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Record<string, string>>(() => createEmptyForm(fields));
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    try {
      const response = await mastersApi.list(masterKey);
      setRows(response.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, [masterKey]);

  const filtered = rows.filter((row) =>
    fields.some((field) => String(row[field.key] ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(createEmptyForm(fields));
  }

  function openEdit(row: MasterRecord) {
    setEditId(row.id);
    setForm(
      fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.key] = String(row[field.key] ?? "");
        return acc;
      }, {})
    );
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = fields.reduce<Record<string, unknown>>((acc, field) => {
        const value = form[field.key];
        acc[field.key] = field.type === "number" ? Number(value || 0) : value;
        return acc;
      }, {});

      if (editId) await mastersApi.update(masterKey, editId, payload);
      else await mastersApi.create(masterKey, payload);
      closeModal();
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`Delete this ${singularLabel.toLowerCase()}?`)) return;
    await mastersApi.remove(masterKey, id);
    fetchAll();
  }

  return (
    <MainLayout title={title} subtitle={subtitle}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title={`${singularLabel}s`} value={rows.length} icon={Building2} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Active" value={rows.filter((row) => row.isActive !== false).length} icon={Building2} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Inactive" value={rows.filter((row) => row.isActive === false).length} icon={Building2} iconColor="text-gray-600" iconBg="bg-gray-100" />
        <StatCard title="Visible" value={filtered.length} icon={Building2} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title} Register</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${title.toLowerCase()}...`}
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> New {singularLabel}
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={filtered as unknown as Record<string, unknown>[]}
              columns={[
                ...fields.slice(0, 4).map((field) => ({
                  key: field.key,
                  header: field.label,
                  render: (value: unknown) => String(value ?? "-"),
                })),
                {
                  key: "isActive",
                  header: "Status",
                  render: (value: unknown) => (
                    <Badge variant={value === false ? "gray" : "success"}>{value === false ? "Inactive" : "Active"}</Badge>
                  ),
                },
                {
                  key: "id",
                  header: "Actions",
                  render: (value: unknown, row: Record<string, unknown>) => (
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(row as unknown as MasterRecord)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(String(value))} className="p-1.5 rounded-lg bg-red-50 text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? `Edit ${singularLabel}` : `New ${singularLabel}`}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fields.map((field) => (
                  <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}{field.required ? " *" : ""}</label>
                    {field.type === "textarea" ? (
                      <textarea
                        required={field.required}
                        value={form[field.key]}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none"
                      />
                    ) : (
                      <input
                        type={field.type ?? "text"}
                        required={field.required}
                        value={form[field.key]}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
