const fs = require('fs');

let code = fs.readFileSync('src/components/ManpowerERP.tsx', 'utf-8');

// Add editingProject state
const stateInjection = `  const [editingProject, setEditingProject] = useState<any>(null);`;
if (!code.includes('const [editingProject')) {
  code = code.replace(
    'const [editingWorker, setEditingWorker] = useState<Worker | null>(null);',
    `${stateInjection}\n  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);`
  );
}

// Update Projects Tab UI Add button to reset editingProject
const oldProjectAddButton = `<button onClick={() => setShowProjectModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Add Project</button>`;
const newProjectAddButton = `<button onClick={() => { setEditingProject(null); setShowProjectModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Add Project</button>`;
code = code.replace(oldProjectAddButton, newProjectAddButton);

// Update Projects table header
const oldProjectHeader = `<thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase"><tr><th className="p-4">Project Name</th><th className="p-4">Client Name</th><th className="p-4">Location</th><th className="p-4">Workers</th></tr></thead>`;
const newProjectHeader = `<thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase"><tr><th className="p-4">Project Name</th><th className="p-4">Client Name</th><th className="p-4">Location</th><th className="p-4">Workers</th><th className="p-4 text-right">Actions</th></tr></thead>`;
code = code.replace(oldProjectHeader, newProjectHeader);

// Update Projects table row
const oldProjectRowEnd = `<td className="p-4 text-slate-600">{workers.filter(w => w.project_id === p.id).length}</td>
                    </tr>`;
const newProjectRowEnd = `<td className="p-4 text-slate-600">{workers.filter(w => w.project_id === p.id).length}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingProject(p); setShowProjectModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(\`/api/manpower-erp/projects/\${p.id}\`)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>`;
code = code.replace(oldProjectRowEnd, newProjectRowEnd);

// Update Project Modal
const oldProjectModal = `<form onSubmit={(e) => { e.preventDefault(); const fd=new FormData(e.currentTarget); handlePost("/api/manpower-erp/projects", { id: crypto.randomUUID(), name: fd.get("name"), client_name: fd.get("client_name"), location: fd.get("location") }, () => setShowProjectModal(false)); }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4">Add Project</h3>
            <div className="space-y-4"><div><label className="block text-sm font-medium mb-1">Project Name *</label><input required name="name" className="w-full border rounded-lg p-2" /></div><div><label className="block text-sm font-medium mb-1">Client Name</label><input name="client_name" className="w-full border rounded-lg p-2" /></div><div><label className="block text-sm font-medium mb-1">Location</label><input name="location" className="w-full border rounded-lg p-2" /></div></div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowProjectModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save</button></div>
          </form>`;

const newProjectModal = `<form onSubmit={(e) => { e.preventDefault(); const fd=new FormData(e.currentTarget); handlePost("/api/manpower-erp/projects", { id: editingProject?.id || crypto.randomUUID(), name: fd.get("name"), client_name: fd.get("client_name"), location: fd.get("location") }, () => { setShowProjectModal(false); setEditingProject(null); }); }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4">{editingProject ? "Edit Project" : "Add Project"}</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Project Name *</label><input required name="name" defaultValue={editingProject?.name || ""} className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Client Name</label><input name="client_name" defaultValue={editingProject?.client_name || ""} className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Location</label><input name="location" defaultValue={editingProject?.location || ""} className="w-full border rounded-lg p-2" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => { setShowProjectModal(false); setEditingProject(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{editingProject ? "Update" : "Save"}</button></div>
          </form>`;

code = code.replace(oldProjectModal, newProjectModal);

fs.writeFileSync('src/components/ManpowerERP.tsx', code);
console.log("Projects edit/delete actions added.");
