const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');

const erpRoutes = `
  // ─── MANPOWER ERP ROUTES ────────────────────────────────────────────────────────
  
  // PROJECTS
  app.get("/api/manpower-erp/projects", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
      
      const { data, error } = await supabase.from("erp_projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/manpower-erp/projects", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
      
      const { id, name, client_name, location } = req.body;
      const { error } = await supabase.from("erp_projects").upsert({ id, name, client_name, location });
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/manpower-erp/projects/:id", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
      
      const { error } = await supabase.from("erp_projects").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // WORKERS
  app.get("/api/manpower-erp/workers", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
      
      const { data, error } = await supabase.from("erp_workers").select("*, erp_projects(name)").order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/manpower-erp/workers", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
      
      const { id, iqama_no, full_name, arabic_name, nationality, hourly_rate, status, trade, project_id, bank_name, iban } = req.body;
      const { error } = await supabase.from("erp_workers").upsert({
        id, iqama_no, full_name, arabic_name, nationality, hourly_rate, status, trade, project_id, bank_name, iban
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/manpower-erp/workers/:id", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
      
      const { error } = await supabase.from("erp_workers").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
`;

if (!serverCode.includes('/api/manpower-erp/projects')) {
  // Find the exact place to inject. Before the fallback route:
  // app.get("*", ...
  const insertIndex = serverCode.lastIndexOf('app.get("*",');
  if (insertIndex !== -1) {
    serverCode = serverCode.slice(0, insertIndex) + erpRoutes + '\\n  ' + serverCode.slice(insertIndex);
    fs.writeFileSync('server.ts', serverCode);
    console.log("Successfully injected Manpower ERP routes into server.ts");
  } else {
    console.log("Could not find insertion point.");
  }
} else {
  console.log("Routes already exist.");
}
