const fs = require('fs');

let emCode = fs.readFileSync('src/components/EmployeeManagement.tsx', 'utf-8');

// 1. Update Salary Table Headers
const oldHeaders = `<th className="p-4 text-right font-bold text-primary">Net Salary</th>
                      <th className="p-4 text-center w-28">Pay Slip</th>`;
const newHeaders = `<th className="p-4 text-right font-bold text-primary">Current Net</th>
                      <th className="p-4 text-right text-orange-600">Past Due</th>
                      <th className="p-4 text-right font-bold text-teal-600">Total Payable</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center w-28">Pay Slip</th>`;
emCode = emCode.replace(oldHeaders, newHeaders);

// 2. Update Salary Table Body Rows
const oldRows = `<td className="p-4 text-right font-bold text-primary text-sm">{Math.round(row.netSalary).toFixed(2)} SAR</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDownloadPaySlip(row)}`;
const newRows = `<td className="p-4 text-right font-bold text-primary text-sm">{Math.round(row.netSalary).toFixed(2)} SAR</td>
                        <td className="p-4 text-right text-orange-600 font-medium">{Math.round(row.previousDue).toFixed(2)} SAR</td>
                        <td className="p-4 text-right font-bold text-teal-600 text-sm">{Math.round(row.netPayable).toFixed(2)} SAR</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleTogglePaid(row)}
                            className={\`px-3 py-1 rounded-full text-[10px] font-bold transition-all \${row.timesheet.isPaid ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}\`}
                          >
                            {row.timesheet.isPaid ? 'Paid' : 'Unpaid'}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDownloadPaySlip(row)}`;
emCode = emCode.replace(oldRows, newRows);

// 3. Update Excel Export
const oldExcel = `"Advance (SAR)": row.timesheet.advance || 0,
        "Net Salary (SAR)": Math.round(row.netSalary * 100) / 100,
        "Notes / Signature": row.timesheet.notes || "",`;
const newExcel = `"Advance (SAR)": row.timesheet.advance || 0,
        "Current Month Net (SAR)": Math.round(row.netSalary * 100) / 100,
        "Past Due (SAR)": Math.round(row.previousDue * 100) / 100,
        "Total Net Payable (SAR)": Math.round(row.netPayable * 100) / 100,
        "Status": row.timesheet.isPaid ? "Paid" : "Unpaid",
        "Notes / Signature": row.timesheet.notes || "",`;
emCode = emCode.replace(oldExcel, newExcel);

// 4. Update PDF Export
const oldPdf = `doc.setFont("Helvetica", "bold");
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(105, 102, 90, 10, "F");
    doc.text(\`NET SALARY:\`, 110, 108);
    doc.text(\`\${Math.round(netSalary).toFixed(2)} SAR\`, 160, 108);`;

const newPdf = `doc.text(\`Current Month Net:\`, 110, 102);
    doc.text(\`\${Math.round(netSalary).toFixed(2)} SAR\`, 160, 102);
    
    doc.text(\`Previous Dues:\`, 110, 108);
    doc.text(\`+ \${Math.round(row.previousDue).toFixed(2)} SAR\`, 160, 108);

    doc.setFont("Helvetica", "bold");
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(105, 114, 90, 10, "F");
    doc.text(\`TOTAL NET PAYABLE:\`, 110, 120);
    doc.text(\`\${Math.round(row.netPayable).toFixed(2)} SAR\`, 160, 120);
    
    doc.text(\`STATUS: \${row.timesheet.isPaid ? 'PAID' : 'UNPAID'}\`, 110, 130);`;

emCode = emCode.replace(oldPdf, newPdf);

fs.writeFileSync('src/components/EmployeeManagement.tsx', emCode);
