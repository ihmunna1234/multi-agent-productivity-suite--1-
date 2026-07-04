import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Loader2,
  Sparkles,
  Layers,
  Download,
  Trash2,
  ArrowLeft,
  ArrowRight,
  RotateCw
} from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

interface PageThumbnail {
  originalIndex: number; // 0-based
  dataUrl: string;
  rotation: number; // 0, 90, 180, 270
}

export default function OrganizePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [pages, setPages] = useState<PageThumbnail[]>([]);
  const [currentProgress, setCurrentProgress] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const loadPdf = async (selectedFile: File) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentProgress("Reading file...");

      const arrayBuffer = await selectedFile.arrayBuffer();
      // Store a clone in state so it doesn't get detached by pdfjs
      setFileBytes(new Uint8Array(arrayBuffer.slice(0)));
      setFile(selectedFile);

      // Read PDF using pdf.js for rendering thumbnails using another clone
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      const numPages = pdf.numPages;
      const extractedPages: PageThumbnail[] = [];

      for (let i = 1; i <= numPages; i++) {
        setCurrentProgress(`Rendering page ${i} of ${numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 }); // smaller scale for thumbnails

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        } as any).promise;

        extractedPages.push({
          originalIndex: i - 1, // 0-based for pdf-lib later
          dataUrl: canvas.toDataURL("image/jpeg", 0.5),
          rotation: 0
        });
      }

      setPages(extractedPages);
      setCurrentProgress("");
    } catch (err: any) {
      console.error(err);
      setError("Failed to load PDF. It might be corrupted or password-protected.");
      setFile(null);
      setFileBytes(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are supported.");
        return;
      }
      loadPdf(selectedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are supported.");
        return;
      }
      loadPdf(selectedFile);
    }
  };

  const resetAll = () => {
    setFile(null);
    setFileBytes(null);
    setPages([]);
    setResultUrl(null);
    setResultName("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Page Operations
  const handleDragStartItem = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Slight delay so the drag image is created before we set opacity
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEndItem = (e: React.DragEvent) => {
    setDraggedIndex(null);
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '1';
    }
  };

  const handleDropItem = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const newPages = [...pages];
    const draggedItem = newPages.splice(draggedIndex, 1)[0];
    newPages.splice(dropIndex, 0, draggedItem);
    setPages(newPages);
    setDraggedIndex(null);
  };

  const movePage = (index: number, direction: 'left' | 'right') => {
    const newPages = [...pages];
    if (direction === 'left' && index > 0) {
      [newPages[index - 1], newPages[index]] = [newPages[index], newPages[index - 1]];
    } else if (direction === 'right' && index < newPages.length - 1) {
      [newPages[index + 1], newPages[index]] = [newPages[index], newPages[index + 1]];
    }
    setPages(newPages);
  };

  const removePage = (index: number) => {
    setPages(prev => prev.filter((_, i) => i !== index));
  };

  const rotatePage = (index: number) => {
    const newPages = [...pages];
    newPages[index].rotation = (newPages[index].rotation + 90) % 360;
    setPages(newPages);
  };

  const startOrganizing = async () => {
    if (!fileBytes || pages.length === 0 || !file) return;

    setLoading(true);
    setError(null);
    try {
      const originalPdf = await PDFDocument.load(fileBytes);
      const newPdf = await PDFDocument.create();

      // Copy pages in the new order
      const pageIndices = pages.map(p => p.originalIndex);
      const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);

      // Add to new document and apply rotations
      copiedPages.forEach((page, i) => {
        const extraRotation = pages[i].rotation;
        if (extraRotation > 0) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + extraRotation));
        }
        newPdf.addPage(page);
      });

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      
      setResultUrl(URL.createObjectURL(blob));
      setResultName(`${file.name.replace(".pdf", "")}_organized.pdf`);
    } catch (err: any) {
      console.error(err);
      setError("An error occurred while organizing the PDF.");
    } finally {
      setLoading(false);
    }
  };

  const isState3 = !!resultUrl;
  const isState2 = pages.length > 0;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 pb-16 pt-6">
      <div className="text-center py-8">
        <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-4">Organize PDF Pages</h1>
        <p className="text-outline text-base max-w-xl mx-auto leading-relaxed">
          Rearrange, delete, or rotate pages within your PDF document using an interactive workspace.
        </p>
      </div>

      {!isState3 ? (
        <div className="mt-4 border border-outline-variant/60 rounded-xl bg-surface-container-lowest overflow-hidden flex flex-col lg:flex-row shadow-sm">
          {/* LEFT COLUMN */}
          <div className="flex-1 p-8 relative min-h-[420px]">
            {loading && !isState2 ? (
              <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in z-20">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-bold text-on-surface">Loading PDF...</h3>
                <p className="text-sm text-primary mt-2 font-mono">{currentProgress}</p>
              </div>
            ) : isState2 ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-on-surface">{file?.name}</h3>
                    <p className="text-xs text-outline">{pages.length} Pages</p>
                  </div>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="text-xs font-semibold text-outline-variant hover:text-error transition-colors px-3 py-1.5 rounded-DEFAULT bg-surface hover:bg-red-50 cursor-pointer"
                  >
                    Discard
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {pages.map((page, idx) => (
                      <div 
                        key={`${page.originalIndex}-${idx}`} 
                        draggable
                        onDragStart={(e) => handleDragStartItem(e, idx)}
                        onDragEnd={handleDragEndItem}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropItem(e, idx)}
                        className={`group relative bg-surface border rounded-lg p-2 transition-all cursor-grab active:cursor-grabbing ${
                          draggedIndex === idx 
                            ? 'opacity-50 border-primary border-dashed shadow-inner scale-95 bg-primary-fixed/20' 
                            : 'border-outline-variant/60 hover:border-primary/50 hover:shadow-md hover:-translate-y-1'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[10px] font-bold text-outline-variant uppercase tracking-widest bg-surface-container-low px-2 py-0.5 rounded">
                            Page {idx + 1}
                          </div>
                          <button
                            onClick={() => removePage(idx)}
                            className="p-1 text-outline-variant hover:text-error hover:bg-red-50 rounded transition-colors"
                            title="Delete Page"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="relative aspect-[1/1.4] bg-white border border-outline-variant/30 rounded overflow-hidden shadow-sm mb-3 flex items-center justify-center">
                          <img 
                            src={page.dataUrl} 
                            alt={`Page ${idx + 1}`} 
                            style={{ transform: `rotate(${page.rotation}deg)` }}
                            className="max-w-full max-h-full object-contain transition-transform pointer-events-none"
                          />
                        </div>
                        <div className="flex items-center justify-center gap-2 border-t border-outline-variant/30 pt-2 mt-auto">
                          <button
                            onClick={() => rotatePage(idx)}
                            className="flex-1 py-1.5 flex items-center justify-center text-xs font-semibold text-outline-variant hover:text-primary hover:bg-primary-fixed/30 rounded transition-colors"
                            title="Rotate 90°"
                          >
                            <RotateCw size={14} className="mr-1" /> Rotate
                          </button>
                        </div>
                      </div>
                    ))}

                  </div>
                </div>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all absolute inset-8 ${
                  dragActive
                    ? "border-primary bg-primary-fixed/30 scale-[1.01]"
                    : "border-outline-variant/60 hover:bg-surface-container-low/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleFileChange}
                  accept=".pdf,application/pdf"
                />
                <div className="flex-1 flex flex-col items-center justify-center w-full">
                  <Layers size={46} strokeWidth={2.5} className="text-primary mb-5" />
                  <h3 className="text-xl font-bold text-on-surface mb-2">Drag & drop your PDF here</h3>
                  <p className="text-sm text-on-surface-variant">
                    or <span className="text-primary font-semibold">browse files</span>
                  </p>
                </div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mt-auto">MAX FILE SIZE: 50MB</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-outline-variant/60 bg-surface-container-lowest p-8 flex flex-col">
            <h3 className="font-bold text-lg text-on-surface mb-6">Organize Settings</h3>

            <div className="space-y-6 flex-1">
              <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/50">
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Total pages: <span className="font-bold text-primary">{pages.length}</span>
                </p>
                <p className="text-xs text-outline mt-2">
                  Use the drag-and-drop feature to visually rearrange your pages. You can also rotate or delete specific pages using their controls.
                </p>
              </div>
            </div>

            {error && <p className="text-xs text-error font-semibold mt-4 text-center">{error}</p>}

            <div className="mt-8">
              <button
                type="button"
                onClick={startOrganizing}
                disabled={!isState2 || loading || pages.length === 0}
                className={`w-full py-3 font-semibold text-sm rounded-DEFAULT shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                  !isState2 || loading || pages.length === 0
                    ? "bg-surface-container-highest text-outline-variant cursor-not-allowed"
                    : "bg-[#1d27f0] hover:bg-primary-container text-white cursor-pointer"
                }`}
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} 
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 border border-outline-variant/60 rounded-xl bg-surface-container-lowest p-12 flex flex-col items-center text-center animate-fade-in shadow-sm max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <Layers size={40} />
          </div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-3">Organization Complete!</h2>
          <p className="text-outline text-base max-w-md mx-auto mb-10 leading-relaxed">
            Your PDF has been successfully reorganized and generated.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
            <a
              href={resultUrl!}
              download={resultName}
              className="px-8 py-4 bg-[#1d27f0] hover:bg-primary-container text-white font-bold rounded-DEFAULT shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download size={20} /> Download PDF
            </a>
            <button
              onClick={resetAll}
              className="px-8 py-4 bg-surface hover:bg-surface-container-low text-on-surface-variant border border-outline-variant/60 font-bold rounded-DEFAULT flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              Organize Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
