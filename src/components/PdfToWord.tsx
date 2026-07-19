import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "../utils/api";
import {
  FileText,
  Download,
  Loader2,
  Clipboard,
  Check,
  FileType,
  FileCheck,
  Trash2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PageInfo {
  pageNumber: number;
  text: string;
  charCount: number;
  wordCount: number;
  isFallback?: boolean;
  apiError?: string;
}

export default function PdfToWord() {
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedPages, setExtractedPages] = useState<PageInfo[]>([]);
  const [editedText, setEditedText] = useState<string>("");
  const [currentProgress, setCurrentProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [conversionMode, setConversionMode] = useState<"standard" | "ocr">("standard");

  // Styling presets for Word Document Template
  const [documentFont] = useState<"Calibri" | "Arial" | "Times New Roman" | "Georgia" | "Courier New">("Calibri");
  const [documentTheme] = useState<"standard" | "professional" | "minimal" | "editorial">("standard");
  const [lineSpacing] = useState<"1.0" | "1.15" | "1.5" | "2.0">("1.15");
  const [addPageBreaks] = useState<boolean>(true);
  // thumbnail for preview
  const [pdfThumbnail, setPdfThumbnail] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);


  // Cleanup copied alert
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Cleanup download success highlight
  useEffect(() => {
    if (downloadSuccess) {
      const timer = setTimeout(() => setDownloadSuccess(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [downloadSuccess]);

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
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        handleFileSelected(file);
      } else {
        setError("Only valid PDF documents are supported for Word conversion.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  // Step 1 → Step 2: File selected, generate thumbnail
  const handleFileSelected = async (file: File) => {
    setPdfFile(file);
    setError(null);
    setExtractedPages([]);
    setEditedText("");
    setDownloadSuccess(false);

    // Generate thumbnail from first page
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
        await page.render({ canvasContext: context, viewport, canvas }).promise;
        setPdfThumbnail(canvas.toDataURL("image/png"));
      }
    } catch {
      setPdfThumbnail("");
    }
  };

  // Step 2 → Step 3: Convert
  const startConversion = () => {
    if (pdfFile) {
      processPdf(pdfFile);
    }
  };

  const processPdf = async (file: File) => {
    setLoading(true);
    setError(null);
    setExtractedPages([]);
    setEditedText("");
    setCurrentProgress("Initializing PDF core worker stream...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      const parsedPages: PageInfo[] = [];

      for (let i = 1; i <= totalPages; i++) {
        if (conversionMode === "ocr") {
          setCurrentProgress(`Rendering page ${i} of ${totalPages} for high-res scanning...`);
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (!context) {
            throw new Error(`Failed to initialize HTML5 canvas context for rendering Page ${i}.`);
          }

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          };
          await page.render(renderContext).promise;

          setCurrentProgress(`Performing AI OCR layout scan on page ${i} of ${totalPages}...`);
          const dataUrl = canvas.toDataURL("image/png");
          const base64Data = dataUrl.split(",")[1];

          const response = await apiFetch("/api/ocr-pdf-page", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: "image/png",
              pageNumber: i,
              totalPages: totalPages,
            }),
          });

          if (!response.ok) {
            const errResult = await response.json().catch(() => ({}));
            throw new Error(errResult.error || `Server OCR request failed on Page ${i} (HTTP status ${response.status}).`);
          }

          const ocrResult = await response.json();
          const pageText = (ocrResult.text || "").trim();
          const pageCharCount = pageText.length;
          const pageWordCount = pageText.split(/\s+/).filter(Boolean).length;

          parsedPages.push({
            pageNumber: i,
            text: pageText,
            charCount: pageCharCount,
            wordCount: pageWordCount,
            isFallback: !!ocrResult.isFallback,
            apiError: ocrResult.apiError,
          });
        } else {
          setCurrentProgress(`Analyzing page ${i} of ${totalPages}...`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();

          const lines: { y: number; text: string }[] = [];

          // Build logical lines based on element coordinate spacing
          textContent.items.forEach((item: any) => {
            const str = item.str || "";
            if (!str.trim()) return;

            const currentY = item.transform ? item.transform[5] : -1;

            const lastLine = lines[lines.length - 1];
            if (lastLine && Math.abs(lastLine.y - currentY) < 4) {
              lastLine.text += (lastLine.text.endsWith(" ") || str.startsWith(" ") ? "" : " ") + str;
            } else {
              lines.push({ y: currentY, text: str });
            }
          });

          // Combine lines into page text separating paragraphs organically
          let pageTextContent = "";
          let lineBuffer: string[] = [];

          lines.forEach((line, index) => {
            const text = line.text.trim();

            const isHeading = text.length < 60 &&
              (text === text.toUpperCase() || /^[0-9]\.?\s+[A-Z]/.test(text) || text.length < 25);

            if (isHeading) {
              if (lineBuffer.length > 0) {
                pageTextContent += lineBuffer.join(" ") + "\r\n\r\n";
                lineBuffer = [];
              }
              pageTextContent += `[HEADING] ${text}\r\n\r\n`;
            } else {
              lineBuffer.push(text);
              if (text.endsWith(".") || text.endsWith("?") || text.endsWith("!") || index === lines.length - 1) {
                pageTextContent += lineBuffer.join(" ") + "\r\n\r\n";
                lineBuffer = [];
              }
            }
          });

          if (lineBuffer.length > 0) {
            pageTextContent += lineBuffer.join(" ") + "\r\n\r\n";
          }

          const cleanedPageText = pageTextContent.trim();
          const pageCharCount = cleanedPageText.length;
          const pageWordCount = cleanedPageText.split(/\s+/).filter(Boolean).length;

          parsedPages.push({
            pageNumber: i,
            text: cleanedPageText,
            charCount: pageCharCount,
            wordCount: pageWordCount
          });
        }
      }

      setExtractedPages(parsedPages);

      let fullMergedText = "";
      parsedPages.forEach((item, index) => {
        if (index > 0 && addPageBreaks) {
          fullMergedText += `\r\n--- PAGE BREAK: PAGE ${item.pageNumber} ---\r\n\r\n`;
        }
        fullMergedText += item.text + "\r\n";
      });

      setEditedText(fullMergedText.trim());
      setCurrentProgress("Conversion and formatting completed.");
    } catch (err: any) {
      console.error("PDF to Word text extraction failure:", err);
      setError(
        err.message || "Could not extract formatted string data from the PDF document. If it is an image-only scanned card, please use our 'Iqama & ID Extractor' tool to run advanced AI-powered OCR algorithms."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatistics = () => {
    if (!editedText) return { words: 0, characters: 0, paragraphs: 0, readingTime: 0 };
    const paragraphs = editedText.split(/\n\s*\n/).filter(Boolean).length;
    const cleanWordText = editedText.replace(/--- PAGE BREAK: PAGE \d+ ---/g, "");
    const words = cleanWordText.split(/\s+/).filter(Boolean).length;
    const characters = cleanWordText.length;
    const readingTime = Math.max(1, Math.round(words / 200));
    return { words, characters, paragraphs, readingTime };
  };

  const stats = getStatistics();

  const handleCopyText = () => {
    if (!editedText) return;
    navigator.clipboard.writeText(editedText);
    setCopied(true);
  };

  const resetAll = () => {
    setPdfFile(null);
    setExtractedPages([]);
    setEditedText("");
    setError(null);
    setPdfThumbnail("");
    setDownloadSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Advanced MS Word download builder
  const downloadAsWord = () => {
    if (!editedText) return;

    let primaryColor = "#1e293b";
    let titleColor = "#0f172a";
    let headingColor = "#0d9488";
    let fontStack = "Calibri, Helvetica, sans-serif";

    if (documentFont === "Times New Roman") fontStack = "'Times New Roman', Georgia, serif";
    else if (documentFont === "Georgia") fontStack = "Georgia, serif";
    else if (documentFont === "Arial") fontStack = "Arial, sans-serif";
    else if (documentFont === "Courier New") fontStack = "'Courier New', monospace";

    if (documentTheme === "professional") {
      headingColor = "#2563eb";
    } else if (documentTheme === "minimal") {
      headingColor = "#111827";
      titleColor = "#111827";
    } else if (documentTheme === "editorial") {
      headingColor = "#b91c1c";
      titleColor = "#450a0a";
    }

    const marginValue = "1.0in";
    const lineSpacingValue = lineSpacing;

    const rawParagraphs = editedText.split(/\r?\n\s*\r?\n/);
    let htmlParagraphsOutput = "";

    rawParagraphs.forEach((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return;

      if (trimmed.startsWith("--- PAGE BREAK:")) {
        if (addPageBreaks) {
          htmlParagraphsOutput += `<div style="page-break-before: always; mso-break-type: section-break;"></div>`;
        }
      } else if (trimmed.startsWith("[HEADING]")) {
        const headingText = trimmed.replace("[HEADING]", "").trim();
        htmlParagraphsOutput += `<h2 style="font-family: ${fontStack}; font-size: 16pt; color: ${headingColor}; font-weight: bold; margin-top: 18pt; margin-bottom: 6pt; border-bottom: 1px solid #f1f5f9; padding-bottom: 3px;">${headingText}</h2>`;
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const itemText = trimmed.slice(2).trim();
        htmlParagraphsOutput += `<p style="font-family: ${fontStack}; font-size: 11pt; color: ${primaryColor}; margin-left: 20pt; text-indent: -10pt; line-height: ${lineSpacingValue}; margin-bottom: 4pt;">&bull; &nbsp; ${itemText}</p>`;
      } else {
        htmlParagraphsOutput += `<p style="font-family: ${fontStack}; font-size: 11pt; color: ${primaryColor}; text-indent: 0in; line-height: ${lineSpacingValue}; margin-bottom: 8pt; text-align: justify;">${trimmed}</p>`;
      }
    });

    const docHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <style>
    @page {
      size: 8.5in 11.0in;
      margin: ${marginValue} ${marginValue} ${marginValue} ${marginValue};
      mso-header-margin: .5in;
      mso-footer-margin: .5in;
      mso-paper-source: 0;
    }
    body {
      font-family: ${fontStack};
      font-size: 11pt;
      line-height: ${lineSpacingValue};
      background-color: #ffffff;
    }
  </style>
</head>
<body style="tab-interval:.5in">
  <div style="font-family: ${fontStack}; font-size: 11pt;">
    <h1 style="font-family: ${fontStack}; font-size: 24pt; color: ${titleColor}; font-weight: bold; margin-bottom: 4pt;">${pdfFile?.name.replace(".pdf", "") || "Document"}</h1>
    <p style="font-size: 9pt; color: #94a3b8; font-family: ${fontStack}; margin-bottom: 24pt; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-style: italic;">
      Converted on ${new Date().toLocaleDateString()} using Injamus's AI Converter Suite
    </p>
    ${htmlParagraphsOutput}
  </div>
</body>
</html>`;

    const blob = new Blob([docHtml], { type: "application/msword;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${pdfFile?.name.replace(".pdf", "") || "document"}_converted.doc`;
    link.click();
    setDownloadSuccess(true);
  };

  const downloadAsTxt = () => {
    if (!editedText) return;
    const blob = new Blob([editedText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${pdfFile?.name.replace(".pdf", "") || "document"}_clean.txt`;
    link.click();
  };

  // Determine current flow state
  const isState1 = !pdfFile && !loading;
  const isState2 = pdfFile && !editedText && !loading;
  const isState3 = editedText.length > 0;
  const isLoading = loading;

  return (
    <div className="animate-fade-in">

      {/* ═══════════════ STATE 1: UPLOAD HERO ═══════════════ */}
      {isState1 && (
        <div className="flex flex-col items-center py-12 sm:py-20 text-center animate-fade-in max-w-5xl mx-auto px-4">
          <h1 className="text-4xl sm:text-[44px] font-extrabold text-on-surface tracking-tight mb-4">
            PDF to Word Converter
          </h1>
          <p className="text-base sm:text-lg text-outline-variant max-w-2xl mx-auto leading-relaxed mb-12">
            Transform your non-editable PDFs into fully formatted Microsoft Word
            documents. High accuracy OCR included.
          </p>

          {/* Large Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative w-full max-w-3xl h-64 sm:h-72 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all bg-surface-container-lowest cursor-pointer ${
              dragActive
                ? "border-primary bg-primary-fixed/30 scale-[1.01]"
                : "border-outline-variant/60 hover:border-primary/50 hover:bg-surface-container-low/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,application/pdf"
            />
            <div className="w-14 h-14 bg-primary text-white rounded-DEFAULT flex items-center justify-center mb-5 shadow-sm">
              <FileType size={28} />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">Drag & Drop your PDF here</h3>
            <p className="text-sm text-outline-variant">
              or click to browse from your device
            </p>
          </div>

          {/* Security Pill */}
          <div className="mt-8 mb-16 inline-flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-surface-container-highest">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-outline">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span className="text-xs font-bold text-on-surface-variant">Secure conversion. Files are automatically deleted after 1 hour.</span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-12 bg-red-50 text-red-700 p-4 border border-red-100 rounded-DEFAULT flex items-center justify-center gap-3 w-full max-w-3xl">
              <AlertTriangle className="text-red-500 shrink-0" size={18} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-8 text-left shadow-sm">
              <div className="w-10 h-10 flex items-center justify-center text-primary mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 7 4 4 20 4 20 7"></polyline>
                  <line x1="9" y1="20" x2="15" y2="20"></line>
                  <line x1="12" y1="4" x2="12" y2="20"></line>
                </svg>
              </div>
              <h4 className="text-lg font-bold text-on-surface mb-3">Retain Formatting</h4>
              <p className="text-sm text-outline leading-relaxed">
                Paragraphs, tables, and lists remain intact just like the original document.
              </p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-8 text-left shadow-sm">
              <div className="w-10 h-10 flex items-center justify-center text-primary mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <circle cx="10" cy="13" r="2"></circle>
                  <line x1="11.41" y1="14.41" x2="14" y2="17"></line>
                </svg>
              </div>
              <h4 className="text-lg font-bold text-on-surface mb-3">Advanced OCR</h4>
              <p className="text-sm text-outline leading-relaxed">
                Extract text from scanned documents accurately with our built-in OCR technology.
              </p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-8 text-left shadow-sm">
              <div className="w-10 h-10 flex items-center justify-center text-primary mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h4 className="text-lg font-bold text-on-surface mb-3">Lightning Fast</h4>
              <p className="text-sm text-outline leading-relaxed">
                Experience near-instant conversions, saving you valuable time on complex files.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ STATE 2: PREVIEW + OPTIONS ═══════════════ */}
      {isState2 && !isLoading && (
        <div className="flex flex-col items-center py-8 sm:py-14 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight text-center">
            PDF to WORD Converter
          </h2>
          <p className="text-sm text-outline mt-2 text-center">Ready to convert your document</p>

          <div className="mt-8 w-full max-w-2xl">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 sm:p-8 shadow-none">
              {/* File Preview Row */}
              <div className="flex items-center gap-5">
                {/* Thumbnail */}
                <div className="w-20 h-28 sm:w-24 sm:h-32 shrink-0 rounded-DEFAULT border border-outline-variant bg-surface-container-low overflow-hidden flex items-center justify-center shadow-inner">
                  {pdfThumbnail ? (
                    <img src={pdfThumbnail} alt="PDF preview" className="w-full h-full object-contain" />
                  ) : (
                    <FileText size={32} className="text-outline-variant" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{pdfFile?.name}</p>
                  <p className="text-xs text-outline-variant mt-1 font-mono">
                    {pdfFile ? `${(pdfFile.size / 1024).toFixed(0)} KB` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="mt-3 text-xs text-outline-variant hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-surface-container-highest my-6"></div>

              {/* Conversion Mode Selection */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-outline uppercase tracking-wider">Conversion Mode</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConversionMode("standard")}
                    className={`p-4 rounded-DEFAULT border-2 text-left transition-all cursor-pointer ${
                      conversionMode === "standard"
                        ? "border-primary bg-primary-fixed/50"
                        : "border-outline-variant hover:border-outline"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${conversionMode === "standard" ? "text-primary-container" : "text-on-surface-variant"}`}>
                        NO OCR
                      </span>
                      {conversionMode === "standard" && (
                        <div className="w-5 h-5 rounded-DEFAULT bg-primary flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-outline mt-1.5 leading-relaxed">
                      Convert PDFs with selectable text into editable Word files.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConversionMode("ocr")}
                    className={`p-4 rounded-DEFAULT border-2 text-left transition-all cursor-pointer ${
                      conversionMode === "ocr"
                        ? "border-primary bg-primary-fixed/50"
                        : "border-outline-variant hover:border-outline"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${conversionMode === "ocr" ? "text-primary-container" : "text-on-surface-variant"}`}>
                          OCR
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-DEFAULT font-bold">AI</span>
                      </div>
                      {conversionMode === "ocr" && (
                        <div className="w-5 h-5 rounded-DEFAULT bg-primary flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-outline mt-1.5 leading-relaxed">
                      Convert scanned PDFs with non-selectable text into editable Word files.
                    </p>
                  </button>
                </div>
              </div>

              {conversionMode === "ocr" && (
                <div className="mt-3 bg-amber-50 text-amber-800 p-3 rounded-DEFAULT border border-amber-100 text-[11px] leading-relaxed font-medium">
                  🛡️ AI OCR mode transcribes layouts pixel-by-pixel. Recommended for scanned documents, complex tables, and Arabic content.
                </div>
              )}

              {error && (
                <div className="mt-4 bg-amber-50 text-amber-800 p-4 border border-amber-100 rounded-DEFAULT flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={17} />
                  <p className="text-xs leading-relaxed">{error}</p>
                </div>
              )}

              {/* Convert Button */}
              <button
                type="button"
                onClick={startConversion}
                className="mt-6 w-full py-4 bg-primary hover:bg-primary-container text-white font-bold text-sm sm:text-base rounded-DEFAULT shadow-lg shadow-primary/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                Convert to WORD
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ LOADING STATE ═══════════════ */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-DEFAULT bg-primary-fixed flex items-center justify-center mb-6">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-on-surface">Converting your document...</h3>
          <p className="text-sm text-primary font-mono mt-3 animate-pulse max-w-md">{currentProgress}</p>
          <div className="mt-6 w-64 h-1.5 bg-surface-container rounded-DEFAULT overflow-hidden">
            <div className="h-full bg-primary rounded-DEFAULT animate-pulse" style={{ width: "60%" }}></div>
          </div>
        </div>
      )}

      {/* ═══════════════ STATE 3: SUCCESS + DOWNLOAD + EDITOR ═══════════════ */}
      {isState3 && !isLoading && (
        <div className="animate-fade-in">
          {/* Success Header */}
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 bg-primary-fixed rounded-DEFAULT flex items-center justify-center mx-auto mb-5">
              <FileCheck size={28} className="text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Your PDF has been converted to an editable WORD document
            </h2>
            <p className="text-sm text-outline mt-3 max-w-lg mx-auto">
              {pdfFile?.name} — {stats.words} words, {extractedPages.length} pages extracted
            </p>

            {/* Fallback Warning */}
            {extractedPages.some((p) => p.isFallback) && (
              <div className="mt-5 max-w-xl mx-auto bg-amber-50 rounded-DEFAULT p-4 border border-amber-200/60 flex gap-3 text-left items-start shadow-none">
                <AlertTriangle className="shrink-0 text-amber-600 mt-0.5" size={18} />
                <div className="space-y-1 text-xs text-amber-900 leading-relaxed">
                  <h4 className="font-bold tracking-tight text-on-surface">
                    AI Quota Reached — Fallback Data Used
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Your Gemini API quota has been exhausted. The system rendered a formatted document fallback. Set a valid API key to get real OCR results.
                  </p>
                  {extractedPages.find((p) => p.apiError)?.apiError && (
                    <p className="font-mono text-[9px] bg-surface-container-lowest/70 p-2 rounded-lg border border-amber-200/50 text-amber-950 break-words mt-1">
                      {(() => {
                        const rawError = extractedPages.find((p) => p.apiError)?.apiError || "";
                        if (!rawError) return "";
                        try {
                          const parsed = JSON.parse(rawError.trim());
                          return parsed.error?.message || parsed.message || rawError;
                        } catch { return rawError; }
                      })()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <button
                type="button"
                onClick={resetAll}
                className="flex items-center gap-2 px-5 py-3 rounded-DEFAULT border border-outline-variant text-on-surface-variant hover:bg-surface-container-low font-semibold text-sm transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft size={16} />
                Convert another
              </button>

              <button
                type="button"
                onClick={downloadAsWord}
                className={`flex items-center gap-2 px-10 py-4 rounded-lg font-bold text-base shadow-lg transition-all cursor-pointer active:scale-95 ${
                  downloadSuccess
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                    : "bg-primary hover:bg-primary-container text-white shadow-primary/25"
                }`}
              >
                {downloadSuccess ? (
                  <>
                    <Check size={18} /> Downloaded!
                  </>
                ) : (
                  <>
                    <Download size={18} /> Download WORD
                  </>
                )}
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                type="button"
                onClick={handleCopyText}
                className="text-xs text-outline hover:text-primary flex items-center gap-1 transition-colors cursor-pointer font-medium"
              >
                {copied ? <><Check size={13} className="text-emerald-500" /> Copied!</> : <><Clipboard size={13} /> Copy Text</>}
              </button>
              <span className="text-slate-200">|</span>
              <button
                type="button"
                onClick={downloadAsTxt}
                className="text-xs text-outline hover:text-primary flex items-center gap-1 transition-colors cursor-pointer font-medium"
              >
                <FileText size={13} /> Download TXT
              </button>
            </div>
          </div>


        </div>
      )}
    </div>
  );
}
