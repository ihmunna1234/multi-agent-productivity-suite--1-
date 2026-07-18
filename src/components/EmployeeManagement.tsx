import React, { useState, useEffect, useRef, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { 
  Users, 
  Plus, 
  Trash2, 
  Calendar, 
  Download, 
  Edit3, 
  Database, 
  Sparkles, 
  Building, 
  Briefcase, 
  DollarSign, 
  Clock, 
  FileSpreadsheet, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  AlertCircle,
  Loader2,
  Check,
  X,
  CreditCard,
  Globe
} from "lucide-react";
import { apiFetch } from "../utils/api";

// ─── API Wrapper Helpers for Supabase Integration ───────────────────────────────

async function getProjects(): Promise<Project[]> {
  const res = await apiFetch("/api/employee-management/projects");
  if (!res.ok) throw new Error("Failed to load projects from Supabase.");
  return res.json();
}

async function saveProject(project: Project): Promise<void> {
  const res = await apiFetch("/api/employee-management/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project)
  });
  if (!res.ok) throw new Error("Failed to save project database to Supabase.");
}

async function deleteProject(id: string): Promise<void> {
  const res = await apiFetch(`/api/employee-management/projects/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete project database from Supabase.");
}

async function getEmployeesByProject(projectId: string): Promise<Employee[]> {
  const res = await apiFetch(`/api/employee-management/employees?projectId=${projectId}`);
  if (!res.ok) throw new Error("Failed to load employees from Supabase.");
  return res.json();
}

async function saveEmployee(employee: Employee): Promise<void> {
  const res = await apiFetch("/api/employee-management/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(employee)
  });
  if (!res.ok) throw new Error("Failed to save employee profile to Supabase.");
}

async function deleteEmployee(id: string): Promise<void> {
  const res = await apiFetch(`/api/employee-management/employees/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete employee profile from Supabase.");
}

async function getTimesheetsByProject(projectId: string, year: number, month: number): Promise<TimesheetEntry[]> {
  const res = await apiFetch(`/api/employee-management/timesheets?projectId=${projectId}&year=${year}&month=${month}`);
  if (!res.ok) throw new Error("Failed to load timesheet records from Supabase.");
  return res.json();
}

async function saveTimesheetEntry(entry: TimesheetEntry): Promise<void> {
  const res = await apiFetch("/api/employee-management/timesheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry)
  });
  if (!res.ok) throw new Error("Failed to save timesheet record to Supabase.");
}

async function getEmployeeIqamaImage(employeeId: string): Promise<string | null> {
  const res = await apiFetch(`/api/employee-management/images/${employeeId}`);
  if (!res.ok) throw new Error("Failed to load card scan from Supabase.");
  const data = await res.json();
  return data.imageBase64;
}

async function saveEmployeeIqamaImage(employeeId: string, base64Data: string): Promise<void> {
  const res = await apiFetch("/api/employee-management/images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeId, imageBase64: base64Data })
  });
  if (!res.ok) throw new Error("Failed to save card scan to Supabase.");
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

interface Employee {
  id: string;
  projectId: string;
  name: string;
  nameArabic?: string;
  iqamaNo: string;
  expiryDate?: string;
  dob?: string;
  nationality?: string;
  trade: string;
  hourlyRate: number;
    createdAt: number;
}

interface TimesheetEntry {
  id: string; // "projectId_year_month_employeeId"
  projectId: string;
  employeeId: string;
  year: number;
  month: number;
  regularHours: number;
  overtimeHours: number;
  absentDays: number;
  otherAllowances: number;
  deductions: number;
  advance: number;
  notes?: string;
}

