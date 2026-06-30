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
  Sparkles
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Bind the worker externally to a reliable unpkg source matching the exact active pdfjs-dist version.
// This completely circumvents bundle/loader limitations in local compilation sandboxes, guaranteeing standard execution.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "6.0.227"}/build/pdf.worker.min.mjs`;

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
  const [qualityScale, setQualityScale] = useState<number>(1.5); // 1.5x default clear rendering
  const [imageFormat, setImageFormat] = useState<"image/png" | "image/jpeg">("image/png");
  const [currentProgress, setCurrentProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
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
        processPdf(file);
      } else {
        setError("Only valid PDF documents are supported.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processPdf(e.target.files[0]);
    }
  };

  const processPdf = async (file: File) => {
    setPdfFile(file);
    setLoading(true);
    setError(null);
    setExtractedPages([]);
    setCurrentProgress("Reading document structure...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the document via pdfjs-dist
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      
      const pages: ExtractedPage[] = [];

      for (let i = 1; i <= totalPages; i++) {
        setCurrentProgress(`Processing Page ${i} of ${totalPages}...`);
        const page = await pdf.getPage(i);
        
        // Define viewport scaling
        const viewport = page.getViewport({ scale: qualityScale });
        
        // Setup internal rendering off-screen canvas
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

        // Complete standard Promise render task
        await page.render(renderContext as any).promise;

        // Convert the structural canvas to data URI
        const dataUrl = canvas.toDataURL(imageFormat);
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
      const ext = imageFormat === "image/png" ? "png" : "jpg";
      const link = document.createElement("a");
      link.href = page.dataUrl;
      link.download = `${pdfFile?.name.replace(".pdf", "") || "document"}_page_${page.pageNumber}.${ext}`;
      link.click();
    });
  };

  const downloadPage = (page: ExtractedPage) => {
    const ext = imageFormat === "image/png" ? "png" : "jpg";
    const link = document.createElement("a");
    link.href = page.dataUrl;
    link.download = `${pdfFile?.name.replace(".pdf", "") || "document"}_page_${page.pageNumber}.${ext}`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tool Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 px-2 py-1 bg-teal-50 rounded-full">
            PDF Utility Agent
          </span>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight mt-1">
            PDF to Image Converter
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Slices multiple PDF document sheets into clean, separate HD raster images (PNG/JPEG) instantly on the fly with custom resolution parameters.
          </p>
        </div>
      </div>

      {/* Settings Panel & Drag-and-Drop Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Sparkles size={18} className="text-teal-600" />
              Agent Core Settings
            </h3>

            {/* Quality scale slider */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 flex justify-between">
                <span>Raster Scale (Quality)</span>
                <span className="text-teal-600">{qualityScale}x</span>
              </label>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.5"
                value={qualityScale}
                onChange={(e) => setQualityScale(parseFloat(e.target.value))}
                disabled={loading}
                className="w-full accent-teal-600 cursor-pointer text-teal-600"
              />
              <span className="text-[10px] text-slate-400 block">
                Higher values result in ultra-crisp, printable text but increase asset file size.
              </span>
            </div>

            {/* Image format selectors */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500">Output Target Type</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setImageFormat("image/png")}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                    imageFormat === "image/png"
                      ? "border-teal-500 bg-teal-50/50 text-teal-700 font-semibold"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  disabled={loading}
                >
                  PNG Format
                </button>
                <button
                  onClick={() => setImageFormat("image/jpeg")}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                    imageFormat === "image/jpeg"
                      ? "border-teal-500 bg-teal-50/50 text-teal-700 font-semibold"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  disabled={loading}
                >
                  JPEG Format
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Action Arena */}
        <div className="lg:col-span-8 space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`min-h-[220px] rounded-2xl border-2 border-dashed transition-all flex flex-col justify-center items-center p-6 bg-white relative ${
              dragActive
                ? "border-teal-500 bg-teal-50/50 scale-[0.99]"
                : "border-slate-200 hover:border-teal-400"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept=".pdf,application/pdf"
              disabled={loading}
            />

            {loading ? (
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto" />
                <div>
                  <h4 className="font-semibold text-slate-700">Converting PDF to Images...</h4>
                  <p className="text-xs text-slate-400 mt-1">{currentProgress}</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto text-teal-600 shadow-sm">
                  <FileText size={24} />
                </div>
                <div>
                  <h4 className="font-medium text-slate-700">
                    {pdfFile ? pdfFile.name : "Drag your PDF handbook here"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Or <span className="text-teal-600 underline">browse computer file directory</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm">
              <AlertCircle size={20} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Gallery Grid */}
          {extractedPages.length > 0 && (
            <div className="space-y-4 animate-slide-up">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    Extracted Pages ({extractedPages.length})
                  </h4>
                  <p className="text-xs text-slate-500">{pdfFile?.name}</p>
                </div>
                <button
                  onClick={downloadAll}
                  className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  <FileDown size={14} /> Batch Download All
                </button>
              </div>

              {/* Grid representation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {extractedPages.map((page) => (
                  <div
                    key={page.pageNumber}
                    className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm group hover:border-slate-200 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="bg-slate-50 border-b border-slate-100 p-3 flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-400">Page {page.pageNumber}</span>
                      <span className="text-[10px] text-slate-400">
                        {page.width}x{page.height} px
                      </span>
                    </div>
                    {/* Visual box */}
                    <div className="p-4 flex-1 flex items-center justify-center min-h-[180px] max-h-[220px] bg-slate-50/50">
                      <img
                        src={page.dataUrl}
                        alt={`Extracted page ${page.pageNumber}`}
                        className="max-h-full max-w-full rounded border shadow-inner object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* Action footer */}
                    <div className="p-3 bg-white border-t border-slate-50">
                      <button
                        onClick={() => downloadPage(page)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 hover:text-teal-600 bg-slate-50 hover:bg-teal-50/50 py-2 rounded-lg transition-colors border border-slate-100 cursor-pointer"
                      >
                        <Download size={13} /> Download Image
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
