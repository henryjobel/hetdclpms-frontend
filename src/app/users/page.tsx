"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { usersApi } from "@/lib/api";
import { Users, UserCheck, Shield, Plus, Search, Loader2, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Role { id: string; name: string; description?: string }
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  role: { name: string };
  createdAt: string;
}

const roleVariant: Record<string, "danger" | "warning" | "info" | "default" | "success" | "gray"> = {
  super_admin: "danger",
  admin: "warning",
  accountant: "info",
  project_manager: "default",
  site_engineer: "success",
  inventory_manager: "gray",
  procurement_officer: "info",
};

const defaultForm = { name: "", email: "", password: "", phone: "", roleId: "" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchAll() {
    try {
      const [ur, rr] = await Promise.all([usersApi.getAll(), usersApi.getRoles()]);
      setUsers(ur.data.data || []);
      setRoles(rr.data.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.roleId) { setError("Select a role"); return; }
    setSaving(true);
    setError("");
    try {
      await usersApi.create(form);
      setShowModal(false);
      setForm(defaultForm);
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  const tableData = filtered.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role.name,
    lastLogin: u.lastLogin,
    status: u.isActive ? "active" : "inactive",
  }));

  return (
    <MainLayout title="Users & Roles" subtitle="Manage team members and role-based permissions">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Users" value={users.length} icon={Users} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Active Users" value={users.filter((u) => u.isActive).length} icon={UserCheck} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Inactive" value={users.filter((u) => !u.isActive).length} icon={Users} iconColor="text-gray-600" iconBg="bg-gray-100" />
        <StatCard title="Roles Defined" value={roles.length} icon={Shield} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      {/* Roles */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Role Permissions Overview</CardTitle></CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-sm text-gray-400">No roles defined yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {roles.map((role) => (
                <div key={role.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={roleVariant[role.name] ?? "default"}>
                      {role.name.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {users.filter((u) => u.role.name === role.name).length} users
                    </span>
                  </div>
                  {role.description && <p className="text-xs text-gray-500 leading-relaxed">{role.description}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team Members</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Add User
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
                {
                  key: "name",
                  header: "Name",
                  render: (v, row) => (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-amber-700">
                          {(v as string).split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{v as string}</p>
                        <p className="text-xs text-gray-400">{row.email as string}</p>
                      </div>
                    </div>
                  ),
                },
                { key: "role", header: "Role", render: (v) => <Badge variant={roleVariant[v as string] ?? "default"}>{(v as string).replace(/_/g, " ")}</Badge> },
                { key: "lastLogin", header: "Last Login", render: (v) => v ? formatDate(v as string) : "—" },
                { key: "status", header: "Status", render: (v) => <Badge variant={v === "active" ? "success" : "gray"}>{v as string}</Badge> },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Add User</h3>
              <button onClick={() => { setShowModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
                <select required value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select Role —</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
