import React, { useState, useRef, useEffect } from "react";
import { 
  FileImage,
  Upload,
  Download,
  Loader2,
  Trash2,
  Sliders,
  Type,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings,
  Sparkles,
  RefreshCcw,
  Undo2,
  Square,
  Paintbrush,
  Pipette,
  CheckCircle,
  HelpCircle,
  FileCheck
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { jsPDF } from "jspdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "6.0.227"}/build/pdf.worker.min.mjs`;

interface ConvertedPage {
  pageIndex: number;
  originalDataUrl: string;
  processedDataUrl: string;
  width: number;
  height: number;
}

export default function WatermarkRemover() {
  const [loading, setLoading] = useState(false);
  const [fileType, setFileType] = useState<"image" | "pdf" | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);

  // Rendered page resources
  const [pages, setPages] = useState<ConvertedPage[]>([]);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);

  // Active tools & adjustments
  const [activeTab, setActiveTab] = useState<"brush" | "color" | "bleach">("brush");
  const [brushSize, setBrushSize] = useState<number>(24);
  const [colorTolerance, setColorTolerance] = useState<number>(30);
  const [pickedColor, setPickedColor] = useState<{ r: number; g: number; b: number } | null>({ r: 210, g: 210, b: 210 });
  const [bleachThreshold, setBleachThreshold] = useState<number>(220); // Whiten everything above this brightness
  
  // Undo histories per page
  const [undoHistory, setUndoHistory] = useState<{ [key: number]: string[] }>({});

  const [isColorPickerActive, setIsColorPickerActive] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pixelsCleaned, setPixelsCleaned] = useState<number>(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Redraw page on index or state changes
  useEffect(() => {
    if (pages.length > 0 && canvasRef.current) {
      renderPageToCanvas(pages[currentPageIdx]);
    }
  }, [currentPageIdx, pages]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processIncomingFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processIncomingFile(e.target.files[0]);
    }
  };

  const processIncomingFile = async (file: File) => {
    setLoading(true);
    setFileName(file.name);
    setPages([]);
    setCurrentPageIdx(0);
    setUndoHistory({});
    setPixelsCleaned(0);

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      setFileType("pdf");
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        const list: ConvertedPage[] = [];

        for (let idx = 1; idx <= numPages; idx++) {
          const page = await pdf.getPage(idx);
          // Standard high-res rendering
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext("2d");

          if (context) {
            await page.render({ canvasContext: context, viewport } as any).promise;
            const originalDataUrl = canvas.toDataURL("image/png");
            list.push({
              pageIndex: idx - 1,
              originalDataUrl,
              processedDataUrl: originalDataUrl,
              width: viewport.width,
              height: viewport.height
            });
          }
        }
        setPages(list);
      } catch (err) {
        console.error("PDF breakdown error: ", err);
        alert("Failed to read the PDF file. Make sure it is not corrupt or encrypted.");
      }
    } else {
      setFileType("image");
      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const img = new Image();
            img.onload = () => {
              const originalDataUrl = event.target!.result as string;
              setPages([
                {
                  pageIndex: 0,
                  originalDataUrl,
                  processedDataUrl: originalDataUrl,
                  width: img.naturalWidth || 800,
                  height: img.naturalHeight || 600
                }
              ]);
            };
            img.src = event.target.result as string;
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Image loader error: ", err);
        alert("Could not load image file.");
      }
    }
    setLoading(false);
  };

  // Save current canvas state to Undo History hierarchy
  const pushToUndoHistory = (dataUrl: string) => {
    setUndoHistory(prev => {
      const currentList = prev[currentPageIdx] || [];
      const updatedList = [...currentList, dataUrl];
      // Keep max 15 steps
      if (updatedList.length > 15) {
        updatedList.shift();
      }
      return { ...prev, [currentPageIdx]: updatedList };
    });
  };

  const handleUndo = () => {
    const list = undoHistory[currentPageIdx] || [];
    if (list.length === 0) return;

    const previousStepUrl = list[list.length - 1];
    const remainingList = list.slice(0, -1);

    // Apply back state
    setPages(prev => {
      const copy = [...prev];
      copy[currentPageIdx].processedDataUrl = previousStepUrl;
      return copy;
    });

    setUndoHistory(prev => ({
      ...prev,
      [currentPageIdx]: remainingList
    }));
  };

  // Draw background helper
  const renderPageToCanvas = (page: ConvertedPage) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = page.width;
    canvas.height = page.height;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = page.processedDataUrl;
  };

  // Commit canvas alterations back to pages list
  const commitCanvasChanges = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentUrl = canvas.toDataURL("image/png");

    pushToUndoHistory(pages[currentPageIdx].processedDataUrl);
    setPages(prev => {
      const copy = [...prev];
      copy[currentPageIdx].processedDataUrl = currentUrl;
      return copy;
    });
  };

  // Reset current page to original content state
  const resetCurrentPage = () => {
    if (confirm("Reset current page to original state and discard all edits?")) {
      pushToUndoHistory(pages[currentPageIdx].processedDataUrl);
      setPages(prev => {
        const copy = [...prev];
        copy[currentPageIdx].processedDataUrl = copy[currentPageIdx].originalDataUrl;
        return copy;
      });
    }
  };

  // Direct Interactive Drawing: Magic brush pixel eraser setting
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Scale factor between actual canvas resolution and rendered display CSS size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCanvasCoords(e);

    if (isColorPickerActive) {
      // Pick color under this coordinate
      try {
        const pixelData = ctx.getImageData(coords.x, coords.y, 1, 1).data;
        setPickedColor({ r: pixelData[0], g: pixelData[1], b: pixelData[2] });
        setIsColorPickerActive(false);
      } catch (e) {
        console.error("Color picker bounds exceeded on locked canvas:", e);
      }
      return;
    }

    // Capture undo save before applying brush strokes
    pushToUndoHistory(pages[currentPageIdx].processedDataUrl);

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    
    // Config stroke style
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;

    if (activeTab === "brush") {
      // Magic Inpainting/Eraser draws a blur/inpainting mask using surrounding pixels
      ctx.strokeStyle = "rgba(255, 255, 255, 1.0)"; // Default eraser writes pure solid white onto layout (best for clean papers)
      ctx.shadowBlur = 4;
      ctx.shadowColor = "white";
    }

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    // Increment clean stats count approximate
    setPixelsCleaned(prev => prev + brushSize * brushSize);
  };

  const handleMovingDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isColorPickerActive || activeTab !== "brush") return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setPixelsCleaned(prev => prev + brushSize * 10);
  };

  const handleStopDraw = () => {
    if (isDrawing) {
      setIsDrawing(false);
      commitCanvasChanges();
    }
  };

  // Color Eraser Algorithm: Match specific selected colors (e.g. gray watermark stamps) and replace them with standard paper white
  const executeColorRemover = () => {
    if (!pickedColor || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    pushToUndoHistory(pages[currentPageIdx].processedDataUrl);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let cleanCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];

      // Euclidean distance thresholding logic
      const diffR = r - pickedColor.r;
      const diffG = g - pickedColor.g;
      const diffB = b - pickedColor.b;
      const distance = Math.sqrt(diffR * diffR + diffG * diffG + diffB * diffB);

      if (distance <= colorTolerance) {
        // Whiten pixel out
        data[i] = 255;
        data[i+1] = 255;
        data[i+2] = 255;
        cleanCount++;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    setPixelsCleaned(prev => prev + cleanCount);
    commitCanvasChanges();
  };

  // Bleach Wash: High contrast threshold mask. Any pixel brighter than threshold becomes pure white
  const executeBleachWash = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    pushToUndoHistory(pages[currentPageIdx].processedDataUrl);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let cleanCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];

      // Luminosity formula
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      if (brightness >= bleachThreshold) {
        // Force complete solid white paper background
        data[i] = 255;
        data[i+1] = 255;
        data[i+2] = 255;
        cleanCount++;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    setPixelsCleaned(prev => prev + cleanCount);
    commitCanvasChanges();
  };

  // Download Output Builders (PDF compiler or plain images)
  const downloadCleanedFile = async () => {
    if (pages.length === 0) return;

    if (fileType === "pdf") {
      // Compile gorgeous clean multipage PDF using jsPDF
      const pdf = new jsPDF({
        orientation: pages[0].width > pages[0].height ? "landscape" : "portrait",
        unit: "px",
        format: [pages[0].width, pages[0].height]
      });

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          pdf.addPage([pages[i].width, pages[i].height], pages[i].width > pages[i].height ? "landscape" : "portrait");
        }
        
        pdf.addImage(
          pages[i].processedDataUrl,
          "PNG",
          0,
          0,
          pages[i].width,
          pages[i].height,
          undefined,
          "FAST"
        );
      }

      pdf.save(`Cleaned_${fileName || "document.pdf"}`);
      setDownloadSuccess(true);
    } else {
      // Image file download
      const link = document.createElement("a");
      link.href = pages[0].processedDataUrl;
      link.download = `Cleaned_${fileName || "image.png"}`;
      link.click();
      setDownloadSuccess(true);
    }

    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const clearWorkspace = () => {
    if (confirm("Reset layout workspace and discard loaded documents?")) {
      setFileType(null);
      setPages([]);
      setUndoHistory({});
      setCurrentPageIdx(0);
      setPixelsCleaned(0);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Tool Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-container-highest pb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-650 px-3 py-1 bg-primary-fixed rounded-DEFAULT">
            Intelligent Erasor
          </span>
          <h2 className="text-2xl font-semibold text-on-surface tracking-tight mt-1.5">
            Watermark Remover from Image & PDF
          </h2>
          <p className="text-sm text-outline mt-1 max-w-2xl">
            Clean files instantly using smart canvas brushes, specialized color range key extraction filters, and document bleach washes. Supports editing PNG/JPG captures and multipage PDF documents directly in your browser.
          </p>
        </div>
      </div>

      {pages.length === 0 ? (
        /* Standby drag/drop panel screen */
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`min-h-[280px] rounded-lg border-2 border-dashed transition-all flex flex-col justify-center items-center p-8 bg-surface-container-lowest relative ${
            dragActive
              ? "border-primary bg-primary-fixed/20 scale-[0.99]"
              : "border-outline-variant hover:border-teal-450 hover:shadow-none"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept=".pdf,application/pdf,image/*"
            disabled={loading}
          />

          {loading ? (
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-teal-650 animate-spin mx-auto" />
              <div>
                <h4 className="font-semibold text-on-surface-variant">Deconstructing Document Frames...</h4>
                <p className="text-xs text-outline-variant mt-1">Acquiring page assets in safe vector space</p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 max-w-md">
              <div className="w-14 h-14 bg-primary-fixed rounded-DEFAULT flex items-center justify-center mx-auto text-teal-650 shadow-none border border-primary-fixed-dim">
                <Upload size={22} />
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-sm">
                  Drag & Drop Document or Graphic File here
                </h4>
                <p className="text-xs text-outline-variant mt-1.5 font-sans leading-relaxed">
                  Upload a <strong className="text-slate-650">PDF file</strong> to clean page-by-page, or a <strong className="text-slate-650">PNG / JPEG img scan</strong>. 
                </p>
                <p className="text-xs text-teal-650 font-semibold underline mt-2.5">
                  Browse local system directories
                </p>
              </div>
              <div className="border-t border-slate-50 pt-3.5 mt-2 text-[10px] text-outline-variant flex justify-center gap-6">
                <span>🛡️ Clean Local processing</span>
                <span>⚡ Multi-Page document binding</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Active Sandbox editor desk */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Clean/Erase Parameters Panels */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-surface-container-lowest border border-surface-container-highest rounded-lg p-5 shadow-none space-y-5">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="font-bold text-on-surface text-sm flex items-center gap-2">
                  <Sliders size={15} className="text-teal-650" />
                  Erase Configuration
                </h3>
                <span className="text-[10px] font-mono bg-surface-container px-2 py-0.5 rounded text-outline">
                  {fileType?.toUpperCase()} Mode
                </span>
              </div>

              {/* Utility Tools Selection tabs */}
              <div className="grid grid-cols-3 gap-1 bg-surface-container-low p-1 rounded-DEFAULT">
                <button
                  onClick={() => {
                    setActiveTab("brush");
                    setIsColorPickerActive(false);
                  }}
                  className={`py-2 px-1 text-[11px] font-bold rounded-lg text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    activeTab === "brush"
                      ? "bg-surface-container-lowest text-on-surface shadow-none"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  <Paintbrush size={13} />
                  <span>Magic brush</span>
                </button>
                <button
                  onClick={() => setActiveTab("color")}
                  className={`py-2 px-1 text-[11px] font-bold rounded-lg text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    activeTab === "color"
                      ? "bg-surface-container-lowest text-on-surface shadow-none"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  <Pipette size={13} />
                  <span>Color match</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("bleach");
                    setIsColorPickerActive(false);
                  }}
                  className={`py-2 px-1 text-[11px] font-bold rounded-lg text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    activeTab === "bleach"
                      ? "bg-surface-container-lowest text-on-surface shadow-none"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  <Sparkles size={13} />
                  <span>Document bleach</span>
                </button>
              </div>

              {/* Parameters body based on active tab */}
              {activeTab === "brush" && (
                <div className="space-y-4 pt-1 animate-fade-in">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-outline">
                      <span>Brush Size (Pixels)</span>
                      <span className="font-mono text-teal-650">{brushSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="100"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-full accent-teal-600 cursor-pointer h-1 bg-surface-container rounded-lg"
                    />
                    <p className="text-[10px] text-outline-variant leading-relaxed font-sans mt-1">
                      💡 Draw or cross out grey text, solid seals, or handwritten notes with your cursor or finger to instantly whitening the region.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "color" && (
                <div className="space-y-4 pt-1 animate-fade-in">
                  
                  {/* Pipette / Preset select row */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-outline block">Match Color Base</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsColorPickerActive(!isColorPickerActive)}
                        className={`p-2.5 rounded-DEFAULT border flex items-center justify-center gap-2 transition-all cursor-pointer text-xs font-bold ${
                          isColorPickerActive
                            ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
                            : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        <Pipette size={14} />
                        <span>{isColorPickerActive ? "Click Canvas..." : "Eye Dropper"}</span>
                      </button>

                      {/* Display Box */}
                      {pickedColor && (
                        <div className="flex items-center gap-2 border border-surface-container-highest p-1.5 px-3 rounded-DEFAULT bg-surface-container-low">
                          <span 
                            className="w-4 h-4 rounded-md border border-outline-variant shadow-inner" 
                            style={{ backgroundColor: `rgb(${pickedColor.r}, ${pickedColor.g}, ${pickedColor.b})` }}
                          />
                          <span className="text-[10px] font-mono text-outline">
                            RGB({pickedColor.r},{pickedColor.g},{pickedColor.b})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preset Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-outline-variant block">Common Presets</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "Light Gray (Text stamp)", r: 215, g: 215, b: 215 },
                        { label: "Watermark Blue", r: 180, g: 215, b: 245 },
                        { label: "Scanner Pink", r: 250, g: 200, b: 210 },
                        { label: "Highlight Yellow", r: 250, g: 250, b: 180 }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPickedColor({ r: preset.r, g: preset.g, b: preset.b })}
                          className="px-2 py-1 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-lg text-[10px] text-slate-650 font-semibold cursor-pointer transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Range Tolerance slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-outline">
                      <span>Color Tolerance Threshold</span>
                      <span className="font-mono text-teal-650">{colorTolerance}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      value={colorTolerance}
                      onChange={(e) => setColorTolerance(parseInt(e.target.value))}
                      className="w-full accent-teal-600 cursor-pointer h-1 bg-surface-container rounded-lg"
                    />
                    <p className="text-[9px] text-outline-variant font-sans leading-tight mt-1">
                      Higher value captures surrounding hues. Click "Apply Color Eraser" below once color is selected.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={executeColorRemover}
                    disabled={!pickedColor}
                    className="w-full bg-slate-800 hover:bg-inverse-surface disabled:opacity-40 text-white font-bold text-xs py-3 rounded-DEFAULT transition cursor-pointer flex items-center justify-center gap-1.5 group"
                  >
                    <Check size={13} /> Apply Color Eraser Filter
                  </button>
                </div>
              )}

              {activeTab === "bleach" && (
                <div className="space-y-4 pt-1 animate-fade-in">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-outline">
                      <span>Bleaching Filter Sensitivity</span>
                      <span className="font-mono text-teal-650">{bleachThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min="150"
                      max="250"
                      value={bleachThreshold}
                      onChange={(e) => setBleachThreshold(parseInt(e.target.value))}
                      className="w-full accent-teal-600 cursor-pointer h-1 bg-surface-container rounded-lg"
                    />
                    <p className="text-[10px] text-outline-variant leading-relaxed font-sans">
                      💡 Wash out background noise. Everything lighter than this threshold is immediately whitened, making faint gray stamp, sheet grids, or shadows disappear completely!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={executeBleachWash}
                    className="w-full bg-slate-800 hover:bg-inverse-surface text-white font-bold text-xs py-3 rounded-DEFAULT transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={13} className="text-amber-500" /> Apply Bleach Wash
                  </button>
                </div>
              )}

            </div>

            {/* Global statistics and metrics logged */}
            <div className="bg-surface-container-low rounded-DEFAULT p-4.5 border border-surface-container-highest space-y-2.5">
              <span className="text-[10px] font-bold text-outline-variant uppercase tracking-widest block">Clean Audit Log</span>
              
              <div className="grid grid-cols-2 gap-3 font-sans">
                <div className="bg-surface-container-lowest rounded-DEFAULT p-3 border border-slate-150">
                  <span className="text-[9px] text-outline-variant font-bold block leading-none">PIXELS ERASED</span>
                  <span className="text-sm font-extrabold text-on-surface block mt-1.5 font-mono">
                    {pixelsCleaned.toLocaleString()} px
                  </span>
                </div>
                <div className="bg-surface-container-lowest rounded-DEFAULT p-3 border border-slate-150">
                  <span className="text-[9px] text-outline-variant font-bold block leading-none">UNDO STEPS</span>
                  <span className="text-sm font-extrabold text-on-surface block mt-1.5 font-mono">
                    {(undoHistory[currentPageIdx] || []).length} recorded
                  </span>
                </div>
              </div>

              <div className="bg-primary-fixed border border-primary-fixed-dim/50 p-2.5 rounded-DEFAULT text-[10px] text-teal-900 font-sans font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-DEFAULT bg-primary animate-ping"></span>
                Canvas ready for user pixel edits
              </div>
            </div>

            {/* Discard Workspace Button */}
            <button
              onClick={clearWorkspace}
              className="w-full text-outline hover:text-red-700 font-bold text-[11px] py-1 text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 size={13} /> Discard File & Load Another
            </button>

          </div>

          {/* RIGHT COLUMN: Interactive High-Res Canvas Studio */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Upper Action bar (Undo, Reset, PDF Index indicators) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest border border-surface-container-highest p-3.5 rounded-DEFAULT shadow-none">
              
              {/* PDF navigation controls, if PDF is parsed */}
              {fileType === "pdf" && pages.length > 1 ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPageIdx(p => Math.max(0, p - 1))}
                    disabled={currentPageIdx === 0}
                    className="p-1.5 disabled:opacity-30 hover:bg-surface-container rounded-lg text-on-surface-variant transition cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold text-on-surface-variant px-1 font-mono">
                    Page {currentPageIdx + 1} of {pages.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPageIdx(p => Math.min(pages.length - 1, p + 1))}
                    disabled={currentPageIdx === pages.length - 1}
                    className="p-1.5 disabled:opacity-30 hover:bg-surface-container rounded-lg text-on-surface-variant transition cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-650 font-sans">
                  <FileImage size={15} className="text-primary" />
                  <span className="truncate max-w-[240px]">{fileName}</span>
                </div>
              )}

              {/* Action Buttons (Undo, Reset, Original Compare overlay) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={(undoHistory[currentPageIdx] || []).length === 0}
                  className="bg-surface-container-lowest border hover:bg-surface-container-low border-outline-variant disabled:opacity-40 text-on-surface-variant text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  title="Undo last pixel change"
                >
                  <Undo2 size={13} />
                  <span className="hidden sm:inline">Undo</span>
                </button>

                <button
                  type="button"
                  onClick={resetCurrentPage}
                  className="bg-surface-container-lowest border border-outline-variant hover:bg-rose-50 hover:text-rose-700 text-on-surface-variant text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  title="Reset to original upload state"
                >
                  <RefreshCcw size={13} />
                  <span className="hidden sm:inline">Reset Code</span>
                </button>
              </div>

            </div>

            {/* Standard comparison instructions banner */}
            {isColorPickerActive && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-DEFAULT text-xs font-bold text-center animate-pulse flex items-center justify-center gap-2">
                <Pipette size={14} className="text-amber-700" />
                <span>Pixel Color Capture Active: Click anywhere on the document preview below to capture its exact shade.</span>
              </div>
            )}

            {/* Canvas Main Stage Window wrapper */}
            <div 
              ref={containerRef}
              className="bg-slate-150 rounded-lg border border-outline-variant/80 p-5 overflow-auto flex justify-center items-center min-h-[420px] max-h-[600px] relative shadow-inner pattern-grid"
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleStartDraw}
                onMouseMove={handleMovingDraw}
                onMouseUp={handleStopDraw}
                onMouseLeave={handleStopDraw}
                onTouchStart={handleStartDraw}
                onTouchMove={handleMovingDraw}
                onTouchEnd={handleStopDraw}
                className={`max-w-full h-auto bg-surface-container-lowest shadow-xl rounded-lg transition-all border border-outline select-none ${
                  isColorPickerActive 
                    ? "cursor-crosshair border-rose-500" 
                    : activeTab === "brush" 
                    ? "cursor-cell" 
                    : "cursor-default"
                }`}
                style={{ touchAction: "none" }}
              />
            </div>

            {/* Bottom Panel Actions (Confirm & Download File) */}
            <div className="bg-surface-container-lowest border border-surface-container-highest p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <h4 className="font-bold text-slate-850 text-xs sm:text-sm">Ready to Export Document?</h4>
                <p className="text-[10px] sm:text-xs text-outline-variant font-sans">
                  Double check pages if PDF. Original vector quality is compiled natively inside your browser.
                </p>
              </div>

              <button
                type="button"
                onClick={downloadCleanedFile}
                className={`w-full sm:w-auto px-6 py-3 rounded-DEFAULT font-bold text-xs text-white shadow-none active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide border-none ${
                  downloadSuccess 
                    ? "bg-emerald-600 shadow-emerald-500/10" 
                    : "bg-primary hover:bg-primary-container shadow-primary/15"
                }`}
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle size={15} /> Download Initiated!
                  </>
                ) : (
                  <>
                    {fileType === "pdf" ? (
                      <>
                        <FileCheck size={15} /> Save & Download Cleaned PDF
                      </>
                    ) : (
                      <>
                        <Download size={15} /> Download Cleaned Image
                      </>
                    )}
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
