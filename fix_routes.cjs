const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');

// Find the start of the MANPOWER ERP ROUTES
const startMarker = '// ─── MANPOWER ERP ROUTES ────────────────────────────────────────────────────────';
const startIndex = serverCode.indexOf(startMarker);

if (startIndex !== -1) {
  // Find the end. The last route is /api/manpower-erp/ledger.
  // It ends with res.status(500).json({ error: err.message }); } });
  const endMarker = 'app.get("*", (req, res) => {';
  const endIndex = serverCode.indexOf(endMarker, startIndex);
  
  if (endIndex !== -1) {
    // Extract the block
    let erpRoutes = serverCode.slice(startIndex, endIndex);
    
    // Remove the block from its current location
    serverCode = serverCode.slice(0, startIndex) + serverCode.slice(endIndex);
    
    // Insert it right before "async function serveApp() {"
    const targetMarker = 'async function serveApp() {';
    const targetIndex = serverCode.indexOf(targetMarker);
    
    if (targetIndex !== -1) {
      serverCode = serverCode.slice(0, targetIndex) + erpRoutes + '\n\n' + serverCode.slice(targetIndex);
      fs.writeFileSync('server.ts', serverCode);
      console.log('Successfully moved ERP routes outside of serveApp!');
    } else {
      console.log('Could not find serveApp() to insert before.');
    }
  } else {
    console.log('Could not find end of ERP routes.');
  }
} else {
  console.log('Could not find start of ERP routes.');
}
