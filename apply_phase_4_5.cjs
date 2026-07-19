const fs = require('fs');

let code = fs.readFileSync('src/components/ManpowerERP.tsx', 'utf-8');

// 1. Add html2canvas and jsPDF imports, and Scan icon
if (!code.includes('import { jsPDF } from "jspdf"')) {
  code = code.replace(
    'import { useNavigate } from "react-router-dom";\nimport { apiFetch } from "../utils/api";',
    `import { useNavigate } from "react-router-dom";\nimport { apiFetch } from "../utils/api";\nimport html2canvas from "html2canvas";\nimport { jsPDF } from "jspdf";`
  );
  code = code.replace(
    'import { ArrowLeft, Plus, Users, Building2, Wallet, FileText, Download, Briefcase, Calculator, CheckCircle2 } from "lucide-react";',
    'import { ArrowLeft, Plus, Users, Building2, Wallet, FileText, Download, Briefcase, Calculator, CheckCircle2, Scan } from "lucide-react";'
  );
}

// 2. Add arabic_name to Worker type
if (!code.includes('arabic_name: string;')) {
  code = code.replace(
    'type Worker = { id: string; iqama_no: string; full_name: string;',
    'type Worker = { id: string; iqama_no: string; full_name: string; arabic_name: string;'
  );
}

// 3. Add states and refs for Payslip and Scanner
const statesInjection = `
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
          const empName = payslipData.erp_workers?.full_name?.replace(/\\s+/g, '_') || 'Worker';
          const monthStr = monthNames[(payslipData.month || 1) - 1];
          pdf.save(\`Payslip_\${empName}_\${monthStr}_\${payslipData.year}.pdf\`);
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
`;

code = code.replace(
  'const [showPaymentModal, setShowPaymentModal] = useState(false);',
  'const [showPaymentModal, setShowPaymentModal] = useState(false);\n' + statesInjection
);

// 4. Update the Worker Form to include arabic_name and scan button
const oldWorkerForm = `<form onSubmit={(e) => { e.preventDefault(); const fd=new FormData(e.currentTarget); handlePost("/api/manpower-erp/workers", { id: crypto.randomUUID(), iqama_no: fd.get("iqama_no"), full_name: fd.get("full_name"), hourly_rate: Number(fd.get("hourly_rate")), trade: fd.get("trade"), project_id: fd.get("project_id"), status: "ACTIVE" }, () => setShowWorkerModal(false)); }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4">Add Worker</h3>
            <div className="space-y-4"><div><label className="block text-sm font-medium mb-1">Iqama No *</label><input required name="iqama_no" className="w-full border rounded-lg p-2" /></div><div><label className="block text-sm font-medium mb-1">Full Name *</label><input required name="full_name" className="w-full border rounded-lg p-2" /></div><div><label className="block text-sm font-medium mb-1">Hourly Rate (SAR) *</label><input required type="number" step="any" name="hourly_rate" className="w-full border rounded-lg p-2" /></div><div><label className="block text-sm font-medium mb-1">Trade</label><input name="trade" className="w-full border rounded-lg p-2" /></div><div><label className="block text-sm font-medium mb-1">Assign Project</label><select name="project_id" className="w-full border rounded-lg p-2"><option value="">-- Unassigned --</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowWorkerModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save</button></div>
          </form>`;

const newWorkerForm = `<form id="add-worker-form" onSubmit={(e) => { e.preventDefault(); const fd=new FormData(e.currentTarget); handlePost("/api/manpower-erp/workers", { id: crypto.randomUUID(), iqama_no: fd.get("iqama_no"), full_name: fd.get("full_name"), arabic_name: fd.get("arabic_name"), hourly_rate: Number(fd.get("hourly_rate")), trade: fd.get("trade"), project_id: fd.get("project_id"), status: "ACTIVE" }, () => setShowWorkerModal(false)); }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
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

code = code.replace(oldWorkerForm, newWorkerForm);

// 5. Update Monthly Hours table to add the download button
const oldHoursTr = `<td className="p-4 font-bold text-slate-900">{h.net_payable} SAR</td>`;
const newHoursTr = `<td className="p-4 font-bold text-slate-900">{h.net_payable} SAR</td>
                      <td className="p-4">
                        <button onClick={() => setPayslipData(h)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Download Payslip">
                          <Download size={18} />
                        </button>
                      </td>`;
code = code.replace(new RegExp(oldHoursTr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), newHoursTr);

const oldHoursTh = `<th className="p-4">Net Payable</th></tr></thead>`;
const newHoursTh = `<th className="p-4">Net Payable</th><th className="p-4">Action</th></tr></thead>`;
code = code.replace(oldHoursTh, newHoursTh);

// 6. Add Payslip template right before the closing div of the component
const payslipTemplate = `
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
`;

code = code.replace(
  '      {/* Modals */}',
  payslipTemplate + '\n      {/* Modals */}'
);

fs.writeFileSync('src/components/ManpowerERP.tsx', code);
console.log("Successfully added Phase 4 and Phase 5 features.");
