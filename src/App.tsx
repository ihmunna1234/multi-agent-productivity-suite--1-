import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Database, 
  FileText, 
  FileCheck, 
  Search, 
  BrainCircuit,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  Sun,
  Moon,
  Contrast,
  Eraser,
  PenTool
} from "lucide-react";
import { ActiveAgent } from "./types";

// Import custom agents
import Dashboard from "./components/Dashboard";
import IqamaExtractor from "./components/IqamaExtractor";
import PdfToImg from "./components/PdfToImg";
import ImgToPdf from "./components/ImgToPdf";
import PdfToWord from "./components/PdfToWord";
import WatermarkRemover from "./components/WatermarkRemover";
import PdfEditor from "./components/PdfEditor";
import ProductFinder from "./components/ProductFinder";
import ResumeMaker from "./components/ResumeMaker";
import GoogleMapsExtractor from "./components/GoogleMapsExtractor";
import { MapPin } from "lucide-react";

export default function App() {
  const [activeAgent, setActiveAgent] = useState<ActiveAgent>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "night">(() => {
    try {
      const stored = localStorage.getItem("workspace_theme");
      if (stored === "dark" || stored === "night" || stored === "light") {
        return stored;
      }
    } catch (e) {
      // safe fallback
    }
    return "light";
  });

  const handleThemeChange = (newTheme: "light" | "dark" | "night") => {
    setTheme(newTheme);
    try {
      localStorage.setItem("workspace_theme", newTheme);
    } catch (e) {
      // ignore
    }
  };

  const navigationItems = [
    { id: "extractor" as ActiveAgent, name: "Iqama Extractor", icon: <Database size={16} />, pill: "AI OCR" },
    { id: "pdf-to-img" as ActiveAgent, name: "PDF to Image", icon: <FileText size={16} />, pill: "Slicer" },
    { id: "img-to-pdf" as ActiveAgent, name: "Image to PDF", icon: <FileCheck size={16} />, pill: "Binder" },
    { id: "pdf-to-word" as ActiveAgent, name: "PDF to Word", icon: <FileText size={16} />, pill: "Convert" },
    { id: "watermark-remover" as ActiveAgent, name: "Watermark Remover", icon: <Eraser size={16} />, pill: "Clean" },
    { id: "pdf-editor" as ActiveAgent, name: "PDF Editor", icon: <PenTool size={16} />, pill: "Edit" },
    { id: "products" as ActiveAgent, name: "Product Scout", icon: <Search size={16} />, pill: "Market" },
    { id: "resume-maker" as ActiveAgent, name: "Resume Studio", icon: <Sparkles size={16} />, pill: "Career" },
    { id: "maps-extractor" as ActiveAgent, name: "Leads Extractor", icon: <MapPin size={16} />, pill: "G-Maps" },
  ];

  const handleNavigate = (id: ActiveAgent) => {
    setActiveAgent(id);
    setIsMobileMenuOpen(false); // Close mobile popup navigation if open
  };

  const themeClass = theme === "dark" ? "theme-dark" : theme === "night" ? "theme-night" : "theme-light";

  return (
    <div className={`flex flex-col h-screen bg-slate-50 font-sans text-slate-800 antialiased overflow-hidden relative ${themeClass}`}>
      
      {/* Premium Top Navigation Bar */}
      <header className="bg-white border-b border-slate-100 flex-shrink-0 z-50 relative shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            
            {/* Logo/Branding Node */}
            <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => handleNavigate("dashboard")}>
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-500/20 active:scale-95 transition-transform">
                <BrainCircuit size={19} />
              </div>
              <div>
                <h1 className="font-bold text-slate-800 text-sm tracking-tight leading-none">
                  Injamus's AI Workspace
                </h1>
                <span className="text-[10px] text-teal-600 font-semibold tracking-wider uppercase mt-1 block">
                  Multi-Agent Suite
                </span>
              </div>
            </div>

            {/* Desktop Dynamic Navigation has been replaced by the unified mobile phone hamburger toggler */}

            {/* Right Side Hamburger Toggle & Theme Switchers */}
            <div className="flex items-center gap-3">
              {/* Single Button Theme Cycler (Light -> Dark -> Night) */}
              <button
                type="button"
                onClick={() => {
                  if (theme === "light") handleThemeChange("dark");
                  else if (theme === "dark") handleThemeChange("night");
                  else handleThemeChange("light");
                }}
                className="p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center border border-slate-200/50 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-xs active:scale-95"
                title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
              >
                {theme === "light" && <Sun size={20} className="text-amber-500 stroke-[2.5]" />}
                {theme === "dark" && <Moon size={20} className="text-amber-300 stroke-[2.5]" />}
                {theme === "night" && <Contrast size={20} className="text-rose-400 stroke-[2.5]" />}
              </button>

              {/* Mobile phone style hamburger menu toggle (Active on all devices & screens) */}
              <button
                id="hamburger-menu-toggle-btn"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-2xl cursor-pointer transition-colors active:scale-95 flex items-center justify-center shadow-xs"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X size={20} className="text-slate-800" /> : <Menu size={20} className="text-slate-800" />}
              </button>
            </div>

          </div>
        </div>

        {/* Universal Mobile Dropdown Menu displayed on all devices */}
        {isMobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white absolute top-16 left-0 right-0 md:left-auto md:right-8 md:w-80 md:rounded-3xl md:border md:shadow-xl px-5 py-4 space-y-1.5 animate-fade-in z-50">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
              Select Agent Tool
            </h3>
            {navigationItems.map((item) => {
              const isActive = activeAgent === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? "bg-teal-50/70 text-teal-800 border border-teal-50"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? "text-teal-600" : "text-slate-400"}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  {item.pill && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      isActive ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-400"
                    }`}>
                      {item.pill}
                    </span>
                  )}
                </button>
              );
            })}
            

          </div>
        )}
      </header>

      {/* Primary Main Content Node */}
      <main className="flex-1 overflow-y-auto flex flex-col h-full bg-slate-50 min-w-0">
        
        {/* Dynamic Workspaces */}
        <div id="workspace-content-body" className="p-4 md:p-8 max-w-7xl w-full mx-auto flex-1 pb-16">
          {activeAgent === "dashboard" && (
            <Dashboard onNavigate={handleNavigate} />
          )}
          {activeAgent === "extractor" && (
            <IqamaExtractor />
          )}
          {activeAgent === "pdf-to-img" && (
            <PdfToImg />
          )}
          {activeAgent === "img-to-pdf" && (
            <ImgToPdf />
          )}
          {activeAgent === "pdf-to-word" && (
            <PdfToWord />
          )}
          {activeAgent === "watermark-remover" && (
            <WatermarkRemover />
          )}
          {activeAgent === "pdf-editor" && (
            <PdfEditor />
          )}
          {activeAgent === "products" && (
            <ProductFinder />
          )}
          {activeAgent === "resume-maker" && (
            <ResumeMaker />
          )}
          {activeAgent === "maps-extractor" && (
            <GoogleMapsExtractor />
          )}
        </div>
      </main>

    </div>
  );
}
