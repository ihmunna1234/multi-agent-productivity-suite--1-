const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');

// 1. Update mapTimesheetRow
serverCode = serverCode.replace(
  'notes: row.notes,',
  'notes: row.notes,\n    isPaid: row.is_paid === true,'
);

// 2. Update POST /api/employee-management/timesheets to accept isPaid
serverCode = serverCode.replace(
  'const { id, projectId, employeeId, year, month, regularHours, overtimeHours, absentDays, otherAllowances, deductions, advance, notes } = req.body;',
  'const { id, projectId, employeeId, year, month, regularHours, overtimeHours, absentDays, otherAllowances, deductions, advance, notes, isPaid } = req.body;'
);

serverCode = serverCode.replace(
  'advance: advance ?? 0,\n          notes: notes || null,',
  'advance: advance ?? 0,\n          notes: notes || null,\n          is_paid: isPaid === true,'
);

// 3. Add GET /api/employee-management/timesheets/all
const allTimesheetsRoute = `
  app.get("/api/employee-management/timesheets/all", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        res.status(503).json({ error: "Supabase is not configured." });
        return;
      }

      const projectId = req.query.projectId as string;
      if (!projectId) {
        res.status(400).json({ error: "projectId is required." });
        return;
      }

      const { data, error } = await supabase
        .from("em_timesheets")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      res.json((data || []).map(mapTimesheetRow));
    } catch (err: any) {
      console.error("[Employee Mgmt] Failed to load all timesheets:", err.message);
      res.status(500).json({ error: "Failed to load timesheets." });
    }
  });
`;

if (!serverCode.includes('/api/employee-management/timesheets/all')) {
  serverCode = serverCode.replace(
    '// ──────────────── POST /api/employee-management/timesheets',
    allTimesheetsRoute + '\n  // ──────────────── POST /api/employee-management/timesheets'
  );
}

fs.writeFileSync('server.ts', serverCode);
