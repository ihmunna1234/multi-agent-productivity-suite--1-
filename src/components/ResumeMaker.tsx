import React, { useState } from "react";
import { apiFetch } from "../utils/api";
import { 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Briefcase, 
  GraduationCap, 
  Code2, 
  FolderGit2, 
  Sparkles, 
  Download, 
  Printer, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Eye, 
  FileEdit, 
  ChevronRight, 
  CheckCircle2, 
  X,
  ListRestart,
  Image,
  Camera
} from "lucide-react";
import { ResumeData, ResumeWorkExperience, ResumeEducation, ResumeSkill, ResumeProject } from "../types";

// Dynamic preloaded template presets to demonstrate immediate value
const ROLE_PRESETS = {
  software_engineer: {
    fullName: "Alex Mercer",
    title: "Lead Full-Stack Systems Engineer",
    email: "alex.mercer@systems.io",
    phone: "+966 50 123 4567",
    location: "Riyadh, Saudi Arabia",
    website: "https://mercer.dev",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    showProfileImage: true,
    summary: "Visionary Full-Stack Engineer with 7+ years of experience constructing high-availability microservice clusters, responsive progressive web interfaces, and automated telemetry loops. Highly fluent in TypeScript, React, and server-side Node.js orchestration. Passionate about converting intricate product specifications into pristine, scale-ready code structures.",
    workExperience: [
      {
        id: "exp-1",
        company: "Systemic Core Solutions",
        position: "Lead Systems Developer",
        location: "Riyadh, KSA",
        startDate: "2024-03",
        endDate: "Present",
        current: true,
        highlights: [
          "Spearheaded development of a low-latency multimodal data aggregator, reducing average API response times by 42% globally.",
          "Orchestrated team migration from legacy systems to a cloud-native React 19 and containerized Node.js cluster setup.",
          "Automated release safety configurations, eliminating environment deployment incidents by 92% utilizing custom test runners."
        ]
      },
      {
        id: "exp-2",
        company: "Apex Digital Platforms",
        position: "Senior Full Stack Dev",
        location: "Dubai, UAE",
        startDate: "2021-08",
        endDate: "2024-02",
        current: false,
        highlights: [
          "Architected real-time dashboard visualization suites handling up to 50,000 active socket connections concurrently.",
          "Refactored complex state models across 4 high-traffic web apps, decreasing overall client-side memory footprint by 28%.",
          "Mentored 6 junior engineers on reactive design strategies, test automation pipelines, and semantic UI criteria."
        ]
      }
    ],
    education: [
      {
        id: "edu-1",
        institution: "King Saud University",
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science & Engineering",
        location: "Riyadh, Saudi Arabia",
        startDate: "2017-09",
        endDate: "2021-06",
        gpa: "3.9 / 4.0"
      }
    ],
    skills: [
      { id: "sk-1", name: "TypeScript / JavaScript ESNext", level: "Expert" },
      { id: "sk-2", name: "React & Next.js Ecosystem", level: "Expert" },
      { id: "sk-3", name: "Node.js & Express API Design", level: "Advanced" },
      { id: "sk-4", name: "PostgreSQL & Redis Caching", level: "Advanced" },
      { id: "sk-5", name: "Docker & Kubernetes Clusters", level: "Advanced" },
      { id: "sk-6", name: "Tailwind CSS & Utility Frameworks", level: "Expert" }
    ],
    projects: [
      {
        id: "pr-1",
        name: "Injamus's AI Workspace Dashboard",
        description: "Built a customized web platform executing real-time multimodal card extractions and grounding engines.",
        url: "https://github.com/alexm/agenthub"
      },
      {
        id: "pr-2",
        name: "OmniSignal State Engine",
        description: "Crafted a tiny, 1.4KB reactive state manager celebrating reactive rendering cycles and custom memo states.",
        url: "https://mercer.dev/omnisignal"
      }
    ]
  },
  marketing_manager: {
    fullName: "Sarah Al-Ghamdi",
    title: "Senior Growth Marketing Strategist",
    email: "sarahg@digitalgrowth.com",
    phone: "+966 54 999 8888",
    location: "Jeddah, Saudi Arabia",
    website: "https://sarahg.media",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    showProfileImage: true,
    summary: "Metrics-driven Growth Marketer with 5+ years of experience leading multichannnel customer acquisition campaigns across KSA and UAE. Specialize in search engine optimization, pay-per-click conversion mapping, and viral social hooks. Championed campaigns generating over $4M in direct customer conversions under optimized CAC metrics.",
    workExperience: [
      {
        id: "exp-1",
        company: "Oasis E-Commerce Hub",
        position: "Senior Growth Lead",
        location: "Jeddah, KSA",
        startDate: "2023-05",
        endDate: "Present",
        current: true,
        highlights: [
          "Scaled active daily customers by 180% year-over-year while slicing digital acquisition budgets by 22% overall.",
          "Designed dynamic A/B landing page trials that bolstered high-ticket conversion rates from 1.4% to 3.25% in 90 days.",
          "Pioneered brand video hooks resulting in 12M+ organic views across Instagram, TikTok and regional publications."
        ]
      },
      {
        id: "exp-2",
        company: "Horizon Brand Consultants",
        position: "SEO Marketing Analyst",
        location: "Riyadh, KSA",
        startDate: "2021-02",
        endDate: "2023-04",
        current: false,
        highlights: [
          "Drove average search authority ranking of 14 client projects to standard page-one status on competitive retail terms.",
          "Coordinated multi-channel newsletter subscriber campaigns, expanding valid recipient indexes by 40,000 contacts."
        ]
      }
    ],
    education: [
      {
        id: "edu-1",
        institution: "Effat University",
        degree: "Bachelor of Business Administration",
        fieldOfStudy: "Marketing & Digital Communications",
        location: "Jeddah, KSA",
        startDate: "2016-09",
        endDate: "2020-05",
        gpa: "4.8 / 5.0"
      }
    ],
    skills: [
      { id: "sk-1", name: "Google Ads & PPC Structuring", level: "Expert" },
      { id: "sk-2", name: "Advanced SEO & Semantic Audits", level: "Expert" },
      { id: "sk-3", name: "Short-Form Video Hook Scripting", level: "Expert" },
      { id: "sk-4", name: "HubSpot / Marketo Telemetry", level: "Advanced" },
      { id: "sk-5", name: "Conversion Rate Optimization (CRO)", level: "Expert" }
    ],
    projects: [
      {
        id: "pr-1",
        name: "The Virality Guide blueprint",
        description: "Self-published comprehensive digital blueprint outlining high-conversion video formats, downloaded by 2,500+ professionals.",
        url: "https://sarahg.media/virality"
      }
    ]
  },
  creative_director: {
    fullName: "Nasser Al-Subaie",
    title: "Senior Product UI & Brand Designer",
    email: "nasser@subaiedesign.co",
    phone: "+966 56 123 9999",
    location: "Riyadh, Saudi Arabia",
    website: "https://subaiedesign.co",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    showProfileImage: true,
    summary: "Award-winning Creative Designer focusing on modern interactive user experiences, bespoke typography, and high-fidelity product design layouts. Highly skilled at building cohesive design system patterns across web, desktop and mobile screens. Commited to architectural honesty and elegant negative spacing.",
    workExperience: [
      {
        id: "exp-1",
        company: "Mirage Creative Studio",
        position: "Senior UI & Brand Architect",
        location: "Riyadh, KSA",
        startDate: "2023-01",
        endDate: "Present",
        current: true,
        highlights: [
          "Established and scaled centralized Figma design libraries, reducing product design cycles by 40% across 5 core teams.",
          "Redesigned the onboarding pipeline of a premier fintech solution, dropping user checkout friction by 18%.",
          "Presented design vision directly to government stakeholders, successfully securing approval for national portal overhauls."
        ]
      },
      {
        id: "exp-2",
        company: "Riyadh Brand House",
        position: "Visual Identity Specialist",
        location: "Riyadh, KSA",
        startDate: "2020-07",
        endDate: "2022-12",
        current: false,
        highlights: [
          "Executed full rebrand campaigns for 8 national entities, delivering pristine vector assets and complete print-ready guides.",
          "Collaborated directly with front-end systems engineers to audit responsive layout fidelity and typography pairing rules."
        ]
      }
    ],
    education: [
      {
        id: "edu-1",
        institution: "Prince Sultan University",
        degree: "Bachelor of Science",
        fieldOfStudy: "Communications Design & Interactive Media",
        location: "Riyadh, KSA",
        startDate: "2016-09",
        endDate: "2020-06",
        gpa: "3.85 / 4.0"
      }
    ],
    skills: [
      { id: "sk-1", name: "High-Fidelity Product UI (Figma)", level: "Expert" },
      { id: "sk-2", name: "Bespoke Design Systems & Tokens", level: "Expert" },
      { id: "sk-3", name: "Interactive Prototyping", level: "Advanced" },
      { id: "sk-4", name: "Typography & Layout Grid Calibration", level: "Expert" },
      { id: "sk-5", name: "Adobe Creative Suite Ecosystem", level: "Expert" }
    ],
    projects: [
      {
        id: "pr-1",
        name: "Saudi Heritage Vector Pack",
        description: "Created a gorgeous collection of 100+ open-source vector badges showcasing historic architectural points.",
        url: "https://subaiedesign.co/heritage"
      }
    ]
  }
};