export default function EmployeeManagement() {
  const [activeTab, setActiveTab] = useState<"projects" | "employees" | "timesheets" | "salary">("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timesheets, setTimesheets] = useState<Record<string, TimesheetEntry>>({}); // employeeId -> entry

  // Timesheet date selectors
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1); // 1-12

  // Modals / Loading states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isCardPreviewOpen, setIsCardPreviewOpen] = useState(false);
  
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Employee Form State
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState({
    name: "",
    nameArabic: "",
    iqamaNo: "",
    expiryDate: "",
    dob: "",
    nationality: "",
    trade: "Laborer",
    hourlyRate: 15,
  });

  // Card preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewEmployeeName, setPreviewEmployeeName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Projects
  useEffect(() => {
    loadProjectsList();
  }, []);

  const loadProjectsList = async () => {
    try {
      const projs = await getProjects();
      setProjects(projs);
      if (projs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projs[0].id);
      }
    } catch (e) {
      console.error("Failed loading projects:", e);
    }
  };

  // Load Employees and Timesheets when active project or month changes
  useEffect(() => {
    if (selectedProjectId) {
      loadEmployeeAndTimesheetData();
    } else {
      setEmployees([]);
      setTimesheets({});
    }
  }, [selectedProjectId, year, month]);

  const loadEmployeeAndTimesheetData = async () => {
    setDataLoading(true);
    try {
      const emps = await getEmployeesByProject(selectedProjectId);
      setEmployees(emps);

      const tsList = await getTimesheetsByProject(selectedProjectId, year, month);
      const tsMap: Record<string, TimesheetEntry> = {};
      tsList.forEach((t: TimesheetEntry) => {
        tsMap[t.employeeId] = t;
      });

      // Fill in default timesheet entries for employees who don't have one saved
      emps.forEach((emp) => {
        if (!tsMap[emp.id]) {
          tsMap[emp.id] = {
            id: `${selectedProjectId}_${year}_${month}_${emp.id}`,
            projectId: selectedProjectId,
            employeeId: emp.id,
            year,
            month,
            regularHours: 260,
            overtimeHours: 0,
            absentDays: 0,
            otherAllowances: 0,
            deductions: 0,
            advance: 0,
          };
        }
      });

      setTimesheets(tsMap);
    } catch (e) {
      console.error("Failed loading employee/timesheet data:", e);
    } finally {
      setDataLoading(false);
    }
  };

  const activeProject = projects.find(p => p.id === selectedProjectId);

  // --- Project Handlers ---
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setActionLoading(true);
    try {
      const newProj: Project = {
        id: crypto.randomUUID(),
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
        createdAt: Date.now(),
      };
      await saveProject(newProj);
      setNewProjectName("");
      setNewProjectDesc("");
      setIsProjectModalOpen(false);
      await loadProjectsList();
      setSelectedProjectId(newProj.id);
      setActiveTab("employees");
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project? This will permanently delete all linked employees, timesheets, and Iqama card scans.")) return;
    try {
      await deleteProject(id);
      const nextProjs = projects.filter(p => p.id !== id);
      setProjects(nextProjs);
      if (selectedProjectId === id) {
        setSelectedProjectId(nextProjs.length > 0 ? nextProjs[0].id : "");
      }
    } catch (e) {
      console.error("Failed deleting project:", e);
    }
  };

  // --- Employee Handlers ---
  const handleOpenAddEmployee = () => {
    setEditingEmployeeId(null);
    setEmpForm({
      name: "",
      nameArabic: "",
      iqamaNo: "",
      expiryDate: "",
      dob: "",
      nationality: "",
      trade: "Laborer",
      hourlyRate: 15,
    });
    setErrorMsg(null);
    setIsEmployeeModalOpen(true);
  };

  const handleOpenEditEmployee = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    setEmpForm({
      name: emp.name,
      nameArabic: emp.nameArabic || "",
      iqamaNo: emp.iqamaNo,
      expiryDate: emp.expiryDate || "",
      dob: emp.dob || "",
      nationality: emp.nationality || "",
      trade: emp.trade,
      hourlyRate: emp.hourlyRate,
          });
    setErrorMsg(null);
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    if (!empForm.name.trim() || !empForm.iqamaNo.trim()) {
      setErrorMsg("Employee Name and Iqama Number are required.");
      return;
    }

    setActionLoading(true);
    try {
      const empId = editingEmployeeId || crypto.randomUUID();
      const savedEmp: Employee = {
        id: empId,
        projectId: selectedProjectId,
        name: empForm.name.trim(),
        nameArabic: empForm.nameArabic.trim() || undefined,
        iqamaNo: empForm.iqamaNo.trim(),
        expiryDate: empForm.expiryDate || undefined,
        dob: empForm.dob || undefined,
        nationality: empForm.nationality.trim() || undefined,
        trade: empForm.trade,
        hourlyRate: Number(empForm.hourlyRate) || 0,
                createdAt: Date.now(),
      };

      await saveEmployee(savedEmp);

      // If we uploaded an Iqama card base64 image, save it securely
      if (previewImage && !editingEmployeeId) {
        await saveEmployeeIqamaImage(empId, previewImage);
      }

      setIsEmployeeModalOpen(false);
      setPreviewImage(null);
      await loadEmployeeAndTimesheetData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save employee profile.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee profile? All timesheets and card data will be lost.")) return;
    try {
      await deleteEmployee(id);
      await loadEmployeeAndTimesheetData();
    } catch (e) {
      console.error(e);
    }
  };

  // --- Iqama Upload & OCR Handler ---
  const handleIqamaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File exceeds the 10MB limit.");
      return;
    }

    setOcrLoading(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      const base64Data = result.split(",")[1];
      const mimeType = file.type || "image/jpeg";

      try {
        const res = await apiFetch("/api/extract-iqama", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64Data, mimeType }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "OCR extraction failed.");
        }

        const ocrResult = await res.json();
        
        // Auto fill form fields
        setEmpForm(prev => ({
          ...prev,
          name: ocrResult.name || prev.name,
          nameArabic: ocrResult.nameArabic || prev.nameArabic,
          iqamaNo: ocrResult.iqamaNo || prev.iqamaNo,
          expiryDate: ocrResult.expiryDate || prev.expiryDate,
          dob: ocrResult.dob || prev.dob,
          nationality: ocrResult.nationality || prev.nationality,
          trade: ocrResult.occupation || prev.trade,
        }));

        setPreviewImage(result);
      } catch (err: any) {
        setErrorMsg(`AI OCR failed: ${err.message}. You can still fill fields manually.`);
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // --- View Secure Card ---
  const handleViewCard = async (emp: Employee) => {
    try {
      const img = await getEmployeeIqamaImage(emp.id);
      if (img) {
        setPreviewImage(img);
        setPreviewEmployeeName(emp.name);
        setIsCardPreviewOpen(true);
      } else {
        alert("No card scan is uploaded for this employee.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed loading employee card scan.");
    }
  };

  // --- Timesheet Grid Handlers ---
  const handleTimesheetChange = (employeeId: string, field: keyof TimesheetEntry, value: any) => {
    setTimesheets(prev => {
      const current = prev[employeeId];
      if (!current) return prev;

      return {
        ...prev,
        [employeeId]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  const handleSaveTimesheet = async () => {
    setActionLoading(true);
    try {
      const promises = Object.values(timesheets).map(entry => saveTimesheetEntry(entry as TimesheetEntry));
      await Promise.all(promises);
      alert("Timesheet saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save timesheet.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- Salary Sheet Helper Computations ---
  const calculatedSalaryRows = useMemo(() => {
    return employees.map((emp) => {
      const ts = timesheets[emp.id] || {
        regularHours: 260,
        overtimeHours: 0,
        absentDays: 0,
        otherAllowances: 0,
        deductions: 0,
        advance: 0,
      };

      // Purely hourly salary logic. Standard month = 260 hours.
      const hourlyRate = emp.hourlyRate;
      const dailyRate = emp.hourlyRate * 8;

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
    });
  }, [employees, timesheets]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // --- Export Excel ---
  const handleExportExcel = () => {
    if (calculatedSalaryRows.length === 0) return;

    const data = calculatedSalaryRows.map((row, idx) => ({
      "Sl No": idx + 1,
      "Employee Name": row.employee.name,
      "Name (Arabic)": row.employee.nameArabic || "-",
      "Iqama / ID No": row.employee.iqamaNo,
      "Trade": row.employee.trade,
      "Nationality": row.employee.nationality || "-",
      "Hourly Rate (SAR)": row.employee.hourlyRate,
      "Regular Hours": row.timesheet.regularHours,
      "Basic Pay Earned (SAR)": Math.round(row.basicPayEarned * 100) / 100,
      "Overtime Hours": row.timesheet.overtimeHours,
      "Overtime Pay (SAR)": Math.round(row.overtimeEarned * 100) / 100,
      "Other Allowances (SAR)": row.timesheet.otherAllowances,
      "Deductions (SAR)": row.timesheet.deductions,
      "Advance (SAR)": row.timesheet.advance || 0,
      "Net Salary (SAR)": Math.round(row.netSalary * 100) / 100,
      "Notes / Signature": row.timesheet.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");

    // Auto-fit column widths
    const maxCols = Object.keys(data[0] || {}).length;
    worksheet["!cols"] = Array(maxCols).fill({ wch: 15 });

    const filename = `${activeProject?.name || "Project"}_Payroll_${monthNames[month - 1]}_${year}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // --- Generate Pay Slip PDF ---
  const handleDownloadPaySlip = (row: typeof calculatedSalaryRows[0]) => {
    const { employee: emp, timesheet: ts, basicPayEarned, overtimeEarned, netSalary } = row;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Color definitions
    const primaryColor = [26, 35, 126]; // Deep Indigo
    const accentColor = [33, 150, 243];  // Blue
    const lightBg = [245, 247, 250];

    // Card boundary line
    doc.setDrawColor(220, 225, 235);
    doc.rect(5, 5, 200, 287);

    // Title/Header band
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, 10, 190, 25, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("EMPLOYEE PAY SLIP / قسيمة الراتب", 15, 18);
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(`Project: ${activeProject?.name || "N/A"}`, 15, 24);
    doc.text(`Salary Period: ${monthNames[month - 1]} ${year}`, 15, 29);

    // Employee Details Section
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont("Helvetica", "bold");
    doc.text("Employee Details / تفاصيل الموظف", 15, 45);
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(0.5);
    doc.line(15, 47, 195, 47);

    // Grid layout for metadata
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Name (English): ${emp.name}`, 15, 54);
    doc.text(`Name (Arabic): ${emp.nameArabic || "-"}`, 110, 54);
    doc.text(`Iqama / ID No: ${emp.iqamaNo}`, 15, 60);
    doc.text(`Nationality: ${emp.nationality || "-"}`, 110, 60);
    doc.text(`Trade / Designation: ${emp.trade}`, 15, 66);
    doc.text(`Regular Hours: ${ts.regularHours} / 260`, 110, 66);

    // Salary Breakdown Table
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text("Earnings & Allowances / المستحقات والبدلات", 15, 80);
    doc.line(15, 82, 195, 82);

    // Table Header
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(15, 85, 180, 8, "F");
    doc.setFontSize(9);
    doc.setFont("Helvetica", "bold");
    doc.text("Description / الوصف", 20, 90);
    doc.text("Config Rate (SAR)", 90, 90);
    doc.text("Amount Earned (SAR)", 150, 90);

    // Row: Basic Salary
    doc.setFont("Helvetica", "normal");
    doc.text("Basic Salary (Calculated / الراتب الأساسي)", 20, 100);
    doc.text(`${emp.hourlyRate.toFixed(2)}`, 90, 100);
    doc.text(`${basicPayEarned.toFixed(2)}`, 150, 100);

    // Row: Overtime Pay
    doc.text(`Overtime Pay (${ts.overtimeHours} hrs / الإضافي)`, 20, 116);
    doc.text(`${row.hourlyRate.toFixed(2)} / hr`, 90, 116);
    doc.text(`${overtimeEarned.toFixed(2)}`, 150, 116);

    // Row: Other Allowances
    doc.text("Other Allowances (بدلات أخرى)", 20, 124);
    doc.text("-", 90, 124);
    doc.text(`${ts.otherAllowances.toFixed(2)}`, 150, 124);

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(15, 128, 195, 128);

    // Deductions Section
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text("Deductions / الاستقطاعات", 15, 140);
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(0.5);
    doc.line(15, 142, 195, 142);

    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(15, 145, 180, 8, "F");
    doc.setFontSize(9);
    doc.setFont("Helvetica", "bold");
    doc.text("Deduction Reason / سبب الخصم", 20, 150);
    doc.text("Amount Deducted (SAR)", 150, 150);

    // Row: Absent Deductions
    doc.setFont("Helvetica", "normal");
    const absentDeduction = ts.absentDays * 10 * row.hourlyRate; // 10 hours per day
    doc.text(`Absences Deductions (${ts.absentDays} days / غياب)`, 20, 160);
    doc.text(`${absentDeduction.toFixed(2)}`, 150, 160);

    // Row: Custom Deductions
    doc.text("Custom Deductions / خصومات أخرى", 20, 168);
    doc.text(`${ts.deductions.toFixed(2)}`, 150, 168);

    // Row: Advance
    doc.text("Advance / سلفة", 20, 176);
    doc.text(`${(ts.advance || 0).toFixed(2)}`, 150, 176);

    doc.line(15, 180, 195, 180);

    // Summary Block
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, 188, 180, 14, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("NET SALARY PAID / صافي الراتب المستحق", 20, 197);
    doc.text(`${Math.round(netSalary * 100 / 100).toFixed(2)} SAR`, 150, 197);

    // Footer signatures
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text("Prepared By / أعدت بواسطة", 25, 220);
    doc.line(20, 235, 70, 235);

    doc.text("Approved By / اعتمدت بواسطة", 125, 220);
    doc.line(120, 235, 170, 235);

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("This is a computer generated pay slip. No seal or signature required.", 15, 275);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 15, 280);

    // Save payslip
    doc.save(`Payslip_${emp.name.replace(/\s+/g, "_")}_${monthNames[month - 1]}_${year}.pdf`);
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Employee Management - Injamus's AI Workspace</title>
      </Helmet>

      {/* Hero Banner Header */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-on-background">Employee & Payroll Studio</h2>
              <p className="text-xs text-outline font-semibold tracking-wide uppercase">Employee DB • Timesheet Tracker • Payroll Sheet • PDF Payslips</p>
            </div>
          </div>
        </div>

        {/* Global Project Switcher */}
        <div className="flex items-center gap-3 bg-surface p-2 border border-outline-variant/50 rounded-2xl">
          <Database size={16} className="text-primary ml-2" />
          <select 
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-transparent text-sm font-semibold pr-8 py-1.5 focus:outline-none cursor-pointer"
          >
            {projects.length === 0 ? (
              <option value="">No Active Projects</option>
            ) : (
              projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))
            )}
          </select>
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm shadow-primary/20 hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} /> Project
          </button>
        </div>
      </div>

      {/* Inner Navigation Tabs */}
      <div className="flex border-b border-outline-variant/60 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab("projects")}
          className={`px-5 py-3 text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "projects" ? "border-primary text-primary" : "border-transparent text-outline hover:text-on-background"
          }`}
        >
          📁 Project Database
        </button>
        <button
          onClick={() => {
            if (!selectedProjectId) { alert("Please select or create a project first."); return; }
            setActiveTab("employees");
          }}
          className={`px-5 py-3 text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "employees" ? "border-primary text-primary" : "border-transparent text-outline hover:text-on-background"
          }`}
        >
          👥 Employees ({employees.length})
        </button>
        <button
          onClick={() => {
            if (!selectedProjectId) { alert("Please select or create a project first."); return; }
            setActiveTab("timesheets");
          }}
          className={`px-5 py-3 text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "timesheets" ? "border-primary text-primary" : "border-transparent text-outline hover:text-on-background"
          }`}
        >
          📅 Timesheets
        </button>
        <button
          onClick={() => {
            if (!selectedProjectId) { alert("Please select or create a project first."); return; }
            setActiveTab("salary")}
          }
          className={`px-5 py-3 text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "salary" ? "border-primary text-primary" : "border-transparent text-outline hover:text-on-background"
          }`}
        >
          💰 Salary Sheets & Payslips
        </button>
      </div>

      {/* --- Tab Content: Project Manager --- */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div 
                key={proj.id} 
                className={`bg-surface-container-lowest border rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-primary/30 transition-all ${
                  selectedProjectId === proj.id ? "border-primary/50 ring-2 ring-primary/10" : "border-outline-variant/60"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-base text-on-background">{proj.name}</h3>
                    <span className="text-[10px] bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full font-bold uppercase">
                      IDB Store
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-3 mb-4 min-h-[40px]">
                    {proj.description || "No project description provided."}
                  </p>
                </div>
                <div className="border-t border-outline-variant/40 pt-4 flex items-center justify-between mt-2">
                  <button
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      selectedProjectId === proj.id 
                        ? "bg-primary/10 text-primary" 
                        : "bg-surface hover:bg-surface-container-low text-on-surface-variant"
                    }`}
                  >
                    {selectedProjectId === proj.id ? "Active Database" : "Select Database"}
                  </button>
                  <button
                    onClick={() => handleDeleteProject(proj.id)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 cursor-pointer"
                    title="Delete Project Database"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Blank State Add Card */}
            <div 
              onClick={() => setIsProjectModalOpen(true)}
              className="bg-dashed border-2 border-dashed border-outline-variant/80 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 min-h-[180px] transition-all"
            >
              <Plus size={24} className="text-primary mb-2" />
              <span className="text-sm font-bold text-primary">New Project Database</span>
              <p className="text-[10px] text-outline text-center mt-1">Create separate container for employee profiles</p>
            </div>
          </div>
        </div>
      )}

      {/* --- Tab Content: Employee Directory --- */}
      {activeTab === "employees" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-on-background">{activeProject?.name} Directory</h3>
              <p className="text-[11px] text-outline">Manage employee trades, fixed salaries, and secure Iqama scans.</p>
            </div>
            <button
              onClick={handleOpenAddEmployee}
              className="px-4 py-2.5 rounded-2xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container hover:text-on-primary-container shadow-sm shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={15} /> Add Employee Profile
            </button>
          </div>

          {dataLoading ? (
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-12 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
              <h4 className="font-bold text-on-background text-sm font-sans">Loading...</h4>
              <p className="text-xs text-outline mt-1 mb-4">Fetching data from the database.</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-12 flex flex-col items-center justify-center">
              <Users size={48} className="text-outline/50 mb-3" />
              <h4 className="font-bold text-on-background text-sm">No Employees Registered</h4>
              <p className="text-xs text-outline mt-1 mb-4">Add your first employee manually or upload their Iqama card for AI parsing.</p>
              <button
                onClick={handleOpenAddEmployee}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/95 transition-all cursor-pointer"
              >
                Add Employee
              </button>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/60">
                      <th className="p-4">Name (English/Arabic)</th>
                      <th className="p-4">Iqama / ID No</th>
                      <th className="p-4">Nationality</th>
                      <th className="p-4">Trade</th>
                      <th className="p-4">Hourly Rate</th>
                      <th className="p-4 text-center">Card Scan</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-on-background">{emp.name}</div>
                          {emp.nameArabic && <div className="text-[10px] text-outline mt-0.5" dir="rtl">{emp.nameArabic}</div>}
                        </td>
                        <td className="p-4 font-mono font-medium">{emp.iqamaNo}</td>
                        <td className="p-4">{emp.nationality || "-"}</td>
                        <td className="p-4">
                          <span className="bg-surface border border-outline-variant/50 px-2 py-0.5 rounded-md font-semibold text-on-surface-variant text-[10px]">
                            {emp.trade}
                          </span>
                        </td>
                        <td className="p-4 font-semibold">{emp.hourlyRate} SAR</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleViewCard(emp)}
                            className="p-1.5 rounded-lg text-primary bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                            title="View Secure Card Scan"
                          >
                            <Eye size={12} /> View Card
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditEmployee(emp)}
                              className="p-2 rounded-xl text-primary hover:bg-primary/5 cursor-pointer"
                              title="Edit Profile"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="p-2 rounded-xl text-red-500 hover:bg-red-500/5 cursor-pointer"
                              title="Delete Profile"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Tab Content: Monthly Timesheets --- */}
      {activeTab === "timesheets" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-on-background">Attendance & Hours Timesheet</h3>
              <p className="text-[11px] text-outline">Update Monthly worked days, overtime hours, and salary modifications.</p>
            </div>
            
            {/* Year & Month selectors */}
            <div className="flex items-center gap-2">
              <select 
                value={month} 
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-surface border border-outline-variant/60 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx + 1}>{name}</option>
                ))}
              </select>
              <select 
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-surface border border-outline-variant/60 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
              >
                {[2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={handleSaveTimesheet}
                disabled={actionLoading || employees.length === 0}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer shadow-sm shadow-primary/20 transition-all"
              >
                {actionLoading ? "Saving..." : "Save Timesheet"}
              </button>
            </div>
          </div>

          {dataLoading ? (
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-12 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
              <h4 className="font-bold text-on-background text-sm font-sans">Loading...</h4>
              <p className="text-xs text-outline mt-1 mb-4">Fetching data from the database.</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-12 flex flex-col items-center justify-center">
              <Calendar size={48} className="text-outline/50 mb-3" />
              <h4 className="font-bold text-on-background text-sm font-sans">No Employees Registered</h4>
              <p className="text-xs text-outline mt-1 mb-4">Please add employee profiles under the "Employees" tab first.</p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/60">
                      <th className="p-4 w-52">Employee Name & Trade</th>
                      <th className="p-4 text-center w-24">Regular Hrs (Default 260)</th>
                      <th className="p-4 text-center w-24">Overtime (Hrs)</th>
                      <th className="p-4 text-center w-24">Absent Days</th>
                      <th className="p-4 text-center w-28">Other Allowance (SAR)</th>
                      <th className="p-4 text-center w-28">Deduction (SAR)</th>
                      <th className="p-4 text-center w-28">Advance (SAR)</th>
                      <th className="p-4 w-60">Notes / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {employees.map((emp) => {
                      const entry = timesheets[emp.id] || {
                        regularHours: 260,
                        overtimeHours: 0,
                        absentDays: 0,
                        otherAllowances: 0,
                        deductions: 0,
                        advance: 0,
                        notes: "",
                      };

                      return (
                        <tr key={emp.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-on-background">{emp.name}</div>
                            <div className="text-[10px] text-outline mt-0.5">{emp.trade} • {emp.iqamaNo}</div>
                          </td>
                          <td className="p-4 text-center">
                            <input 
                              type="number"
                              min="0"
                              value={entry.regularHours}
                              onChange={(e) => handleTimesheetChange(emp.id, "regularHours", Number(e.target.value) || 0)}
                              className="w-16 text-center border border-outline-variant/60 rounded-lg py-1 px-1.5 focus:outline-none font-semibold"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <input 
                              type="number"
                              min="0"
                              value={entry.overtimeHours}
                              onChange={(e) => handleTimesheetChange(emp.id, "overtimeHours", Number(e.target.value) || 0)}
                              className="w-16 text-center border border-outline-variant/60 rounded-lg py-1 px-1.5 focus:outline-none font-semibold text-blue-500"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <input 
                              type="number"
                              min="0"
                              value={entry.absentDays}
                              onChange={(e) => handleTimesheetChange(emp.id, "absentDays", Number(e.target.value) || 0)}
                              className="w-16 text-center border border-outline-variant/60 rounded-lg py-1 px-1.5 focus:outline-none font-semibold text-red-500"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <input 
                              type="number"
                              min="0"
                              value={entry.otherAllowances}
                              onChange={(e) => handleTimesheetChange(emp.id, "otherAllowances", Number(e.target.value) || 0)}
                              className="w-20 text-center border border-outline-variant/60 rounded-lg py-1 px-1.5 focus:outline-none font-semibold text-green-600"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <input 
                              type="number"
                              min="0"
                              value={entry.deductions}
                              onChange={(e) => handleTimesheetChange(emp.id, "deductions", Number(e.target.value) || 0)}
                              className="w-20 text-center border border-outline-variant/60 rounded-lg py-1 px-1.5 focus:outline-none font-semibold text-red-600"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <input 
                              type="number"
                              min="0"
                              value={entry.advance || 0}
                              onChange={(e) => handleTimesheetChange(emp.id, "advance", Number(e.target.value) || 0)}
                              className="w-20 text-center border border-outline-variant/60 rounded-lg py-1 px-1.5 focus:outline-none font-semibold text-orange-500"
                            />
                          </td>
                          <td className="p-4">
                            <input 
                              type="text"
                              placeholder="e.g. sick leave, travel allowance, etc."
                              value={entry.notes || ""}
                              onChange={(e) => handleTimesheetChange(emp.id, "notes", e.target.value)}
                              className="w-full border border-outline-variant/60 rounded-lg py-1 px-2.5 focus:outline-none text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Tab Content: Salary Sheets & Payslips --- */}
      {activeTab === "salary" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-on-background">Monthly Payroll & Pay Slips</h3>
              <p className="text-[11px] text-outline">Calculated salary breakdown for {monthNames[month - 1]} {year}. Review and export.</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <select 
                value={month} 
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-surface border border-outline-variant/60 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx + 1}>{name}</option>
                ))}
              </select>
              <select 
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-surface border border-outline-variant/60 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
              >
                {[2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={handleExportExcel}
                disabled={calculatedSalaryRows.length === 0}
                className="px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 disabled:opacity-50 cursor-pointer shadow-sm shadow-green-600/20 transition-all flex items-center gap-1.5"
              >
                <Download size={14} /> Export Excel
              </button>
            </div>
          </div>

          {calculatedSalaryRows.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-12 flex flex-col items-center justify-center">
              <DollarSign size={48} className="text-outline/50 mb-3" />
              <h4 className="font-bold text-on-background text-sm font-sans">No Payroll Calculations Available</h4>
              <p className="text-xs text-outline mt-1 mb-4">Please add employee profiles under the "Employees" tab first.</p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/60">
                      <th className="p-4">Employee</th>
                      <th className="p-4">Trade</th>
                      <th className="p-4 text-center">Reg. Hrs / Abs</th>
                      <th className="p-4 text-right">Basic Earned</th>
                      <th className="p-4 text-right">OT Earned</th>
                      <th className="p-4 text-right">Allowances</th>
                      <th className="p-4 text-right">Deductions</th>
                      <th className="p-4 text-right">Advance</th>
                      <th className="p-4 text-right font-bold text-primary">Net Salary</th>
                      <th className="p-4 text-center w-28">Pay Slip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {calculatedSalaryRows.map((row) => (
                      <tr key={row.employee.id} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-on-background">{row.employee.name}</div>
                          <div className="text-[10px] text-outline mt-0.5">Iqama: {row.employee.iqamaNo}</div>
                        </td>
                        <td className="p-4">{row.employee.trade}</td>
                        <td className="p-4 text-center font-medium">
                          {row.timesheet.regularHours}h / {row.timesheet.absentDays}d
                        </td>
                        <td className="p-4 text-right font-medium">{Math.round(row.basicPayEarned).toFixed(2)} SAR</td>
                        <td className="p-4 text-right text-blue-500 font-medium">{Math.round(row.overtimeEarned).toFixed(2)} SAR</td>
                        <td className="p-4 text-right text-green-600 font-medium">+{Math.round(row.totalAllowance).toFixed(2)} SAR</td>
                        <td className="p-4 text-right text-red-500 font-medium">-{Math.round(row.timesheet.deductions).toFixed(2)} SAR</td>
                        <td className="p-4 text-right text-orange-500 font-medium">-{Math.round(row.timesheet.advance || 0).toFixed(2)} SAR</td>
                        <td className="p-4 text-right font-bold text-primary text-sm">{Math.round(row.netSalary).toFixed(2)} SAR</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDownloadPaySlip(row)}
                            className="p-1.5 rounded-lg text-primary bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer inline-flex items-center gap-1.5 text-[10px] font-bold"
                            title="Download Printable Pay Slip (PDF)"
                          >
                            <FileText size={12} /> Pay Slip
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Dialog Modal: Create Project --- */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-on-background flex items-center gap-2">
                <Database size={18} className="text-primary" /> New Project Database
              </h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="p-1 rounded-full hover:bg-surface cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Project Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Riyadh Metro Project"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full border border-outline-variant/60 rounded-xl py-2 px-3 focus:outline-none text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Description</label>
                <textarea 
                  placeholder="Details, location, supplier details..."
                  rows={3}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full border border-outline-variant/60 rounded-xl py-2 px-3 focus:outline-none text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-outline-variant/45 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/95 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {actionLoading ? "Creating..." : "Create Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Dialog Modal: Add/Edit Employee --- */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 max-w-xl w-full shadow-2xl animate-fade-in my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-on-background flex items-center gap-2">
                <Users size={18} className="text-primary" /> 
                {editingEmployeeId ? "Edit Employee Profile" : "Add New Employee"}
              </h3>
              <button onClick={() => setIsEmployeeModalOpen(false)} className="p-1 rounded-full hover:bg-surface cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* AI Iqama Extraction Banner */}
            {!editingEmployeeId && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-primary animate-pulse" size={20} />
                  <div>
                    <h4 className="font-bold text-xs text-primary">AI Auto-Extract from Iqama Card</h4>
                    <p className="text-[10px] text-outline-variant/90 text-on-surface-variant mt-0.5">Upload a scan/photo of the Saudi Iqama to automatically populate all employee metadata.</p>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleIqamaUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={triggerUpload}
                  disabled={ocrLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-[10px] font-bold shadow-sm shadow-primary/25 hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer w-full sm:w-auto justify-center"
                >
                  {ocrLoading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Extracting...
                    </>
                  ) : (
                    <>
                      <Plus size={12} /> Upload Iqama Scan
                    </>
                  )}
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-3 text-xs flex items-center gap-2.5 mb-4">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Employee Name (English)</label>
                  <input 
                    type="text"
                    required
                    placeholder="MOHAMMAD MUNNA"
                    value={empForm.name}
                    onChange={(e) => setEmpForm({...empForm, name: e.target.value})}
                    className="w-full border border-outline-variant/60 rounded-xl py-2 px-3 focus:outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Employee Name (Arabic)</label>
                  <input 
                    type="text"
                    placeholder="محمد منى"
                    value={empForm.nameArabic}
                    onChange={(e) => setEmpForm({...empForm, nameArabic: e.target.value})}
                    className="w-full border border-outline-variant/60 rounded-xl py-2 px-3 focus:outline-none text-xs font-sans"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Iqama / ID Number</label>
                  <input 
                    type="text"
                    required
                    placeholder="2600372352"
                    value={empForm.iqamaNo}
                    onChange={(e) => setEmpForm({...empForm, iqamaNo: e.target.value})}
                    className="w-full border border-outline-variant/60 rounded-xl py-2 px-3 focus:outline-none text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Nationality</label>
                  <input 
                    type="text"
                    placeholder="Bangladesh"
                    value={empForm.nationality}
                    onChange={(e) => setEmpForm({...empForm, nationality: e.target.value})}
                    className="w-full border border-outline-variant/60 rounded-xl py-2 px-3 focus:outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Trade / Trade Type</label>
                  <select 
                    value={empForm.trade}
                    onChange={(e) => setEmpForm({...empForm, trade: e.target.value})}
                    className="w-full border border-outline-variant/60 rounded-xl py-2 px-3 focus:outline-none text-xs cursor-pointer bg-surface font-semibold text-on-background"
                  >
                    {["Laborer", "Mason", "Plumber", "Electrician", "Carpenter", "Welder", "Painter", "Steel Fixer", "Pipe Fitter", "Foreman", "Safety Officer", "Driver", "Engineer", "Manager", "Others"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Iqama Expiry Date</label>
                  <input 
                    type="text"
                    placeholder="e.g. 1449/05/20 or 2027-11-20"
                    value={empForm.expiryDate}
                    onChange={(e) => setEmpForm({...empForm, expiryDate: e.target.value})}
                    className="w-full border border-outline-variant/60 rounded-xl py-2 px-3 focus:outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Hourly Rate (SAR)</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-2.5 text-outline" />
                    <input 
                      type="number"
                      required
                      min="0"
                      value={empForm.hourlyRate}
                      onChange={(e) => setEmpForm({...empForm, hourlyRate: Number(e.target.value) || 0})}
                      className="w-full border border-outline-variant/60 rounded-xl py-2 pl-8 pr-3 focus:outline-none text-xs font-semibold text-primary"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Monthly Fixed Allowance (SAR)</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-2.5 text-outline" />
                    <input 
                      type="number"
                      required
                      min="0"
                      value={empForm.allowance}
                      onChange={(e) => setEmpForm({...empForm, allowance: Number(e.target.value) || 0})}
                      className="w-full border border-outline-variant/60 rounded-xl py-2 pl-8 pr-3 focus:outline-none text-xs font-semibold text-green-600"
                    />
                  </div>
                </div>
              </div>

              {previewImage && !editingEmployeeId && (
                <div className="border border-outline-variant/60 rounded-2xl p-2 bg-surface max-w-xs relative flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2.5">
                    <img src={previewImage} className="w-10 h-10 object-cover rounded-lg border" />
                    <div>
                      <span className="text-[10px] font-bold text-on-background block">Secure Iqama Scan Attached</span>
                      <span className="text-[8px] text-outline block">Will be encrypted with AES-GCM at rest</span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setPreviewImage(null)}
                    className="p-1 rounded-full text-red-500 hover:bg-red-500/10 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-outline-variant/45 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/95 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {actionLoading ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Dialog Modal: Iqama Card Secure Preview --- */}
      {isCardPreviewOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-fade-in relative">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-xs text-on-background flex items-center gap-1.5">
                <Globe size={16} className="text-primary" /> Secure Card Preview: {previewEmployeeName}
              </h3>
              <button onClick={() => setIsCardPreviewOpen(false)} className="p-1 rounded-full hover:bg-surface cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex justify-center border border-outline-variant/50 rounded-2xl overflow-hidden bg-surface max-h-[300px] mb-4">
              {previewImage ? (
                <img src={previewImage} className="max-w-full h-auto object-contain" alt="Iqama Scan" />
              ) : (
                <div className="p-8 text-center text-xs text-outline">Loading scan data...</div>
              )}
            </div>

            <div className="bg-yellow-500/5 border border-yellow-500/10 text-yellow-600 rounded-2xl p-3 text-[10px] flex items-center gap-2.5">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>Decrypted securely in-memory. Image data is not saved in plaintext on local disk.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
