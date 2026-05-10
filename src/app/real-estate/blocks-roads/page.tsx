"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { projectsApi, realEstateApi } from "@/lib/api";
import { Plus, Loader2, X, Trash2 } from "lucide-react";

interface Project { id: string; name: string }
interface BlockRow { id: string; name: string; code?: string; project: { name: string } }
interface RoadRow { id: string; name: string; code?: string; project: { name: string } }

const defaultForm = { projectId: "", name: "", code: "" };

export default function BlocksRoadsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [roads, setRoads] = useState<RoadRow[]>([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showRoadModal, setShowRoadModal] = useState(false);
  const [blockForm, setBlockForm] = useState(defaultForm);
  const [roadForm, setRoadForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    try {
      const [pr, br, rr] = await Promise.all([
        projectsApi.getAll(),
        realEstateApi.getBlocks(),
        realEstateApi.getRoads(),
      ]);
      setProjects(pr.data.data || []);
      setBlocks(br.data.data || []);
      setRoads(rr.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  async function submitBlock(e: React.FormEvent) {
    e.preventDefault();
    await realEstateApi.createBlock(blockForm);
    setShowBlockModal(false);
    setBlockForm(defaultForm);
    fetchAll();
  }

  async function submitRoad(e: React.FormEvent) {
    e.preventDefault();
    await realEstateApi.createRoad(roadForm);
    setShowRoadModal(false);
    setRoadForm(defaultForm);
    fetchAll();
  }

  return (
    <MainLayout title="Blocks & Roads" subtitle="Create land blocks and road references like the reference PMS">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Blocks</CardTitle>
            <button onClick={() => setShowBlockModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium"><Plus className="w-4 h-4" /> Add Block</button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div> : (
              <DataTable data={blocks as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "name", header: "Block" },
                  { key: "code", header: "Code", render: (v) => (v as string) || "—" },
                  { key: "project", header: "Project", render: (_v, row) => (row as unknown as BlockRow).project.name },
                  { key: "id", header: "Action", render: (v) => <button onClick={() => realEstateApi.deleteBlock(v as string).then(fetchAll)} className="p-1.5 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button> },
                ]} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Roads</CardTitle>
            <button onClick={() => setShowRoadModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium"><Plus className="w-4 h-4" /> Add Road</button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div> : (
              <DataTable data={roads as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "name", header: "Road" },
                  { key: "code", header: "Code", render: (v) => (v as string) || "—" },
                  { key: "project", header: "Project", render: (_v, row) => (row as unknown as RoadRow).project.name },
                  { key: "id", header: "Action", render: (v) => <button onClick={() => realEstateApi.deleteRoad(v as string).then(fetchAll)} className="p-1.5 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button> },
                ]} />
            )}
          </CardContent>
        </Card>
      </div>

      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Add Block</h3>
              <button onClick={() => setShowBlockModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={submitBlock} className="p-6 space-y-4">
              <select required value={blockForm.projectId} onChange={(e) => setBlockForm({ ...blockForm, projectId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">Select project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input required value={blockForm.name} onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })} placeholder="Block name" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <input value={blockForm.code} onChange={(e) => setBlockForm({ ...blockForm, code: e.target.value })} placeholder="Code" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowBlockModal(false)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">Create</button></div>
            </form>
          </div>
        </div>
      )}

      {showRoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Add Road</h3>
              <button onClick={() => setShowRoadModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={submitRoad} className="p-6 space-y-4">
              <select required value={roadForm.projectId} onChange={(e) => setRoadForm({ ...roadForm, projectId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">Select project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input required value={roadForm.name} onChange={(e) => setRoadForm({ ...roadForm, name: e.target.value })} placeholder="Road name" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <input value={roadForm.code} onChange={(e) => setRoadForm({ ...roadForm, code: e.target.value })} placeholder="Code" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowRoadModal(false)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">Create</button></div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
