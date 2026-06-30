import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "../utils/api";
import { 
  MapPin, 
  Search, 
  FileSpreadsheet, 
  Download, 
  Database, 
  Sparkles, 
  Globe, 
  Phone, 
  Star, 
  Mail, 
  Link as LinkIcon, 
  Map, 
  Settings, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Layers3,
  ListFilter
} from "lucide-react";
import * as XLSX from "xlsx";

interface MapsBusinessEntry {
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  ratingCount: number;
  category: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string;
  email: string;
  socialProfiles: string;
  source: string;
}

interface ColumnSelection {
  name: boolean;
  address: boolean;
  phone: boolean;
  website: boolean;
  rating: boolean;
  ratingCount: boolean;
  category: boolean;
  latitude: boolean;
  longitude: boolean;
  email: boolean;
  socialProfiles: boolean;
}

export default function GoogleMapsExtractor() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [mode, setMode] = useState<"ai" | "places_api">("ai");
  const [clientApiKey, setClientApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [results, setResults] = useState<MapsBusinessEntry[]>([]);
  const [activeItem, setActiveItem] = useState<MapsBusinessEntry | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Column toggles for exporting selection
  const [columns, setColumns] = useState<ColumnSelection>({
    name: true,
    address: true,
    phone: true,
    website: true,
    rating: true,
    ratingCount: true,
    category: true,
    latitude: true,
    longitude: true,
    email: true,
    socialProfiles: true,
  });

  const columnsMeta = [
    { key: "name" as keyof ColumnSelection, label: "Business Name", desc: "Official title" },
    { key: "address" as keyof ColumnSelection, label: "Full Address", desc: "Street & City" },
    { key: "phone" as keyof ColumnSelection, label: "Phone Number", desc: "Direct phone lines" },
    { key: "website" as keyof ColumnSelection, label: "Website URL", desc: "Domain link" },
    { key: "rating" as keyof ColumnSelection, label: "Average Rating", desc: "Star score (1-5)" },
    { key: "ratingCount" as keyof ColumnSelection, label: "Rating Count", desc: "Number of reviews" },
    { key: "category" as keyof ColumnSelection, label: "Business Category", desc: "Sectors & Tags" },
    { key: "latitude" as keyof ColumnSelection, label: "Latitude", desc: "Earth Latitude" },
    { key: "longitude" as keyof ColumnSelection, label: "Longitude", desc: "Earth Longitude" },
    { key: "email" as keyof ColumnSelection, label: "Email Contact", desc: "Scraped company mail (AI mode)" },
    { key: "socialProfiles" as keyof ColumnSelection, label: "Social Media Links", desc: "IG/FB/LinkedIn (AI mode)" },
  ];

  const presets = [
    { k: "Dentist", l: "Riyadh, Saudi Arabia" },
    { k: "Specialty Coffee Roasteries", l: "Dubai, UAE" },
    { k: "Boutique Luxury Hotels", l: "London, UK" },
    { k: "Real Estate Agencies", l: "New York, USA" },
    { k: "Tesla Charging Stations", l: "San Francisco, USA" },
  ];

  const applyPreset = (k: string, l: string) => {
    setKeyword(k);
    setLocation(l);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      setError("Please enter a valid keyword or business type.");
      return;
    }
    if (!location.trim()) {
      setError("Please enter a location filter (e.g. City or State).");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setActiveItem(null);
    setApiError(null);

    try {
      const res = await apiFetch("/api/extract-maps-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, location, mode, clientApiKey }),
      });

      if (!res.ok) {
        throw new Error(`Server returned code ${res.status}`);
      }

      const data = await res.json();
      if (data.results) {
        setResults(data.results);
        setIsFallback(!!data.isFallback);
        setApiError(data.apiError || null);
        if (data.results.length > 0) {
          setActiveItem(data.results[0]);
          if (data.isFallback) {
            setSuccessMsg("Google AI search cap active. High-fidelity lead generation simulation enabled!");
          } else {
            setSuccessMsg(`Successfully gathered ${data.results.length} rich Google Maps lead logs!`);
          }
        } else {
          setError("No results returned for the specified query. Try widening your location or changing keyword.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch map data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (results.length === 0) return;

    // Filter columns based on user selection
    const filteredData = results.map((entry) => {
      const row: any = {};
      columnsMeta.forEach((colMeta) => {
        if (columns[colMeta.key]) {
          // Map to beautiful uppercase titles
          row[colMeta.label] = entry[colMeta.key as keyof MapsBusinessEntry] ?? "N/A";
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Maps Leads Report");

    const cleanKeyword = keyword.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
    const cleanLocation = location.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
    
    XLSX.writeFile(workbook, `gmaps_leads_${cleanKeyword}_in_${cleanLocation}.xlsx`);
    
    // Auto trigger tiny success state
    const originalText = successMsg;
    setSuccessMsg("Spreadsheet .xlsx file downloaded successfully!");
    setTimeout(() => setSuccessMsg(originalText), 5000);
  };

  const handleExportCsv = () => {
    if (results.length === 0) return;

    // Build header line
    const activeHeaders = columnsMeta.filter(c => columns[c.key]);
    const headerRow = activeHeaders.map(h => `"${h.label.replace(/"/g, '""')}"`).join(",");

    // Build data lines
    const rows = results.map(entry => {
      return activeHeaders.map(col => {
        const val = String(entry[col.key as keyof MapsBusinessEntry] ?? "N/A");
        return `"${val.replace(/"/g, '""')}"`;
      }).join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headerRow, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const cleanKeyword = keyword.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
    const cleanLocation = location.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
    link.setAttribute("download", `gmaps_leads_${cleanKeyword}_in_${cleanLocation}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleAllColumns = (val: boolean) => {
    setColumns({
      name: true, // Name is mandatory
      address: val,
      phone: val,
      website: val,
      rating: val,
      ratingCount: val,
      category: val,
      latitude: val,
      longitude: val,
      email: val,
      socialProfiles: val,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 animate-fade-in">
      
      {/* Workspace Header Panel */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/25 border border-emerald-400/20 text-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
              <Sparkles size={11} className="animate-spin duration-3000" />
              Direct Lead Extractor
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Google Maps Leads Sourcing</h2>
            <p className="text-sm text-teal-100 max-w-2xl leading-normal">
              Extract physical store locations, phone coordinates, active websites, structured business ratings, and email addresses directly from search indexes and export exactly what you want as high-grade formatted Excel tables.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-md border border-white/10 hidden sm:block">
              <MapPin size={26} className="text-emerald-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Input Formulation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Search Parameter Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-2">
              <Settings size={14} className="text-teal-600" />
              Extraction Config
            </h3>

            {/* Mode Switcher */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 block">Sourcing Architecture</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode("ai")}
                  className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-center transition-all cursor-pointer ${
                    mode === "ai"
                      ? "bg-white text-teal-800 font-bold shadow-xs border border-slate-200/50"
                      : "text-slate-400 font-medium hover:text-slate-600"
                  }`}
                >
                  <span className="text-xs flex items-center gap-1">
                    <Sparkles size={12} className={mode === "ai" ? "text-teal-600" : ""} />
                    AI Search
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase mt-0.5 tracking-wide scale-90">Auto Email/Social</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("places_api")}
                  className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-center transition-all cursor-pointer ${
                    mode === "places_api"
                      ? "bg-white text-teal-800 font-bold shadow-xs border border-slate-200/50"
                      : "text-slate-400 font-medium hover:text-slate-600"
                  }`}
                >
                  <span className="text-xs flex items-center gap-1">
                    <Database size={12} className={mode === "places_api" ? "text-teal-600" : ""} />
                    Google API
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase mt-0.5 tracking-wide scale-90">Official Places</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              
              {/* Keyword Group */}
              <div className="space-y-1">
                <label htmlFor="keyword-box" className="text-xs font-bold text-slate-500 block">Keyword / Business niche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 text-slate-400" size={15} />
                  <input
                    id="keyword-box"
                    type="text"
                    required
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. Real Estate, Coffee Shops, Gym"
                    className="w-full pl-9 pr-3 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white focus:border-teal-500 transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Location Group */}
              <div className="space-y-1">
                <label htmlFor="location-box" className="text-xs font-bold text-slate-500 block">Target Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-slate-400" size={15} />
                  <input
                    id="location-box"
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. London, Riyadh, Dubai"
                    className="w-full pl-9 pr-3 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white focus:border-teal-500 transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* API Key Group inside Places API choice */}
              {mode === "places_api" && (
                <div className="space-y-1 pt-1 border-t border-slate-50 animate-fade-in">
                  <div className="flex justify-between items-center mb-0.5">
                    <label htmlFor="api-key-box" className="text-xs font-bold text-slate-500">Google Places API Key</label>
                    <span className="text-[9px] text-slate-400 font-medium">Optional Fallback</span>
                  </div>
                  <input
                    id="api-key-box"
                    type="password"
                    value={clientApiKey}
                    onChange={(e) => setClientApiKey(e.target.value)}
                    placeholder="AI Studio secret will be used if blank"
                    className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all font-mono"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal pt-1">
                    Leave blank to automatically use proxy keys. If you hit quota, paste your custom Google Maps API key.
                  </p>
                </div>
              )}

              {/* Submit trigger button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold tracking-wider uppercase rounded-xl shadow-xs hover:shadow-md transition-all active:scale-97 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Extracting Leads...</span>
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    <span>Compile lead report</span>
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Preset Buttons */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Quick Try Presets</h4>
            <div className="flex flex-col gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset.k, preset.l)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-teal-100 bg-slate-50/50 hover:bg-teal-50/30 text-[11px] text-slate-600 hover:text-teal-800 transition-all font-medium flex items-center gap-2 cursor-pointer group"
                >
                  <Search size={12} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
                  <span className="truncate flex-1">
                    <strong className="text-slate-700">{preset.k}</strong> in {preset.l}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Client Selector & Live Export Matrix */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Export Fields Selector (Critical for Client Constraint) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-50 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-2">
                  <ListFilter size={14} className="text-teal-600" />
                  Client Export Data Fields Selection
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Toggle coordinates, contacts or ratings columns. Only selected fields will build into your downloaded Excel sheet.</p>
              </div>
              
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  onClick={() => toggleAllColumns(true)}
                  className="text-[10px] font-bold text-teal-600 hover:bg-teal-50 px-2 py-1 rounded"
                >
                  Select All
                </button>
                <span className="text-slate-200">|</span>
                <button
                  onClick={() => toggleAllColumns(false)}
                  className="text-[10px] font-bold text-slate-400 hover:bg-slate-100 px-2 py-1 rounded"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {columnsMeta.map((col) => {
                const checked = columns[col.key];
                const isMandatory = col.key === "name";
                return (
                  <label
                    key={col.key}
                    onClick={() => {
                      if (isMandatory) return;
                      setColumns({ ...columns, [col.key]: !checked });
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-[68px] select-none ${
                      checked
                        ? "border-emerald-200 bg-emerald-50/20 text-emerald-900 shadow-inner"
                        : "border-slate-100 bg-slate-50/40 text-slate-400 hover:bg-slate-50/80 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${checked ? "text-slate-800" : "text-slate-500"}`}>
                        {col.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isMandatory}
                        readOnly
                        className="w-3 h-3 text-teal-600 rounded focus:ring-teal-500 pointer-events-none accent-emerald-500"
                      />
                    </div>
                    <span className="text-[8px] uppercase tracking-wide text-slate-400/90 truncate font-mono">
                      {isMandatory ? "Required" : col.desc}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Feedback Section */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3 text-rose-800 text-xs animate-fade-in leading-relaxed">
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Extraction Error:</strong> {error}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 text-emerald-800 text-xs animate-fade-in">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>{successMsg}</div>
            </div>
          )}

          {isFallback && (
            <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4.5 space-y-2.5 text-amber-900 text-xs animate-fade-in">
              <div className="flex gap-3">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <strong className="font-semibold text-slate-900">Google AI Studio Project Cap Reached (RESOURCE_EXHAUSTED)</strong>
                  <p className="text-slate-600 leading-relaxed font-sans">
                    Your Google AI Studio project has exceeded its monthly query limit or spending cap. To maintain an uninterrupted workflow and allow you to fully test layouts, maps visualization, coordinates mapping, and excel downloads, we have seamlessly activated our <strong className="text-amber-800 font-semibold">High-Fidelity Leads Simulation Sandbox</strong>.
                  </p>
                  {apiError && (
                    <div className="mt-2 text-left">
                      <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">Exact API Error Response:</p>
                      <p className="font-mono text-[9px] bg-white/70 p-2.5 rounded-xl border border-amber-200/50 leading-relaxed text-amber-950 break-words select-all mt-1">
                        {(() => {
                          const rawError = apiError;
                          const trimmed = rawError.trim();
                          try {
                            if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
                              const parsed = JSON.parse(trimmed);
                              if (parsed.error && parsed.error.message) {
                                return parsed.error.message;
                              }
                              if (parsed.message) {
                                return parsed.message;
                              }
                            }
                          } catch (e) {}
                          try {
                            const matchMessage = trimmed.match(/"message"\s*:\s*"([^"]+)"/);
                            if (matchMessage && matchMessage[1]) {
                              return matchMessage[1].replace(/\\"/g, '"');
                              }
                          } catch (_) {}
                          return rawError;
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="pl-7.5 pt-2 border-t border-amber-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-amber-800">
                <span className="font-bold text-[10px] uppercase font-mono tracking-wider text-amber-700">
                  ⚡ Bypass instructions:
                </span>
                <span className="leading-relaxed">
                  Toggle the sourcing mode above to <strong className="font-semibold">Google API</strong> and enter your own Google Places API Key to extract live directory metadata.
                </span>
              </div>
            </div>
          )}

          {/* Loading Radar Overlay Panel */}
          {loading && (
            <div className="bg-white rounded-2xl p-10 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center space-y-4 relative min-h-[300px]">
              <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-teal-500/10 animate-ping duration-2000" />
                <div className="absolute inset-3 rounded-full border border-teal-500/20 animate-ping duration-1500" />
                <div className="absolute inset-6 rounded-full border border-teal-500/30 animate-ping duration-1000" />
                
                {/* Simulated search sweep radar lines */}
                <div className="w-16 h-16 rounded-full border-t border-r border-teal-500/40 animate-spin flex items-center justify-center absolute">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                </div>
                <MapPin className="text-teal-600 relative z-10 animate-bounce" size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 font-mono tracking-tight">CRAWLING SEARCH GRAPHS</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Leveraging high-capacity model search grounding layers to resolve coordinates, direct lines, and domains for {keyword} in {location}...
                </p>
              </div>
              <div className="text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg animate-pulse">
                IP: SATELLITE_GPS_LINK // RETRY_COUNT: 0 // NODE: ACTIVE
              </div>
            </div>
          )}

          {/* Sourced Data Grid Board */}
          {!loading && results.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              
              {/* Header Actions panel inside Lead logs grid */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-slate-850 text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <Layers3 size={14} className="text-teal-600" />
                    Compiled Leads (Total: {results.length})
                  </h3>
                  <p className="text-[10px] text-slate-400">Preview leads before downloading. Active rows show real-time GPS locations below.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCsv}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Download size={13} />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/20 text-white text-xs font-bold rounded-xl transition-all hover:shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Download Excel Sheet</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
                  <thead className="bg-slate-50/30 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                    <tr>
                      {columns.name && <th className="p-4 pl-6">Business Name</th>}
                      {columns.category && <th className="p-4">Category</th>}
                      {columns.phone && <th className="p-4">Phone Number</th>}
                      {columns.website && <th className="p-4">Website</th>}
                      {columns.rating && <th className="p-4">Rating ⭐</th>}
                      {columns.email && mode === "ai" && <th className="p-4">Email</th>}
                      {columns.socialProfiles && mode === "ai" && <th className="p-4">Social handles</th>}
                      <th className="p-4 text-right pr-6">Geoloc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((entry, index) => {
                      const isActive = activeItem?.placeId === entry.placeId;
                      return (
                        <tr
                          key={entry.placeId || index}
                          onClick={() => setActiveItem(entry)}
                          className={`hover:bg-teal-50/20 cursor-pointer transition-colors ${
                            isActive ? "bg-teal-50/40 relative z-10" : ""
                          }`}
                        >
                          {columns.name && (
                            <td className="p-4 pl-6 font-semibold text-slate-800">
                              <span className="flex items-center gap-2">
                                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping inline-block" />}
                                {entry.name}
                              </span>
                            </td>
                          )}
                          {columns.category && (
                            <td className="p-4">
                              <span className="bg-slate-100 text-slate-600 font-mono text-[10px] px-2 py-0.5 rounded uppercase">
                                {entry.category}
                              </span>
                            </td>
                          )}
                          {columns.phone && (
                            <td className="p-4 text-slate-500">
                              {entry.phone !== "N/A" ? (
                                <a href={`tel:${entry.phone}`} className="flex items-center gap-1 text-teal-600 hover:underline">
                                  <Phone size={11} />
                                  <span>{entry.phone}</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 font-mono">N/A</span>
                              )}
                            </td>
                          )}
                          {columns.website && (
                            <td className="p-4 text-slate-500">
                              {entry.website !== "N/A" ? (
                                <a
                                  href={entry.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-teal-600 hover:underline truncate max-w-[140px]"
                                >
                                  <Globe size={11} className="shrink-0" />
                                  <span>{entry.website.replace("https://", "").replace("http://", "").replace("www.", "")}</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 font-mono">N/A</span>
                              )}
                            </td>
                          )}
                          {columns.rating && (
                            <td className="p-4">
                              {entry.rating > 0 ? (
                                <span className="flex items-center gap-1 text-orange-500 font-bold">
                                  <span>{entry.rating}</span>
                                  <Star size={11} fill="currentColor" />
                                  <span className="text-slate-400 font-medium font-mono text-[9px]">({entry.ratingCount})</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono">Unrated</span>
                              )}
                            </td>
                          )}
                          {columns.email && mode === "ai" && (
                            <td className="p-4 text-slate-500">
                              {entry.email !== "N/A" ? (
                                <span className="flex items-center gap-1 text-indigo-600 text-[11px] truncate max-w-[120px]">
                                  <Mail size={11} className="shrink-0" />
                                  <span>{entry.email}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono">None</span>
                              )}
                            </td>
                          )}
                          {columns.socialProfiles && mode === "ai" && (
                            <td className="p-4 text-slate-500">
                              {entry.socialProfiles !== "N/A" ? (
                                <span className="flex items-center gap-1 text-slate-600 text-[11px] truncate max-w-[120px]">
                                  <LinkIcon size={11} className="shrink-0 text-slate-400" />
                                  <span>{entry.socialProfiles}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono">None</span>
                              )}
                            </td>
                          )}
                          <td className="p-4 text-right pr-6 font-mono text-[10px] text-slate-400">
                            {entry.latitude ? `${entry.latitude.toFixed(2)}, ${entry.longitude?.toFixed(2)}` : "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Informative Lead Sourcing Footer */}
              <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 px-6">
                <span className="flex items-center gap-1 font-mono">
                  <Info size={12} className="text-teal-600" />
                  Sourcing Graph: {results[0]?.source}
                </span>
                <span className="font-mono">Ready to download in client preferred fields layout</span>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Dynamic Simulated Tactical Map View (Aesthetics first) */}
      {!loading && results.length > 0 && activeItem && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0 relative animate-fade-in">
          
          {/* Spatial Map simulation Pane (7 cols) */}
          <div className="md:col-span-8 h-[340px] bg-slate-900 relative overflow-hidden flex items-center justify-center">
            
            {/* Visual Grid Lines and Concentric Circles representing GPS scanning */}
            <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
            
            {/* Radar concentric circular sweeps */}
            <div className="absolute w-[200px] h-[200px] rounded-full border border-teal-500/10 animate-pulse" />
            <div className="absolute w-[400px] h-[400px] rounded-full border border-teal-500/5 animate-pulse" />
            <div className="absolute w-[600px] h-[600px] rounded-full border border-teal-500/3 pointer-events-none" />

            {/* Simulated Street Outlines (SVG aesthetic) */}
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              {/* Lines representing mock grid streets */}
              <line x1="10%" y1="0" x2="10%" y2="100%" stroke="#14b8a6" strokeWidth="1.5" />
              <line x1="45%" y1="0" x2="45%" y2="100%" stroke="#14b8a6" strokeWidth="1.5" />
              <line x1="80%" y1="0" x2="80%" y2="100%" stroke="#14b8a6" strokeWidth="1.5" />
              <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#14b8a6" strokeWidth="1.5" />
              <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#14b8a6" strokeWidth="1.5" />
              
              <path d="M 10,150 Q 150,220 300,300 T 700,100" fill="none" stroke="#059669" strokeWidth="2.5" />
              <path d="M 0,50 C 250,50 150,250 800,250" fill="none" stroke="#059669" strokeWidth="2" />
            </svg>

            {/* Simulated Satellite Tracker Radar scanning coordinates indicators */}
            {results.map((item, idx) => {
              // Generate standard offset coordinate spreads in pixels around the center using their latitude fallback
              const latSeed = item.latitude ? (item.latitude % 1) : Math.sin(idx) * 0.4;
              const lngSeed = item.longitude ? (item.longitude % 1) : Math.cos(idx) * 0.4;
              
              const xPos = 50 + latSeed * 40; // centered +/- 40%
              const yPos = 50 + lngSeed * 40;
              const isActive = activeItem.placeId === item.placeId;

              return (
                <div
                  key={item.placeId || idx}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 select-none group"
                  style={{ left: `${xPos}%`, top: `${yPos}%` }}
                  onClick={() => setActiveItem(item)}
                >
                  <div className="relative cursor-pointer">
                    {isActive ? (
                      <>
                        <span className="absolute -inset-2 rounded-full bg-teal-500/30 animate-ping" />
                        <MapPin className="text-teal-400 drop-shadow-lg relative z-10 animate-bounce" size={26} />
                      </>
                    ) : (
                      <MapPin className="text-emerald-500/60 hover:text-emerald-400 hover:scale-110 drop-shadow duration-300 relative z-10" size={18} />
                    )}
                    
                    {/* Hover tooltip for other pin dots */}
                    <div className="absolute left-full top-1/2 ml-2 -translate-y-1/2 bg-slate-900 border border-slate-700/80 p-2 rounded-lg text-white font-sans text-[10px] font-bold tracking-tight opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg pointer-events-none whitespace-nowrap">
                      {item.name}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dynamic UI HUD Legend displaying top satellite coordinates telemetry */}
            <div className="absolute bottom-4 left-4 font-mono text-[9px] text-teal-400 bg-slate-950/80 border border-teal-500/20 p-2.5 rounded-lg backdrop-blur-sm space-y-1">
              <div className="flex gap-4 font-bold">
                <span>LAT: {activeItem.latitude?.toFixed(4) || "0.0000"}</span>
                <span>LNG: {activeItem.longitude?.toFixed(4) || "0.0000"}</span>
              </div>
              <div className="text-slate-500 uppercase tracking-widest text-[8px]">
                Target: {activeItem.name.substring(0, 24)}
              </div>
            </div>

            {/* Top corner category status bar badge */}
            <div className="absolute top-4 left-4 font-mono text-[9px] text-emerald-400 bg-emerald-950/85 border border-emerald-500/30 px-2.5 py-1 rounded">
              ● SATELLITE HUD MAP ACTIVE
            </div>

          </div>

          {/* Active Inspection detail Drawer Pane (4 cols) */}
          <div className="md:col-span-4 p-5 sm:p-6 bg-slate-50 border-l border-slate-100 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              
              {/* Category indicator */}
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md uppercase tracking-wide">
                  {activeItem.category}
                </span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">
                  ID: {activeItem.placeId.substring(0, 10)}
                </span>
              </div>

              {/* Title log */}
              <div className="space-y-1.5Packed">
                <h4 className="font-bold text-sm text-slate-800 tracking-tight leading-snug">
                  {activeItem.name}
                </h4>
                <p className="text-xs text-slate-500 leading-normal flex items-start gap-1">
                  <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>{activeItem.address}</span>
                </p>
              </div>

              <div className="border-t border-slate-200/50 pt-4 space-y-2 text-xs">
                
                {/* Phone details */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Telephone</span>
                  <span className="font-semibold text-slate-700">
                    {activeItem.phone !== "N/A" ? activeItem.phone : "Not Available"}
                  </span>
                </div>

                {/* Rating score details */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Google Rating</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    {activeItem.rating > 0 ? (
                      <>
                        <span>{activeItem.rating}</span>
                        <Star size={12} className="text-orange-500" fill="currentColor" />
                        <span className="text-slate-400 font-normal font-mono text-[9px]">({activeItem.ratingCount})</span>
                      </>
                    ) : (
                      "No Star Reviews"
                    )}
                  </span>
                </div>

                {/* Website domain details */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Website domain</span>
                  <span className="font-semibold truncate max-w-[140px]">
                    {activeItem.website !== "N/A" ? (
                      <a href={activeItem.website} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">
                        {activeItem.website.replace("https://", "").replace("http://", "").replace("www.", "")}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </span>
                </div>

                {/* Email (AI Mode only details) */}
                {mode === "ai" && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Scraped E-mail</span>
                    <span className="font-semibold text-slate-700 text-[11px] truncate max-w-[140px]">
                      {activeItem.email !== "N/A" ? activeItem.email : "Not Scraped/None"}
                    </span>
                  </div>
                )}

                {/* Social media targets */}
                {mode === "ai" && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Profile handle</span>
                    <span className="font-semibold text-slate-700 text-[11px] truncate max-w-[140px]">
                      {activeItem.socialProfiles !== "N/A" ? activeItem.socialProfiles : "None Identified"}
                    </span>
                  </div>
                )}

              </div>

            </div>

            {/* Inspect direct Google Maps reference search button helper */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${activeItem.name} ${activeItem.address}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-2 bg-slate-900 text-white hover:bg-teal-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Globe size={13} />
              <span>Inspect on live Google Maps</span>
            </a>
          </div>

        </div>
      )}

    </div>
  );
}
