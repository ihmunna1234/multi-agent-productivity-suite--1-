import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Users, Building2, Wallet, FileText, Download, Briefcase, Calculator, CheckCircle2, Scan, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type Project = { id: string; name: string; client_name: string; location: string; created_at: string; };
type Worker = { id: string; iqama_no: string; full_name: string; arabic_name: string; hourly_rate: number; trade: string; project_id: string; status: string; erp_projects?: { name: string }; };
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
    const [filterProjectId, setFilterProjectId] = useState<string>("");
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

    const exportSalarySheet = () => {
    const filtered = hours.filter(h => h.month === filterMonth && h.year === filterYear);
    if (filtered.length === 0) {
      alert("No records to export for this month.");
      return;
    }
    const headers = ["Worker Name", "Iqama No", "Project", "Month/Year", "Reg Hrs", "Overtime Hrs", "Hourly Rate", "Basic Pay", "Overtime Pay", "Allowances", "Advances", "Deductions", "Net Payable"];
    
    const rows = filtered.map(h => [
      h.erp_workers?.full_name || "",
      h.erp_workers?.iqama_no || "",
      h.erp_projects?.name || "Unassigned",
      `${h.month}/${h.year}`,
      h.total_hours,
      h.overtime_hours,
      h.hourly_rate,
      (h.total_hours * h.hourly_rate).toFixed(2),
      (h.overtime_hours * h.hourly_rate).toFixed(2),
      h.allowances || 0,
      h.advance || 0,
      h.deductions || 0,
      h.net_payable
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.map(x => `"${x}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    link.setAttribute("download", `Salary_Sheet_${monthNames[filterMonth - 1]}_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (url: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await apiFetch(url, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Forms
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const payslipRef = React.useRef<HTMLDivElement>(null);
  const [payslipData, setPayslipData] = useState<MonthlyHour | null>(null);

  useEffect(() => {
    if (payslipData && payslipRef.current) {
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(payslipRef.current!, { scale: 2, useCORS: true, logging: false });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
          
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const empName = payslipData.erp_workers?.full_name?.replace(/\s+/g, '_') || 'Worker';
          const monthStr = monthNames[(payslipData.month || 1) - 1];
          pdf.save(`Payslip_${empName}_${monthStr}_${payslipData.year}.pdf`);
        } catch (e) {
          console.error("PDF generation failed", e);
        } finally {
          setPayslipData(null);
        }
      }, 500);
    }
  }, [payslipData]);

  const handleScanIqama = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result?.toString().split(",")[1];
        if (!base64) throw new Error("Failed to read image");

        const res = await apiFetch("/api/extract-iqama", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            // Autofill form
            const form = document.getElementById("add-worker-form") as HTMLFormElement;
            if (form) {
              const inputs = form.elements as any;
              if (inputs.iqama_no) inputs.iqama_no.value = data.data.iqamaNo || "";
              if (inputs.full_name) inputs.full_name.value = data.data.name || "";
              if (inputs.arabic_name) inputs.arabic_name.value = data.data.nameArabic || "";
            }
          }
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
    }
  };


  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await apiFetch("/api/manpower-erp/projects");
      if (pRes.ok) setProjects(await pRes.json());
      
      const wRes = await apiFetch("/api/manpower-erp/workers");
      if (wRes.ok) setWorkers(await wRes.json());
      
      const hRes = await apiFetch("/api/manpower-erp/monthly-hours");
      if (hRes.ok) setHours(await hRes.json());

      const payRes = await apiFetch("/api/manpower-erp/payments");
      if (payRes.ok) setPayments(await payRes.json());

      const lRes = await apiFetch("/api/manpower-erp/ledger");
      if (lRes.ok) setLedger(await lRes.json());
      
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handlePost = async (url: string, payload: any, closeModal: () => void) => {
    try {
      const res = await apiFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
                className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-colors ${
                  activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
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
                {hours.filter(h => h.month === filterMonth && h.year === filterYear).length === 0 && (
                      <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No timesheets recorded for this month.</td></tr>
                    )}
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
              <div className="flex items-center gap-4">
                <select value={filterProjectId} onChange={e => setFilterProjectId(e.target.value)} className="border border-slate-200 rounded-lg p-2 bg-white text-sm font-medium">
                  <option value="">All Projects</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  <option value="unassigned">Unassigned</option>
                </select>
                <button onClick={() => { setEditingWorker(null); setShowWorkerModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Add Worker</button>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase"><tr><th className="p-4">Iqama No</th><th className="p-4">Full Name</th><th className="p-4">Trade</th><th className="p-4">Project</th><th className="p-4">Rate</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {workers.filter(w => !filterProjectId ? true : filterProjectId === "unassigned" ? !w.project_id : w.project_id === filterProjectId).map(w => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono text-slate-600">{w.iqama_no}</td><td className="p-4 font-bold text-slate-900">{w.full_name}</td><td className="p-4 text-slate-600">{w.trade || '-'}</td><td className="p-4 text-slate-600">{w.erp_projects?.name || '-'}</td><td className="p-4 text-slate-600">{w.hourly_rate} SAR</td><td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">{w.status}</span></td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingWorker(w); setShowWorkerModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(`/api/manpower-erp/workers/${w.id}`)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
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
              <div className="flex items-center gap-4">
                <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                  <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="bg-transparent border-none outline-none font-medium text-slate-700 px-2 cursor-pointer">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(0, m-1).toLocaleString('default', { month: 'long' })}</option>)}
                  </select>
                  <div className="w-px bg-slate-200 mx-2"></div>
                  <input type="number" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="bg-transparent border-none outline-none font-medium text-slate-700 w-20 text-center" />
                </div>
                <button onClick={exportSalarySheet} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><FileText size={18} /> Export Salary Sheet</button>
                <button onClick={() => setShowHoursModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Add Timesheet</button>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase"><tr><th className="p-4">Worker</th><th className="p-4">Month/Year</th><th className="p-4">Project</th><th className="p-4">Reg Hrs</th><th className="p-4">Rate</th><th className="p-4">Net Payable</th><th className="p-4">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {hours.filter(h => h.month === filterMonth && h.year === filterYear).map(h => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{h.erp_workers?.full_name} <br/><span className="font-mono font-normal text-xs text-slate-500">{h.erp_workers?.iqama_no}</span></td>
                      <td className="p-4 text-slate-600">{h.month}/{h.year}</td>
                      <td className="p-4 text-slate-600">{h.erp_projects?.name || '-'}</td>
                      <td className="p-4 text-slate-600">{h.total_hours}</td>
                      <td className="p-4 text-slate-600">{h.hourly_rate}</td>
                      <td className="p-4 font-bold text-slate-900">{h.net_payable} SAR</td>
                      <td className="p-4">
                        <button onClick={() => setPayslipData(h)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Download Payslip">
                          <Download size={18} />
                        </button>
                      </td>
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


      {/* OFF-SCREEN PAYSLIP TEMPLATE FOR PDF */}
      {payslipData && (
        <div className="absolute top-[-9999px] left-[-9999px]">
          <div ref={payslipRef} className="w-[800px] bg-white p-12 text-slate-800 font-sans" dir="ltr">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
              <div>
                <h1 className="text-4xl font-black text-indigo-900 tracking-tight mb-2">PAYSLIP</h1>
                <p className="text-slate-500 font-medium">For the month of {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][(payslipData.month || 1) - 1]} {payslipData.year}</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-slate-900">Manpower Services</h2>
                <p className="text-slate-500">Commercial Registration: 1010XXXXXX</p>
                <p className="text-slate-500">Riyadh, Saudi Arabia</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12">
              {/* Employee Details */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Employee Details</h3>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <p className="text-xl font-bold text-slate-900">{payslipData.erp_workers?.full_name}</p>
                  <p className="text-slate-500 mt-1 mb-4">ID: {payslipData.erp_workers?.iqama_no}</p>
                  <p className="text-sm font-medium text-slate-700">Project: {payslipData.erp_projects?.name || 'Unassigned'}</p>
                </div>
              </div>

              {/* Summary Metrics */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Earnings Summary</h3>
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                  <p className="text-sm font-medium text-indigo-800 mb-1">Net Payable Amount</p>
                  <p className="text-4xl font-black text-indigo-900">{Number(payslipData.net_payable).toFixed(2)} <span className="text-indigo-600 text-lg">SAR</span></p>
                </div>
              </div>
            </div>

            {/* Earnings Table */}
            <div className="mb-12">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Salary Breakdown</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr><th className="p-4 text-sm font-bold text-slate-600">Description</th><th className="p-4 text-sm font-bold text-slate-600 text-right">Amount (SAR)</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-4">
                        <p className="font-bold text-slate-900">Basic Pay</p>
                        <p className="text-xs text-slate-500">{payslipData.total_hours} hrs @ {payslipData.hourly_rate} SAR/hr</p>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900">{(payslipData.total_hours * payslipData.hourly_rate).toFixed(2)}</td>
                    </tr>
                    {payslipData.overtime_hours > 0 && (
                      <tr>
                        <td className="p-4">
                          <p className="font-bold text-slate-900">Overtime Pay</p>
                          <p className="text-xs text-slate-500">{payslipData.overtime_hours} hrs @ {payslipData.hourly_rate} SAR/hr</p>
                        </td>
                        <td className="p-4 text-right font-bold text-slate-900">{(payslipData.overtime_hours * payslipData.hourly_rate).toFixed(2)}</td>
                      </tr>
                    )}
                    {payslipData.earned_salary > (payslipData.total_hours * payslipData.hourly_rate + payslipData.overtime_hours * payslipData.hourly_rate) && (
                      <tr>
                        <td className="p-4 font-bold text-slate-900">Allowances</td>
                        <td className="p-4 text-right font-bold text-slate-900">{(payslipData.earned_salary - (payslipData.total_hours * payslipData.hourly_rate + payslipData.overtime_hours * payslipData.hourly_rate)).toFixed(2)}</td>
                      </tr>
                    )}
                    
                    {/* Deductions if any (difference between earned and payable, usually advance/deductions) */}
                    {payslipData.earned_salary > payslipData.net_payable && (
                      <tr>
                        <td className="p-4 font-bold text-rose-600">Deductions / Advances</td>
                        <td className="p-4 text-right font-bold text-rose-600">- {(payslipData.earned_salary - payslipData.net_payable).toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-900">
                    <tr>
                      <td className="p-4 font-black text-slate-900 uppercase">Total Net Payable</td>
                      <td className="p-4 text-right font-black text-indigo-700 text-xl">{Number(payslipData.net_payable).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-8 border-t border-slate-200 text-center">
              <p className="text-slate-500 text-sm font-medium">This is a computer-generated document. No signature is required.</p>
              <p className="text-slate-400 text-xs mt-2">Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

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
          <form id="add-worker-form" onSubmit={(e) => { e.preventDefault(); const fd=new FormData(e.currentTarget); handlePost("/api/manpower-erp/workers", { id: editingWorker?.id || crypto.randomUUID(), iqama_no: fd.get("iqama_no"), full_name: fd.get("full_name"), arabic_name: fd.get("arabic_name"), hourly_rate: Number(fd.get("hourly_rate")), trade: fd.get("trade"), project_id: fd.get("project_id"), status: "ACTIVE" }, () => { setShowWorkerModal(false); setEditingWorker(null); }); }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
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
