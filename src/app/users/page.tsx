"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { usersApi } from "@/lib/api";
import { Users, UserCheck, Shield, Plus, Search, Loader2, X, Pencil, Trash2 } from "lucide-react";
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
  roleId?: string;
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

const defaultCreateForm = { name: "", email: "", password: "", phone: "", roleId: "" };
const defaultEditForm = { name: "", phone: "", roleId: "", isActive: true };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [creating, setCreating] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState(defaultEditForm);
  const [editing, setEditing] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    if (!createForm.roleId) { setError("Select a role"); return; }
    setCreating(true);
    setError("");
    try {
      await usersApi.create(createForm);
      setShowCreateModal(false);
      setCreateForm(defaultCreateForm);
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  function openEdit(u: User) {
    setEditingUser(u);
    setEditForm({ name: u.name, phone: u.phone ?? "", roleId: u.roleId ?? "", isActive: u.isActive });
    setError("");
    setShowEditModal(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditing(true);
    setError("");
    try {
      await usersApi.update(editingUser.id, { name: editForm.name, phone: editForm.phone, roleId: editForm.roleId });
      await usersApi.toggleStatus(editingUser.id, editForm.isActive);
      setShowEditModal(false);
      setEditingUser(null);
      fetchAll();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to update user");
    } finally {
      setEditing(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await usersApi.delete(deleteId);
      setDeleteId(null);
      fetchAll();
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }

  const tableData = filtered.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role.name,
    lastLogin: u.lastLogin,
    status: u.isActive ? "active" : "inactive",
    _raw: u,
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
            <button onClick={() => { setShowCreateModal(true); setError(""); }}
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
                { key: "id", header: "Actions", render: (_, row) => (
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(row._raw as unknown as User)}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Add User</h3>
              <button onClick={() => { setShowCreateModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                <input required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" required value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" required value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
                <select required value={createForm.roleId} onChange={(e) => setCreateForm({ ...createForm, roleId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select Role —</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreateModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Edit User</h3>
              <button onClick={() => { setShowEditModal(false); setError(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input disabled value={editingUser.email}
                  className="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
                <select required value={editForm.roleId} onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select Role —</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700">Status</label>
                <button type="button" onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editForm.isActive ? "bg-green-500" : "bg-gray-300"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editForm.isActive ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <span className="text-xs text-gray-500">{editForm.isActive ? "Active" : "Inactive"}</span>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowEditModal(false); setError(""); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={editing}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium flex items-center gap-2">
                  {editing && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Update User
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
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete User?</h3>
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
