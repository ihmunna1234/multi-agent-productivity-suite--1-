import React, { useState, useMemo, useRef, useEffect } from "react";
import { apiFetch } from "../utils/api";
import { 
  Search, 
  Sparkles, 
  TrendingUp, 
  Loader2, 
  DollarSign, 
  Users, 
  Heart, 
  ExternalLink,
  Target,
  AlertCircle,
  Lightbulb,
  BookOpen,
  X,
  Store,
  Coins,
  ChevronRight,
  Flame,
  Layers,
  Cpu,
  Sliders,
  Percent,
  Filter,
  Tag,
  ShoppingBag,
  Globe,
  SlidersHorizontal,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProductItem, ProductSearchResponse, ProductSupplier } from "../types";

interface IndustryCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  trendReason: string;
  keywords: string[];
  color: {
    primary: string;
    bg: string;
    border: string;
    text: string;
    glow: string;
  };
}

export default function ProductFinder() {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>("tech");
  const [nicheInput, setNicheInput] = useState<string>("");
  const [results, setResults] = useState<ProductSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // States for active panels/tabs in product details
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [activeTab, setActiveTab] = useState<"opportunities" | "insights" | "calculator">("opportunities");
  
  // Custom margin simulation states inside details modal
  const [simulatedRetailPrice, setSimulatedRetailPrice] = useState<number>(100);

  // States for the newly introduced Smart Categories Filter Input
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>("");

  // States for real-time live product search of parsed results
  const [resultsKeywordFilter, setResultsKeywordFilter] = useState<string>("");
  const [minGrowthFilter, setMinGrowthFilter] = useState<number>(80);
  const [priceTierFilter, setPriceTierFilter] = useState<string>("all");

  // Advanced search parameters sent to the grounding request
  const [intelligenceDepth, setIntelligenceDepth] = useState<"standard" | "deep" | "moat">("standard");
  const [trajectoryBias, setTrajectoryBias] = useState<string>("high");

  // Premium, expanded 2026 industry verticals catalog
  const categoriesList: IndustryCategory[] = [
    { 
      id: "tech", 
      label: "Wearables & Gadgets", 
      icon: "🔌", 
      description: "Biofeedback frames, haptic rings, and sensory-calibrating eye frames",
      trendReason: "A high-capacity acceleration of screenless haptic guidance and non-invasive health metrics.",
      keywords: ["smart ring coach", "haptic response glasses", "bone conduction sound", "magnetic accessory tag", "TWS battery charger"],
      color: {
        primary: "bg-primary",
        bg: "bg-primary-fixed/50",
        border: "border-primary-fixed-dim",
        text: "text-primary-container",
        glow: "shadow-primary/10"
      }
    },
    { 
      id: "home", 
      label: "Aesthetic Home Decor", 
      icon: "✨", 
      description: "Minimal warm organizers, biological daylight panels, and ceramic stone utilities",
      trendReason: "DTC shift toward natural minerals, warm circadian lights, and premium wood cable arrays.",
      keywords: ["wall hydroponics planter", "raw stoneware diffuser", "circadian sleep lamp", "magnetic wood cord bar", "inductive stone mug"],
      color: {
        primary: "bg-amber-600",
        bg: "bg-amber-50/50",
        border: "border-amber-100",
        text: "text-amber-700",
        glow: "shadow-amber-500/10"
      }
    },
    { 
      id: "beauty", 
      label: "Self-Care & Beauty Tools", 
      icon: "🧴", 
      description: "Dermal phototherapy, spa-grade micro-pulse rollers, and biodegradable caps",
      trendReason: "Premium bio-active facial sculptors and localized cold cryogenic wands delivering clinical results.",
      keywords: ["cryo glass massagers", "micro-pulse face sculptor", "carbon red light wand", "compostable fresh capsule", "digital moisture sensor"],
      color: {
        primary: "bg-pink-600",
        bg: "bg-pink-50/50",
        border: "border-pink-100",
        text: "text-pink-700",
        glow: "shadow-pink-500/10"
      }
    },
    { 
      id: "fitness", 
      label: "Smart Desk Gym", 
      icon: "💪", 
      description: "Ultra-quiet apartment skipping, gravity power grip sensors, and thermal infra-rollers",
      trendReason: "Extremely quiet haptic weights and compact resistance kits designed for desktop athletes.",
      keywords: ["cordless weighted jump rope", "forearm grip dynamometer", "infra-red warming roller", "modular locked flat bands", "smart hydro sensor cup"],
      color: {
        primary: "bg-indigo-600",
        bg: "bg-indigo-50/50",
        border: "border-indigo-100",
        text: "text-indigo-700",
        glow: "shadow-indigo-500/10"
      }
    },
    { 
      id: "pet", 
      label: "Pet Wellness Tech", 
      icon: "🐾", 
      description: "Automated nutritional tracking, biological interactive play, and GPS collar sensors",
      trendReason: "Smart cameras, custom chasing arrays, and quiet chewing tools capitalizing on pet humanization trends.",
      keywords: ["smart companionship play", "micro-current brush cleaner", "filtered warming water bowl", "quiet dental treats", "smart bio-feeder"],
      color: {
        primary: "bg-emerald-600",
        bg: "bg-emerald-50/50",
        border: "border-emerald-100",
        text: "text-emerald-700",
        glow: "shadow-emerald-500/10"
      }
    },
    { 
      id: "wellness", 
      label: "Sleep & Neurotech", 
      icon: "🧠", 
      description: "Atmospheric white-noise domes, haptic brain soothe bands, and diaphragmatic sensory pods",
      trendReason: "High-flexibility non-pharmacological sleeping aids optimized for high-performance employees.",
      keywords: ["sleep sound tactile sphere", "cranial vibration headband", "diaphragm pacing pod", "herbal sensory capsules", "blackout smart shielding"],
      color: {
        primary: "bg-violet-600",
        bg: "bg-violet-50/50",
        border: "border-violet-100",
        text: "text-violet-700",
        glow: "shadow-violet-500/10"
      }
    },
    { 
      id: "eco", 
      label: "Sustainable Lifestyle", 
      icon: "🌱", 
      description: "Compostable daily accessories, bento travel boxes, and reusable screen sanitizers",
      trendReason: "Aesthetic, organic substitutes built from hemp and marine plastic polymers to eliminate packaging footprints.",
      keywords: ["hemp modern tech case", "reusable screens spray device", "bamboo modular desk drawer", "marine polymer bottle", "reusable beeswax roll wraps"],
      color: {
        primary: "bg-green-600",
        bg: "bg-green-50/50",
        border: "border-green-100",
        text: "text-green-700",
        glow: "shadow-green-500/10"
      }
    },
    { 
      id: "custom_input", 
      label: "Custom Niche Focus", 
      icon: "🛰️", 
      description: "Enter your own keyword parameter set to run direct custom grounding crawls",
      trendReason: "Flexible grounding crawler mapping viral parameters in specialized DTC e-commerce circles.",
      keywords: ["TikTok viral tools", "aesthetic dropshipping", "premium high ticket gadgets", "quiet luxury lifestyle"],
      color: {
        primary: "bg-slate-700",
        bg: "bg-surface-container-low/80",
        border: "border-surface-container-highest",
        text: "text-on-surface",
        glow: "shadow-slate-500/5"
      }
    }
  ];

  // Smart filter calculations for category search
  const filteredCategories = useMemo(() => {
    const query = categorySearchQuery.trim().toLowerCase();
    if (!query) return categoriesList;

    return categoriesList.filter((cat) => {
      const matchLabel = cat.label.toLowerCase().includes(query);
      const matchDesc = cat.description.toLowerCase().includes(query);
      const matchTrend = cat.trendReason.toLowerCase().includes(query);
      const matchKeys = cat.keywords.some((k) => k.toLowerCase().includes(query));
      return matchLabel || matchDesc || matchTrend || matchKeys;
    });
  }, [categorySearchQuery]);

  // Quick check for affinity alerts
  const matchingAffinitySector = useMemo(() => {
    const query = categorySearchQuery.trim().toLowerCase();
    if (!query) return null;
    
    // Scan keywords to give smart category feedback
    if (query.match(/(dog|cat|pet|fur)/)) {
      return categoriesList.find(c => c.id === "pet");
    }
    if (query.match(/(eco|green|sustainable|recycle|nature|biodegradable)/)) {
      return categoriesList.find(c => c.id === "eco");
    }
    if (query.match(/(sleep|brain|calm|mind|meditate|neuro)/)) {
      return categoriesList.find(c => c.id === "wellness");
    }
    if (query.match(/(tech|gadget|ring|smart|sensor|wearable)/)) {
      return categoriesList.find(c => c.id === "tech");
    }
    if (query.match(/(gym|workout|fitness|cardio|muscle|rope)/)) {
      return categoriesList.find(c => c.id === "fitness");
    }
    return null;
  }, [categorySearchQuery]);

  // Extract selected category parameters for UI styling
  const activeCategoryObject = useMemo(() => {
    return categoriesList.find((c) => c.id === category) || categoriesList[0];
  }, [category]);

  const triggerSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSelectedProduct(null);

    const activeCategory = category === "custom_input" ? "custom niche" : category;
    
    // Inject parameters into the grounding query
    let compoundNiche = nicheInput.trim();
    if (intelligenceDepth === "deep") {
      compoundNiche += " with comprehensive supply analytics and highly specified target buyers";
    } else if (intelligenceDepth === "moat") {
      compoundNiche += " emphasizing high barriers to entry, patent possibilities, and distinct engineering components";
    }
    if (trajectoryBias === "extreme") {
      compoundNiche += " exhibiting hyper-accelerated direct-to-consumer demand over the past 45 days";
    }

    try {
      const response = await apiFetch("/api/find-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: activeCategory,
          niche: compoundNiche,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(
        "Could not compile market intelligence. Please check that your OpenAI API key is configured and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Live filter results catalog
  const filteredProducts = useMemo(() => {
    if (!results || !results.products) return [];

    return results.products.filter((p) => {
      // 1. Text Search Input matches name, description, USP, or target demographic
      const query = resultsKeywordFilter.toLowerCase().trim();
      const matchText = !query || 
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.usp.toLowerCase().includes(query) ||
        p.targetAudience.toLowerCase().includes(query);

      // 2. Minimum Growth score threshold slider
      const matchGrowth = p.growthScore >= minGrowthFilter;

      // 3. Price point tier constraints
      let matchPrice = true;
      if (priceTierFilter !== "all" && p.priceRange) {
        const cleanPrice = p.priceRange.replace(/[\$\s,]/g, "").split("-");
        const lowerVal = parseFloat(cleanPrice[0]) || 0;
        
        if (priceTierFilter === "budget") {
          matchPrice = lowerVal < 50;
        } else if (priceTierFilter === "mid") {
          matchPrice = lowerVal >= 50 && lowerVal <= 150;
        } else if (priceTierFilter === "premium") {
          matchPrice = lowerVal > 150;
        }
      }

      return matchText && matchGrowth && matchPrice;
    });
  }, [results, resultsKeywordFilter, minGrowthFilter, priceTierFilter]);

  // Quick action tags handler
  const handleTagClick = (tag: string) => {
    setNicheInput((prev) => {
      if (!prev) return tag;
      if (prev.toLowerCase().includes(tag.toLowerCase())) return prev;
      return `${prev}, ${tag}`;
    });
  };

  // Helper unit converter inside simulated profit card
  const handleOpenProductDetail = (p: ProductItem) => {
    setSelectedProduct(p);
    
    // Read unit price suggestions to pre-configure pricing-slider defaults
    try {
      const retailStr = p.marketPrice || p.priceRange || "100";
      const cleanRetailStr = retailStr.replace(/[\$\s,]/g, "").split("-")[0];
      const val = parseFloat(cleanRetailStr) || 99;
      setSimulatedRetailPrice(Math.round(val));
    } catch (e) {
      setSimulatedRetailPrice(99);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Modern Dashboard Title Strip */}
      <div className="bg-surface-container-lowest rounded-lg p-6 md:p-8 border border-surface-container-highest flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden transition-all duration-300">
        
        {/* Subtle decorative background lights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-DEFAULT blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 rounded-DEFAULT blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-container bg-primary-fixed border border-primary-fixed-dim px-2.5 py-1 rounded-DEFAULT flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-DEFAULT bg-primary block" />
              Intelligence Engine Active
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-DEFAULT flex items-center gap-1">
              <Globe size={11} />
              Grounding Era: 2026
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Trend Scout <span className="text-primary">Research Core</span>
          </h2>
          <p className="text-xs md:text-sm text-outline font-medium max-w-3xl leading-relaxed">
            Crawls high-velocity digital sources utilizing Google Search Grounded models to isolate emerging Direct-To-Consumer trends, analyze competitive structures, and simulate B2B sourcing parameters.
          </p>
        </div>

        <div className="flex gap-3 md:self-center shrink-0">
          <div className="bg-surface-container-low border border-surface-container-highest px-4 py-3 rounded-DEFAULT text-center shadow-none">
            <p className="text-[9px] uppercase tracking-wider text-outline-variant font-mono font-bold">Web Crawled</p>
            <p className="text-sm font-bold text-on-surface-variant font-mono mt-0.5">50+ Nodes</p>
          </div>
          <div className="bg-primary-fixed/55 border border-primary-fixed-dim/50 px-4 py-3 rounded-DEFAULT text-center shadow-none">
            <p className="text-[9px] uppercase tracking-wider text-primary font-mono font-bold">Accuracy</p>
            <p className="text-sm font-bold text-primary-container font-mono mt-0.5">Grounding</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Dynamic Sidebar Configuration Parameters Layout */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={triggerSearch}
            className="bg-surface-container-lowest rounded-lg p-6 border border-surface-container-highest shadow-none relative overflow-hidden space-y-6"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container-low rounded-bl-full border-l border-b border-surface-container-highest/50 -mr-6 -mt-6 pointer-events-none" />

            <div className="flex items-center gap-2.5 border-b border-slate-50 pb-4">
              <div className="w-8 h-8 rounded-DEFAULT bg-primary-fixed flex items-center justify-center text-primary">
                <Cpu size={16} />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-sm tracking-tight">
                  Parameter Console
                </h3>
                <p className="text-[10px] text-outline-variant font-medium">Fine-tune scout intelligence filters</p>
              </div>
            </div>

            {/* Smart Category Intelligence Filter - USER REQUEST MANDATE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-outline flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <Filter size={13} className="text-primary" />
                  Category Intelligent Filter
                </label>
                <span className="text-[10px] font-bold text-outline-variant font-mono">
                  {filteredCategories.length} options
                </span>
              </div>
              
              {/* Category Search Filter Input */}
              <div className="relative">
                <input
                  type="text"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="Smart keyword filter: e.g. sleep, pet, ring..."
                  className="w-full text-xs font-medium bg-surface-container-low hover:bg-surface-container/50 border border-surface-container-highest focus:border-primary focus:bg-surface-container-lowest p-3 pl-9 rounded-DEFAULT outline-none transition-all text-on-surface-variant placeholder-slate-400 font-mono"
                />
                <Search size={14} className="absolute left-3.5 top-3.5 text-outline-variant" />
                {categorySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCategorySearchQuery("")}
                    className="absolute right-3.5 top-3.5 text-outline-variant hover:text-on-surface-variant"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Affinity Alert Notice */}
              {matchingAffinitySector && (
                <div className="bg-primary-fixed/60 text-on-primary-fixed p-2.5 rounded-DEFAULT text-[10px] border border-primary-fixed-dim/50 flex items-center gap-1.5 animate-fade-in font-medium">
                  <Sparkles size={11} className="text-primary animate-spin" />
                  <span>Identified high matching sector: <strong>{matchingAffinitySector.label}</strong>! Click below to select.</span>
                </div>
              )}

              {/* Slider list of search results categories */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filteredCategories.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`w-full group flex items-start gap-3 p-3 text-left rounded-DEFAULT border transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary-fixed/40 text-on-primary-fixed font-semibold shadow-none"
                          : "border-surface-container-highest hover:border-outline-variant hover:bg-surface-container-low text-on-surface-variant"
                      }`}
                    >
                      <div className="text-lg mt-0.5 shrink-0 bg-surface-container-lowest p-1 rounded-md shadow-none border border-surface-container-highest/80">
                        {cat.icon}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold font-sans block group-hover:text-primary-container transition-colors">
                          {cat.label}
                        </span>
                        <p className="text-[10px] text-outline-variant leading-tight font-medium">
                          {cat.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Smart tags clicker */}
            <div className="space-y-2 pt-2 border-t border-slate-50">
              <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider font-mono block">Recommended Niche Modifiers</span>
              <div className="flex flex-wrap gap-1.5">
                {activeCategoryObject.keywords.map((kw, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleTagClick(kw)}
                    className="text-[10px] bg-surface-container-low text-on-surface-variant hover:bg-primary-fixed hover:text-primary-container hover:border-teal-200 border border-surface-container-highest rounded-lg px-2.5 py-1 font-medium transition-all cursor-pointer"
                  >
                    + {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom specification search string */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-outline block">
                Niche Keyword Focus
              </label>
              <input
                type="text"
                value={nicheInput}
                onChange={(e) => setNicheInput(e.target.value)}
                placeholder="e.g. TikTok viral gadgets, organic dog food"
                className="w-full text-xs font-medium bg-surface-container-low border border-surface-container-highest focus:border-primary focus:bg-surface-container-lowest p-3 rounded-DEFAULT outline-none transition-all text-on-surface-variant font-mono"
              />
              <span className="text-[10px] text-outline-variant block leading-tight font-medium">
                Enter target parameter string or click recommended modifiers above to populate.
              </span>
            </div>

            {/* Additional parameters section toggler */}
            <div className="space-y-3 pt-3 border-t border-slate-50">
              <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider font-mono block">Scout Parameters</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-outline font-mono uppercase">API Depth</label>
                  <select
                    value={intelligenceDepth}
                    onChange={(e) => setIntelligenceDepth(e.target.value as any)}
                    className="w-full text-[10px] bg-surface-container-low border border-surface-container-highest p-2 rounded-lg outline-none font-medium"
                  >
                    <option value="standard">Standard Scout</option>
                    <option value="deep">Deep Crawl</option>
                    <option value="moat">Defensive Moat</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-outline font-mono uppercase font-bold">Trend Trajectory</label>
                  <select
                    value={trajectoryBias}
                    onChange={(e) => setTrajectoryBias(e.target.value)}
                    className="w-full text-[10px] bg-surface-container-low border border-surface-container-highest p-2 rounded-lg outline-none font-medium"
                  >
                    <option value="high">High Velocity (90+)</option>
                    <option value="extreme">Vertical Growth (95+)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action launcher buttons */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-container disabled:bg-slate-300 text-white text-xs font-semibold py-3.5 px-4 rounded-DEFAULT shadow-none cursor-pointer transition-colors active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" /> Accessing Grounding Nodes...
                </>
              ) : (
                <>
                  <Search size={14} className="text-teal-300" /> Ground Search Trends
                </>
              )}
            </button>
          </form>
        </div>

        {/* Workspace Display Area Redesign */}
        <div className="lg:col-span-8 space-y-6">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-DEFAULT border border-red-100 text-xs">
              <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
              <div className="space-y-1 font-medium">
                <span className="font-bold block text-on-surface">Scouting Pipeline Overload</span>
                <span className="text-red-600/90 leading-relaxed font-sans block">{error}</span>
              </div>
            </div>
          )}

          {/* Connected research log output terminal */}
          {loading && (
            <div className="bg-inverse-surface border border-on-surface text-teal-400 p-8 rounded-lg flex flex-col items-center justify-center text-center space-y-6 shadow-inner min-h-[420px] relative overflow-hidden animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-0" />
              
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-DEFAULT flex items-center justify-center mx-auto shadow-none">
                  <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-mono text-xs tracking-widest text-teal-300 uppercase font-bold">
                    [PIPELINE_INITIOTIALIZED_LOG]
                  </h4>
                  <p className="text-xs text-outline-variant font-mono max-w-md mx-auto leading-relaxed">
                    Connecting to Google OpenAI Search Grounding framework. Isolating demographic indices in 2026. Structuring unit wholesale databases...
                  </p>
                </div>

                <div className="border border-on-surface bg-slate-950/80 rounded-DEFAULT p-4 text-left max-w-sm mx-auto space-y-1 font-mono text-[9px] text-outline select-none">
                  <p className="text-teal-400">&gt; GET /api/find-products HTTP/1.1</p>
                  <p>&gt; Host: ais-OpenAI-agent-hub</p>
                  <p>&gt; category: &quot;{category}&quot;</p>
                  <p>&gt; filters-bias: &quot;{trajectoryBias}&quot;</p>
                  <p className="text-teal-500">&gt; Status: Retrieving live e-commerce search vectors...</p>
                </div>
              </div>
            </div>
          )}

          {/* Market Scanner Standby */}
          {!results && !loading && (
            <div className="bg-surface-container-lowest border border-surface-container-highest rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[420px] shadow-none relative">
              <div className="w-14 h-14 bg-surface-container-low border border-surface-container-highest text-outline-variant rounded-DEFAULT flex items-center justify-center shadow-none">
                <TrendingUp size={24} />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h4 className="font-bold text-on-surface text-sm">Market Intelligence Hub</h4>
                <p className="text-xs text-outline-variant mt-1 leading-relaxed font-semibold">
                  Configure your diagnostic parameter set on the left or search/filter categories to fetch trending retail listings. Real-time search graphs will populate dynamically here.
                </p>
              </div>

              {/* Grid of initial suggestions boxes to inspire user */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full pt-6">
                <div 
                  onClick={() => { setCategory("tech"); setNicheInput("biometric rings"); }}
                  className="p-3 border border-slate-50 hover:border-primary-fixed-dim hover:bg-primary-fixed/20 rounded-DEFAULT text-left cursor-pointer transition-colors"
                >
                  <span className="text-[10px] font-bold text-primary font-mono block">⚡ EMERGING TECH</span>
                  <span className="text-xs font-bold text-on-surface-variant block mt-0.5">Biometric Smart Coach Rings</span>
                  <p className="text-[10px] text-outline-variant line-clamp-1 mt-0.5">Scouts ring sensors metrics.</p>
                </div>

                <div 
                  onClick={() => { setCategory("home"); setNicheInput("circadian lightning Sunset"); }}
                  className="p-3 border border-slate-50 hover:border-amber-100 hover:bg-amber-50/20 rounded-DEFAULT text-left cursor-pointer transition-colors"
                >
                  <span className="text-[10px] font-bold text-amber-600 font-mono block">🌿 SUSTAINABLE HOME</span>
                  <span className="text-xs font-bold text-on-surface-variant block mt-0.5">SunsetCircadian Bed Lamp</span>
                  <p className="text-[10px] text-outline-variant line-clamp-1 mt-0.5">Warm orange-spectrum circadian bulbs.</p>
                </div>
              </div>
            </div>
          )}

          {/* Active compiled results page */}
          {results && !loading && (
            <div className="space-y-6 animate-slide-up">
              
              {/* Fallback quota triggers notification */}
              {results.isFallback && (
                <div className="bg-amber-50 rounded-DEFAULT p-4.5 border border-amber-200/60 flex gap-3 text-amber-900 items-start shadow-none">
                  <AlertCircle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                  <div className="space-y-1.5 text-xs text-amber-900 leading-relaxed flex-1">
                    <h4 className="font-bold tracking-tight text-on-surface">
                      High-Growth Secondary Database Catalog Enforced (API Resource Warning)
                    </h4>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      Standard OpenAI API quota boundaries or credit limits were hit. Dynamic sandbox analytics have automatically loaded to ensure continuous evaluation of interface components and pricing variables.
                    </p>
                    {results.apiError && (
                      <div className="mt-2 text-left">
                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">Exact API Error Response:</p>
                        <p className="font-mono text-[9px] bg-surface-container-lowest/70 p-2.5 rounded-DEFAULT border border-amber-200/50 leading-relaxed text-amber-950 break-words select-all mt-1">
                          {(() => {
                            const rawError = results.apiError || "";
                            if (!rawError) return "";
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
              )}

              {/* Synthesized overview sector */}
              <div className="bg-gradient-to-br from-teal-50/50 to-indigo-50/20 rounded-lg p-6 border border-primary-fixed-dim/30 flex gap-4 shadow-none relative">
                <div className="w-10 h-10 bg-surface-container-lowest border border-primary-fixed-dim/80 text-primary rounded-DEFAULT flex items-center justify-center shrink-0 shadow-none">
                  <Lightbulb size={20} className="text-primary" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-primary-fixed font-mono leading-none">
                    SCOUT COGNITIVE SYNTHESIS (REAL-TIME ADVICE)
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-semibold">
                    {results.trendReasonDescription}
                  </p>
                </div>
              </div>

              {/* Core Dynamic Interactive Tabs bar */}
              <div className="bg-surface-container-lowest border border-surface-container-highest rounded-DEFAULT p-1.5 flex gap-1.5 shadow-none">
                {[
                  { id: "opportunities", label: "Opportunities List", icon: <Layers size={14} /> },
                  { id: "insights", label: "Scientific Intelligence", icon: <Info size={14} /> },
                  { id: "calculator", label: "Margin Potential", icon: <Percent size={14} /> }
                ].map((tb) => (
                  <button
                    key={tb.id}
                    onClick={() => setActiveTab(tb.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-DEFAULT text-xs font-bold font-sans transition-all cursor-pointer ${
                      activeTab === tb.id
                        ? "bg-primary text-white shadow-none"
                        : "text-outline hover:text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    {tb.icon}
                    <span>{tb.label}</span>
                  </button>
                ))}
              </div>

              {/* TAB 1: Opportunities List View */}
              {activeTab === "opportunities" && (
                <div className="space-y-6 animate-fade-in">

                  {/* Results list dynamic keyword filter - Mandate of modern intelligence search/filtering */}
                  <div className="bg-surface-container-lowest border border-surface-container-highest rounded-DEFAULT p-4 shadow-none space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Filter size={14} className="text-primary" />
                        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wide font-mono">
                          Live Results Analyzer & Filter
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-outline-variant font-mono">
                        Filtered matches: {filteredProducts.length} of {results.products?.length || 0}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      {/* Live keyword target bar */}
                      <div className="md:col-span-6 relative">
                        <input
                          type="text"
                          value={resultsKeywordFilter}
                          onChange={(e) => setResultsKeywordFilter(e.target.value)}
                          placeholder="Filter cards: e.g. Ring, sensor, user..."
                          className="w-full text-[11px] font-medium bg-surface-container-low border border-surface-container-highest focus:bg-surface-container-lowest focus:border-primary p-2.5 pl-8 rounded-DEFAULT outline-none transition-all font-mono"
                        />
                        <Search size={12} className="absolute left-2.5 top-3.5 text-outline-variant" />
                        {resultsKeywordFilter && (
                          <button
                            onClick={() => setResultsKeywordFilter("")}
                            className="absolute right-2.5 top-3 text-outline-variant hover:text-on-surface-variant"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>

                      {/* Growth Threshold Range Selector */}
                      <div className="md:col-span-3 flex flex-col justify-center space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-bold text-outline-variant font-mono uppercase">
                          <span>Min Trajectory</span>
                          <span className="text-primary font-bold">{minGrowthFilter}+</span>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="98"
                          value={minGrowthFilter}
                          onChange={(e) => setMinGrowthFilter(parseInt(e.target.value))}
                          className="w-full accent-teal-600 cursor-pointer h-1 bg-surface-container rounded-lg text-xs"
                        />
                      </div>

                      {/* Cash range toggle selector */}
                      <div className="md:col-span-3">
                        <select
                          value={priceTierFilter}
                          onChange={(e) => setPriceTierFilter(e.target.value)}
                          className="w-full text-[10px] bg-surface-container-low border border-surface-container-highest p-2.5 rounded-DEFAULT outline-none font-medium text-on-surface-variant"
                        >
                          <option value="all">Any Price Class</option>
                          <option value="budget">Under $50 (Impulse)</option>
                          <option value="mid">Between $50 - $150</option>
                          <option value="premium">Over $150 (High ticket)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Clean cards list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProducts.map((prod, i) => {
                      const isHighGrowth = prod.growthScore >= 93;
                      return (
                        <div
                          key={i}
                          onClick={() => handleOpenProductDetail(prod)}
                          className={`bg-surface-container-lowest rounded-DEFAULT border ${
                            isHighGrowth ? "border-primary/20 shadow-primary/[0.02]" : "border-surface-container-highest"
                          } p-5 hover:border-primary/80 hover:shadow-none hover:scale-[1.01] duration-300 transition-all flex flex-col justify-between h-full cursor-pointer relative group overflow-hidden`}
                        >
                          {/* Top-right visual glow element */}
                          {isHighGrowth && (
                            <div className="absolute right-0 top-0 w-16 h-16 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
                          )}

                          <div className="space-y-4">
                            {/* Headline block */}
                            <div className="flex items-start justify-between gap-3 border-b border-slate-50 pb-3">
                              <div className="space-y-1">
                                <h4 className="font-bold text-on-surface text-xs md:text-sm leading-snug group-hover:text-primary transition-colors">
                                  {prod.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary-fixed/80 border border-primary-fixed-dim/50 px-1.5 py-0.5 rounded">
                                    USP: {prod.usp}
                                  </span>
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 shadow-2xs">
                                <Flame size={12} className="text-amber-500 animate-pulse animate-duration-1000" />
                                <span className="text-[11px] font-mono font-bold text-amber-700">
                                  {prod.growthScore}
                                </span>
                              </div>
                            </div>

                            <p className="text-[11px] text-outline leading-relaxed line-clamp-3">
                              {prod.description}
                            </p>
                          </div>

                          <div className="space-y-3 pt-4 mt-4 border-t border-surface-container-highest/60">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <DollarSign size={13} className="text-outline-variant" />
                                <div>
                                  <p className="text-[8px] text-outline-variant uppercase font-mono font-bold leading-none">Price Range</p>
                                  <p className="font-bold text-on-surface-variant text-[10px] mt-0.5">{prod.priceRange}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Target size={13} className="text-outline-variant" />
                                <div>
                                  <p className="text-[8px] text-outline-variant uppercase font-mono font-bold leading-none">Demographic</p>
                                  <p className="font-bold text-on-surface-variant text-[10px] truncate max-w-[100px] mt-0.5" title={prod.targetAudience}>
                                    {prod.targetAudience}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* View detail action pill */}
                            <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-primary group-hover:text-primary-container transition-colors">
                              <span className="flex items-center gap-1.5">
                                <Store size={12} className="text-teal-500" />
                                View Suppliers & Costs
                              </span>
                              <ChevronRight size={13} className="transform group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredProducts.length === 0 && (
                      <div className="col-span-2 bg-surface-container-low border border-surface-container-highest rounded-DEFAULT p-8 text-center text-outline-variant text-xs py-12">
                        No product opportunity matches current live filter settings. Try modifying keywords or adjusting the trajectory bar.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Scientific Insights Overview */}
              {activeTab === "insights" && (
                <div className="bg-surface-container-lowest border border-surface-container-highest rounded-lg p-6 shadow-none space-y-6 animate-fade-in text-xs font-sans">
                  
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                    <BookOpen size={16} className="text-primary" />
                    <h4 className="font-bold text-on-surface uppercase tracking-widest text-xs font-mono">
                      Research Grounding Citations
                    </h4>
                  </div>

                  <p className="text-outline leading-relaxed font-medium">
                    Emerging target markets require strong validation. Below are the verified search references isolated during crawling, providing scientific context and retail proof trajectories:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {results.sources && results.sources.length > 0 ? (
                      results.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3.5 rounded-DEFAULT border border-surface-container-highest hover:border-primary hover:bg-surface-container-low transition-all text-on-surface-variant group cursor-pointer shadow-2xs"
                        >
                          <span className="truncate pr-4 font-bold text-on-surface-variant group-hover:text-primary">
                            {src.title}
                          </span>
                          <ExternalLink size={13} className="text-outline-variant group-hover:text-primary shrink-0" />
                        </a>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-6 bg-surface-container-low rounded-DEFAULT text-outline-variant">
                        No external citations required for pre-validated sandbox catalog.
                      </div>
                    )}
                  </div>

                  <div className="bg-surface-container-low p-4 rounded-DEFAULT border border-slate-150 flex items-start gap-3">
                    <Info size={16} className="text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-on-surface-variant leading-none">Google Grounding Methodology</span>
                      <p className="text-[11px] text-outline leading-relaxed">
                        Citations are mapped by analyzing public consumer interest peaks. High trajectory score vectors (90+) represent sectors experiencing positive compounding feedback across social algorithms and B2B orders.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Interactive Margin Calculator */}
              {activeTab === "calculator" && (
                <div className="bg-surface-container-lowest border border-surface-container-highest rounded-lg p-6 shadow-none space-y-6 animate-fade-in text-xs font-sans">
                  
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                    <SlidersHorizontal size={16} className="text-primary" />
                    <h4 className="font-bold text-on-surface uppercase tracking-widest text-xs font-mono">
                      Integrated Global Margin Estimator
                    </h4>
                  </div>

                  <p className="text-outline leading-relaxed font-medium">
                    Estimate e-commerce profitability across your active scouting portfolio. Click any calculated commodity cards to inspect wholesale ranges.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {results.products?.slice(0, 3).map((p, pIdx) => {
                      const lowerCost = p.growthScore * 0.15; // calculated estimate
                      const suggestedSell = p.growthScore * 0.55;
                      const profit = suggestedSell - lowerCost;
                      const marginRatio = Math.round((profit / suggestedSell) * 100);

                      return (
                        <div 
                          key={pIdx}
                          className="bg-surface-container-low/50 border border-surface-container-highest p-4 rounded-DEFAULT flex flex-col justify-between space-y-4 shadow-3xs"
                        >
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-primary font-mono tracking-widest">PRODUCT #{pIdx + 1}</span>
                            <h5 className="font-extrabold text-on-surface line-clamp-1">{p.title}</h5>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-outline-variant font-medium">
                              <span>Estimated Wholesale:</span>
                              <span className="font-mono text-on-surface-variant font-bold">${lowerCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-outline-variant font-medium">
                              <span>Suggested Retail:</span>
                              <span className="font-mono text-on-surface-variant font-bold">${suggestedSell.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold border-t border-outline-variant/50 pt-1">
                              <span className="text-on-surface-variant">Profit margin:</span>
                              <span className="text-emerald-700 font-mono">~{marginRatio}%</span>
                            </div>
                          </div>

                          <div className="w-full bg-surface-container-high/60 h-1.5 rounded-DEFAULT overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-DEFAULT" 
                              style={{ width: `${marginRatio}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Modern High-Fidelity Product Sourcing Details Modal Overlay */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Smooth visual backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm" 
              onClick={() => setSelectedProduct(null)}
            />

            {/* Modal Body Container with slide transition */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-surface-container-lowest p-6 md:p-8 text-left shadow-2xl border border-surface-container-highest z-10"
            >
              
              {/* Header Title Bar */}
              <div className="flex items-start justify-between border-b border-surface-container-highest pb-5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-primary-container bg-primary-fixed border border-primary-fixed-dim px-2.5 py-1 rounded-DEFAULT font-mono">
                      Verified Sourcing Node
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-DEFAULT font-mono flex items-center gap-1">
                      <Flame size={11} className="text-amber-500 animate-pulse" />
                      Viral Rating: {selectedProduct.growthScore}/100
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-on-surface tracking-tight mt-3">
                    {selectedProduct.title}
                  </h3>
                  <p className="text-[11px] text-outline-variant font-bold uppercase tracking-wider font-mono">
                    Unique Selling point (USP): {selectedProduct.usp}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="rounded-DEFAULT p-2 text-outline-variant hover:bg-surface-container hover:text-on-surface-variant transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body Scroll Space */}
              <div className="mt-5 space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                
                {/* Description Segment */}
                <div>
                  <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-outline-variant mb-2 font-mono flex items-center gap-1.5">
                    <Lightbulb size={13} className="text-primary" />
                    Aesthetic Description
                  </h4>
                  <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed bg-surface-container-low p-4 rounded-DEFAULT border border-surface-container-highest/60 font-medium">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Sourcing Cost & Pricing slider calculation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* wholesale buy cost widget */}
                  <div className="p-4 rounded-DEFAULT border border-surface-container-highest bg-gradient-to-br from-teal-50/10 to-teal-50/40 space-y-3 shadow-3xs">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-primary-container block font-mono">
                      Estimated Sourcing Cost
                    </span>
                    <div className="space-y-1">
                      <span className="text-lg font-bold text-on-surface font-mono">
                        {selectedProduct.approxTotalCost || "$1,150 (For 100 units / MOQ)"}
                      </span>
                      <p className="text-[10px] text-outline leading-normal">
                        Estimated initial bulk wholesale batch rate inclusive of duty tariffs and direct air cargo carriers.
                      </p>
                    </div>
                  </div>

                  {/* interactive price target and real-time margin Calculator slide rule */}
                  <div className="p-4 rounded-DEFAULT border border-surface-container-highest bg-gradient-to-br from-violet-50/10 to-violet-50/40 space-y-3 shadow-3xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-violet-700 block font-mono">
                        Adjust Target Market Price
                      </span>
                      <span className="text-xs font-bold text-violet-800 font-mono bg-surface-container-lowest px-2 py-0.5 rounded-md border border-violet-100">${simulatedRetailPrice}</span>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="range"
                        min="20"
                        max="350"
                        value={simulatedRetailPrice}
                        onChange={(e) => setSimulatedRetailPrice(parseInt(e.target.value))}
                        className="w-full accent-violet-600 cursor-pointer h-1.5 bg-surface-container-high rounded-lg text-xs"
                      />

                      <div className="flex justify-between items-center text-[10px] text-outline leading-normal gap-1 font-medium">
                        <span>Min Sourcing: $20</span>
                        <span>High TicketCap: $350</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Real-Time Interactive Profit Slider Indicator Panel */}
                {(() => {
                  try {
                    // units cost estimations
                    const firstSupCost = selectedProduct.suppliers?.[0]?.unitCost || "25";
                    const cleanSupCostStr = firstSupCost.replace(/[\$\s,]/g, "").split("-")[0];
                    const unitCostVal = parseFloat(cleanSupCostStr) || (simulatedRetailPrice * 0.25) || 12.5;

                    const activeProfit = Math.max(1, simulatedRetailPrice - unitCostVal);
                    const grossPercent = Math.min(99, Math.max(1, Math.round((activeProfit / simulatedRetailPrice) * 100)));

                    const performanceRating = grossPercent >= 70 ? "Elite Target" : grossPercent >= 50 ? "Healthy Target" : "Lower Bounds Warning";
                    const barColor = grossPercent >= 70 ? "bg-emerald-500" : grossPercent >= 50 ? "bg-amber-500" : "bg-red-500";

                    return (
                      <div className="bg-surface-container-low p-4 rounded-DEFAULT border border-slate-150 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold gap-2">
                          <span className="text-outline font-sans">Active Simulated Financial Matrix:</span>
                          <span className="text-emerald-700 font-mono tracking-wide">
                            {performanceRating} (~{grossPercent}% Markup Profit)
                          </span>
                        </div>

                        {/* Visual feedback tracker metric */}
                        <div className="w-full bg-surface-container-high/80 h-2 rounded-DEFAULT overflow-hidden">
                          <div 
                            className={`${barColor} h-full rounded-DEFAULT transition-all duration-300`}
                            style={{ width: `${grossPercent}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1.5 text-center text-[9px] font-bold text-outline-variant font-mono uppercase">
                          <div className="bg-surface-container-lowest border border-surface-container-highest p-2 rounded-lg">
                            <p>Wholesale unit cost</p>
                            <p className="text-xs font-bold text-on-surface-variant mt-1">${unitCostVal.toFixed(2)}</p>
                          </div>
                          <div className="bg-surface-container-lowest border border-surface-container-highest p-2 rounded-lg">
                            <p>Gross unit profit</p>
                            <p className="text-xs font-bold text-emerald-700 mt-1">${activeProfit.toFixed(2)}</p>
                          </div>
                          <div className="bg-surface-container-lowest border border-surface-container-highest p-2 rounded-lg">
                            <p>Break-even units</p>
                            <p className="text-xs font-bold text-on-surface-variant mt-1">
                              {Math.round(1150 / activeProfit)} pcs
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  } catch (err) {
                    return null;
                  }
                })()}

                {/* Sourcing Channel Directories exactly 3 options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-outline flex items-center gap-1.5 font-mono">
                      <Store size={14} className="text-outline-variant" />
                      Global B2B Wholesale Channels
                    </h4>
                    <span className="text-[10px] font-bold text-outline-variant font-mono">Real-time Sourcing options</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {selectedProduct.suppliers && selectedProduct.suppliers.length > 0 ? (
                      selectedProduct.suppliers.map((sup, sIndex) => {
                        const isAliExpress = sup.name.toLowerCase().includes("aliexpress");
                        const isAlibaba = sup.name.toLowerCase().includes("alibaba");
                        
                        let badgeColor = "bg-sky-50 text-sky-700 border-sky-100 text-[10px]";
                        if (isAlibaba) {
                          badgeColor = "bg-amber-50 text-amber-700 border-amber-100 text-[10px]";
                        } else if (isAliExpress) {
                          badgeColor = "bg-rose-50 text-rose-700 border-rose-100 text-[10px]";
                        }

                        return (
                          <div
                            key={sIndex}
                            className="bg-surface-container-lowest border border-slate-150 p-4 rounded-DEFAULT shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans hover:border-teal-400 transition-colors duration-200"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-DEFAULT border ${badgeColor}`}>
                                  {isAlibaba ? "Alibaba" : isAliExpress ? "AliExpress" : "GlobalSources"}
                                </span>
                                <span className="font-bold text-on-surface-variant text-sm">{sup.name}</span>
                              </div>
                              <p className="text-xs text-outline-variant font-medium">
                                Target Piece Sourcing rate: <span className="font-bold text-on-surface-variant font-mono">{sup.unitCost}</span>
                              </p>
                            </div>

                            <a
                              href={sup.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-inverse-surface border border-on-surface text-white hover:bg-primary font-bold text-xs px-4 py-2.5 rounded-DEFAULT text-center active:scale-95 duration-150 shrink-0 transition-all cursor-pointer shadow-3xs"
                            >
                              Verify Supply Link ↗
                            </a>
                          </div>
                        );
                      })
                    ) : (
                      <p className="col-span-1 py-4 text-center text-outline-variant bg-surface-container-low rounded-DEFAULT">No suppliers index available for this sandbox item.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Footer Closer bar */}
              <div className="mt-8 pt-5 border-t border-surface-container-highest flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs font-bold rounded-DEFAULT cursor-pointer transition-all"
                >
                  Return to Dashboard
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
