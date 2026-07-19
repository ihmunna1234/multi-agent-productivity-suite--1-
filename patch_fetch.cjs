const fs = require('fs');

let code = fs.readFileSync('src/components/ManpowerERP.tsx', 'utf-8');

// 1. Add apiFetch import
if (!code.includes('import { apiFetch } from "../utils/api";')) {
  code = code.replace(
    'import { useNavigate } from "react-router-dom";',
    'import { useNavigate } from "react-router-dom";\nimport { apiFetch } from "../utils/api";'
  );
}

// 2. Fix fetchData
const oldFetchData = `  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("workspace_token");
      const headers = { Authorization: \\\`Bearer \\\${token}\\\`, "Content-Type": "application/json" };
      
      const pRes = await fetch("/api/manpower-erp/projects", { headers });
      if (pRes.ok) setProjects(await pRes.json());
      
      const wRes = await fetch("/api/manpower-erp/workers", { headers });
      if (wRes.ok) setWorkers(await wRes.json());
      
      const hRes = await fetch("/api/manpower-erp/monthly-hours", { headers });
      if (hRes.ok) setHours(await hRes.json());

      const payRes = await fetch("/api/manpower-erp/payments", { headers });
      if (payRes.ok) setPayments(await payRes.json());

      const lRes = await fetch("/api/manpower-erp/ledger", { headers });
      if (lRes.ok) setLedger(await lRes.json());
      
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };`;

const newFetchData = `  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await apiFetch("/api/manpower-erp/projects");
      if (pRes.ok) setProjects(await pRes.json());
      
      const wRes = await apiFetch("/api/manpower-erp/workers");
      if (wRes.ok) setWorkers(await wRes.json());
      
      const hRes = await apiFetch("/api/manpower-erp/monthly-hours");
      if (hRes.ok) setHours(await hRes.json());

      const payRes = await apiFetch("/api/manpower-erp/payments");
      if (payRes.ok) setPayments(await payRes.json());

      const lRes = await apiFetch("/api/manpower-erp/ledger");
      if (lRes.ok) setLedger(await lRes.json());
      
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };`;

code = code.replace(oldFetchData.replace(/\\/g, ''), newFetchData);

// 3. Fix handlePost
const oldHandlePost = `  const handlePost = async (url: string, payload: any, closeModal: () => void) => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Authorization": \\\`Bearer \\\${localStorage.getItem("workspace_token")}\\\`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) { closeModal(); fetchData(); }
    } catch (e) { console.error(e); }
  };`;

const newHandlePost = `  const handlePost = async (url: string, payload: any, closeModal: () => void) => {
    try {
      const res = await apiFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) { closeModal(); fetchData(); }
    } catch (e) { console.error(e); }
  };`;

code = code.replace(oldHandlePost.replace(/\\/g, ''), newHandlePost);

fs.writeFileSync('src/components/ManpowerERP.tsx', code);
console.log("Patched ManpowerERP.tsx successfully.");
