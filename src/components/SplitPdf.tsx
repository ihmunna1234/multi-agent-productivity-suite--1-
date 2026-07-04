import React, { useState, useRef } from "react";
import {
  FileText,
  Loader2,
  AlertTriangle,
  Sparkles,
  Scissors,
  Download,
  Trash2
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [splitMode, setSplitMode] = useState<"range" | "single">("range");
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);
  
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
      const arrayBuffer = await selectedFile.arrayBuffer();
      // Store a copy of the bytes in state, not the complex PDFDocument object
      setFileBytes(new Uint8Array(arrayBuffer.slice(0)));
      const doc = await PDFDocument.load(arrayBuffer);
      setNumPages(doc.getPageCount());
      setEndPage(doc.getPageCount());
      setFile(selectedFile);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load PDF. It might be corrupted or password-protected.");
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
    setNumPages(0);
    setResultUrl(null);
    setResultName("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startSplit = async () => {
    if (!fileBytes || !file) return;

    setLoading(true);
    setError(null);
    try {
      // Load the document fresh to avoid React state mutation issues
      const pdfDoc = await PDFDocument.load(fileBytes);

      if (splitMode === "range") {
        if (startPage < 1 || endPage > numPages || startPage > endPage) {
          setError(`Invalid range. Please select between 1 and ${numPages}.`);
          setLoading(false);
          return;
        }

        const newPdf = await PDFDocument.create();
        const indices = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage - 1 + i);
        const copiedPages = await newPdf.copyPages(pdfDoc, indices);
        copiedPages.forEach((page) => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        setResultUrl(URL.createObjectURL(blob));
        setResultName(`${file.name.replace(".pdf", "")}_pages_${startPage}-${endPage}.pdf`);
      } else {
        // Single pages -> ZIP
        const zip = new JSZip();
        for (let i = 0; i < numPages; i++) {
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(copiedPage);
          const pdfBytes = await newPdf.save();
          zip.file(`page_${i + 1}.pdf`, pdfBytes);
        }
        
        const zipBlob = await zip.generateAsync({ type: "blob" });
        setResultUrl(URL.createObjectURL(zipBlob));
        setResultName(`${file.name.replace(".pdf", "")}_split.zip`);
      }
    } catch (err: any) {
      console.error(err);
      setError("An error occurred during splitting.");
    } finally {
      setLoading(false);
    }
  };

  const isState3 = !!resultUrl;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 pb-16 pt-6">
      <div className="text-center py-8">
        <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-4">Split PDF Files</h1>
        <p className="text-outline text-base max-w-xl mx-auto leading-relaxed">
          Extract specific pages or split a large PDF document into multiple smaller files instantly.
        </p>
      </div>

      {!isState3 ? (
        <div className="mt-4 border border-outline-variant/60 rounded-xl bg-surface-container-lowest overflow-hidden flex flex-col lg:flex-row shadow-sm">
          {/* LEFT COLUMN */}
          <div className="flex-1 p-8 relative flex items-center justify-center min-h-[420px]">
            {loading && !fileBytes ? (
              <div className="flex flex-col items-center text-center animate-fade-in z-20">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-bold text-on-surface">Loading PDF...</h3>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center text-center animate-fade-in z-20">
                <div className="w-24 h-32 bg-surface-container-lowest border border-outline-variant/60 rounded shadow-md flex items-center justify-center mb-6 overflow-hidden">
                  <FileText size={40} className="text-primary" />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-1 truncate max-w-xs">{file.name}</h3>
                <p className="text-xs text-outline font-mono mb-2">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p className="text-sm font-bold text-primary mb-6">{numPages} Pages Total</p>
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
                className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer ${
                  dragActive
                    ? "border-primary bg-primary-fixed/30 scale-[1.01]"
                    : "border-outline-variant/60 hover:bg-surface-container-low/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,application/pdf"
                />
                <div className="flex-1 flex flex-col items-center justify-center w-full pointer-events-none">
                  <Scissors size={46} strokeWidth={2.5} className="text-primary mb-5" />
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
            <h3 className="font-bold text-lg text-on-surface mb-6">Split Settings</h3>

            <div className="space-y-6 flex-1">
              {/* Mode */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Mode</label>
                <div className="flex rounded-DEFAULT isolate">
                  <button
                    type="button"
                    onClick={() => setSplitMode("range")}
                    className={`flex-1 py-2 text-xs font-bold transition-colors border cursor-pointer rounded-l-DEFAULT ${
                      splitMode === "range"
                        ? "border-primary text-primary z-10 relative bg-surface-container-lowest"
                        : "border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-low bg-surface-container-lowest"
                    }`}
                  >
                    Custom Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode("single")}
                    className={`flex-1 py-2 text-xs font-bold transition-colors border cursor-pointer rounded-r-DEFAULT -ml-[1px] ${
                      splitMode === "single"
                        ? "border-primary text-primary z-10 relative bg-surface-container-lowest"
                        : "border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-low bg-surface-container-lowest"
                    }`}
                  >
                    Split to Single Pages
                  </button>
                </div>
                <p className="text-[11px] text-outline-variant">
                  {splitMode === "range" 
                    ? "Extract a specific section of pages into a new PDF." 
                    : "Extract every single page into separate PDF files (downloads as ZIP)."}
                </p>
              </div>

              {/* Range Inputs */}
              {splitMode === "range" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Start Page</label>
                    <input
                      type="number"
                      min={1}
                      max={numPages || 1}
                      value={startPage}
                      onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                      disabled={!file}
                      className="w-full text-sm font-bold bg-surface-container-lowest border border-outline-variant/60 p-2.5 rounded-DEFAULT focus:border-primary outline-none disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">End Page</label>
                    <input
                      type="number"
                      min={startPage}
                      max={numPages || 1}
                      value={endPage}
                      onChange={(e) => setEndPage(parseInt(e.target.value) || 1)}
                      disabled={!file}
                      className="w-full text-sm font-bold bg-surface-container-lowest border border-outline-variant/60 p-2.5 rounded-DEFAULT focus:border-primary outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-xs text-error font-semibold mt-4 text-center">{error}</p>}

            <div className="mt-8">
              <button
                type="button"
                onClick={startSplit}
                disabled={!file || loading}
                className={`w-full py-3 font-semibold text-sm rounded-DEFAULT shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                  !file || loading
                    ? "bg-surface-container-highest text-outline-variant cursor-not-allowed"
                    : "bg-[#1d27f0] hover:bg-primary-container text-white cursor-pointer"
                }`}
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Scissors size={16} />} 
                Split PDF
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 border border-outline-variant/60 rounded-xl bg-surface-container-lowest p-12 flex flex-col items-center text-center animate-fade-in shadow-sm max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <Scissors size={40} />
          </div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-3">Split Complete!</h2>
          <p className="text-outline text-base max-w-md mx-auto mb-10 leading-relaxed">
            Your PDF has been successfully split based on your selected settings.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
            <a
              href={resultUrl!}
              download={resultName}
              className="px-8 py-4 bg-[#1d27f0] hover:bg-primary-container text-white font-bold rounded-DEFAULT shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download size={20} /> Download Result
            </a>
            <button
              onClick={resetAll}
              className="px-8 py-4 bg-surface hover:bg-surface-container-low text-on-surface-variant border border-outline-variant/60 font-bold rounded-DEFAULT flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              Split Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
