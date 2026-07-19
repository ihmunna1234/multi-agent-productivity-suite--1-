const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');

const phase3Routes = `
  // MONTHLY HOURS (TIMESHEETS)
  app.get("/api/manpower-erp/monthly-hours", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
      
      const { data, error } = await supabase.from("erp_monthly_hours").select("*, erp_workers(full_name, iqama_no), erp_projects(name)").order("year", { ascending: false }).order("month", { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/manpower-erp/monthly-hours", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
      
      const { id, worker_id, project_id, year, month, total_hours, overtime_hours, hourly_rate, allowances, advance, deductions } = req.body;
      
      const earned_salary = (Number(total_hours) * Number(hourly_rate)) + (Number(overtime_hours) * Number(hourly_rate) * 1.5);
      const net_payable = earned_salary + Number(allowances) - Number(advance) - Number(deductions);
      
      const { error } = await supabase.from("erp_monthly_hours").upsert({
        id, worker_id, project_id, year, month, total_hours, overtime_hours, hourly_rate, earned_salary, allowances, advance, deductions, net_payable
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PAYMENTS (LEDGER)
  app.get("/api/manpower-erp/payments", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
      
      const { data, error } = await supabase.from("erp_payments").select("*, erp_workers(full_name, iqama_no)").order("payment_date", { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/manpower-erp/payments", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
      
      const { id, worker_id, amount, payment_date, notes } = req.body;
      const { error } = await supabase.from("erp_payments").upsert({
        id, worker_id, amount, payment_date, notes
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/manpower-erp/ledger", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
      
      // Aggregate Ledger: Total Net Payable vs Total Payments per worker
      const { data: workers, error: wErr } = await supabase.from("erp_workers").select("id, full_name, iqama_no");
      if (wErr) throw wErr;
      
      const { data: hours, error: hErr } = await supabase.from("erp_monthly_hours").select("worker_id, net_payable");
      if (hErr) throw hErr;
      
      const { data: payments, error: pErr } = await supabase.from("erp_payments").select("worker_id, amount");
      if (pErr) throw pErr;

      const ledger = workers.map(w => {
        const totalEarned = hours.filter(h => h.worker_id === w.id).reduce((sum, h) => sum + Number(h.net_payable), 0);
        const totalPaid = payments.filter(p => p.worker_id === w.id).reduce((sum, p) => sum + Number(p.amount), 0);
        return {
          worker_id: w.id,
          full_name: w.full_name,
          iqama_no: w.iqama_no,
          total_earned: totalEarned,
          total_paid: totalPaid,
          outstanding_balance: totalEarned - totalPaid
        };
      });

      res.json(ledger);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
`;

if (!serverCode.includes('/api/manpower-erp/monthly-hours')) {
  const insertIndex = serverCode.lastIndexOf('app.get("*",');
  if (insertIndex !== -1) {
    serverCode = serverCode.slice(0, insertIndex) + phase3Routes + '\\n  ' + serverCode.slice(insertIndex);
    fs.writeFileSync('server.ts', serverCode);
    console.log("Successfully injected Phase 3 ERP routes into server.ts");
  } else {
    console.log("Could not find insertion point.");
  }
} else {
  console.log("Routes already exist.");
}
