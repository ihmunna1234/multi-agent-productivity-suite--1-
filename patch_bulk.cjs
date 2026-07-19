const fs = require('fs');

// --- 1. Update server.ts ---
let serverCode = fs.readFileSync('server.ts', 'utf-8');

const bulkRoute = `  app.post("/api/manpower-erp/workers/bulk", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
      
      const { workers } = req.body;
      const { error } = await supabase.from("erp_workers").upsert(workers);
      if (error) throw error;
      res.json({ success: true, count: workers.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/manpower-erp/workers",`;

if (!serverCode.includes('/api/manpower-erp/workers/bulk')) {
  serverCode = serverCode.replace('  app.post("/api/manpower-erp/workers",', bulkRoute);
  fs.writeFileSync('server.ts', serverCode);
}


// --- 2. Update ManpowerERP.tsx ---
let clientCode = fs.readFileSync('src/components/ManpowerERP.tsx', 'utf-8');

if (!clientCode.includes('UploadCloud')) {
  clientCode = clientCode.replace(
    'Trash2 } from "lucide-react";',
    'Trash2, UploadCloud } from "lucide-react";'
  );
}

const stateInjection = `  const [isUploadingCSV, setIsUploadingCSV] = useState(false);

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCSV(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) {
         alert("CSV is empty or missing data.");
         setIsUploadingCSV(false);
         return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/ /g, '_'));
      
      const workersToInsert = [];
      for (let i = 1; i < lines.length; i++) {
        // Handle basic CSV splitting (ignoring commas inside quotes for now as it's a simple template)
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const worker: any = { id: crypto.randomUUID(), status: "ACTIVE" };
        
        headers.forEach((header, index) => {
           if (header === 'iqama_no' || header === 'iqama') worker.iqama_no = values[index];
           if (header === 'full_name' || header === 'name') worker.full_name = values[index];
           if (header === 'arabic_name') worker.arabic_name = values[index];
           if (header === 'hourly_rate' || header === 'rate') worker.hourly_rate = Number(values[index]) || 0;
           if (header === 'trade') worker.trade = values[index];
           if (header === 'nationality') worker.nationality = values[index];
           if (header === 'bank_name' || header === 'bank') worker.bank_name = values[index];
           if (header === 'iban') worker.iban = values[index];
        });
        
        if (worker.iqama_no && worker.full_name) {
           workersToInsert.push(worker);
        }
      }
      
      if (workersToInsert.length === 0) {
        alert("No valid workers found. Ensure columns like 'iqama_no' and 'full_name' exist.");
        setIsUploadingCSV(false);
        return;
      }

      try {
        const res = await apiFetch("/api/manpower-erp/workers/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workers: workersToInsert })
        });
        if (res.ok) {
           alert(\`Successfully added \${workersToInsert.length} workers.\`);
           fetchData();
        } else {
           alert("Failed to upload workers. Check API logs.");
        }
      } catch (err) {
        console.error(err);
      }
      setIsUploadingCSV(false);
      e.target.value = ''; // reset input
    };
    reader.readAsText(file);
  };
`;

if (!clientCode.includes('const [isUploadingCSV')) {
  clientCode = clientCode.replace(
    'const [isScanning, setIsScanning] = useState(false);',
    `const [isScanning, setIsScanning] = useState(false);\n${stateInjection}`
  );
}

const oldWorkerHeader = `<button onClick={() => { setEditingWorker(null); setShowWorkerModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Add Worker</button>`;
const newWorkerHeader = `
                <label className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                  <UploadCloud size={18} /> {isUploadingCSV ? "Uploading..." : "Bulk CSV"}
                  <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} disabled={isUploadingCSV} />
                </label>
                <button onClick={() => { setEditingWorker(null); setShowWorkerModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus size={18} /> Add Worker</button>`;

clientCode = clientCode.replace(oldWorkerHeader, newWorkerHeader);

fs.writeFileSync('src/components/ManpowerERP.tsx', clientCode);
console.log("Bulk upload added successfully.");
