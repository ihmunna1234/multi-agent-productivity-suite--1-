const fs = require('fs');

let code = fs.readFileSync('src/components/ManpowerERP.tsx', 'utf-8');

// 1. Add missing lucide icons
if (!code.includes('Edit,')) {
  code = code.replace(
    'Scan } from "lucide-react";',
    'Scan, Edit, Trash2 } from "lucide-react";'
  );
}

// 2. Add states for filtering and editing
const stateInjection = `  const [filterProjectId, setFilterProjectId] = useState<string>("");
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  const handleDelete = async (url: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await apiFetch(url, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) {
      console.error("Delete failed", e);
    }
  };
`;

if (!code.includes('const [filterProjectId, setFilterProjectId]')) {
  code = code.replace(
    'const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);',
    `${stateInjection}\n  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);`
  );
}

// 3. Update Workers Tab Header to include Project Filter
const oldWorkersHeader = `<div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Worker Management</h2>
              <button onClick={() => setShowWorkerModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Add Worker</button>
            </div>`;

const newWorkersHeader = `<div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Worker Management</h2>
              <div className="flex items-center gap-4">
                <select value={filterProjectId} onChange={e => setFilterProjectId(e.target.value)} className="border border-slate-200 rounded-lg p-2 bg-white text-sm font-medium">
                  <option value="">All Projects</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  <option value="unassigned">Unassigned</option>
                </select>
                <button onClick={() => { setEditingWorker(null); setShowWorkerModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Add Worker</button>
              </div>
            </div>`;

code = code.replace(oldWorkersHeader, newWorkersHeader);

// 4. Filter Workers array and add Action buttons
const oldWorkersThead = `<thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase"><tr><th className="p-4">Iqama No</th><th className="p-4">Full Name</th><th className="p-4">Trade</th><th className="p-4">Project</th><th className="p-4">Rate</th><th className="p-4">Status</th></tr></thead>`;
const newWorkersThead = `<thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase"><tr><th className="p-4">Iqama No</th><th className="p-4">Full Name</th><th className="p-4">Trade</th><th className="p-4">Project</th><th className="p-4">Rate</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead>`;

code = code.replace(oldWorkersThead, newWorkersThead);

const oldWorkersMap = `{workers.map(w => (`;
const newWorkersMap = `{workers.filter(w => !filterProjectId ? true : filterProjectId === "unassigned" ? !w.project_id : w.project_id === filterProjectId).map(w => (`;

code = code.replace(oldWorkersMap, newWorkersMap);

const oldWorkerTrEnd = `<td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">{w.status}</span></td>
                    </tr>`;

const newWorkerTrEnd = `<td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">{w.status}</span></td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingWorker(w); setShowWorkerModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(\`/api/manpower-erp/workers/\${w.id}\`)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>`;

code = code.replace(oldWorkerTrEnd, newWorkerTrEnd);


// 5. Update Worker Modal to support Editing
const oldWorkerForm = `<form id="add-worker-form" onSubmit={(e) => { e.preventDefault(); const fd=new FormData(e.currentTarget); handlePost("/api/manpower-erp/workers", { id: crypto.randomUUID(), iqama_no: fd.get("iqama_no"), full_name: fd.get("full_name"), arabic_name: fd.get("arabic_name"), hourly_rate: Number(fd.get("hourly_rate")), trade: fd.get("trade"), project_id: fd.get("project_id"), status: "ACTIVE" }, () => setShowWorkerModal(false)); }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Worker</h3>
              <label className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                <Scan size={16} /> {isScanning ? "Scanning..." : "Scan Iqama"}
                <input type="file" accept="image/*" className="hidden" onChange={handleScanIqama} disabled={isScanning} />
              </label>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Iqama No *</label><input required name="iqama_no" className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Full Name *</label><input required name="full_name" className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Arabic Name</label><input name="arabic_name" dir="rtl" className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Hourly Rate (SAR) *</label><input required type="number" step="any" name="hourly_rate" className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Trade</label><input name="trade" className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Assign Project</label><select name="project_id" className="w-full border rounded-lg p-2"><option value="">-- Unassigned --</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowWorkerModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save</button></div>
          </form>`;

const newWorkerForm = `<form id="add-worker-form" onSubmit={(e) => { e.preventDefault(); const fd=new FormData(e.currentTarget); handlePost("/api/manpower-erp/workers", { id: editingWorker?.id || crypto.randomUUID(), iqama_no: fd.get("iqama_no"), full_name: fd.get("full_name"), arabic_name: fd.get("arabic_name"), hourly_rate: Number(fd.get("hourly_rate")), trade: fd.get("trade"), project_id: fd.get("project_id"), status: "ACTIVE" }, () => { setShowWorkerModal(false); setEditingWorker(null); }); }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingWorker ? "Edit Worker" : "Add Worker"}</h3>
              {!editingWorker && (
                <label className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                  <Scan size={16} /> {isScanning ? "Scanning..." : "Scan Iqama"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleScanIqama} disabled={isScanning} />
                </label>
              )}
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Iqama No *</label><input required name="iqama_no" defaultValue={editingWorker?.iqama_no || ""} className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Full Name *</label><input required name="full_name" defaultValue={editingWorker?.full_name || ""} className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Arabic Name</label><input name="arabic_name" dir="rtl" defaultValue={editingWorker?.arabic_name || ""} className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Hourly Rate (SAR) *</label><input required type="number" step="any" name="hourly_rate" defaultValue={editingWorker?.hourly_rate || ""} className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Trade</label><input name="trade" defaultValue={editingWorker?.trade || ""} className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Assign Project</label><select name="project_id" defaultValue={editingWorker?.project_id || ""} className="w-full border rounded-lg p-2"><option value="">-- Unassigned --</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => { setShowWorkerModal(false); setEditingWorker(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{editingWorker ? "Update" : "Save"}</button></div>
          </form>`;

code = code.replace(oldWorkerForm, newWorkerForm);

fs.writeFileSync('src/components/ManpowerERP.tsx', code);
console.log("Worker edit/delete and project filter added successfully.");
