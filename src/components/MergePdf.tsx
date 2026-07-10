import React, { useState, useRef } from "react";
import {
  FileText,
  Upload,
  Download,
  Loader2,
  AlertTriangle,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Trash2,
  Combine
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

export default function MergePdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [mergedPdfName, setMergedPdfName] = useState<string>("");
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
      const newFiles = Array.from(e.dataTransfer.files).filter((f: any) => f.type === "application/pdf");
      if (newFiles.length === 0) {
        setError("Only PDF files are supported.");
        return;
      }
      setFiles(prev => [...prev, ...newFiles]);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((f: any) => f.type === "application/pdf");
      if (newFiles.length === 0) {
        setError("Only PDF files are supported.");
        return;
      }
      setFiles(prev => [...prev, ...newFiles]);
      setError(null);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    if (direction === 'up' && index > 0) {
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    } else if (direction === 'down' && index < newFiles.length - 1) {
      [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
    }
    setFiles(newFiles);
  };

  const removeItem = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const resetAll = () => {
    setFiles([]);
    setMergedPdfUrl(null);
    setMergedPdfName("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startMerge = async () => {
    if (files.length < 2) {
      setError("Please select at least 2 PDF files to merge.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      setMergedPdfUrl(url);
      setMergedPdfName(`merged_${Date.now()}.pdf`);
    } catch (err: any) {
      console.error("Merge error:", err);
      setError("An error occurred while merging the PDF files. Ensure they are valid and not password protected.");
    } finally {
      setLoading(false);
    }
  };

  const isState3 = !!mergedPdfUrl;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 pb-16 pt-6">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-4">Merge PDF Documents</h1>
        <p className="text-outline text-base max-w-xl mx-auto leading-relaxed">
          Combine multiple PDF files into one single continuous document in the exact order you specify.
        </p>
      </div>

      {!isState3 ? (
        <div className="mt-4 border border-outline-variant/60 rounded-xl bg-surface-container-lowest overflow-hidden flex flex-col lg:flex-row shadow-sm">
          {/* LEFT COLUMN */}
          <div className="flex-1 p-8 relative flex flex-col min-h-[420px]">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in z-20">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-bold text-on-surface">Merging PDFs...</h3>
              </div>
            ) : (
              <>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`w-full ${files.length === 0 ? 'h-full' : 'h-48'} border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all shrink-0 ${
                    dragActive
                      ? "border-primary bg-primary-fixed/30 scale-[1.01]"
                      : "border-outline-variant/60 hover:bg-surface-container-low/50"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 hidden"
                    onChange={handleFileChange}
                    accept=".pdf,application/pdf"
                    multiple
                  />
                  <div className="flex flex-col items-center justify-center w-full cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Combine size={46} strokeWidth={2.5} className="text-primary mb-5" />
                    <h3 className="text-xl font-bold text-on-surface mb-2">Drag & drop PDFs here</h3>
                    <p className="text-sm text-on-surface-variant">
                      or <span className="text-primary font-semibold">browse files</span>
                    </p>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="mt-6 flex-1 overflow-y-auto pr-2 space-y-3">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-outline-variant/60 rounded-lg bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="text-primary shrink-0" size={24} />
                          <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-on-surface truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                            <p className="text-xs text-outline">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveItem(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 text-outline-variant hover:text-primary hover:bg-surface-container-low rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem(idx, 'down')}
                            disabled={idx === files.length - 1}
                            className="p-1.5 text-outline-variant hover:text-primary hover:bg-surface-container-low rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-1.5 text-outline-variant hover:text-error hover:bg-red-50 rounded cursor-pointer ml-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-outline-variant/60 bg-surface-container-lowest p-8 flex flex-col">
            <h3 className="font-bold text-lg text-on-surface mb-6">Merge Settings</h3>

            <div className="space-y-6 flex-1">
              <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/50">
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  You have selected <span className="font-bold text-primary">{files.length}</span> file{files.length !== 1 && 's'}. 
                  Adjust the order using the up/down arrows.
                </p>
              </div>
            </div>

            {error && <p className="text-xs text-error font-semibold mt-4 text-center">{error}</p>}

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={startMerge}
                disabled={files.length < 2 || loading}
                className={`w-full py-3 font-semibold text-sm rounded-DEFAULT shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                  files.length < 2 || loading
                    ? "bg-surface-container-highest text-outline-variant cursor-not-allowed"
                    : "bg-primary hover:bg-primary-container text-white cursor-pointer"
                }`}
              >
                <Sparkles size={16} /> Merge Files
              </button>
              {files.length > 0 && (
                <button
                  type="button"
                  onClick={resetAll}
                  className="w-full py-3 font-semibold text-sm rounded-DEFAULT border border-outline-variant/60 hover:bg-surface-container-low text-on-surface-variant transition-all cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 border border-outline-variant/60 rounded-xl bg-surface-container-lowest p-12 flex flex-col items-center text-center animate-fade-in shadow-sm max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <Combine size={40} />
          </div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-3">Merge Complete!</h2>
          <p className="text-outline text-base max-w-md mx-auto mb-10 leading-relaxed">
            Your PDFs have been successfully combined into a single document.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
            <a
              href={mergedPdfUrl!}
              download={mergedPdfName}
              className="px-8 py-4 bg-primary hover:bg-primary-container text-white font-bold rounded-DEFAULT shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download size={20} /> Download PDF
            </a>
            <button
              onClick={resetAll}
              className="px-8 py-4 bg-surface hover:bg-surface-container-low text-on-surface-variant border border-outline-variant/60 font-bold rounded-DEFAULT flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              Merge More Files
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
