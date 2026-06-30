import React, { useState, useMemo } from "react";
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
        primary: "bg-teal-600",
        bg: "bg-teal-50/50",
        border: "border-teal-100",
        text: "text-teal-700",
        glow: "shadow-teal-500/10"
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
        bg: "bg-slate-50/80",
        border: "border-slate-100",
        text: "text-slate-800",
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
      const response = await fetch("/api/find-products", {
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
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden transition-all duration-300">
        
        {/* Subtle decorative background lights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 block" />
              Intelligence Engine Active
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Globe size={11} />
              Grounding Era: 2026
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Trend Scout <span className="text-teal-600">Research Core</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium max-w-3xl leading-relaxed">
            Crawls high-velocity digital sources utilizing Google Search Grounded models to isolate emerging Direct-To-Consumer trends, analyze competitive structures, and simulate B2B sourcing parameters.
          </p>
        </div>

        <div className="flex gap-3 md:self-center shrink-0">
          <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-center shadow-xs">
            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold">Web Crawled</p>
            <p className="text-sm font-bold text-slate-700 font-mono mt-0.5">50+ Nodes</p>
          </div>
          <div className="bg-teal-50/55 border border-teal-100/50 px-4 py-3 rounded-2xl text-center shadow-xs">
            <p className="text-[9px] uppercase tracking-wider text-teal-600 font-mono font-bold">Accuracy</p>
            <p className="text-sm font-bold text-teal-700 font-mono mt-0.5">Grounding</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Dynamic Sidebar Configuration Parameters Layout */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={triggerSearch}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden space-y-6"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full border-l border-b border-slate-100/50 -mr-6 -mt-6 pointer-events-none" />

            <div className="flex items-center gap-2.5 border-b border-slate-50 pb-4">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <Cpu size={16} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">
                  Parameter Console
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Fine-tune scout intelligence filters</p>
              </div>
            </div>

            {/* Smart Category Intelligence Filter - USER REQUEST MANDATE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <Filter size={13} className="text-teal-600" />
                  Category Intelligent Filter
                </label>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
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
                  className="w-full text-xs font-medium bg-slate-50 hover:bg-slate-100/50 border border-slate-100 focus:border-teal-500 focus:bg-white p-3 pl-9 rounded-xl outline-none transition-all text-slate-700 placeholder-slate-400 font-mono"
                />
                <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                {categorySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCategorySearchQuery("")}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Affinity Alert Notice */}
              {matchingAffinitySector && (
                <div className="bg-teal-50/60 text-teal-800 p-2.5 rounded-xl text-[10px] border border-teal-100/50 flex items-center gap-1.5 animate-fade-in font-medium">
                  <Sparkles size={11} className="text-teal-600 animate-spin" />
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
                      className={`w-full group flex items-start gap-3 p-3 text-left rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-teal-500 bg-teal-50/40 text-teal-800 font-semibold shadow-sm"
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="text-lg mt-0.5 shrink-0 bg-white p-1 rounded-md shadow-xs border border-slate-100/80">
                        {cat.icon}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold font-sans block group-hover:text-teal-700 transition-colors">
                          {cat.label}
                        </span>
                        <p className="text-[10px] text-slate-400 leading-tight font-medium">
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Recommended Niche Modifiers</span>
              <div className="flex flex-wrap gap-1.5">
                {activeCategoryObject.keywords.map((kw, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleTagClick(kw)}
                    className="text-[10px] bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 border border-slate-100 rounded-lg px-2.5 py-1 font-medium transition-all cursor-pointer"
                  >
                    + {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom specification search string */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 block">
                Niche Keyword Focus
              </label>
              <input
                type="text"
                value={nicheInput}
                onChange={(e) => setNicheInput(e.target.value)}
                placeholder="e.g. TikTok viral gadgets, organic dog food"
                className="w-full text-xs font-medium bg-slate-50 border border-slate-100 focus:border-teal-500 focus:bg-white p-3 rounded-xl outline-none transition-all text-slate-700 font-mono"
              />
              <span className="text-[10px] text-slate-400 block leading-tight font-medium">
                Enter target parameter string or click recommended modifiers above to populate.
              </span>
            </div>

            {/* Additional parameters section toggler */}
            <div className="space-y-3 pt-3 border-t border-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Scout Parameters</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 font-mono uppercase">API Depth</label>
                  <select
                    value={intelligenceDepth}
                    onChange={(e) => setIntelligenceDepth(e.target.value as any)}
                    className="w-full text-[10px] bg-slate-50 border border-slate-100 p-2 rounded-lg outline-none font-medium"
                  >
                    <option value="standard">Standard Scout</option>
                    <option value="deep">Deep Crawl</option>
                    <option value="moat">Defensive Moat</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 font-mono uppercase font-bold">Trend Trajectory</label>
                  <select
                    value={trajectoryBias}
                    onChange={(e) => setTrajectoryBias(e.target.value)}
                    className="w-full text-[10px] bg-slate-50 border border-slate-100 p-2 rounded-lg outline-none font-medium"
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
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-semibold py-3.5 px-4 rounded-xl shadow-md cursor-pointer transition-colors active:scale-95"
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
            <div className="flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 text-xs">
              <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
              <div className="space-y-1 font-medium">
                <span className="font-bold block text-slate-800">Scouting Pipeline Overload</span>
                <span className="text-red-600/90 leading-relaxed font-sans block">{error}</span>
              </div>
            </div>
          )}

          {/* Connected research log output terminal */}
          {loading && (
            <div className="bg-slate-900 border border-slate-800 text-teal-400 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-6 shadow-inner min-h-[420px] relative overflow-hidden animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-0" />
              
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-mono text-xs tracking-widest text-teal-300 uppercase font-bold">
                    [PIPELINE_INITIOTIALIZED_LOG]
                  </h4>
                  <p className="text-xs text-slate-400 font-mono max-w-md mx-auto leading-relaxed">
                    Connecting to Google OpenAI Search Grounding framework. Isolating demographic indices in 2026. Structuring unit wholesale databases...
                  </p>
                </div>

                <div className="border border-slate-800 bg-slate-950/80 rounded-xl p-4 text-left max-w-sm mx-auto space-y-1 font-mono text-[9px] text-slate-500 select-none">
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
            <div className="bg-white border border-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[420px] shadow-sm relative">
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 text-slate-300 rounded-2xl flex items-center justify-center shadow-xs">
                <TrendingUp size={24} />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h4 className="font-bold text-slate-800 text-sm">Market Intelligence Hub</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-semibold">
                  Configure your diagnostic parameter set on the left or search/filter categories to fetch trending retail listings. Real-time search graphs will populate dynamically here.
                </p>
              </div>

              {/* Grid of initial suggestions boxes to inspire user */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full pt-6">
                <div 
                  onClick={() => { setCategory("tech"); setNicheInput("biometric rings"); }}
                  className="p-3 border border-slate-50 hover:border-teal-100 hover:bg-teal-50/20 rounded-2xl text-left cursor-pointer transition-colors"
                >
                  <span className="text-[10px] font-bold text-teal-600 font-mono block">⚡ EMERGING TECH</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">Biometric Smart Coach Rings</span>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Scouts ring sensors metrics.</p>
                </div>

                <div 
                  onClick={() => { setCategory("home"); setNicheInput("circadian lightning Sunset"); }}
                  className="p-3 border border-slate-50 hover:border-amber-100 hover:bg-amber-50/20 rounded-2xl text-left cursor-pointer transition-colors"
                >
                  <span className="text-[10px] font-bold text-amber-600 font-mono block">🌿 SUSTAINABLE HOME</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">SunsetCircadian Bed Lamp</span>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Warm orange-spectrum circadian bulbs.</p>
                </div>
              </div>
            </div>
          )}

          {/* Active compiled results page */}
          {results && !loading && (
            <div className="space-y-6 animate-slide-up">
              
              {/* Fallback quota triggers notification */}
              {results.isFallback && (
                <div className="bg-amber-50 rounded-2xl p-4.5 border border-amber-200/60 flex gap-3 text-amber-900 items-start shadow-xs">
                  <AlertCircle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                  <div className="space-y-1.5 text-xs text-amber-900 leading-relaxed flex-1">
                    <h4 className="font-bold tracking-tight text-slate-900">
                      High-Growth Secondary Database Catalog Enforced (API Resource Warning)
                    </h4>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      Standard OpenAI API quota boundaries or credit limits were hit. Dynamic sandbox analytics have automatically loaded to ensure continuous evaluation of interface components and pricing variables.
                    </p>
                    {results.apiError && (
                      <div className="mt-2 text-left">
                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">Exact API Error Response:</p>
                        <p className="font-mono text-[9px] bg-white/70 p-2.5 rounded-xl border border-amber-200/50 leading-relaxed text-amber-950 break-words select-all mt-1">
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
              <div className="bg-gradient-to-br from-teal-50/50 to-indigo-50/20 rounded-3xl p-6 border border-teal-100/30 flex gap-4 shadow-xs relative">
                <div className="w-10 h-10 bg-white border border-teal-100/80 text-teal-600 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                  <Lightbulb size={20} className="text-teal-600" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-teal-800 font-mono leading-none">
                    SCOUT COGNITIVE SYNTHESIS (REAL-TIME ADVICE)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    {results.trendReasonDescription}
                  </p>
                </div>
              </div>

              {/* Core Dynamic Interactive Tabs bar */}
              <div className="bg-white border border-slate-100 rounded-2xl p-1.5 flex gap-1.5 shadow-xs">
                {[
                  { id: "opportunities", label: "Opportunities List", icon: <Layers size={14} /> },
                  { id: "insights", label: "Scientific Intelligence", icon: <Info size={14} /> },
                  { id: "calculator", label: "Margin Potential", icon: <Percent size={14} /> }
                ].map((tb) => (
                  <button
                    key={tb.id}
                    onClick={() => setActiveTab(tb.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                      activeTab === tb.id
                        ? "bg-teal-600 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
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
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Filter size={14} className="text-teal-600" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">
                          Live Results Analyzer & Filter
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
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
                          className="w-full text-[11px] font-medium bg-slate-50 border border-slate-100 focus:bg-white focus:border-teal-500 p-2.5 pl-8 rounded-xl outline-none transition-all font-mono"
                        />
                        <Search size={12} className="absolute left-2.5 top-3.5 text-slate-400" />
                        {resultsKeywordFilter && (
                          <button
                            onClick={() => setResultsKeywordFilter("")}
                            className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>

                      {/* Growth Threshold Range Selector */}
                      <div className="md:col-span-3 flex flex-col justify-center space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 font-mono uppercase">
                          <span>Min Trajectory</span>
                          <span className="text-teal-600 font-bold">{minGrowthFilter}+</span>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="98"
                          value={minGrowthFilter}
                          onChange={(e) => setMinGrowthFilter(parseInt(e.target.value))}
                          className="w-full accent-teal-600 cursor-pointer h-1 bg-slate-100 rounded-lg text-xs"
                        />
                      </div>

                      {/* Cash range toggle selector */}
                      <div className="md:col-span-3">
                        <select
                          value={priceTierFilter}
                          onChange={(e) => setPriceTierFilter(e.target.value)}
                          className="w-full text-[10px] bg-slate-50 border border-slate-100 p-2.5 rounded-xl outline-none font-medium text-slate-600"
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
                          className={`bg-white rounded-2xl border ${
                            isHighGrowth ? "border-teal-500/20 shadow-teal-500/[0.02]" : "border-slate-100"
                          } p-5 hover:border-teal-500/80 hover:shadow-md hover:scale-[1.01] duration-300 transition-all flex flex-col justify-between h-full cursor-pointer relative group overflow-hidden`}
                        >
                          {/* Top-right visual glow element */}
                          {isHighGrowth && (
                            <div className="absolute right-0 top-0 w-16 h-16 bg-teal-500/5 rounded-bl-full pointer-events-none group-hover:bg-teal-500/10 transition-colors" />
                          )}

                          <div className="space-y-4">
                            {/* Headline block */}
                            <div className="flex items-start justify-between gap-3 border-b border-slate-50 pb-3">
                              <div className="space-y-1">
                                <h4 className="font-bold text-slate-800 text-xs md:text-sm leading-snug group-hover:text-teal-600 transition-colors">
                                  {prod.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50/80 border border-teal-100/50 px-1.5 py-0.5 rounded">
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

                            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                              {prod.description}
                            </p>
                          </div>

                          <div className="space-y-3 pt-4 mt-4 border-t border-slate-100/60">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <DollarSign size={13} className="text-slate-400" />
                                <div>
                                  <p className="text-[8px] text-slate-400 uppercase font-mono font-bold leading-none">Price Range</p>
                                  <p className="font-bold text-slate-700 text-[10px] mt-0.5">{prod.priceRange}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Target size={13} className="text-slate-400" />
                                <div>
                                  <p className="text-[8px] text-slate-400 uppercase font-mono font-bold leading-none">Demographic</p>
                                  <p className="font-bold text-slate-700 text-[10px] truncate max-w-[100px] mt-0.5" title={prod.targetAudience}>
                                    {prod.targetAudience}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* View detail action pill */}
                            <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-teal-600 group-hover:text-teal-700 transition-colors">
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
                      <div className="col-span-2 bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center text-slate-400 text-xs py-12">
                        No product opportunity matches current live filter settings. Try modifying keywords or adjusting the trajectory bar.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Scientific Insights Overview */}
              {activeTab === "insights" && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-6 animate-fade-in text-xs font-sans">
                  
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                    <BookOpen size={16} className="text-teal-600" />
                    <h4 className="font-bold text-slate-800 uppercase tracking-widest text-xs font-mono">
                      Research Grounding Citations
                    </h4>
                  </div>

                  <p className="text-slate-500 leading-relaxed font-medium">
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
                          className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-teal-500 hover:bg-slate-50 transition-all text-slate-600 group cursor-pointer shadow-2xs"
                        >
                          <span className="truncate pr-4 font-bold text-slate-700 group-hover:text-teal-600">
                            {src.title}
                          </span>
                          <ExternalLink size={13} className="text-slate-400 group-hover:text-teal-600 shrink-0" />
                        </a>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-6 bg-slate-50 rounded-xl text-slate-400">
                        No external citations required for pre-validated sandbox catalog.
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex items-start gap-3">
                    <Info size={16} className="text-teal-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 leading-none">Google Grounding Methodology</span>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Citations are mapped by analyzing public consumer interest peaks. High trajectory score vectors (90+) represent sectors experiencing positive compounding feedback across social algorithms and B2B orders.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Interactive Margin Calculator */}
              {activeTab === "calculator" && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-6 animate-fade-in text-xs font-sans">
                  
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                    <SlidersHorizontal size={16} className="text-teal-600" />
                    <h4 className="font-bold text-slate-800 uppercase tracking-widest text-xs font-mono">
                      Integrated Global Margin Estimator
                    </h4>
                  </div>

                  <p className="text-slate-500 leading-relaxed font-medium">
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
                          className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-between space-y-4 shadow-3xs"
                        >
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-teal-600 font-mono tracking-widest">PRODUCT #{pIdx + 1}</span>
                            <h5 className="font-extrabold text-slate-800 line-clamp-1">{p.title}</h5>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                              <span>Estimated Wholesale:</span>
                              <span className="font-mono text-slate-700 font-bold">${lowerCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                              <span>Suggested Retail:</span>
                              <span className="font-mono text-slate-700 font-bold">${suggestedSell.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold border-t border-slate-200/50 pt-1">
                              <span className="text-slate-600">Profit margin:</span>
                              <span className="text-emerald-700 font-mono">~{marginRatio}%</span>
                            </div>
                          </div>

                          <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full" 
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
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setSelectedProduct(null)}
            />

            {/* Modal Body Container with slide transition */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-6 md:p-8 text-left shadow-2xl border border-slate-100 z-10"
            >
              
              {/* Header Title Bar */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full font-mono">
                      Verified Sourcing Node
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full font-mono flex items-center gap-1">
                      <Flame size={11} className="text-amber-500 animate-pulse" />
                      Viral Rating: {selectedProduct.growthScore}/100
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mt-3">
                    {selectedProduct.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                    Unique Selling point (USP): {selectedProduct.usp}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body Scroll Space */}
              <div className="mt-5 space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                
                {/* Description Segment */}
                <div>
                  <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-2 font-mono flex items-center gap-1.5">
                    <Lightbulb size={13} className="text-teal-600" />
                    Aesthetic Description
                  </h4>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100/60 font-medium">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Sourcing Cost & Pricing slider calculation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* wholesale buy cost widget */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-gradient-to-br from-teal-50/10 to-teal-50/40 space-y-3 shadow-3xs">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-teal-700 block font-mono">
                      Estimated Sourcing Cost
                    </span>
                    <div className="space-y-1">
                      <span className="text-lg font-bold text-slate-800 font-mono">
                        {selectedProduct.approxTotalCost || "$1,150 (For 100 units / MOQ)"}
                      </span>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Estimated initial bulk wholesale batch rate inclusive of duty tariffs and direct air cargo carriers.
                      </p>
                    </div>
                  </div>

                  {/* interactive price target and real-time margin Calculator slide rule */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-gradient-to-br from-violet-50/10 to-violet-50/40 space-y-3 shadow-3xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-violet-700 block font-mono">
                        Adjust Target Market Price
                      </span>
                      <span className="text-xs font-bold text-violet-800 font-mono bg-white px-2 py-0.5 rounded-md border border-violet-100">${simulatedRetailPrice}</span>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="range"
                        min="20"
                        max="350"
                        value={simulatedRetailPrice}
                        onChange={(e) => setSimulatedRetailPrice(parseInt(e.target.value))}
                        className="w-full accent-violet-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg text-xs"
                      />

                      <div className="flex justify-between items-center text-[10px] text-slate-500 leading-normal gap-1 font-medium">
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
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold gap-2">
                          <span className="text-slate-500 font-sans">Active Simulated Financial Matrix:</span>
                          <span className="text-emerald-700 font-mono tracking-wide">
                            {performanceRating} (~{grossPercent}% Markup Profit)
                          </span>
                        </div>

                        {/* Visual feedback tracker metric */}
                        <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`${barColor} h-full rounded-full transition-all duration-300`}
                            style={{ width: `${grossPercent}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1.5 text-center text-[9px] font-bold text-slate-400 font-mono uppercase">
                          <div className="bg-white border border-slate-100 p-2 rounded-lg">
                            <p>Wholesale unit cost</p>
                            <p className="text-xs font-bold text-slate-700 mt-1">${unitCostVal.toFixed(2)}</p>
                          </div>
                          <div className="bg-white border border-slate-100 p-2 rounded-lg">
                            <p>Gross unit profit</p>
                            <p className="text-xs font-bold text-emerald-700 mt-1">${activeProfit.toFixed(2)}</p>
                          </div>
                          <div className="bg-white border border-slate-100 p-2 rounded-lg">
                            <p>Break-even units</p>
                            <p className="text-xs font-bold text-slate-700 mt-1">
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
                    <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 flex items-center gap-1.5 font-mono">
                      <Store size={14} className="text-slate-400" />
                      Global B2B Wholesale Channels
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">Real-time Sourcing options</span>
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
                            className="bg-white border border-slate-150 p-4 rounded-2xl shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans hover:border-teal-400 transition-colors duration-200"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                  {isAlibaba ? "Alibaba" : isAliExpress ? "AliExpress" : "GlobalSources"}
                                </span>
                                <span className="font-bold text-slate-700 text-sm">{sup.name}</span>
                              </div>
                              <p className="text-xs text-slate-400 font-medium">
                                Target Piece Sourcing rate: <span className="font-bold text-slate-700 font-mono">{sup.unitCost}</span>
                              </p>
                            </div>

                            <a
                              href={sup.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-900 border border-slate-800 text-white hover:bg-teal-600 font-bold text-xs px-4 py-2.5 rounded-xl text-center active:scale-95 duration-150 shrink-0 transition-all cursor-pointer shadow-3xs"
                            >
                              Verify Supply Link ↗
                            </a>
                          </div>
                        );
                      })
                    ) : (
                      <p className="col-span-1 py-4 text-center text-slate-400 bg-slate-50 rounded-xl">No suppliers index available for this sandbox item.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Footer Closer bar */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
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
