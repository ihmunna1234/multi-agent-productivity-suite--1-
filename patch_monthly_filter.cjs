const fs = require('fs');

let code = fs.readFileSync('src/components/ManpowerERP.tsx', 'utf-8');

// 1. Add state variables for filtering
const stateInjection = `  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());`;

if (!code.includes('const [filterMonth, setFilterMonth]')) {
  code = code.replace(
    'const [loading, setLoading] = useState(false);',
    `const [loading, setLoading] = useState(false);\n${stateInjection}`
  );
}

// 2. Add filter UI to Monthly Hours Tab
const oldTabHeader = `<div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Monthly Hours (Timesheets)</h2>
              <button onClick={() => setShowHoursModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Add Timesheet</button>
            </div>`;

const newTabHeader = `<div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Monthly Hours (Timesheets)</h2>
              <div className="flex items-center gap-4">
                <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                  <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="bg-transparent border-none outline-none font-medium text-slate-700 px-2 cursor-pointer">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(0, m-1).toLocaleString('default', { month: 'long' })}</option>)}
                  </select>
                  <div className="w-px bg-slate-200 mx-2"></div>
                  <input type="number" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="bg-transparent border-none outline-none font-medium text-slate-700 w-20 text-center" />
                </div>
                <button onClick={() => setShowHoursModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Add Timesheet</button>
              </div>
            </div>`;

code = code.replace(oldTabHeader, newTabHeader);

// 3. Filter hours array before mapping
code = code.replace(
  '{hours.map(h => (',
  '{hours.filter(h => h.month === filterMonth && h.year === filterYear).map(h => ('
);

// If there are no hours for the selected month, show a message
const noHoursMessage = `{hours.filter(h => h.month === filterMonth && h.year === filterYear).length === 0 && (
                      <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No timesheets recorded for this month.</td></tr>
                    )}`;

if (!code.includes('No timesheets recorded for this month.')) {
  code = code.replace(
    '</tbody>',
    `${noHoursMessage}\n                  </tbody>`
  );
}

fs.writeFileSync('src/components/ManpowerERP.tsx', code);
console.log("Monthly filter added to Timesheets tab successfully.");
