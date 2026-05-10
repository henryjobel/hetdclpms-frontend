"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { adminApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Plus, Save, Shield, Users, X } from "lucide-react";

interface Permission {
  module: string;
  action: string;
}

interface RoleRow {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  _count: { users: number };
}

const defaultForm = { name: "", description: "", permissions: [] as string[] };

export function RolePermissionsPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [catalog, setCatalog] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    try {
      const [rolesRes, catalogRes] = await Promise.all([adminApi.getRoles(), adminApi.getPermissionCatalog()]);
      setRoles(rolesRes.data.data || []);
      setCatalog(catalogRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(defaultForm);
  }

  function togglePermission(permissionKey: string) {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permissionKey)
        ? current.permissions.filter((item) => item !== permissionKey)
        : [...current.permissions, permissionKey],
    }));
  }

  function openEdit(role: RoleRow) {
    setEditId(role.id);
    setForm({
      name: role.name,
      description: role.description ?? "",
      permissions: role.permissions.map((permission) => `${permission.module}:${permission.action}`),
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      permissions: form.permissions.map((permission) => {
        const [module, action] = permission.split(":");
        return { module, action };
      }),
    };
    try {
      if (editId) await adminApi.updateRole(editId, payload);
      else await adminApi.createRole(payload);
      closeModal();
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout title="User Roles & Permissions" subtitle="Configure role access and permission coverage across modules">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Roles" value={roles.length} icon={Shield} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Permission Rules" value={catalog.length} icon={Shield} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="Assigned Users" value={roles.reduce((sum, row) => sum + row._count.users, 0)} icon={Users} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Custom Roles" value={roles.filter((row) => !["admin", "user"].includes(row.name)).length} icon={Shield} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Role Register</CardTitle>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> New Role
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={roles as unknown as Record<string, unknown>[]}
              columns={[
                { key: "name", header: "Role", render: (value) => <Badge variant="info">{String(value).replace(/_/g, " ")}</Badge> },
                { key: "description", header: "Description", render: (value) => String(value ?? "-") },
                { key: "permissions", header: "Permissions", render: (_value, row) => `${(row as unknown as RoleRow).permissions.length} rules` },
                { key: "_count", header: "Users", render: (_value, row) => (row as unknown as RoleRow)._count.users },
                {
                  key: "id",
                  header: "Actions",
                  render: (_value, row) => (
                    <button onClick={() => openEdit(row as unknown as RoleRow)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editId ? "Edit Role" : "New Role"}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-3">Permissions</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {catalog.map((permission) => {
                    const key = `${permission.module}:${permission.action}`;
                    const checked = form.permissions.includes(key);
                    return (
                      <label key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${checked ? "border-amber-400 bg-amber-50" : "border-gray-200"}`}>
                        <input type="checkbox" checked={checked} onChange={() => togglePermission(key)} />
                        <span className="text-sm text-gray-700 capitalize">{permission.module} / {permission.action}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editId ? "Update Role" : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
