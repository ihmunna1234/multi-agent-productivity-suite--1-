const fs = require('fs');

const reactCode = `import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Users, Building2, Wallet, FileText, Download, Briefcase, Calculator, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Project = { id: string; name: string; client_name: string; location: string; created_at: string; };
type Worker = { id: string; iqama_no: string; full_name: string; hourly_rate: number; trade: string; project_id: string; status: string; erp_projects?: { name: string }; };
type MonthlyHour = { id: string; worker_id: string; project_id: string; year: number; month: number; total_hours: number; overtime_hours: number; hourly_rate: number; earned_salary: number; net_payable: number; erp_workers?: { full_name: string, iqama_no: string }; erp_projects?: { name: string } };
type Payment = { id: string; worker_id: string; amount: number; payment_date: string; notes: string; erp_workers?: { full_name: string, iqama_no: string } };
type Ledger = { worker_id: string; full_name: string; iqama_no: string; total_earned: number; total_paid: number; outstanding_balance: number; };

export default function ManpowerERP() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [hours, setHours] = useState<MonthlyHour[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(false);

  // Forms
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("workspace_token");
      const headers = { Authorization: \`Bearer \${token}\`, "Content-Type": "application/json" };
      
      const pRes = await fetch("/api/manpower-erp/projects", { headers });
      if (pRes.ok) setProjects(await pRes.json());
      
      const wRes = await fetch("/api/manpower-erp/workers", { headers });
      if (wRes.ok) setWorkers(await wRes.json());
      
      const hRes = await fetch("/api/manpower-erp/monthly-hours", { headers });
      if (hRes.ok) setHours(await hRes.json());

      const payRes = await fetch("/api/manpower-erp/payments", { headers });
      if (payRes.ok) setPayments(await payRes.json());

      const lRes = await fetch("/api/manpower-erp/ledger", { headers });
      if (lRes.ok) setLedger(await lRes.json());
      
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handlePost = async (url: string, payload: any, closeModal: () => void) => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Authorization": \`Bearer \${localStorage.getItem("workspace_token")}\`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) { closeModal(); fetchData(); }
    } catch (e) { console.error(e); }
  };

  const totalOutstanding = ledger.reduce((sum, l) => sum + Number(l.outstanding_balance), 0);
  const totalPaid = ledger.reduce((sum, l) => sum + Number(l.total_paid), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
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
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl"><Wallet size={24} /></div>
                <div><p className="text-sm font-medium text-slate-500">Total Outstanding (SAR)</p><h3 className="text-2xl font-bold text-slate-900">{totalOutstanding.toLocaleString()}</h3></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-indigo-50 text-indigo-600 p-4 rounded-xl"><CheckCircle2 size={24} /></div>
                <div><p className="text-sm font-medium text-slate-500">Total Paid All Time (SAR)</p><h3 className="text-2xl font-bold text-slate-900">{totalPaid.toLocaleString()}</h3></div>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6">
              <div className="p-4 border-b border-slate-200 bg-slate-50"><h3 className="font-bold text-slate-800">Worker Ledger Summary (Outstanding Balances)</h3></div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                  <tr><th className="p-4">Worker</th><th className="p-4">Iqama</th><th className="p-4">Total Earned</th><th className="p-4">Total Paid</th><th className="p-4">Outstanding Balance</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledger.filter(l => l.outstanding_balance > 0).map(l => (
                    <tr key={l.worker_id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{l.full_name}</td>
                      <td className="p-4 text-slate-600">{l.iqama_no}</td>
                      <td className="p-4 text-slate-600">{Number(l.total_earned).toLocaleString()} SAR</td>
                      <td className="p-4 text-slate-600">{Number(l.total_paid).toLocaleString()} SAR</td>
                      <td className="p-4 font-bold text-rose-600">{Number(l.outstanding_balance).toLocaleString()} SAR</td>
                    </tr>
                  ))}
                  {ledger.filter(l => l.outstanding_balance > 0).length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No outstanding balances.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Project Management</h2>
              <button onClick={() => setShowProjectModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Add Project</button>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase"><tr><th className="p-4">Project Name</th><th className="p-4">Client Name</th><th className="p-4">Location</th><th className="p-4">Workers</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{p.name}</td>
                      <td className="p-4 text-slate-600">{p.client_name || '-'}</td>
                      <td className="p-4 text-slate-600">{p.location || '-'}</td>
                      <td className="p-4 text-slate-600">{workers.filter(w => w.project_id === p.id).length}</td>
                    </tr>
                  ))}
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
              <button onClick={() => setShowWorkerModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Add Worker</button>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase"><tr><th className="p-4">Iqama No</th><th className="p-4">Full Name</th><th className="p-4">Trade</th><th className="p-4">Project</th><th className="p-4">Rate</th><th className="p-4">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {workers.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono text-slate-600">{w.iqama_no}</td><td className="p-4 font-bold text-slate-900">{w.full_name}</td><td className="p-4 text-slate-600">{w.trade || '-'}</td><td className="p-4 text-slate-600">{w.erp_projects?.name || '-'}</td><td className="p-4 text-slate-600">{w.hourly_rate} SAR</td><td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">{w.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MONTHLY HOURS TAB */}
        {activeTab === "monthly-hours" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Monthly Hours (Timesheets)</h2>
              <button onClick={() => setShowHoursModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Add Timesheet</button>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase"><tr><th className="p-4">Worker</th><th className="p-4">Month/Year</th><th className="p-4">Project</th><th className="p-4">Reg Hrs</th><th className="p-4">Rate</th><th className="p-4">Net Payable</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {hours.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{h.erp_workers?.full_name} <br/><span className="font-mono font-normal text-xs text-slate-500">{h.erp_workers?.iqama_no}</span></td>
                      <td className="p-4 text-slate-600">{h.month}/{h.year}</td>
                      <td className="p-4 text-slate-600">{h.erp_projects?.name || '-'}</td>
                      <td className="p-4 text-slate-600">{h.total_hours}</td>
                      <td className="p-4 text-slate-600">{h.hourly_rate}</td>
                      <td className="p-4 font-bold text-slate-900">{h.net_payable} SAR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Payments Ledger</h2>
              <button onClick={() => setShowPaymentModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Record Payment</button>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase"><tr><th className="p-4">Date</th><th className="p-4">Worker</th><th className="p-4">Amount</th><th className="p-4">Notes</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-600">{new Date(p.payment_date).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-slate-900">{p.erp_workers?.full_name} <br/><span className="font-mono font-normal text-xs text-slate-500">{p.erp_workers?.iqama_no}</span></td>
                      <td className="p-4 font-bold text-emerald-600">+{p.amount} SAR</td>
                      <td className="p-4 text-slate-600">{p.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={(e) => { e.preventDefault(); const fd=new FormData(e.currentTarget); handlePost("/api/manpower-erp/projects", { id: crypto.randomUUID(), name: fd.get("name"), client_name: fd.get("client_name"), location: fd.get("location") }, () => setShowProjectModal(false)); }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4">Add Project</h3>
            <div className="space-y-4"><div><label className="block text-sm font-medium mb-1">Project Name *</label><input required name="name" className="w-full border rounded-lg p-2" /></div><div><label className="block text-sm font-medium mb-1">Client Name</label><input name="client_name" className="w-full border rounded-lg p-2" /></div><div><label className="block text-sm font-medium mb-1">Location</label><input name="location" className="w-full border rounded-lg p-2" /></div></div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowProjectModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save</button></div>
          </form>
        </div>
      )}

      {showWorkerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={(e) => { e.preventDefault(); const fd=new FormData(e.currentTarget); handlePost("/api/manpower-erp/workers", { id: crypto.randomUUID(), iqama_no: fd.get("iqama_no"), full_name: fd.get("full_name"), hourly_rate: Number(fd.get("hourly_rate")), trade: fd.get("trade"), project_id: fd.get("project_id"), status: "ACTIVE" }, () => setShowWorkerModal(false)); }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4">Add Worker</h3>
            <div className="space-y-4"><div><label className="block text-sm font-medium mb-1">Iqama No *</label><input required name="iqama_no" className="w-full border rounded-lg p-2" /></div><div><label className="block text-sm font-medium mb-1">Full Name *</label><input required name="full_name" className="w-full border rounded-lg p-2" /></div><div><label className="block text-sm font-medium mb-1">Hourly Rate (SAR) *</label><input required type="number" step="any" name="hourly_rate" className="w-full border rounded-lg p-2" /></div><div><label className="block text-sm font-medium mb-1">Trade</label><input name="trade" className="w-full border rounded-lg p-2" /></div><div><label className="block text-sm font-medium mb-1">Assign Project</label><select name="project_id" className="w-full border rounded-lg p-2"><option value="">-- Unassigned --</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowWorkerModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save</button></div>
          </form>
        </div>
      )}

      {showHoursModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={(e) => { e.preventDefault(); const fd=new FormData(e.currentTarget); const w = workers.find(x => x.id === fd.get("worker_id")); handlePost("/api/manpower-erp/monthly-hours", { id: crypto.randomUUID(), worker_id: fd.get("worker_id"), project_id: w?.project_id, year: Number(fd.get("year")), month: Number(fd.get("month")), total_hours: Number(fd.get("total_hours")), overtime_hours: Number(fd.get("overtime_hours")), hourly_rate: w?.hourly_rate, allowances: Number(fd.get("allowances")), advance: Number(fd.get("advance")), deductions: Number(fd.get("deductions")) }, () => setShowHoursModal(false)); }} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-xl font-bold mb-4">Record Monthly Hours</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-sm font-medium mb-1">Worker *</label><select required name="worker_id" className="w-full border rounded-lg p-2"><option value="">-- Select Worker --</option>{workers.map(w => <option key={w.id} value={w.id}>{w.full_name} ({w.iqama_no})</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Month *</label><select required name="month" className="w-full border rounded-lg p-2">{[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(0, m-1).toLocaleString('default', { month: 'long' })}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Year *</label><input required type="number" name="year" defaultValue={new Date().getFullYear()} className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Total Reg Hours *</label><input required type="number" step="any" name="total_hours" className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Overtime Hours</label><input type="number" step="any" defaultValue={0} name="overtime_hours" className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Allowances</label><input type="number" step="any" defaultValue={0} name="allowances" className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Deductions</label><input type="number" step="any" defaultValue={0} name="deductions" className="w-full border rounded-lg p-2" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowHoursModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save</button></div>
          </form>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={(e) => { e.preventDefault(); const fd=new FormData(e.currentTarget); handlePost("/api/manpower-erp/payments", { id: crypto.randomUUID(), worker_id: fd.get("worker_id"), amount: Number(fd.get("amount")), payment_date: new Date().toISOString(), notes: fd.get("notes") }, () => setShowPaymentModal(false)); }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4">Record Payment</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Worker *</label><select required name="worker_id" className="w-full border rounded-lg p-2"><option value="">-- Select Worker --</option>{ledger.filter(l => l.outstanding_balance > 0).map(l => <option key={l.worker_id} value={l.worker_id}>{l.full_name} (Owes: {l.outstanding_balance} SAR)</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Amount (SAR) *</label><input required type="number" step="any" name="amount" className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Notes</label><input name="notes" className="w-full border rounded-lg p-2" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Record Payment</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/components/ManpowerERP.tsx', reactCode);
console.log('Successfully wrote ManpowerERP.tsx with Phase 3 UI updates.');
