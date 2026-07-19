const fs = require('fs');

let code = fs.readFileSync('src/components/ManpowerERP.tsx', 'utf-8');

// 1. Add export function inside component
const exportFunction = `  const exportSalarySheet = () => {
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
      \`\${h.month}/\${h.year}\`,
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

    const csvContent = [headers.join(","), ...rows.map(r => r.map(x => \`"\${x}"\`).join(","))].join("\\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    link.setAttribute("download", \`Salary_Sheet_\${monthNames[filterMonth - 1]}_\${filterYear}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
`;

if (!code.includes('const exportSalarySheet = () => {')) {
  code = code.replace(
    'const handleDelete = async (url: string) => {',
    `${exportFunction}\n  const handleDelete = async (url: string) => {`
  );
}

// 2. Add Export button to UI
const oldHeader = `<button onClick={() => setShowHoursModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Add Timesheet</button>`;

const newHeader = `<button onClick={exportSalarySheet} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><FileText size={18} /> Export Salary Sheet</button>
                <button onClick={() => setShowHoursModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Add Timesheet</button>`;

code = code.replace(oldHeader, newHeader);

fs.writeFileSync('src/components/ManpowerERP.tsx', code);
console.log("Added Export Salary Sheet button.");
