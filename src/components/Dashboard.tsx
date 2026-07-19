import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileCheck, 
  FileText, 
  Search, 
  Database,
  Layers,
  Sparkles,
  ArrowRight,
  BookmarkCheck,
  MapPin,
  TrendingUp,
  Eraser,
  PenTool,
  Combine,
  Scissors,
  Trash2,
  ShieldAlert
} from "lucide-react";


export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(false);

  const handlePurgeAllData = () => {
    try {
      // Clear localStorage items containing user preferences, tokens, or configurations
      localStorage.removeItem("agent_hub_iqamas");
      localStorage.removeItem("agent_hub_categories");
      localStorage.removeItem("agent_hub_active_category");
      localStorage.removeItem("agent_hub_duplicate_alerts");
      localStorage.removeItem("agent_hub_last_supplier");
      localStorage.removeItem("workspace_token");

      // Delete IndexedDB database
      const req = indexedDB.deleteDatabase("IqamaImagesDB");
      req.onsuccess = () => {
        setPurgeSuccess(true);
        setShowPurgeConfirm(false);
        setTimeout(() => {
          setPurgeSuccess(false);
          window.location.reload();
        }, 1500);
      };
      req.onerror = () => {
        alert("Failed to delete database cache. You can clear it manually in your browser settings.");
        setShowPurgeConfirm(false);
      };
      req.onblocked = () => {
        // Fallback if DB open connections block deletion
        setPurgeSuccess(true);
        setShowPurgeConfirm(false);
        setTimeout(() => {
          setPurgeSuccess(false);
          window.location.reload();
        }, 1500);
      };
    } catch (e) {
      console.error("Purge failure:", e);
      alert("An error occurred while deleting data.");
    }
  };


  const categories = [
    "All",
    "PDF Utilities",
    "Data & Crawlers",
    "AI Systems",
    "Enterprise ERP"
  ];

  const tools = [
    {
      path: "/iqama-extractor",
      title: "Iqama & ID Extractor",
      category: "Data & Crawlers",
      description: "Surgically extract structured names, dates of birth, and ID card numbers from scanned official images using smart AI OCR.",
      icon: <Database size={24} />,
      bgClass: "bg-primary-fixed text-primary border border-primary-fixed-dim",
      pill: "AI OCR"
    },
    {
      path: "/pdf-to-image",
      title: "PDF to Image",
      category: "PDF Utilities",
      description: "Instantly slice multi-page PDF documents into high-grade JPEG or PNG raster images with custom resolution profiles.",
      icon: <FileText size={24} />,
      bgClass: "bg-primary-fixed text-on-primary-fixed border border-primary-fixed-dim",
      pill: "Slicer"
    },
    {
      path: "/image-to-pdf",
      title: "Image to PDF",
      category: "PDF Utilities",
      description: "Combine scattered photo files, design renders, or receipts into a single, highly optimized PDF binder document.",
      icon: <FileCheck size={24} />,
      bgClass: "bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-fixed-dim",
      pill: "Binder"
    },
    {
      path: "/pdf-to-word",
      title: "PDF to Word Converter",
      category: "PDF Utilities",
      description: "Deconstruct PDF pages to extract document contents, format structural headings, and compile perfectly editable Word documents.",
      icon: <FileText size={24} />,
      bgClass: "bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim",
      pill: "Word"
    },
    {
      path: "/merge-pdf",
      title: "Merge PDF Documents",
      category: "PDF Utilities",
      description: "Combine multiple PDF files into one single continuous document in the order you specify.",
      icon: <Combine size={24} />,
      bgClass: "bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-fixed-dim",
      pill: "Merge"
    },
    {
      path: "/split-pdf",
      title: "Split PDF Files",
      category: "PDF Utilities",
      description: "Extract specific pages or split a large PDF document into multiple smaller files instantly.",
      icon: <Scissors size={24} />,
      bgClass: "bg-primary-fixed text-primary border border-primary-fixed-dim",
      pill: "Split"
    },
    {
      path: "/organize-pdf",
      title: "Organize PDF Pages",
      category: "PDF Utilities",
      description: "Rearrange, delete, or rotate pages within your PDF document using an interactive drag-and-drop workspace.",
      icon: <Layers size={24} />,
      bgClass: "bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim",
      pill: "Organize"
    },
    {
      path: "/watermark-remover",
      title: "Watermark Remover from Image/PDF",
      category: "PDF Utilities",
      description: "Erase stamp watermarks, signature overlays, or faint background markings from image scans and PDF pages using smart filters.",
      icon: <Eraser size={24} />,
      bgClass: "bg-primary-fixed text-primary border border-primary-fixed-dim",
      pill: "Clean"
    },

    {
      path: "/product-scout",
      title: "Product Trend Scout",
      category: "AI Systems",
      description: "Analyze trending e-commerce product sectors, consumer categories, and active market intelligence with smart filters.",
      icon: <Search size={22} />,
      bgClass: "bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-fixed-dim",
      pill: "Market AI"
    },
    {
      path: "/resume-studio",
      title: "AI Resume Studio",
      category: "AI Systems",
      description: "Build high-grade professional resumes customized to your target job role using modern layout structures.",
      icon: <Sparkles size={22} />,
      bgClass: "bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim",
      pill: "Career AI"
    },
    {
      path: "/maps-extractor",
      title: "G-Maps Lead Extractor",
      category: "Data & Crawlers",
      description: "Compile high-quality physical store coordinates, telephone numbers, and email listings straight from active map graphs.",
      icon: <MapPin size={24} />,
      bgClass: "bg-error-container text-on-error-container border border-error",
      pill: "G-Maps Leads"
    },
    {
      path: "/manpower-erp",
      title: "Manpower Management ERP",
      category: "Enterprise ERP",
      description: "Full-scale workforce management system for Saudi manpower suppliers. Track monthly hours, salaries, ledger payments, and worker documents.",
      icon: <Database size={24} />,
      bgClass: "bg-emerald-100 text-emerald-700 border border-emerald-300",
      pill: "ERP System"
    }
  ];

  const filteredTools = selectedCategory === "All" 
    ? tools 
    : tools.filter(t => t.category === selectedCategory);

  return (
    <div className="space-y-10 animate-fade-in text-on-surface pb-12">
      
      {/* High Fidelity Centered Greeting Panel */}
      <div className="text-center space-y-4 pt-6">
        <h2 className="text-3xl font-semibold tracking-tight text-on-surface sm:text-4xl">
          Hi Injamul Hoque, let's get started
        </h2>
        <p className="text-sm text-outline max-w-xl mx-auto leading-relaxed">
          Select an intelligent workspace adapter or micro-tool pipeline below to start compiling leads, processing metadata, or transforming documents.
        </p>
      </div>

      {/* Horizontal Category Filtering Row (matches UI in screenshot) */}
      <div className="flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl px-4">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-DEFAULT text-xs font-semibold tracking-wide border transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? "bg-[#1f2937] text-white border-[#1f2937] shadow-none" 
                    : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-outline hover:bg-surface-container-low/50"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pure White Card Grid Matrix */}
      <div className="max-w-7xl mx-auto px-1 sm:px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <div
              key={tool.path}
              onClick={() => navigate(tool.path)}
              className="group bg-surface-container-lowest rounded-lg p-6 border border-[#e4e4e7] hover:border-outline shadow-none hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px]"
            >
              <div className="space-y-4">
                {/* Micro Icon Badge with subtle backdrop */}
                <div className={`w-12 h-12 rounded-DEFAULT flex items-center justify-center ${tool.bgClass}`}>
                  {tool.icon}
                </div>

                {/* Content Area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-on-surface text-[16px] tracking-tight group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>
                    <span className="text-[9px] font-bold text-outline-variant uppercase tracking-widest bg-surface-container-low border border-surface-container-highest px-2 py-0.5 rounded">
                      {tool.pill}
                    </span>
                  </div>
                  <p className="text-xs text-outline leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>

              {/* Action Prompt */}
              <div className="pt-4 flex items-center justify-between text-[11px] font-bold text-primary group-hover:text-primary-container">
                <span className="text-outline-variant font-normal font-mono uppercase text-[9px] tracking-wider">
                  {tool.category}
                </span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Launch workspace
                  <ArrowRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Embedded Workspace Trust Banner */}
      <div className="max-w-7xl mx-auto px-1 sm:px-4 pt-4">
        <div className="bg-surface-container-lowest border border-[#e4e4e7] rounded-lg p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex gap-4 items-start text-left">
            <div className="p-3 bg-emerald-50 rounded-DEFAULT border border-emerald-100 text-emerald-600 shrink-0 hidden sm:block">
              <BookmarkCheck size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-on-surface text-sm flex items-center gap-1.5">
                Secure Client Sandboxing Active
              </h4>
              <p className="text-xs text-outline max-w-2xl leading-relaxed">
                All document parsing, data extractions, and PDF transformations happen entirely inside secure local memory caches. No data ever leaves your device without explicit request.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/iqama-extractor")}
            className="w-full md:w-auto text-xs font-bold text-white bg-inverse-surface hover:bg-primary-container px-6 py-3 rounded-DEFAULT shadow-none transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Quick Start OCR Extractor</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Privacy and Deletion Flow Panel */}
      <div className="max-w-7xl mx-auto px-1 sm:px-4 pt-2">
        <div className="bg-surface-container-lowest border border-[#e4e4e7] rounded-lg p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex gap-4 items-start text-left">
            <div className="p-3 bg-red-50 rounded-DEFAULT border border-red-100 text-red-600 shrink-0 hidden sm:block">
              <ShieldAlert size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-on-surface text-sm flex items-center gap-1.5">
                Privacy Controls & Local Data Purge
              </h4>
              <p className="text-xs text-outline max-w-2xl leading-relaxed">
                To guarantee complete privacy, this application stores configuration options and scanned document data in your browser's local sandbox memory (IndexedDB and local storage). Erase all historical logs, records, and preferences instantly.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0 flex flex-col gap-2">
            {!showPurgeConfirm && !purgeSuccess && (
              <button
                onClick={() => setShowPurgeConfirm(true)}
                className="w-full md:w-auto text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-6 py-3 rounded-DEFAULT shadow-none transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <Trash2 size={13} />
                <span>Purge All Saved Data</span>
              </button>
            )}

            {showPurgeConfirm && (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowPurgeConfirm(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface rounded-DEFAULT text-xs font-semibold hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurgeAllData}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-DEFAULT text-xs font-semibold shadow-sm active:scale-95 transition-transform"
                >
                  Confirm Delete All
                </button>
              </div>
            )}

            {purgeSuccess && (
              <div className="text-emerald-600 text-xs font-bold flex items-center justify-center gap-1">
                <span>✓ Data Purged Successfully!</span>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