type ActiveFormSection = "personal" | "summary" | "experience" | "education" | "skills" | "projects";
type ActiveTemplate = "modern" | "executive" | "mono";

export default function ResumeMaker() {
  const [resumeData, setResumeData] = useState<ResumeData>(ROLE_PRESETS.software_engineer);
  const [activeFormTab, setActiveFormTab] = useState<ActiveFormSection>("personal");
  const [activeTemplate, setActiveTemplate] = useState<ActiveTemplate>("modern");
  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");

  // AI assist states
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isAiFallback, setIsAiFallback] = useState(false);
  const [aiApiError, setAiApiError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [activeAiField, setActiveAiField] = useState<{
    type: "summary" | "experience";
    experienceId?: string;
  } | null>(null);

  // Quick preset loader handler
  const loadPreset = (presetKey: keyof typeof ROLE_PRESETS) => {
    if (confirm(`Are you sure you want to load the "${ROLE_PRESETS[presetKey].title}" preset? Your current edits will be overwritten.`)) {
      setResumeData(JSON.parse(JSON.stringify(ROLE_PRESETS[presetKey])));
      setAiSuggestions([]);
      setActiveAiField(null);
    }
  };

  // Text inputs handlers
  const handlePersonalChange = (field: keyof ResumeData, value: any) => {
    setResumeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Adding/removing dynamic items
  const addWorkExperience = () => {
    const newItem: ResumeWorkExperience = {
      id: "exp-" + Math.random().toString(36).substring(2, 9),
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      highlights: [""]
    };
    setResumeData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, newItem]
    }));
  };

  const removeWorkExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter(item => item.id !== id)
    }));
  };

  const updateWorkExperience = (id: string, field: keyof ResumeWorkExperience, value: any) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const addHighlight = (expId: string) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(item => {
        if (item.id === expId) {
          return {
            ...item,
            highlights: [...item.highlights, ""]
          };
        }
        return item;
      })
    }));
  };

  const updateHighlight = (expId: string, hIndex: number, value: string) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(item => {
        if (item.id === expId) {
          const updated = [...item.highlights];
          updated[hIndex] = value;
          return { ...item, highlights: updated };
        }
        return item;
      })
    }));
  };

  const removeHighlight = (expId: string, hIndex: number) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(item => {
        if (item.id === expId) {
          const updated = item.highlights.filter((_, i) => i !== hIndex);
          return { ...item, highlights: updated.length === 0 ? [""] : updated };
        }
        return item;
      })
    }));
  };

  // Education handlers
  const addEducation = () => {
    const newItem: ResumeEducation = {
      id: "edu-" + Math.random().toString(36).substring(2, 9),
      institution: "",
      degree: "",
      fieldOfStudy: "",
      location: "",
      startDate: "",
      endDate: "",
      gpa: ""
    };
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newItem]
    }));
  };

  const updateEducation = (id: string, field: keyof ResumeEducation, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(item => item.id !== id)
    }));
  };

  // Skills handlers
  const addSkill = () => {
    const newItem: ResumeSkill = {
      id: "sk-" + Math.random().toString(36).substring(2, 9),
      name: "",
      level: "Intermediate"
    };
    setResumeData(prev => ({
      ...prev,
      skills: [...prev.skills, newItem]
    }));
  };

  const updateSkill = (id: string, field: keyof ResumeSkill, value: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const removeSkill = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(item => item.id !== id)
    }));
  };

  // Projects handlers
  const addProject = () => {
    const newItem: ResumeProject = {
      id: "pr-" + Math.random().toString(36).substring(2, 9),
      name: "",
      description: "",
      url: ""
    };
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, newItem]
    }));
  };

  const updateProject = (id: string, field: keyof ResumeProject, value: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const removeProject = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter(item => item.id !== id)
    }));
  };

  // Call the robust AI assistance endpoint
  const requestAiAssistance = async (action: "improve-bullets" | "write-summary" | "generate-skills", contextText?: string) => {
    setIsAiProcessing(true);
    setAiSuggestions([]);
    setIsAiFallback(false);
    setAiApiError(null);
    try {
      const response = await apiFetch("/api/ai-resume-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          role: resumeData.title || "Professional Specialist",
          text: contextText || ""
        })
      });

      const data = await response.json();
      if (data.isFallback) {
        setIsAiFallback(true);
        if (data.apiError) {
          setAiApiError(data.apiError);
        }
      }
      
      if (data.suggestions) {
        setAiSuggestions(data.suggestions);
      } else {
        // Safe programmatic simulation of resume points in case of unexpected format anomalies
        setIsAiFallback(true);
        const defaultList = action === "improve-bullets" 
          ? [`Spearheaded core feature design as a ${resumeData.title || "Specialist"}, driving user satisfaction metrics.`]
          : [`Dedicated, dynamic professional specialized as a ${resumeData.title || "Specialist"}.`];
        setAiSuggestions(defaultList);
      }
    } catch (e) {
      console.warn("AI Resume helper connection issue, using locally simulated suggestions:", e);
      setIsAiFallback(true);
      const defaultList = action === "improve-bullets" 
         ? [`Spearheaded core feature design as a ${resumeData.title || "Specialist"}, driving user satisfaction metrics.`]
         : [`Dedicated, dynamic professional specialized as a ${resumeData.title || "Specialist"}.`];
      setAiSuggestions(defaultList);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const acceptAiSuggestion = (text: string) => {
    if (!activeAiField) return;

    if (activeAiField.type === "summary") {
      setResumeData(prev => ({ ...prev, summary: text }));
    } else if (activeAiField.type === "experience" && activeAiField.experienceId) {
      // Append highlight to the designated experience block
      const expId = activeAiField.experienceId;
      setResumeData(prev => ({
        ...prev,
        workExperience: prev.workExperience.map(item => {
          if (item.id === expId) {
            // Replace first empty bullet or simply push a new one
            const updatedBullets = [...item.highlights];
            if (updatedBullets.length === 1 && updatedBullets[0].trim() === "") {
              updatedBullets[0] = text;
            } else {
              updatedBullets.push(text);
            }
            return { ...item, highlights: updatedBullets };
          }
          return item;
        })
      }));
    }

    setAiSuggestions([]);
    setActiveAiField(null);
  };

  // Direct HTML format exporter
  const handleExportHtml = () => {
    const previewContainer = document.getElementById("resume-paper-canvas-node");
    if (!previewContainer) return;
    
    // Inline styling combined for portable transport
    const outerHtml = previewContainer.innerHTML;
    const documentTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${resumeData.fullName} - ${resumeData.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: #f8fafc;
      font-family: 'Inter', sans-serif;
      padding: 40px 20px;
    }
    .print-only-page {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 45px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="print-only-page">
    ${outerHtml}
  </div>
</body>
</html>`;

    const dataStr = "data:text/html;charset=utf-8," + encodeURIComponent(documentTemplate);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${resumeData.fullName.replace(/\s+/g, "_")}_resume.html`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Print execution with proper target cloning & document isolated design
  const handlePrint = () => {
    const previewContainer = document.getElementById("resume-paper-canvas-node");
    if (!previewContainer) return;

    // Create an elegant iframe sandbox dynamically to secure the environment styling
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "absolute";
    printFrame.style.top = "-9999px";
    printFrame.style.left = "-9999px";
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (!frameDoc) return;

    const stylingText = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map(tag => tag.outerHTML)
      .join("\n");

    const htmlBody = `
<html>
<head>
  <title>${resumeData.fullName} - Resume</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  ${stylingText}
  <style>
    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        color: #0c1220 !important;
        font-size: 11px !important;
      }
      .resume-print-root {
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        width: 100% !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; background-color: #fff;">
  <div class="resume-print-root">
    ${previewContainer.innerHTML}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    }
  </script>
</body>
</html>`;

    frameDoc.write(htmlBody);
    frameDoc.close();

    // Remove the frame shortly after execution triggers
    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 10000);
  };

  return (
    <div className="space-y-6 text-on-surface">
      
      {/* Title block */}
      <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface-container-highest shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[10px] bg-primary-fixed text-primary-container font-bold px-2 py-1 rounded uppercase tracking-wider">
            AI Multi-Agent Suite
          </span>
          <h2 className="text-xl font-bold font-sans text-on-surface flex items-center gap-2">
            <Plus className="text-primary" size={20} />
            Creative Resume Studio
          </h2>
          <p className="text-xs text-outline-variant">
            Construct high-fidelity, ATS-optimized print-ready blueprints with side-by-side Gemini AI support.
          </p>
        </div>

        {/* Toolbar Preset launchpads */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-outline-variant font-bold uppercase tracking-wider mr-1">
            Presets:
          </span>
          <button 
            onClick={() => loadPreset("software_engineer")}
            className="text-[11px] font-semibold bg-surface-container-low hover:bg-surface-container text-on-surface-variant px-2.5 py-1.5 rounded-lg border border-outline-variant transition-all cursor-pointer"
          >
            Software
          </button>
          <button 
            onClick={() => loadPreset("marketing_manager")}
            className="text-[11px] font-semibold bg-surface-container-low hover:bg-surface-container text-on-surface-variant px-2.5 py-1.5 rounded-lg border border-outline-variant transition-all cursor-pointer"
          >
            Growth Growth
          </button>
          <button 
            onClick={() => loadPreset("creative_director")}
            className="text-[11px] font-semibold bg-surface-container-low hover:bg-surface-container text-on-surface-variant px-2.5 py-1.5 rounded-lg border border-outline-variant transition-all cursor-pointer"
          >
            UI / UX
          </button>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Controls & Interactive Editors */}
        <div className={`col-span-1 lg:col-span-6 space-y-6 ${viewMode === "preview" ? "hidden lg:block" : ""}`}>
          
          {/* Section Navigation Tabs */}
          <div className="bg-surface-container-lowest rounded-DEFAULT p-2 border border-surface-container-highest shadow-none flex flex-wrap gap-1">
            {[
              { id: "personal", label: "Contact", icon: <User size={14} /> },
              { id: "summary", label: "Summary", icon: <Sparkles size={14} /> },
              { id: "experience", label: "Work", icon: <Briefcase size={14} /> },
              { id: "education", label: "Education", icon: <GraduationCap size={14} /> },
              { id: "skills", label: "Skills", icon: <Code2 size={14} /> },
              { id: "projects", label: "Projects", icon: <FolderGit2 size={14} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFormTab(tab.id as ActiveFormSection)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-DEFAULT text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeFormTab === tab.id
                    ? "bg-inverse-surface text-white shadow-none"
                    : "text-outline hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Cards */}
          <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface-container-highest shadow-none space-y-5">
            
            {/* Tabs View Mode helper on smaller screens */}
            <div className="flex lg:hidden justify-between items-center pb-4 border-b border-surface-container-highest">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Form Editor ({activeFormTab})
              </span>
              <button 
                onClick={() => setViewMode("preview")}
                className="text-xs font-semibold text-outline hover:text-on-surface flex items-center gap-1 bg-surface-container-low px-2.5 py-1 rounded"
              >
                <Eye size={14} /> View Layout
              </button>
            </div>

            {/* TAB: Personal Details */}
            {activeFormTab === "personal" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-bold text-on-surface text-sm">Personal Details</h3>
                
                {/* Profile Image Box section */}
                <div className="p-4 rounded-DEFAULT bg-surface-container-low border border-surface-container-highest space-y-4 shadow-none">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <Image size={14} className="text-primary" />
                        Profile Image Box
                      </span>
                      <p className="text-[10px] text-outline-variant">Add a professional headshot to your resume canvas</p>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={!!resumeData.showProfileImage}
                        onChange={(e) => handlePersonalChange("showProfileImage", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-DEFAULT peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:border-outline after:border after:rounded-DEFAULT after:h-4 after:w-4 after:transition-all peer-checked:bg-inverse-surface"></div>
                      <span className="ml-2 text-[10px] font-mono font-bold uppercase tracking-wider text-outline">
                        {resumeData.showProfileImage ? "Active" : "Hidden"}
                      </span>
                    </label>
                  </div>

                  {resumeData.showProfileImage && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1 animate-fade-in">
                      {/* Image Preview & Upload zone (Col 4) */}
                      <div className="md:col-span-4 flex flex-col items-center justify-center">
                        <div className="w-24 h-24 rounded-DEFAULT border-2 border-dashed border-outline-variant bg-surface-container-lowest flex flex-col items-center justify-center overflow-hidden relative group shadow-none transition-all hover:border-primary">
                          {resumeData.profileImage ? (
                            <>
                              <img 
                                src={resumeData.profileImage} 
                                alt="Profile Thumbnail" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handlePersonalChange("profileImage", "")}
                                  className="text-[9px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-outline-variant p-2 text-center">
                              <Camera size={18} className="mb-1 text-outline-variant animate-pulse" />
                              <span className="text-[9px] font-bold leading-tight">Click or Drag Image</span>
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  handlePersonalChange("profileImage", reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* URL Override & Presets (Col 8) */}
                      <div className="md:col-span-8 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-outline-variant uppercase">Or Paste External Image URL</label>
                          <input 
                            type="text"
                            value={resumeData.profileImage || ""}
                            onChange={(e) => handlePersonalChange("profileImage", e.target.value)}
                            placeholder="https://images.unsplash.com/... or data:image/..."
                            className="w-full text-xs p-2 rounded-DEFAULT border border-outline-variant focus:outline-none focus:border-primary bg-surface-container-lowest font-sans"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[9px] font-mono text-outline-variant uppercase block">Quick Presets</span>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: "Male Pro", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" },
                              { label: "Female Pro", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face" },
                              { label: "Young Techie", url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face" },
                              { label: "Creative", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face" }
                            ].map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handlePersonalChange("profileImage", preset.url)}
                                className={`text-[10px] bg-surface-container-lowest border px-2 py-1.5 rounded-lg hover:bg-surface-container transition-all cursor-pointer flex items-center gap-1 ${
                                  resumeData.profileImage === preset.url ? "border-primary text-on-primary-fixed bg-primary-fixed/20" : "border-outline-variant text-on-surface-variant"
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-outline-variant uppercase">Full Name</label>
                    <input 
                      type="text" 
                      value={resumeData.fullName} 
                      onChange={(e) => handlePersonalChange("fullName", e.target.value)}
                      placeholder="e.g. Nasser Al-Otaibi"
                      className="w-full text-xs p-3 rounded-DEFAULT border border-outline-variant/80 focus:outline-none focus:border-primary font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-outline-variant uppercase">Target Professional Title</label>
                    <input 
                      type="text" 
                      value={resumeData.title} 
                      onChange={(e) => handlePersonalChange("title", e.target.value)}
                      placeholder="e.g. Lead React Architect"
                      className="w-full text-xs p-3 rounded-DEFAULT border border-outline-variant/80 focus:outline-none focus:border-primary font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-outline-variant uppercase">Email Address</label>
                    <input 
                      type="email" 
                      value={resumeData.email} 
                      onChange={(e) => handlePersonalChange("email", e.target.value)}
                      placeholder="e.g. nasser@domain.com"
                      className="w-full text-xs p-3 rounded-DEFAULT border border-outline-variant/80 focus:outline-none focus:border-primary font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-outline-variant uppercase">Phone Number</label>
                    <input 
                      type="text" 
                      value={resumeData.phone} 
                      onChange={(e) => handlePersonalChange("phone", e.target.value)}
                      placeholder="e.g. +966 50 123 4567"
                      className="w-full text-xs p-3 rounded-DEFAULT border border-outline-variant/80 focus:outline-none focus:border-primary font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-outline-variant uppercase">Location / Residence</label>
                    <input 
                      type="text" 
                      value={resumeData.location} 
                      onChange={(e) => handlePersonalChange("location", e.target.value)}
                      placeholder="e.g. Riyadh, Saudi Arabia"
                      className="w-full text-xs p-3 rounded-DEFAULT border border-outline-variant/80 focus:outline-none focus:border-primary font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-outline-variant uppercase">Portfolio / Website URL</label>
                    <input 
                      type="text" 
                      value={resumeData.website} 
                      onChange={(e) => handlePersonalChange("website", e.target.value)}
                      placeholder="e.g. https://portfolio.com"
                      className="w-full text-xs p-3 rounded-DEFAULT border border-outline-variant/80 focus:outline-none focus:border-primary font-sans"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Summary (with AI optimization) */}
            {activeFormTab === "summary" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-on-surface text-sm">Professional Profile Summary</h3>
                  
                  {/* AI trigger */}
                  <button
                    onClick={() => {
                      setActiveAiField({ type: "summary" });
                      requestAiAssistance("write-summary", resumeData.summary);
                    }}
                    disabled={isAiProcessing}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-container bg-primary-fixed px-2.5 py-1.5 rounded-lg border border-primary-fixed-dim disabled:opacity-40 cursor-pointer hover:bg-primary-fixed-dim"
                  >
                    <Sparkles size={12} className="animate-pulse text-primary" />
                    <span>AI Generate / Improve</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-outline-variant uppercase">Write a brief overview of your impact (2-4 sentences)</label>
                  <textarea 
                    value={resumeData.summary} 
                    onChange={(e) => handlePersonalChange("summary", e.target.value)}
                    rows={6}
                    placeholder="Describe your vision, core tech skillsets, and years of high-caliber accomplishments..."
                    className="w-full text-xs p-3 rounded-DEFAULT border border-outline-variant/80 focus:outline-none focus:border-primary font-sans leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB: Experience (Dynamic lists + AI Bullets support) */}
            {activeFormTab === "experience" && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-on-surface text-sm">Professional Work History</h3>
                  <button
                    onClick={addWorkExperience}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container cursor-pointer"
                  >
                    <Plus size={12} /> Add Job
                  </button>
                </div>

                {resumeData.workExperience.length === 0 ? (
                  <p className="text-xs text-outline-variant py-6 text-center">No corporate work experience logged. Click Add Job above to begin.</p>
                ) : (
                  <div className="space-y-6">
                    {resumeData.workExperience.map((exp, index) => (
                      <div key={exp.id} className="p-4 rounded-DEFAULT border border-surface-container-highest bg-surface-container-low/50 space-y-4 relative">
                        <button
                          onClick={() => removeWorkExperience(exp.id)}
                          className="absolute right-3 top-3 text-outline-variant hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                          title="Remove Job Block"
                        >
                          <Trash2 size={14} />
                        </button>

                        <div className="text-[10px] font-bold text-primary-container uppercase tracking-widest leading-none">
                          Experience #{index + 1}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-outline-variant uppercase">Company Name</label>
                            <input 
                              type="text" 
                              value={exp.company} 
                              onChange={(e) => updateWorkExperience(exp.id, "company", e.target.value)}
                              placeholder="e.g. Apex Tech Solutions"
                              className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-outline-variant uppercase">Job Title / Position</label>
                            <input 
                              type="text" 
                              value={exp.position} 
                              onChange={(e) => updateWorkExperience(exp.id, "position", e.target.value)}
                              placeholder="e.g. Mobile UX Developer"
                              className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-outline-variant uppercase">Location / Territory</label>
                            <input 
                              type="text" 
                              value={exp.location} 
                              onChange={(e) => updateWorkExperience(exp.id, "location", e.target.value)}
                              placeholder="e.g. Riyadh, Saudi Arabia"
                              className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-outline-variant uppercase">Start Date</label>
                            <input 
                              type="text" 
                              value={exp.startDate} 
                              onChange={(e) => updateWorkExperience(exp.id, "startDate", e.target.value)}
                              placeholder="YYYY-MM (e.g. 2023-01)"
                              className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-outline-variant uppercase">End Date</label>
                            <input 
                              type="text" 
                              value={exp.endDate} 
                              disabled={exp.current}
                              onChange={(e) => updateWorkExperience(exp.id, "endDate", e.target.value)}
                              placeholder="YYYY-MM or Present"
                              className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none disabled:bg-surface-container disabled:text-outline-variant"
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant select-none mt-1">
                          <input 
                            type="checkbox" 
                            checked={exp.current} 
                            onChange={(e) => {
                              updateWorkExperience(exp.id, "current", e.target.checked);
                              if (e.target.checked) {
                                updateWorkExperience(exp.id, "endDate", "Present");
                              }
                            }}
                            className="rounded accent-slate-800"
                          />
                          <span>I currently work here in this position</span>
                        </label>

                        {/* Bullets Sub-section of Experience */}
                        <div className="border-t border-outline-variant/50 pt-3 space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-outline-variant uppercase tracking-wide">Key Achievements & Responsibilities</span>
                            
                            {/* AI Bullet trigger */}
                            <button
                              onClick={() => {
                                setActiveAiField({ type: "experience", experienceId: exp.id });
                                const currentDraftHighlight = exp.highlights.join(" | ");
                                requestAiAssistance("improve-bullets", currentDraftHighlight || exp.position);
                              }}
                              disabled={isAiProcessing}
                              className="flex items-center gap-1 text-[9px] font-bold text-primary-container uppercase bg-primary-fixed px-2 py-1 rounded border border-primary-fixed-dim cursor-pointer"
                            >
                              <Sparkles size={10} className="text-primary" />
                              <span>AI Improve Bullets</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {exp.highlights.map((highlight, hIndex) => (
                              <div key={hIndex} className="flex gap-2">
                                <input
                                  type="text"
                                  value={highlight}
                                  onChange={(e) => updateHighlight(exp.id, hIndex, e.target.value)}
                                  placeholder="e.g. Led development of automated security checks, saving [12] hours per sprint."
                                  className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none"
                                />
                                <button
                                  onClick={() => removeHighlight(exp.id, hIndex)}
                                  className="p-2 text-outline-variant hover:text-rose-600 rounded-lg hover:bg-surface-container cursor-pointer shrink-0"
                                  title="Remove Bullet"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => addHighlight(exp.id)}
                            className="text-[10px] font-semibold text-outline hover:text-on-surface flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            <Plus size={12} /> Add Achievement Bullet
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Education */}
            {activeFormTab === "education" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-on-surface text-sm">Academic History</h3>
                  <button
                    onClick={addEducation}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container cursor-pointer"
                  >
                    <Plus size={12} /> Add Degree
                  </button>
                </div>

                {resumeData.education.length === 0 ? (
                  <p className="text-xs text-outline-variant py-6 text-center">No academic history logged. Click Add Degree to add educational blocks.</p>
                ) : (
                  <div className="space-y-5">
                    {resumeData.education.map((edu, index) => (
                      <div key={edu.id} className="p-4 rounded-DEFAULT border border-surface-container-highest bg-surface-container-low/50 space-y-4 relative">
                        <button
                          onClick={() => removeEducation(edu.id)}
                          className="absolute right-3 top-3 text-outline-variant hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>

                        <div className="text-[10px] font-bold text-primary-container uppercase tracking-widest leading-none">
                          Academic Institute #{index + 1}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-outline-variant uppercase">Institution Name</label>
                            <input 
                              type="text" 
                              value={edu.institution} 
                              onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                              placeholder="e.g. King Saud University"
                              className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-outline-variant uppercase">Degree Earned</label>
                            <input 
                              type="text" 
                              value={edu.degree} 
                              onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                              placeholder="e.g. Bachelor of Science"
                              className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-outline-variant uppercase">Field of Study / Major</label>
                            <input 
                              type="text" 
                              value={edu.fieldOfStudy} 
                              onChange={(e) => updateEducation(edu.id, "fieldOfStudy", e.target.value)}
                              placeholder="e.g. Structural Computer Systems"
                              className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-outline-variant uppercase">Location</label>
                              <input 
                                type="text" 
                                value={edu.location} 
                                onChange={(e) => updateEducation(edu.id, "location", e.target.value)}
                                placeholder="e.g. Riyadh, KSA"
                                className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-outline-variant uppercase">GPA / Grade</label>
                              <input 
                                type="text" 
                                value={edu.gpa} 
                                onChange={(e) => updateEducation(edu.id, "gpa", e.target.value)}
                                placeholder="e.g. 4.9 / 5.0"
                                className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-outline-variant uppercase">Start Date</label>
                            <input 
                              type="text" 
                              value={edu.startDate} 
                              onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                              placeholder="e.g. 2017-09"
                              className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-outline-variant uppercase">Graduation / End Date</label>
                            <input 
                              type="text" 
                              value={edu.endDate} 
                              onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                              placeholder="e.g. 2021-06"
                              className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Skills (Simple entry + AI options) */}
            {activeFormTab === "skills" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-on-surface text-sm">Professional Skills Checklist</h3>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveAiField(null);
                        requestAiAssistance("generate-skills");
                      }}
                      disabled={isAiProcessing}
                      className="flex items-center gap-1 text-[9px] font-bold text-primary-container uppercase bg-primary-fixed px-2 py-1.5 rounded-lg border border-primary-fixed-dim cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles size={11} className="text-primary animate-pulse" />
                      <span>AI Generate Core Skills</span>
                    </button>
                    <button
                      onClick={addSkill}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container cursor-pointer"
                    >
                      <Plus size={12} /> Add Skill
                    </button>
                  </div>
                </div>

                {resumeData.skills.length === 0 ? (
                  <p className="text-xs text-outline-variant py-6 text-center">No skills drafted. Click Add Skill or let AI generate a core index matching your title.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {resumeData.skills.map((skill) => (
                      <div key={skill.id} className="flex gap-2 items-center bg-surface-container-low p-2.5 rounded-DEFAULT border border-surface-container-highest">
                        <input 
                          type="text" 
                          value={skill.name} 
                          onChange={(e) => updateSkill(skill.id, "name", e.target.value)}
                          placeholder="e.g. TypeScript"
                          className="w-full text-[11px] p-2 bg-surface-container-lowest rounded-lg border border-outline-variant focus:outline-none font-medium text-on-surface-variant"
                        />
                        <select
                          value={skill.level || "Intermediate"}
                          onChange={(e) => updateSkill(skill.id, "level", e.target.value)}
                          className="text-[10px] font-semibold text-on-surface-variant p-2 bg-surface-container-lowest rounded-lg border border-outline-variant focus:outline-none shrink-0"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Expert">Expert</option>
                        </select>
                        <button
                          onClick={() => removeSkill(skill.id)}
                          className="p-1.5 text-outline-variant hover:text-rose-600 rounded-lg hover:bg-surface-container cursor-pointer shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Projects */}
            {activeFormTab === "projects" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-on-surface text-sm">Key Creative Projects</h3>
                  <button
                    onClick={addProject}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container cursor-pointer"
                  >
                    <Plus size={12} /> Add Project
                  </button>
                </div>

                {resumeData.projects.length === 0 ? (
                  <p className="text-xs text-outline-variant py-6 text-center">No specific projects registered yet. Click Add Project to showcase work.</p>
                ) : (
                  <div className="space-y-4">
                    {resumeData.projects.map((proj, index) => (
                      <div key={proj.id} className="p-4 rounded-DEFAULT border border-surface-container-highest bg-surface-container-low/50 space-y-4 relative">
                        <button
                          onClick={() => removeProject(proj.id)}
                          className="absolute right-3 top-3 text-outline-variant hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>

                        <div className="text-[10px] font-bold text-primary-container uppercase tracking-widest leading-none">
                          Project #{index + 1}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-outline-variant uppercase">Project Name / Product</label>
                            <input 
                              type="text" 
                              value={proj.name} 
                              onChange={(e) => updateProject(proj.id, "name", e.target.value)}
                              placeholder="e.g. Injamus's AI Workspace Dashboard"
                              className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-outline-variant uppercase">Reference URL / Showcase URL</label>
                            <input 
                              type="text" 
                              value={proj.url || ""} 
                              onChange={(e) => updateProject(proj.id, "url", e.target.value)}
                              placeholder="e.g. https://github.io/repo"
                              className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-outline-variant uppercase">Brief Description / Tech stack utilized</label>
                          <textarea 
                            value={proj.description} 
                            onChange={(e) => updateProject(proj.id, "description", e.target.value)}
                            rows={3}
                            placeholder="Detail what challenge you solved and list key technical milestones accomplished..."
                            className="w-full text-[11px] p-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus:outline-none font-sans leading-normal resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* AI Interactive Suggestion Box Panel (Appears when suggestions are fetched) */}
          {(isAiProcessing || aiSuggestions.length > 0) && (
            <div className="bg-gradient-to-br from-teal-900 to-slate-900 rounded-lg p-6 text-white border border-on-surface shadow-xl space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-teal-400 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                    Gemini AI Suggestions
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setAiSuggestions([]);
                    setActiveAiField(null);
                  }}
                  className="p-1 text-outline-variant hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {isAiProcessing ? (
                <div className="py-4 flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 rounded-DEFAULT border-2 border-primary border-t-transparent animate-spin"></div>
                  <p className="text-xs text-outline-variant font-medium">Drafting elite bullet phrases and analyzing ATS structure...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {isAiFallback && (
                    <div className="bg-amber-400/10 rounded-DEFAULT p-3 border border-amber-500/20 text-amber-200 text-[10px] sm:text-[11px] leading-relaxed mb-1 space-y-1">
                      <span className="font-extrabold uppercase block text-amber-400">SIMULATED WRITER ENGINE ACTIVE</span>
                      The Gemini API quota is currently sleeping. The system has gracefully mapped offline executive templates to draft ATS-optimized sections perfectly without disruption!
                      {aiApiError && (
                        <div className="mt-2 pt-1.5 border-t border-amber-500/15 text-left">
                          <p className="text-[9px] font-bold text-amber-400 uppercase tracking-tight">Exact API Error Response:</p>
                          <p className="font-mono text-[8.5px] bg-black/40 p-2 rounded border border-amber-500/10 leading-relaxed text-amber-100 break-words mt-1 select-all">
                            {(() => {
                              const rawError = aiApiError;
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
                  )}

                  <p className="text-[11px] text-outline-variant leading-relaxed font-sans">
                    Click any recommendation below to inject it directly into your active card workspace:
                  </p>
                  
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {aiSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (activeFormTab === "skills") {
                            // Specialized path for skills insert loop
                            const newSkill: ResumeSkill = {
                              id: "sk-" + Math.random().toString(36).substring(2, 9),
                              name: suggestion,
                              level: "Expert"
                            };
                            setResumeData(prev => ({
                              ...prev,
                              skills: [...prev.skills.filter(s => s.name !== ""), newSkill]
                            }));
                          } else {
                            acceptAiSuggestion(suggestion);
                          }
                        }}
                        className="w-full text-left p-3 rounded-DEFAULT bg-slate-800/40 hover:bg-slate-800 border border-on-surface hover:border-primary/50 text-xs font-sans leading-relaxed text-slate-200 transition-all cursor-pointer group flex gap-2.5 items-start"
                      >
                        <ChevronRight className="shrink-0 text-teal-400 group-hover:translate-x-0.5 transition-transform mt-0.5" size={12} />
                        <span>{suggestion}</span>
                      </button>
                    ))}
                  </div>

                  {activeFormTab === "skills" && (
                    <button
                      onClick={() => {
                        // Bulk import all generated skills
                        const newSkills: ResumeSkill[] = aiSuggestions.map(s => ({
                          id: "sk-" + Math.random().toString(36).substring(2, 9),
                          name: s,
                          level: "Advanced"
                        }));
                        setResumeData(prev => ({
                          ...prev,
                          skills: [...prev.skills.filter(s => s.name !== ""), ...newSkills]
                        }));
                        setAiSuggestions([]);
                      }}
                      className="w-full text-center py-2 rounded-DEFAULT bg-primary hover:bg-primary text-white font-bold text-xs cursor-pointer transition-all mt-2"
                    >
                      Import All {aiSuggestions.length} Skills
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right column: Multi-Template Canvas Preview Workspace */}
        <div className={`col-span-1 lg:col-span-6 space-y-6 ${viewMode === "edit" ? "hidden lg:block" : ""}`}>
          
          {/* Controls Bar */}
          <div className="bg-surface-container-lowest rounded-DEFAULT p-4 border border-surface-container-highest shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            <div className="flex flex-wrap items-center gap-1.5 bg-surface-container p-1 rounded-DEFAULT">
              <button
                onClick={() => setTemplateTheme("modern")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  activeTemplate === "modern" 
                    ? "bg-inverse-surface text-white font-semibold" 
                    : "text-outline hover:text-on-surface"
                }`}
              >
                Modern
              </button>
              <button
                onClick={() => setTemplateTheme("executive")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  activeTemplate === "executive" 
                    ? "bg-inverse-surface text-white font-semibold" 
                    : "text-outline hover:text-on-surface"
                }`}
              >
                Executive
              </button>
              <button
                onClick={() => setTemplateTheme("mono")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  activeTemplate === "mono" 
                    ? "bg-inverse-surface text-white font-semibold" 
                    : "text-outline hover:text-on-surface"
                }`}
              >
                Mono
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportHtml}
                className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface bg-surface-container-low hover:bg-surface-container border border-outline-variant px-3 py-2 rounded-DEFAULT transition-all cursor-pointer font-semibold"
                title="Download direct single-file HTML"
              >
                <Download size={14} className="text-outline" /> HTML
              </button>
              
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 text-xs bg-primary hover:bg-primary text-white px-3 py-2 rounded-DEFAULT transition-all font-semibold cursor-pointer shadow-none shadow-primary/20"
                title="Print or export to PDF easily via the browser"
              >
                <Printer size={14} /> Print / Save PDF
              </button>
            </div>

            {/* View switcher on responsive layouts */}
            <div className="lg:hidden w-full flex justify-end">
              <button 
                onClick={() => setViewMode("edit")}
                className="text-xs font-semibold text-outline hover:text-on-surface flex items-center gap-1 bg-surface-container-low px-2.5 py-1 rounded"
              >
                <FileEdit size={14} /> Switch to Form Editor
              </button>
            </div>

          </div>

          {/* Paper Canvas Mockup Containment */}
          <div className="bg-surface-container-high/50 rounded-lg p-1 sm:p-5 border border-outline/30 overflow-x-auto">
            
            {/* Aspect ratio bounding box resembling an A4 sheet of paper */}
            <div 
              id="resume-paper-canvas-node"
              className="w-full min-w-[210mm] max-w-[210mm] min-h-[297mm] bg-surface-container-lowest text-on-surface shadow-none p-8 sm:p-12 mx-auto overflow-hidden relative font-sans text-[11px] leading-relaxed break-words border border-outline/50"
            >
              
              {/* STYLE PATH 1: Modern Layout Theme (Teal branding sidebar + clean structure) */}
              {activeTemplate === "modern" && (
                <div className="space-y-6">
                  
                  {/* Modern Header node */}
                  <div className="flex justify-between items-start border-b-2 border-primary pb-5">
                    <div className="flex gap-4 items-center">
                      {resumeData.showProfileImage && resumeData.profileImage && (
                        <div className="w-16 h-16 rounded-DEFAULT overflow-hidden shrink-0 border border-outline-variant shadow-none">
                          <img 
                            src={resumeData.profileImage} 
                            alt={resumeData.fullName} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="space-y-1 max-w-lg">
                        <h1 className="text-2xl font-extrabold text-on-surface uppercase tracking-tight">{resumeData.fullName || "Your Full Name"}</h1>
                        <p className="text-xs font-bold text-primary-container tracking-wide">{resumeData.title || "Your Professional Title"}</p>
                      </div>
                    </div>

                    <div className="text-right space-y-1 text-outline-variant text-[10px] font-medium font-sans">
                      {resumeData.location && (
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{resumeData.location}</span>
                          <MapPin size={10} className="text-outline-variant" />
                        </div>
                      )}
                      {resumeData.email && (
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{resumeData.email}</span>
                          <Mail size={10} className="text-outline-variant" />
                        </div>
                      )}
                      {resumeData.phone && (
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{resumeData.phone}</span>
                          <Phone size={10} className="text-outline-variant" />
                        </div>
                      )}
                      {resumeData.website && (
                        <div className="flex items-center justify-end gap-1.5">
                          <a href={resumeData.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{resumeData.website}</a>
                          <Globe size={10} className="text-outline-variant" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Segment */}
                  {resumeData.summary && (
                    <div className="space-y-1.5">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-on-primary-fixed bg-primary-fixed px-2 py-0.5 rounded inline-block">
                        Professional Profile
                      </h3>
                      <p className="text-on-surface-variant text-justify text-[11px] leading-relaxed font-sans mt-1">
                        {resumeData.summary}
                      </p>
                    </div>
                  )}

                  {/* Experience Segment */}
                  {resumeData.workExperience.length > 0 && (
                    <div className="space-y-3 pt-1">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-on-primary-fixed bg-primary-fixed px-2 py-0.5 rounded inline-block">
                        Professional Experience
                      </h3>

                      <div className="space-y-4 mt-2">
                        {resumeData.workExperience.map((exp) => (
                          <div key={exp.id} className="space-y-1">
                            <div className="flex justify-between items-baseline font-bold text-on-surface">
                              <span className="text-[12px]">{exp.position || "Target Position"}</span>
                              <span className="text-[10px] text-outline-variant font-medium">{exp.startDate} – {exp.endDate || "Present"}</span>
                            </div>
                            
                            <div className="flex justify-between items-baseline text-[10px] font-semibold text-primary-container">
                              <span>{exp.company}</span>
                              <span className="text-outline-variant font-normal">{exp.location}</span>
                            </div>

                            <ul className="list-disc pl-4 space-y-1 text-on-surface-variant text-[11px] leading-relaxed mt-1.5">
                              {exp.highlights.filter(h => h.trim() !== "").map((h, idx) => (
                                <li key={idx} className="pl-0.5 text-justify">{h}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills Grid */}
                  {resumeData.skills.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-on-primary-fixed bg-primary-fixed px-2 py-0.5 rounded inline-block">
                        Core Competencies & Skills
                      </h3>
                      
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {resumeData.skills.filter(s => s.name.trim() !== "").map((skill) => (
                          <span 
                            key={skill.id}
                            className="bg-surface-container/80 border border-outline-variant/50 text-on-surface-variant px-2.5 py-1 rounded text-[10px] font-semibold tracking-wide"
                          >
                            {skill.name} <span className="text-primary text-[9px] font-bold">({skill.level || "Intermediate"})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Two Column Section underneath */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                    
                    {/* Education block */}
                    {resumeData.education.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-on-primary-fixed bg-primary-fixed px-2 py-0.5 rounded inline-block">
                          Education & Academics
                        </h3>

                        <div className="space-y-3 mt-1.5">
                          {resumeData.education.map((edu) => (
                            <div key={edu.id} className="space-y-0.5">
                              <p className="font-bold text-[11px] text-on-surface leading-tight">
                                {edu.degree} in {edu.fieldOfStudy}
                              </p>
                              <p className="text-[10px] font-semibold text-primary-container">{edu.institution}</p>
                              <div className="flex justify-between text-[10px] text-outline-variant font-medium">
                                <span>{edu.startDate} – {edu.endDate}</span>
                                {edu.gpa && <span>GPA: {edu.gpa}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects block */}
                    {resumeData.projects.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-on-primary-fixed bg-primary-fixed px-2 py-0.5 rounded inline-block">
                          Creative Works & Projects
                        </h3>

                        <div className="space-y-3 mt-1.5">
                          {resumeData.projects.map((proj) => (
                            <div key={proj.id} className="space-y-0.5">
                              <div className="flex justify-between items-baseline font-bold text-on-surface">
                                <span className="text-[11px]">{proj.name}</span>
                                {proj.url && (
                                  <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-[9px] font-normal shrink-0">
                                    [Showcase link]
                                  </a>
                                )}
                              </div>
                              <p className="text-[10px] text-outline leading-relaxed text-justify">{proj.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              )}

              {/* STYLE PATH 2: Classic Executive Theme (Traditional serif elegance, center format) */}
              {activeTemplate === "executive" && (
                <div className="font-serif space-y-6">
                  
                  {/* Centered header */}
                  <div className="text-center space-y-2 border-b border-double border-outline pb-5">
                    {resumeData.showProfileImage && resumeData.profileImage && (
                      <div className="mx-auto w-20 h-20 rounded-DEFAULT overflow-hidden border border-outline shadow-none mb-3">
                        <img 
                          src={resumeData.profileImage} 
                          alt={resumeData.fullName} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <h1 className="text-3xl font-medium tracking-tight text-on-surface font-serif">
                      {resumeData.fullName || "Your Full Name"}
                    </h1>
                    
                    <p className="text-xs italic font-medium text-outline uppercase tracking-widest leading-none">
                      {resumeData.title || "Your Professional Title"}
                    </p>

                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-outline font-sans text-[10px] font-medium pt-1">
                      {resumeData.location && <span>{resumeData.location}</span>}
                      {resumeData.email && <span>• {resumeData.email}</span>}
                      {resumeData.phone && <span>• {resumeData.phone}</span>}
                      {resumeData.website && (
                        <span>• <a href={resumeData.website} className="underline">{resumeData.website}</a></span>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {resumeData.summary && (
                    <div className="space-y-1.5 text-center px-4">
                      <p className="text-on-surface-variant text-[11px] leading-relaxed italic text-justify">
                        {resumeData.summary}
                      </p>
                    </div>
                  )}

                  {/* Experience */}
                  {resumeData.workExperience.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface border-b border-outline pb-0.5 text-center font-sans">
                        Professional Experience
                      </h3>

                      <div className="space-y-4">
                        {resumeData.workExperience.map((exp) => (
                          <div key={exp.id} className="space-y-1">
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-[12px] text-on-surface">{exp.company}</span>
                              <span className="font-sans text-[10px] text-outline-variant font-medium">{exp.startDate} – {exp.endDate}</span>
                            </div>

                            <div className="flex justify-between items-baseline text-[10px] italic text-on-surface-variant">
                              <span>{exp.position}</span>
                              <span className="text-outline-variant not-italic font-sans">{exp.location}</span>
                            </div>

                            <ul className="list-disc pl-5 space-y-1 text-on-surface-variant text-[11px] mt-1.5 font-sans leading-relaxed">
                              {exp.highlights.filter(h => h.trim() !== "").map((h, idx) => (
                                <li key={idx} className="text-justify">{h}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills Section */}
                  {resumeData.skills.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface border-b border-outline pb-0.5 text-center font-sans">
                        Technical Skillsets
                      </h3>
                      <p className="text-[10px] font-sans text-center text-on-surface-variant leading-relaxed">
                        {resumeData.skills.filter(s => s.name.trim() !== "").map((s, idx, arr) => (
                          <span key={s.id}>
                            <strong className="text-on-surface">{s.name}</strong> ({s.level || "Expert"})
                            {idx < arr.length - 1 ? " • " : ""}
                          </span>
                        ))}
                      </p>
                    </div>
                  )}

                  {/* Education */}
                  {resumeData.education.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface border-b border-outline pb-0.5 text-center font-sans">
                        Education & Academic Honors
                      </h3>

                      <div className="space-y-3 mt-1.5">
                        {resumeData.education.map((edu) => (
                          <div key={edu.id} className="flex justify-between items-start font-sans text-[10px]">
                            <div className="space-y-0.5">
                              <p className="font-serif font-bold text-[12px] text-on-surface">{edu.institution}</p>
                              <p className="italic text-outline">{edu.degree} in {edu.fieldOfStudy} ({edu.location})</p>
                            </div>
                            <div className="text-right font-medium text-outline-variant">
                              <p>{edu.startDate} – {edu.endDate}</p>
                              {edu.gpa && <p className="text-on-surface-variant font-semibold">GPA: {edu.gpa}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* STYLE PATH 3: Minimalist Monospace Theme (Brutalist tech-forward, mono font spacing) */}
              {activeTemplate === "mono" && (
                <div className="font-mono space-y-6 text-on-surface">
                  
                  {/* Monospace Header bar */}
                  <div className="border border-on-surface p-6 space-y-3 bg-surface-container-low">
                    <div className="flex gap-4 items-center">
                      {resumeData.showProfileImage && resumeData.profileImage && (
                        <div className="w-16 h-16 rounded-none overflow-hidden shrink-0 border-2 border-slate-850 shadow-none">
                          <img 
                            src={resumeData.profileImage} 
                            alt={resumeData.fullName} 
                            className="w-full h-full object-cover grayscale" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div>
                            <h1 className="text-xl font-bold uppercase text-on-surface">{resumeData.fullName || "NASA_CANDIDATE"}</h1>
                            <p className="text-xs font-bold text-primary-container mt-0.5">&gt; {resumeData.title || "SYSTEMS_SPECIALIST"}</p>
                          </div>
                          
                          <div className="text-left md:text-right text-[10px] text-outline font-medium space-y-0.5">
                            {resumeData.email && <p>mail:{resumeData.email}</p>}
                            {resumeData.phone && <p>ph:{resumeData.phone}</p>}
                            {resumeData.location && <p>loc:{resumeData.location}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile section */}
                  {resumeData.summary && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container"># PROFILE_SUMMARY</p>
                      <p className="text-[11px] leading-relaxed text-on-surface-variant text-justify border-l-2 border-on-surface pl-3">
                        {resumeData.summary}
                      </p>
                    </div>
                  )}

                  {/* Experience */}
                  {resumeData.workExperience.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container"># WORK_RECORD_INDEX</p>
                      
                      <div className="space-y-4">
                        {resumeData.workExperience.map((exp) => (
                          <div key={exp.id} className="space-y-1 pl-3 border-l border-outline-variant">
                            <div className="flex justify-between items-baseline font-bold text-on-surface text-[11px]">
                              <span>[{exp.company.toUpperCase()}]</span>
                              <span className="text-[9px] text-outline-variant font-normal">{exp.startDate} / {exp.endDate}</span>
                            </div>
                            <p className="text-[10px] text-outline font-semibold">{exp.position} - {exp.location}</p>
                            
                            <ul className="space-y-1 text-on-surface-variant text-[10px] leading-relaxed mt-1.5 list-none">
                              {exp.highlights.filter(h => h.trim() !== "").map((h, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-primary font-bold shrink-0">*</span>
                                  <span className="text-justify">{h}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {resumeData.skills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container"># COMPETENCY_SET</p>
                      <div className="flex flex-wrap gap-2 pl-3">
                        {resumeData.skills.filter(s => s.name.trim() !== "").map((s) => (
                          <span key={s.id} className="text-[10px] bg-surface-container px-2 py-0.5 border border-outline-variant rounded text-on-surface-variant">
                            {s.name}::{s.level?.toUpperCase().substring(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education & Projects block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {resumeData.education.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container"># EDUCATION_CREDENTIALS</p>
                        {resumeData.education.map((edu) => (
                          <div key={edu.id} className="space-y-0.5 pl-3 border-l border-surface-container-highest text-[10px] text-outline">
                            <p className="font-bold text-on-surface">{edu.institution}</p>
                            <p>{edu.degree} / {edu.fieldOfStudy}</p>
                            <p className="text-[9px]">{edu.startDate} - {edu.endDate} {edu.gpa && `| GPA:${edu.gpa}`}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {resumeData.projects.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container"># PROJECTS_INDEX</p>
                        {resumeData.projects.map((p) => (
                          <div key={p.id} className="space-y-0.5 pl-3 border-l border-surface-container-highest text-[10px] text-outline">
                            <p className="font-bold text-on-surface">{p.name}</p>
                            <p className="leading-normal text-justify">{p.description}</p>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>

                </div>
              )}

              {/* PDF Sheet watermark overlay */}
              <div className="absolute right-4 bottom-4 text-[8px] font-mono text-outline-variant tracking-wider font-semibold uppercase pointer-events-none pr-1">
                Generated via Injamus's AI Workspace
              </div>

            </div>
          </div>

          {/* Quick PDF Print checklist tips */}
          <div className="bg-surface-container-lowest rounded-DEFAULT p-5 border border-surface-container-highest shadow-none space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-primary" />
              Optimal PDF Print Configuration
            </h4>
            
            <p className="text-[11px] text-outline leading-relaxed font-sans">
              To download a flawless single-page or formatted multi-page PDF output directly via browser print:
            </p>
            
            <ul className="list-decimal pl-4.5 space-y-1 text-[10px] text-outline-variant font-mono">
              <li>Click <strong className="text-on-surface-variant">Print / Save PDF</strong> in the above control header.</li>
              <li>Set Destination to <strong className="text-on-surface-variant">Save as PDF</strong>.</li>
              <li>Configure Paper Size to <strong className="text-on-surface-variant">A4 standard</strong>.</li>
              <li>Disable <strong className="text-on-surface-variant">Headers and footers</strong> in the More options dropdown to eliminate page URL logs.</li>
              <li>Set Margins to <strong className="text-on-surface-variant">None</strong> or <strong className="text-on-surface-variant">Default</strong> for premium bleed-to-edge layouts.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );

  // Simple override to support custom theme state transitions easily
  function setTemplateTheme(theme: ActiveTemplate) {
    setActiveTemplate(theme);
  }
}
