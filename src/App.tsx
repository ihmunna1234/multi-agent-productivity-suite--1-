import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
  PenTool,
  Combine,
  Scissors,
  Layers,
  MapPin,
  LogOut
} from "lucide-react";

// Import custom agents
import Dashboard from "./components/Dashboard";
import IqamaExtractor from "./components/IqamaExtractor";
import PdfToImg from "./components/PdfToImg";
import ImgToPdf from "./components/ImgToPdf";
import PdfToWord from "./components/PdfToWord";
import WatermarkRemover from "./components/WatermarkRemover";
import ProductFinder from "./components/ProductFinder";
import ResumeMaker from "./components/ResumeMaker";
import GoogleMapsExtractor from "./components/GoogleMapsExtractor";
import MergePdf from "./components/MergePdf";
import SplitPdf from "./components/SplitPdf";
import OrganizePdf from "./components/OrganizePdf";
import Login from "./components/Login";

// ─── Auth Gate ───────────────────────────────────────────────────────────────
// Returns true if there is a JWT token stored in localStorage.
function isAuthenticated(): boolean {
  try {
    return !!localStorage.getItem("workspace_token");
  } catch {
    return false;
  }
}

// ─── Workspace Shell ─────────────────────────────────────────────────────────
function WorkspaceShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "night">(() => {
    try {
      const stored = localStorage.getItem("workspace_theme");
      if (stored === "dark" || stored === "night" || stored === "light") return stored;
    } catch { /* safe fallback */ }
    return "light";
  });

  const handleThemeChange = (newTheme: "light" | "dark" | "night") => {
    setTheme(newTheme);
    try { localStorage.setItem("workspace_theme", newTheme); } catch { /* ignore */ }
  };

  // Listen for session-expired events and redirect to root (which shows Login)
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem("workspace_token");
      window.location.replace("/");
    };
    window.addEventListener("auth-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth-unauthorized", handleUnauthorized);
  }, []);

  const navigationItems = [
    { path: "/iqama-extractor", name: "Iqama Extractor", icon: <Database size={16} />, pill: "AI OCR" },
    { path: "/pdf-to-image", name: "PDF to Image", icon: <FileText size={16} />, pill: "Slicer" },
    { path: "/image-to-pdf", name: "Image to PDF", icon: <FileCheck size={16} />, pill: "Binder" },
    { path: "/pdf-to-word", name: "PDF to Word", icon: <FileText size={16} />, pill: "Convert" },
    { path: "/merge-pdf", name: "Merge PDF", icon: <Combine size={16} />, pill: "Merge" },
    { path: "/split-pdf", name: "Split PDF", icon: <Scissors size={16} />, pill: "Split" },
    { path: "/organize-pdf", name: "Organize PDF", icon: <Layers size={16} />, pill: "Organize" },
    { path: "/watermark-remover", name: "Watermark Remover", icon: <Eraser size={16} />, pill: "Clean" },
    { path: "/product-scout", name: "Product Scout", icon: <Search size={16} />, pill: "Market" },
    { path: "/resume-studio", name: "Resume Studio", icon: <Sparkles size={16} />, pill: "Career" },
    { path: "/maps-extractor", name: "Leads Extractor", icon: <MapPin size={16} />, pill: "G-Maps" },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const themeClass = theme === "dark" ? "theme-dark" : theme === "night" ? "theme-night" : "theme-light";

  return (
    <div className={`flex flex-col h-screen bg-background font-sans text-on-background antialiased overflow-hidden relative ${themeClass}`}>
      <Helmet>
        <title>Injamus's AI Workspace</title>
      </Helmet>

      {/* Premium Top Navigation Bar */}
      <header className="bg-surface-container-lowest border-b border-outline-variant flex-shrink-0 z-50 relative shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">

            {/* Logo/Branding Node */}
            <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => handleNavigate("/")}>
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/20 active:scale-95 transition-transform">
                <BrainCircuit size={19} />
              </div>
              <div>
                <h1 className="font-bold text-on-background text-sm tracking-tight leading-none">
                  Injamus's AI Workspace
                </h1>
                <span className="text-[10px] text-primary font-semibold tracking-wider uppercase mt-1 block">
                  Multi-Agent Suite
                </span>
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-3">
              {/* Single Button Theme Cycler */}
              <button
                type="button"
                onClick={() => {
                  if (theme === "light") handleThemeChange("dark");
                  else if (theme === "dark") handleThemeChange("night");
                  else handleThemeChange("light");
                }}
                className="p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center border border-outline-variant/50 bg-surface hover:bg-surface-container-low text-on-surface-variant shadow-xs active:scale-95"
                title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
              >
                {theme === "light" && <Sun size={20} className="text-amber-500 stroke-[2.5]" />}
                {theme === "dark" && <Moon size={20} className="text-amber-300 stroke-[2.5]" />}
                {theme === "night" && <Contrast size={20} className="text-rose-400 stroke-[2.5]" />}
              </button>

              {/* Hamburger menu toggle */}
              <button
                id="hamburger-menu-toggle-btn"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 text-on-surface-variant bg-surface hover:bg-surface-container-low border border-outline-variant/50 rounded-2xl cursor-pointer transition-colors active:scale-95 flex items-center justify-center shadow-xs"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X size={20} className="text-on-background" /> : <Menu size={20} className="text-on-background" />}
              </button>

              {/* Lock / Logout Button */}
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("workspace_token");
                  window.location.replace("/");
                }}
                className="p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 shadow-xs active:scale-95"
                title="Lock Workspace (Logout)"
              >
                <LogOut size={20} strokeWidth={2.5} />
              </button>
            </div>

          </div>
        </div>

        {/* Universal Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-outline-variant bg-surface-container-lowest absolute top-16 left-0 right-0 md:left-auto md:right-8 md:w-80 md:rounded-3xl md:border md:shadow-xl px-5 py-4 space-y-1.5 animate-fade-in z-50">
            <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest px-3 mb-2">
              Select Agent Tool
            </h3>
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary-container text-on-primary-container border border-primary-container"
                      : "text-on-surface-variant hover:text-on-background hover:bg-surface-container-low border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? "text-primary" : "text-outline"}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  {item.pill && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      isActive ? "bg-primary text-on-primary" : "bg-surface-variant text-on-surface-variant"
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

      {/* Primary Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col h-full bg-background min-w-0">
        <div id="workspace-content-body" className="p-4 md:p-8 max-w-7xl w-full mx-auto flex-1 pb-16 bg-background">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/iqama-extractor" element={<IqamaExtractor />} />
            <Route path="/pdf-to-image" element={<PdfToImg />} />
            <Route path="/image-to-pdf" element={<ImgToPdf />} />
            <Route path="/pdf-to-word" element={<PdfToWord />} />
            <Route path="/merge-pdf" element={<MergePdf />} />
            <Route path="/split-pdf" element={<SplitPdf />} />
            <Route path="/organize-pdf" element={<OrganizePdf />} />
            <Route path="/watermark-remover" element={<WatermarkRemover />} />
            <Route path="/product-scout" element={<ProductFinder />} />
            <Route path="/resume-studio" element={<ResumeMaker />} />
            <Route path="/maps-extractor" element={<GoogleMapsExtractor />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

// ─── Root App — Auth Gate ─────────────────────────────────────────────────────
// This is the single source of truth for authentication.
// If no token exists → render <Login /> full page (nothing else shown).
// If token exists   → render the full <WorkspaceShell /> with all routes.
export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check localStorage token synchronously on mount
    setAuthenticated(isAuthenticated());

    // Also react to storage changes (e.g., logout in another tab)
    const handleStorage = () => setAuthenticated(isAuthenticated());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Null = still resolving (avoids flicker on first paint)
  if (authenticated === null) return null;

  // Not authenticated → full-page login, no app shell visible
  if (!authenticated) return <Login />;

  // Authenticated → full workspace
  return <WorkspaceShell />;
}
