const fs = require('fs');

let emCode = fs.readFileSync('src/components/EmployeeManagement.tsx', 'utf-8');

// 1. Add isPaid to TimesheetEntry
emCode = emCode.replace(
  'notes?: string;',
  'notes?: string;\n  isPaid?: boolean;'
);

// 2. Add allTimesheets state
emCode = emCode.replace(
  'const [timesheets, setTimesheets] = useState<Record<string, TimesheetEntry>>({});',
  'const [timesheets, setTimesheets] = useState<Record<string, TimesheetEntry>>({});\n  const [allTimesheets, setAllTimesheets] = useState<TimesheetEntry[]>([]);'
);

// 3. Fetch allTimesheets in loadEmployeeAndTimesheetData
const fetchReplacement = `const tsList = await getTimesheetsByProject(selectedProjectId, year, month);

      // Fetch all timesheets to calculate past dues
      try {
        const allTsRes = await apiFetch(\`/api/employee-management/timesheets/all?projectId=\${selectedProjectId}\`);
        if (allTsRes.ok) {
          const allTs = await allTsRes.json();
          setAllTimesheets(allTs);
        }
      } catch(e) { console.error(e); }`;
emCode = emCode.replace('const tsList = await getTimesheetsByProject(selectedProjectId, year, month);', fetchReplacement);

// 4. Update calculatedSalaryRows
const calcReplacement = `const basicPayEarned = hourlyRate * ts.regularHours;
      const overtimeEarned = hourlyRate * ts.overtimeHours;
      const totalAllowance = ts.otherAllowances;
      const netSalary = basicPayEarned + totalAllowance - ts.deductions - (ts.advance || 0);

      // Calculate previous due
      let previousDue = 0;
      allTimesheets.forEach(pastTs => {
        if (pastTs.employeeId === emp.id && !pastTs.isPaid) {
          if (pastTs.year < year || (pastTs.year === year && pastTs.month < month)) {
            const pBasic = hourlyRate * pastTs.regularHours;
            const pOT = hourlyRate * pastTs.overtimeHours;
            const pNet = pBasic + pOT + pastTs.otherAllowances - pastTs.deductions - (pastTs.advance || 0);
            previousDue += pNet;
          }
        }
      });
      const netPayable = netSalary + previousDue;

      return {
        employee: emp,
        timesheet: ts,
        dailyRate,
        hourlyRate,
        basicPayEarned,
        overtimeEarned,
        totalAllowance,
        netSalary,
        previousDue,
        netPayable,
      };`;
// We need to replace the old calc block. The old one is:
/*
      const basicPayEarned = hourlyRate * ts.regularHours;
      const overtimeEarned = hourlyRate * ts.overtimeHours;
      const totalAllowance = ts.otherAllowances;
      const netSalary = basicPayEarned + totalAllowance - ts.deductions - (ts.advance || 0);

      return {
        employee: emp,
        timesheet: ts,
        dailyRate,
        hourlyRate,
        basicPayEarned,
        overtimeEarned,
        totalAllowance,
        netSalary,
      };
*/
emCode = emCode.replace(/const basicPayEarned = hourlyRate \* ts\.regularHours;[\s\S]*?netSalary,\n      \};\n    \}\);/, calcReplacement + '\n    });');

// Fix the dependency array of useMemo
emCode = emCode.replace(
  '}, [employees, timesheets]);',
  '}, [employees, timesheets, allTimesheets, year, month]);'
);

// 5. Add toggle Paid logic
const togglePaidFn = `
  const handleTogglePaid = async (row: typeof calculatedSalaryRows[0]) => {
    const newStatus = !row.timesheet.isPaid;
    const entry = { ...row.timesheet, isPaid: newStatus };
    
    // Optimistic UI updates
    setTimesheets(prev => ({ ...prev, [row.employee.id]: entry }));
    setAllTimesheets(prev => prev.map(t => t.id === entry.id ? { ...t, isPaid: newStatus } : t));

    try {
      // Create a dummy body if it's new
      const res = await apiFetch("/api/employee-management/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry)
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch (e) {
      console.error(e);
      alert("Failed to update paid status");
      // Revert optimism if needed (ignored for simplicity)
    }
  };
`;
// Insert before handleExportExcel
emCode = emCode.replace(
  'const handleExportExcel = () => {',
  togglePaidFn + '\n  const handleExportExcel = () => {'
);

fs.writeFileSync('src/components/EmployeeManagement.tsx', emCode);
