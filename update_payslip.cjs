const fs = require('fs');

let emCode = fs.readFileSync('src/components/EmployeeManagement.tsx', 'utf-8');

// 1. Add html2canvas import
if (!emCode.includes('import html2canvas')) {
  emCode = emCode.replace(
    'import { jsPDF } from "jspdf";',
    'import { jsPDF } from "jspdf";\nimport html2canvas from "html2canvas";'
  );
}

// 2. Add states and useEffect
const statesToAdd = `const payslipRef = useRef<HTMLDivElement>(null);
  const [payslipData, setPayslipData] = useState<typeof calculatedSalaryRows[0] | null>(null);

  useEffect(() => {
    if (payslipData && payslipRef.current) {
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(payslipRef.current!, { scale: 2, useCORS: true, logging: false });
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
          
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save(\`\${activeProject?.name || "Project"}_Payslip_\${payslipData.employee.name.replace(/\\s+/g, '_')}_\${monthNames[month - 1]}_\${year}.pdf\`);
        } catch (error) {
          console.error("Error generating PDF:", error);
        } finally {
          setPayslipData(null);
        }
      }, 500);
    }
  }, [payslipData]);`;

if (!emCode.includes('const [payslipData, setPayslipData]')) {
  emCode = emCode.replace(
    'const [activeTab, setActiveTab] = useState<"projects" | "employees" | "timesheets" | "salary">("projects");',
    'const [activeTab, setActiveTab] = useState<"projects" | "employees" | "timesheets" | "salary">("projects");\n  ' + statesToAdd
  );
}

// 3. Replace handleDownloadPaySlip
const regex = /const handleDownloadPaySlip = \(row: typeof calculatedSalaryRows\[0\]\) => \{[\s\S]*?doc\.save\(filename\);\n    \};/;
const newHandle = `const handleDownloadPaySlip = (row: typeof calculatedSalaryRows[0]) => {
    setPayslipData(row);
  };`;
emCode = emCode.replace(regex, newHandle);


// 4. Add the hidden HTML template at the very end (before the final </div>)
const htmlTemplate = `

      {/* OFF-SCREEN PAYSLIP TEMPLATE FOR PDF */}
      {payslipData && (
        <div className="fixed top-[3000px] left-[3000px] z-[-9999] pointer-events-none">
          <div ref={payslipRef} className="w-[800px] bg-white p-12 text-slate-800 font-sans" dir="ltr">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-8">
              <div>
                <h1 className="text-4xl font-black text-indigo-900 tracking-tight mb-2">PAYSLIP</h1>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{monthNames[month - 1]} {year}</p>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg mb-3 ml-auto">
                  {activeProject?.name?.charAt(0) || "P"}
                </div>
                <p className="text-lg font-bold text-slate-800">{activeProject?.name || "Project Name"}</p>
                <p className="text-xs text-slate-500 max-w-[200px] ml-auto">{activeProject?.location || "Project Location"}</p>
              </div>
            </div>

            {/* Employee Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 flex flex-col gap-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Employee Details</h2>
                <div className="text-xs font-mono bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-bold">
                  ID: {payslipData.employee.iqamaNo}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Full Name</p>
                  <p className="text-xl font-bold text-slate-900">{payslipData.employee.name}</p>
                  {payslipData.employee.nameArabic && <p className="text-sm text-slate-600 font-arabic mt-1" dir="rtl">{payslipData.employee.nameArabic}</p>}
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Trade / Designation</p>
                  <p className="text-lg font-bold text-slate-800">{payslipData.employee.trade}</p>
                </div>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Earnings */}
              <div>
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-100 pb-2 mb-4">Earnings</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-700">Basic Salary</p>
                      <p className="text-[10px] text-slate-500">{payslipData.timesheet.regularHours} hrs @ {payslipData.hourlyRate} SAR/hr</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{payslipData.basicPayEarned.toFixed(2)}</p>
                  </div>
                  {payslipData.overtimeEarned > 0 && (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-slate-700">Overtime Pay</p>
                        <p className="text-[10px] text-slate-500">{payslipData.timesheet.overtimeHours} hrs @ {payslipData.hourlyRate} SAR/hr</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{payslipData.overtimeEarned.toFixed(2)}</p>
                    </div>
                  )}
                  {payslipData.totalAllowance > 0 && (
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-slate-700">Allowances</p>
                      <p className="text-sm font-bold text-slate-900">{payslipData.totalAllowance.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest border-b-2 border-rose-100 pb-2 mb-4">Deductions</h3>
                <div className="space-y-4">
                  {(payslipData.timesheet.advance || 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-slate-700">Advance Taken</p>
                      <p className="text-sm font-bold text-rose-600">- {(payslipData.timesheet.advance || 0).toFixed(2)}</p>
                    </div>
                  )}
                  {payslipData.timesheet.deductions > 0 && (
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-slate-700">Other Deductions</p>
                      <p className="text-sm font-bold text-rose-600">- {payslipData.timesheet.deductions.toFixed(2)}</p>
                    </div>
                  )}
                  {(payslipData.timesheet.advance || 0) === 0 && payslipData.timesheet.deductions === 0 && (
                    <p className="text-sm italic text-slate-400">No deductions this month.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Box */}
            <div className="bg-indigo-900 text-white rounded-3xl p-8 mb-8 shadow-xl">
              <div className="grid grid-cols-3 gap-6 mb-6 pb-6 border-b border-indigo-800">
                <div>
                  <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Current Month Net</p>
                  <p className="text-2xl font-bold">{Math.round(payslipData.netSalary).toFixed(2)} <span className="text-indigo-400 text-sm">SAR</span></p>
                </div>
                <div>
                  <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Past Due</p>
                  <p className="text-2xl font-bold">{Math.round(payslipData.previousDue).toFixed(2)} <span className="text-indigo-400 text-sm">SAR</span></p>
                </div>
                <div className="bg-indigo-800 rounded-xl px-4 py-2 flex flex-col justify-center">
                  <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">Status</p>
                  <p className={\`text-lg font-black uppercase tracking-wider \${payslipData.timesheet.isPaid ? 'text-emerald-400' : 'text-rose-400'}\`}>
                    {payslipData.timesheet.isPaid ? 'PAID' : 'UNPAID'}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-sm font-medium text-indigo-200">TOTAL NET PAYABLE</p>
                <p className="text-5xl font-black">{Math.round(payslipData.netPayable).toFixed(2)} <span className="text-indigo-400 text-2xl">SAR</span></p>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-12 mt-16 px-4">
              <div>
                <div className="border-b-2 border-slate-300 border-dashed mb-2 h-12"></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Prepared By</p>
              </div>
              <div>
                <div className="border-b-2 border-slate-300 border-dashed mb-2 h-12"></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Received By (Employee Signature)</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">
                This is a computer generated document.
              </p>
              <p className="text-[9px] text-slate-400">
                Generated on {new Date().toLocaleDateString('en-GB')} using Injamus AI Productivity Suite
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

if (!emCode.includes('OFF-SCREEN PAYSLIP TEMPLATE')) {
  // Find the last </div>
  const lastIndex = emCode.lastIndexOf('</div>');
  if (lastIndex !== -1) {
    emCode = emCode.substring(0, lastIndex) + htmlTemplate + emCode.substring(lastIndex);
  }
}

fs.writeFileSync('src/components/EmployeeManagement.tsx', emCode);
