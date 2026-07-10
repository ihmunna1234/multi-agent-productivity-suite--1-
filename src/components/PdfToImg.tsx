import React, { useState, useRef } from "react";
import {
  FileText,
  Upload,
  Download,
  Loader2,
  Image as ImageIcon,
  Check,
  AlertCircle,
  FileDown,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Settings
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface ExtractedPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export default function PdfToImg() {
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedPages, setExtractedPages] = useState<ExtractedPage[]>([]);
  const [qualityScale, setQualityScale] = useState<number>(1.5);
  const [imageFormat, setImageFormat] = useState<"image/png" | "image/jpeg" | "image/tiff">("image/png");
  const [currentProgress, setCurrentProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pdfThumbnail, setPdfThumbnail] = useState<string>("");

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        handleFileSelected(file);
      } else {
        setError("Only valid PDF documents are supported.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file: File) => {
    setPdfFile(file);
    setError(null);
    setExtractedPages([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      if (context) {
        await page.render({ canvasContext: context, viewport, canvas } as any).promise;
        setPdfThumbnail(canvas.toDataURL("image/png"));
      }
    } catch {
      setPdfThumbnail("");
    }
  };

  const resetAll = () => {
    setPdfFile(null);
    setExtractedPages([]);
    setError(null);
    setPdfThumbnail("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startConversion = () => {
    if (pdfFile) processPdf(pdfFile);
  };

  const processPdf = async (file: File) => {
    setLoading(true);
    setError(null);
    setExtractedPages([]);
    setCurrentProgress("Reading document structure...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      const pages: ExtractedPage[] = [];
      const actualFormat = imageFormat === "image/tiff" ? "image/png" : imageFormat; // Tiff fallback

      for (let i = 1; i <= totalPages; i++) {
        setCurrentProgress(`Processing Page ${i} of ${totalPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: qualityScale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Could not initialize 2D canvas context for page rendering.");
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext as any).promise;

        const dataUrl = canvas.toDataURL(actualFormat);
        pages.push({
          pageNumber: i,
          dataUrl,
          width: viewport.width,
          height: viewport.height,
        });
      }

      setExtractedPages(pages);
      setCurrentProgress("Rendering complete.");
    } catch (err: any) {
      console.error("PDF to Image conversion error:", err);
      setError(
        "Could not load or extract pages from the PDF file. Please verify that the PDF is not password-protected and is valid."
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadAll = () => {
    if (extractedPages.length === 0) return;
    extractedPages.forEach((page) => {
      let ext = "png";
      if (imageFormat === "image/jpeg") ext = "jpg";
      if (imageFormat === "image/tiff") ext = "tiff";
      const link = document.createElement("a");
      link.href = page.dataUrl;
      link.download = `${pdfFile?.name.replace(".pdf", "") || "document"}_page_${page.pageNumber}.${ext}`;
      link.click();
    });
  };

  const isState3 = extractedPages.length > 0;
  const isLoading = loading;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 pb-16 pt-6">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-4">Convert PDF to Image</h1>
        <p className="text-outline text-base max-w-xl mx-auto leading-relaxed">
          Extract images from your PDF or convert each page to a high-quality JPG, PNG, or TIFF file instantly.
        </p>
      </div>

      {!isState3 && (
        <div className="mt-4 border border-outline-variant/60 rounded-xl bg-surface-container-lowest overflow-hidden flex flex-col lg:flex-row shadow-sm">
          {/* LEFT COLUMN */}
          <div className="flex-1 p-8 relative flex items-center justify-center min-h-[420px]">
            {isLoading ? (
              <div className="flex flex-col items-center text-center animate-fade-in z-20">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-bold text-on-surface">Converting your PDF...</h3>
                <p className="text-sm text-primary mt-2 font-mono">{currentProgress}</p>
              </div>
            ) : pdfFile ? (
              <div className="flex flex-col items-center text-center animate-fade-in z-20">
                <div className="w-24 h-32 bg-surface-container-lowest border border-outline-variant rounded shadow-md flex items-center justify-center mb-6 overflow-hidden">
                  {pdfThumbnail ? (
                    <img src={pdfThumbnail} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <FileText size={40} className="text-outline-variant" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-1 truncate max-w-xs">{pdfFile.name}</h3>
                <p className="text-xs text-outline font-mono mb-6">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-sm font-semibold text-outline-variant hover:text-error transition-colors cursor-pointer px-4 py-2 rounded-DEFAULT hover:bg-surface-container-low"
                >
                  Change file
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer relative z-10 ${
                  dragActive
                    ? "border-primary bg-primary-fixed/30 scale-[1.02] shadow-sm"
                    : "border-outline-variant/60 hover:bg-surface-container-low/50"
                }`}
              >
                <input
                  type="file"
                  title=""
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,application/pdf"
                />
                
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <FileText size={46} strokeWidth={2.5} className="text-primary mb-5" />
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
            <h3 className="font-bold text-lg text-on-surface mb-6">Output Settings</h3>

            <div className="space-y-6 flex-1">
              {/* Format */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Format</label>
                <div className="flex rounded-DEFAULT isolate">
                  <button
                    type="button"
                    onClick={() => setImageFormat("image/jpeg")}
                    className={`flex-1 py-2 text-xs font-bold transition-colors border cursor-pointer rounded-l-DEFAULT ${
                      imageFormat === "image/jpeg"
                        ? "border-primary text-primary z-10 relative bg-surface-container-lowest"
                        : "border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-low bg-surface-container-lowest"
                    }`}
                  >
                    JPG
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageFormat("image/png")}
                    className={`flex-1 py-2 text-xs font-bold transition-colors border cursor-pointer -ml-[1px] ${
                      imageFormat === "image/png"
                        ? "border-primary text-primary z-10 relative bg-surface-container-lowest"
                        : "border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-low bg-surface-container-lowest"
                    }`}
                  >
                    PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageFormat("image/tiff")}
                    className={`flex-1 py-2 text-xs font-bold transition-colors border cursor-pointer rounded-r-DEFAULT -ml-[1px] ${
                      imageFormat === "image/tiff"
                        ? "border-primary text-primary z-10 relative bg-surface-container-lowest"
                        : "border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-low bg-surface-container-lowest"
                    }`}
                  >
                    TIFF
                  </button>
                </div>
              </div>

              {/* Quality */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Quality (DPI)</label>
                <select
                  value={qualityScale}
                  onChange={(e: any) => setQualityScale(parseFloat(e.target.value))}
                  className="w-full text-sm font-medium bg-surface-container-lowest border border-outline-variant/60 p-2.5 rounded-DEFAULT hover:border-primary focus:border-primary outline-none text-on-surface-variant cursor-pointer transition-colors"
                >
                  <option value={1.0}>72 (Web)</option>
                  <option value={1.5}>150 (Standard)</option>
                  <option value={2.0}>300 (Print)</option>
                </select>
              </div>
            </div>

            {error && <p className="text-xs text-error font-semibold mt-4 text-center">{error}</p>}

            <div className="mt-8">
              <button
                type="button"
                onClick={startConversion}
                disabled={!pdfFile || isLoading}
                className={`w-full py-3 font-semibold text-sm rounded-DEFAULT shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                  !pdfFile
                    ? "bg-surface-container-highest text-outline-variant cursor-not-allowed"
                    : "bg-primary hover:bg-primary-container text-white cursor-pointer"
                }`}
              >
                <Sparkles size={16} /> Convert Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {isState3 && (
        <div className="mt-4 border border-outline-variant rounded-xl bg-surface-container-lowest p-16 text-center animate-fade-in shadow-sm">
          <div className="w-20 h-20 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-3">Conversion Complete!</h2>
          <p className="text-outline text-sm mb-10 max-w-sm mx-auto">
            Successfully extracted {extractedPages.length} images from {pdfFile?.name}.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={resetAll}
              className="px-6 py-3 rounded-DEFAULT border border-outline-variant text-on-surface-variant font-semibold text-sm hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              Convert another
            </button>
            <button
              type="button"
              onClick={downloadAll}
              className="px-8 py-3 rounded-DEFAULT bg-primary hover:bg-primary-container text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download size={18} /> Download All Images
            </button>
          </div>
        </div>
      )}

      {/* How it works */}
      {!isState3 && (
        <div className="mt-24 max-w-5xl mx-auto text-center animate-fade-in">
          <h2 className="text-2xl font-extrabold text-on-surface mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-left shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center text-lg mb-6">1</div>
              <h4 className="text-lg font-bold text-on-surface mb-3">Upload PDF</h4>
              <p className="text-sm text-outline leading-relaxed">
                Drag and drop your document into the upload area. We support large files up to 50MB.
              </p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-left shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center text-lg mb-6">2</div>
              <h4 className="text-lg font-bold text-on-surface mb-3">Choose Settings</h4>
              <p className="text-sm text-outline leading-relaxed">
                Select your desired image format (JPG, PNG, or TIFF) and adjust the DPI for perfect quality.
              </p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-left shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center text-lg mb-6">3</div>
              <h4 className="text-lg font-bold text-on-surface mb-3">Download Images</h4>
              <p className="text-sm text-outline leading-relaxed">
                Click convert and download your images instantly. Files are securely processed and automatically deleted.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
