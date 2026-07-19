const fs = require('fs');

let clientCode = fs.readFileSync('src/components/ManpowerERP.tsx', 'utf-8');

// 1. Inject state
const stateInjection = `const [selectedProject, setSelectedProject] = useState<string | null>(null);`;
if (!clientCode.includes('const [selectedProject')) {
  clientCode = clientCode.replace(
    'const [editingProject, setEditingProject] = useState<any>(null);',
    `${stateInjection}\n  const [editingProject, setEditingProject] = useState<any>(null);`
  );
}

// 2. Modify Project Name to be clickable
const oldProjectTd = `<td className="p-4 font-bold text-slate-900">{p.name}</td>`;
const newProjectTd = `<td className="p-4 font-bold text-indigo-600 cursor-pointer hover:underline" onClick={() => setSelectedProject(p.id)}>{p.name}</td>`;
clientCode = clientCode.replace(oldProjectTd, newProjectTd);

// 3. Render Project Details if selectedProject is set
const oldProjectsTabStart = `{/* PROJECTS TAB */}
        {activeTab === "projects" && (
          <div className="space-y-6">`;

const newProjectsTabStart = `{/* PROJECTS TAB */}
        {activeTab === "projects" && selectedProject && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-bold text-slate-800">{projects.find(p => p.id === selectedProject)?.name} - Details</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-blue-50 text-blue-600 p-4 rounded-xl"><Users size={24} /></div>
                <div><p className="text-sm font-medium text-slate-500">Project Workers</p><h3 className="text-2xl font-bold text-slate-900">{workers.filter(w => w.project_id === selectedProject).length}</h3></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl"><Wallet size={24} /></div>
                <div><p className="text-sm font-medium text-slate-500">Due Salary (SAR)</p><h3 className="text-2xl font-bold text-slate-900">
                  {ledger.filter(l => workers.filter(w => w.project_id === selectedProject).some(w => w.id === l.worker_id)).reduce((sum, l) => sum + Number(l.outstanding_balance), 0).toLocaleString()}
                </h3></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-indigo-50 text-indigo-600 p-4 rounded-xl"><CheckCircle2 size={24} /></div>
                <div><p className="text-sm font-medium text-slate-500">Total Paid (SAR)</p><h3 className="text-2xl font-bold text-slate-900">
                  {ledger.filter(l => workers.filter(w => w.project_id === selectedProject).some(w => w.id === l.worker_id)).reduce((sum, l) => sum + Number(l.total_paid), 0).toLocaleString()}
                </h3></div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6">
              <div className="p-4 border-b border-slate-200 bg-slate-50"><h3 className="font-bold text-slate-800">Project Employees</h3></div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                  <tr><th className="p-4">Worker</th><th className="p-4">Iqama</th><th className="p-4">Earned</th><th className="p-4">Paid</th><th className="p-4">Due Salary</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workers.filter(w => w.project_id === selectedProject).map(w => {
                    const l = ledger.find(ld => ld.worker_id === w.id);
                    return (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-900">{w.full_name}</td>
                        <td className="p-4 text-slate-600">{w.iqama_no}</td>
                        <td className="p-4 text-slate-600">{Number(l?.total_earned || 0).toLocaleString()} SAR</td>
                        <td className="p-4 text-slate-600">{Number(l?.total_paid || 0).toLocaleString()} SAR</td>
                        <td className="p-4 font-bold text-rose-600">{Number(l?.outstanding_balance || 0).toLocaleString()} SAR</td>
                      </tr>
                    );
                  })}
                  {workers.filter(w => w.project_id === selectedProject).length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No workers in this project.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PROJECTS TAB (LIST) */}
        {activeTab === "projects" && !selectedProject && (
          <div className="space-y-6">`;

clientCode = clientCode.replace(oldProjectsTabStart, newProjectsTabStart);

// Since `activeTab` changing should reset selectedProject, we update the tab click:
const oldTabClick = `onClick={() => setActiveTab(tab)}`;
const newTabClick = `onClick={() => { setActiveTab(tab); setSelectedProject(null); }}`;
clientCode = clientCode.replace(oldTabClick, newTabClick);

fs.writeFileSync('src/components/ManpowerERP.tsx', clientCode);
console.log("Project Details View added successfully.");
