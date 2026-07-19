const fs = require('fs');

// --- 1. Update server.ts ---
let serverCode = fs.readFileSync('server.ts', 'utf-8');

const oldBulkRoute = `const { error } = await supabase.from("erp_workers").upsert(workers);`;
const newBulkRoute = `const { error } = await supabase.from("erp_workers").upsert(workers, { onConflict: "iqama_no" });`;

if (serverCode.includes(oldBulkRoute)) {
  serverCode = serverCode.replace(oldBulkRoute, newBulkRoute);
  fs.writeFileSync('server.ts', serverCode);
}

// --- 2. Update ManpowerERP.tsx ---
let clientCode = fs.readFileSync('src/components/ManpowerERP.tsx', 'utf-8');

const oldWorkerCreation = `const worker: any = { id: crypto.randomUUID(), status: "ACTIVE" };`;
const newWorkerCreation = `const worker: any = { status: "ACTIVE" };`;

if (clientCode.includes(oldWorkerCreation)) {
  clientCode = clientCode.replace(oldWorkerCreation, newWorkerCreation);
  fs.writeFileSync('src/components/ManpowerERP.tsx', clientCode);
}

console.log("Fixed bulk upload unique constraint issues.");
