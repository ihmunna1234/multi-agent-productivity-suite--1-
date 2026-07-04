import React, { useState } from "react";
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
  Scissors
} from "lucide-react";
import { ActiveAgent } from "../types";

interface DashboardProps {
  onNavigate: (agent: ActiveAgent) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    "PDF Utilities",
    "Data & Crawlers",
    "AI Systems"
  ];

  const tools = [
    {
      id: "extractor" as ActiveAgent,
      title: "Iqama & ID Extractor",
      category: "Data & Crawlers",
      description: "Surgically extract structured names, dates of birth, and ID card numbers from scanned official images using smart AI OCR.",
      icon: <Database size={24} />,
      bgClass: "bg-primary-fixed text-primary border border-primary-fixed-dim",
      pill: "AI OCR"
    },
    {
      id: "pdf-to-img" as ActiveAgent,
      title: "PDF to Image Slicer",
      category: "PDF Utilities",
      description: "Instantly slice multi-page PDF documents into high-grade JPEG or PNG raster images with custom resolution profiles.",
      icon: <FileText size={24} />,
      bgClass: "bg-primary-fixed text-on-primary-fixed border border-primary-fixed-dim",
      pill: "Slicer"
    },
    {
      id: "img-to-pdf" as ActiveAgent,
      title: "Image to PDF Binder",
      category: "PDF Utilities",
      description: "Combine scattered photo files, design renders, or receipts into a single, highly optimized PDF binder document.",
      icon: <FileCheck size={24} />,
      bgClass: "bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-fixed-dim",
      pill: "Binder"
    },
    {
      id: "pdf-to-word" as ActiveAgent,
      title: "PDF to Word Converter",
      category: "PDF Utilities",
      description: "Deconstruct PDF pages to extract document contents, format structural headings, and compile perfectly editable Word documents.",
      icon: <FileText size={24} />,
      bgClass: "bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim",
      pill: "Word"
    },
    {
      id: "merge-pdf" as ActiveAgent,
      title: "Merge PDF Documents",
      category: "PDF Utilities",
      description: "Combine multiple PDF files into one single continuous document in the order you specify.",
      icon: <Combine size={24} />,
      bgClass: "bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-fixed-dim",
      pill: "Merge"
    },
    {
      id: "split-pdf" as ActiveAgent,
      title: "Split PDF Files",
      category: "PDF Utilities",
      description: "Extract specific pages or split a large PDF document into multiple smaller files instantly.",
      icon: <Scissors size={24} />,
      bgClass: "bg-primary-fixed text-primary border border-primary-fixed-dim",
      pill: "Split"
    },
    {
      id: "organize-pdf" as ActiveAgent,
      title: "Organize PDF Pages",
      category: "PDF Utilities",
      description: "Rearrange, delete, or rotate pages within your PDF document using an interactive drag-and-drop workspace.",
      icon: <Layers size={24} />,
      bgClass: "bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim",
      pill: "Organize"
    },
    {
      id: "watermark-remover" as ActiveAgent,
      title: "Watermark Remover from Image/PDF",
      category: "PDF Utilities",
      description: "Erase stamp watermarks, signature overlays, or faint background markings from image scans and PDF pages using smart filters.",
      icon: <Eraser size={24} />,
      bgClass: "bg-primary-fixed text-primary border border-primary-fixed-dim",
      pill: "Clean"
    },
    {
      id: "pdf-editor" as ActiveAgent,
      title: "Interactive PDF Editor",
      category: "PDF Utilities",
      description: "Draw annotations, blackout/redact confidential content, place customized corporate approval seals, and add comments on active page layers.",
      icon: <PenTool size={24} />,
      bgClass: "bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim",
      pill: "Edit"
    },
    {
      id: "products" as ActiveAgent,
      title: "Product Trend Scout",
      category: "AI Systems",
      description: "Analyze trending e-commerce product sectors, consumer categories, and active market intelligence with smart filters.",
      icon: <Search size={22} />,
      bgClass: "bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-fixed-dim",
      pill: "Market AI"
    },
    {
      id: "resume-maker" as ActiveAgent,
      title: "AI Resume Studio",
      category: "AI Systems",
      description: "Build high-grade professional resumes customized to your target job role using modern layout structures.",
      icon: <Sparkles size={22} />,
      bgClass: "bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim",
      pill: "Career AI"
    },
    {
      id: "maps-extractor" as ActiveAgent,
      title: "G-Maps Lead Extractor",
      category: "Data & Crawlers",
      description: "Compile high-quality physical store coordinates, telephone numbers, and email listings straight from active map graphs.",
      icon: <MapPin size={24} />,
      bgClass: "bg-error-container text-on-error-container border border-error",
      pill: "G-Maps Leads"
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
              key={tool.id}
              onClick={() => onNavigate(tool.id)}
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
            onClick={() => onNavigate("extractor")}
            className="w-full md:w-auto text-xs font-bold text-white bg-inverse-surface hover:bg-primary-container px-6 py-3 rounded-DEFAULT shadow-none transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Quick Start OCR Extractor</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

    </div>
  );
}
