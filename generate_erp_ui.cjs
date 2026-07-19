const fs = require('fs');

const reactCode = `import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Users, Building2, Wallet, FileText, Download, Briefcase, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Project = {
  id: string;
  name: string;
  client_name: string;
  location: string;
  created_at: string;
};

type Worker = {
  id: string;
  iqama_no: string;
  full_name: string;
  arabic_name: string;
  nationality: string;
  hourly_rate: number;
  status: string;
  trade: string;
  project_id: string;
  bank_name: string;
  iban: string;
  erp_projects?: { name: string };
};

export default function ManpowerERP() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);

  // Forms
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("workspace_token");
      const headers = { Authorization: \`Bearer \${token}\`, "Content-Type": "application/json" };
      
      const pRes = await fetch("/api/manpower-erp/projects", { headers });
      if (pRes.ok) setProjects(await pRes.json());
      
      const wRes = await fetch("/api/manpower-erp/workers", { headers });
      if (wRes.ok) setWorkers(await wRes.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: crypto.randomUUID(),
      name: fd.get("name"),
      client_name: fd.get("client_name"),
      location: fd.get("location")
    };
    
    try {
      const res = await fetch("/api/manpower-erp/projects", {
        method: "POST",
        headers: {
          "Authorization": \`Bearer \${localStorage.getItem("workspace_token")}\`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowProjectModal(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveWorker = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: crypto.randomUUID(),
      iqama_no: fd.get("iqama_no"),
      full_name: fd.get("full_name"),
      hourly_rate: Number(fd.get("hourly_rate")),
      trade: fd.get("trade"),
      project_id: fd.get("project_id"),
      status: "ACTIVE"
    };
    
    try {
      const res = await fetch("/api/manpower-erp/workers", {
        method: "POST",
        headers: {
          "Authorization": \`Bearer \${localStorage.getItem("workspace_token")}\`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowWorkerModal(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-slate-900 leading-none">Manpower ERP</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">Enterprise Workforce System</p>
            </div>
          </div>
          
          <nav className="flex space-x-1">
            {['dashboard', 'projects', 'workers', 'monthly-hours', 'payments'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={\`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-colors \${
                  activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }\`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6">
        
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-blue-50 text-blue-600 p-4 rounded-xl"><Users size={24} /></div>
                <div><p className="text-sm font-medium text-slate-500">Total Workers</p><h3 className="text-2xl font-bold text-slate-900">{workers.length}</h3></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl"><Building2 size={24} /></div>
                <div><p className="text-sm font-medium text-slate-500">Active Projects</p><h3 className="text-2xl font-bold text-slate-900">{projects.length}</h3></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-amber-50 text-amber-600 p-4 rounded-xl"><Wallet size={24} /></div>
                <div><p className="text-sm font-medium text-slate-500">Total Outstanding</p><h3 className="text-2xl font-bold text-slate-900">0.00</h3></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-indigo-50 text-indigo-600 p-4 rounded-xl"><Calculator size={24} /></div>
                <div><p className="text-sm font-medium text-slate-500">Total Paid (Month)</p><h3 className="text-2xl font-bold text-slate-900">0.00</h3></div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">ERP Architecture Initialized</h2>
              <p className="text-slate-500 max-w-lg mx-auto">Select the Projects or Workers tab to begin setting up your workforce and assigning them to active client sites.</p>
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Project Management</h2>
              <button onClick={() => setShowProjectModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                <Plus size={18} /> Add Project
              </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                  <tr><th className="p-4">Project Name</th><th className="p-4">Client Name</th><th className="p-4">Location</th><th className="p-4">Workers</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{p.name}</td>
                      <td className="p-4 text-slate-600">{p.client_name || '-'}</td>
                      <td className="p-4 text-slate-600">{p.location || '-'}</td>
                      <td className="p-4 text-slate-600">{workers.filter(w => w.project_id === p.id).length}</td>
                    </tr>
                  ))}
                  {projects.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No projects found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WORKERS TAB */}
        {activeTab === "workers" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Worker Management</h2>
              <button onClick={() => setShowWorkerModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                <Plus size={18} /> Add Worker
              </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                  <tr><th className="p-4">Iqama No</th><th className="p-4">Full Name</th><th className="p-4">Trade</th><th className="p-4">Project</th><th className="p-4">Rate (SAR)</th><th className="p-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workers.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono text-slate-600">{w.iqama_no}</td>
                      <td className="p-4 font-bold text-slate-900">{w.full_name}</td>
                      <td className="p-4 text-slate-600">{w.trade || '-'}</td>
                      <td className="p-4 text-slate-600">{w.erp_projects?.name || '-'}</td>
                      <td className="p-4 text-slate-600">{w.hourly_rate}</td>
                      <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">{w.status}</span></td>
                    </tr>
                  ))}
                  {workers.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No workers found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {(activeTab === "monthly-hours" || activeTab === "payments") && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <Calculator size={48} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Coming Soon</h2>
            <p className="text-slate-500 max-w-lg mx-auto">This module will be built in Phase 3 of the ERP integration plan.</p>
          </div>
        )}

      </main>

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveProject} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4">Add Project</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Project Name *</label><input required name="name" className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Client Name</label><input name="client_name" className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Location</label><input name="location" className="w-full border rounded-lg p-2" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowProjectModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save Project</button>
            </div>
          </form>
        </div>
      )}

      {/* Worker Modal */}
      {showWorkerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveWorker} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4">Add Worker</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Iqama Number *</label><input required name="iqama_no" className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Full Name (English) *</label><input required name="full_name" className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Hourly Rate (SAR) *</label><input required type="number" step="any" name="hourly_rate" className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Trade/Designation</label><input name="trade" className="w-full border rounded-lg p-2" /></div>
              <div>
                <label className="block text-sm font-medium mb-1">Assign Project</label>
                <select name="project_id" className="w-full border rounded-lg p-2">
                  <option value="">-- Unassigned --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowWorkerModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save Worker</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/components/ManpowerERP.tsx', reactCode);
console.log('Successfully wrote ManpowerERP.tsx');
