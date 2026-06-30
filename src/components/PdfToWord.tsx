import React, { useState, useRef, useEffect } from "react";
import { 
  FileText, 
  Upload, 
  Download, 
  Loader2, 
  Sparkles,
  Clipboard,
  Check,
  FileType,
  FileCheck,
  Trash2,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  AlertTriangle,
  Type,
  BookOpen,
  Settings,
  Scale,
  RefreshCcw,
  Heading
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Bind the worker externally to keep consistency with the other PDF utilities in the suite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "6.0.227"}/build/pdf.worker.min.mjs`;

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
  const [documentFont, setDocumentFont] = useState<"Calibri" | "Arial" | "Times New Roman" | "Georgia" | "Courier New">("Calibri");
  const [documentTheme, setDocumentTheme] = useState<"standard" | "professional" | "minimal" | "editorial">("standard");
  const [lineSpacing, setLineSpacing] = useState<"1.0" | "1.15" | "1.5" | "2.0">("1.15");
  const [addPageBreaks, setAddPageBreaks] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

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
        processPdf(file);
      } else {
        setError("Only valid PDF documents are supported for Word conversion.");
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
          const viewport = page.getViewport({ scale: 1.5 }); // 1.5x scaling provides great text clarity for optical OCR
          
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

          const response = await fetch("/api/ocr-pdf-page", {
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
          
          let lastY = -1;
          let pText = "";
          const lines: { y: number; text: string }[] = [];

          // Build logical lines based on element coordinate spacing
          textContent.items.forEach((item: any) => {
            const str = item.str || "";
            if (!str.trim()) return;

            // Find Y coordinate of this text box
            const currentY = item.transform ? item.transform[5] : -1;

            // If close enough to previous coordinate, append to current line; else push a new line
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
            
            // Heuristic to detect headings: short line, capitalized, or structural breaks
            const isHeading = text.length < 60 && 
              (text === text.toUpperCase() || /^[0-9]\.?\s+[A-Z]/.test(text) || text.length < 25);

            if (isHeading) {
              // Commit buffer as standard paragraph
              if (lineBuffer.length > 0) {
                pageTextContent += lineBuffer.join(" ") + "\r\n\r\n";
                lineBuffer = [];
              }
              // Add heading with clean newlines
              pageTextContent += `[HEADING] ${text}\r\n\r\n`;
            } else {
              lineBuffer.push(text);
              // If line ends with period, or it's the last line of the page, commit as a complete paragraph block
              if (text.endsWith(".") || text.endsWith("?") || text.endsWith("!") || index === lines.length - 1) {
                pageTextContent += lineBuffer.join(" ") + "\r\n\r\n";
                lineBuffer = [];
              }
            }
          });

          // Add any remaining line buffers
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

      // Merge all text blocks to display inside the WYSIWYG editor
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
    const readingTime = Math.max(1, Math.round(words / 200)); // 200 words per minute average
    return { words, characters, paragraphs, readingTime };
  };

  const stats = getStatistics();

  const handleCopyText = () => {
    if (!editedText) return;
    navigator.clipboard.writeText(editedText);
    setCopied(true);
  };

  const clearAll = () => {
    if (confirm("Are you sure you want to discard your current converted file?")) {
      setPdfFile(null);
      setExtractedPages([]);
      setEditedText("");
      setError(null);
    }
  };

  // Advanced MS Word download builder (generates compliant HTML/MSWord standard)
  const downloadAsWord = () => {
    if (!editedText) return;
    
    // Select styling parameters based on user configurations
    let primaryColor = "#1e293b"; // Slate-800
    let titleColor = "#0f172a"; // Slate-900
    let headingColor = "#0d9488"; // Teal-600
    let fontStack = "Calibri, Helvetica, sans-serif";
    
    if (documentFont === "Times New Roman") fontStack = "'Times New Roman', Georgia, serif";
    else if (documentFont === "Georgia") fontStack = "Georgia, serif";
    else if (documentFont === "Arial") fontStack = "Arial, sans-serif";
    else if (documentFont === "Courier New") fontStack = "'Courier New', monospace";

    if (documentTheme === "professional") {
      headingColor = "#2563eb"; // Royal Blue
    } else if (documentTheme === "minimal") {
      headingColor = "#111827"; // Carbon dark
      titleColor = "#111827";
    } else if (documentTheme === "editorial") {
      headingColor = "#b91c1c"; // Bordeaux red
      titleColor = "#450a0a";
    }

    const marginValue = "1.0in";
    const lineSpacingValue = lineSpacing;

    // Convert raw editor markup to beautiful HTML layout inside word processor document container
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
        // Render simple clean list style
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
      size: 8.5in 11.0in; /* Letter */
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

  // Simple editor formatting helper actions
  const applyTextTransformer = (action: "uppercase" | "lowercase" | "capitalize" | "heading" | "bullet") => {
    if (!editedText || !editorRef.current) return;
    
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start === end) {
      alert("Please highlight/select a segment of text inside the editor viewport to format it.");
      return;
    }

    const selectedText = editedText.substring(start, end);
    let transformed = "";

    switch (action) {
      case "uppercase":
        transformed = selectedText.toUpperCase();
        break;
      case "lowercase":
        transformed = selectedText.toLowerCase();
        break;
      case "capitalize":
        transformed = selectedText.replace(/\b\w/g, c => c.toUpperCase());
        break;
      case "heading":
        transformed = `\r\n[HEADING] ${selectedText.replace(/\[HEADING\]/g, "").trim()}\r\n`;
        break;
      case "bullet":
        transformed = selectedText.split(/\r?\n/).map(line => line.startsWith("- ") ? line : `- ${line}`).join("\n");
        break;
    }

    const newText = editedText.substring(0, start) + transformed + editedText.substring(end);
    setEditedText(newText);
    
    // Refocus with delay to preserve cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + transformed.length);
    }, 100);
  };

  const removePageBreaks = () => {
    const updated = editedText.replace(/--- PAGE BREAK: PAGE \d+ ---\r?\n\s*/g, "");
    setEditedText(updated.trim());
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Tool Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 px-3 py-1 bg-rose-50 rounded-full">
            PDF Word Processor
          </span>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight mt-1.5">
            PDF to Word Converter
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Extract document streams page-by-page. Analyze document layout formatting to preserve headings, sentences, lists, and output beautifully formatted editable Microsoft Word .DOC layouts instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Drag Setup & Configuration Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main upload arena box */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`min-h-[200px] rounded-2xl border-2 border-dashed transition-all flex flex-col justify-center items-center p-6 bg-white relative ${
              dragActive
                ? "border-rose-500 bg-rose-50/50 scale-[0.99]"
                : "border-slate-200 hover:border-rose-450"
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
                <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto" />
                <div>
                  <h4 className="font-semibold text-slate-700">Deconstructing PDF Layers...</h4>
                  <p className="text-xs text-rose-600 font-mono mt-1 animate-pulse">{currentProgress}</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600 shadow-sm">
                  <FileType size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {pdfFile ? pdfFile.name : "Drag your PDF report here"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 font-sans">
                    Or <span className="text-rose-600 underline font-semibold">browse computer system directory</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2">Supports digital document text extraction.</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-amber-50 text-amber-800 p-4 border border-amber-100 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={17} />
              <div className="space-y-1 text-xs">
                <p className="font-semibold leading-tight">Image-Only Scanning Notice</p>
                <p className="text-slate-600 leading-relaxed font-sans">{error}</p>
              </div>
            </div>
          )}

          {/* Conversion Mode Controls */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-rose-500" />
                Intelligence & OCR Settings
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Choose the layer analysis model for scanning and converting content.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConversionMode("standard")}
                className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  conversionMode === "standard"
                    ? "border-rose-500 bg-rose-50/60 text-rose-700 font-bold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                }`}
              >
                <FileType size={16} className={conversionMode === "standard" ? "text-rose-600" : "text-slate-400"} />
                <div className="text-xs">Standard (Fast)</div>
                <div className="text-[9px] opacity-75 leading-none">Digital text layers</div>
              </button>

              <button
                type="button"
                onClick={() => setConversionMode("ocr")}
                className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  conversionMode === "ocr"
                    ? "border-rose-500 bg-rose-50/60 text-rose-700 font-bold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                }`}
              >
                <Sparkles size={16} className={conversionMode === "ocr" ? "text-rose-600 animate-pulse" : "text-slate-400"} />
                <div className="text-xs">AI OCR Scanner</div>
                <div className="text-[9px] opacity-75 leading-none">Images & Scanned Pages</div>
              </button>
            </div>
            
            {conversionMode === "ocr" && (
              <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-100 text-[10px] leading-relaxed font-medium">
                🛡️ AI OCR mode transcribes layouts pixel-by-pixel. Recommended for unselectable text, non-searchable scans, complex tables, and high-fidelity Arabic content.
              </div>
            )}
          </div>

          {/* Configuration Parameters Panel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-5">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2">
              <Settings size={15} className="text-rose-600" />
              Word Processor Template Settings
            </h3>

            {/* Font Style Selection */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block">Output Primary Font Style</label>
              <select
                value={documentFont}
                onChange={(e: any) => setDocumentFont(e.target.value)}
                disabled={!editedText}
                className="w-full text-xs font-medium bg-slate-50 disabled:opacity-50 border border-slate-200 p-3 rounded-xl focus:bg-white outline-none text-slate-700 cursor-pointer"
              >
                <option value="Calibri">Calibri Corporate (Standard Office Template)</option>
                <option value="Arial">Arial Clean (Geometric Modern Layout)</option>
                <option value="Times New Roman">Times New Roman Editorial (Traditional Academic)</option>
                <option value="Georgia">Georgia Storybook (Premium Literary Serif Style)</option>
                <option value="Courier New">Courier New Codework (Fixed Pitch Monospace)</option>
              </select>
            </div>

            {/* Layout Color Palette Theme */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block">Heading Color Palette</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "standard", label: "Corporate Teal" },
                  { value: "professional", label: "Executive Blue" },
                  { value: "minimal", label: "Ink Charcoal" },
                  { value: "editorial", label: "Bordeaux Crimson" }
                ].map((themeOpt) => (
                  <button
                    key={themeOpt.value}
                    type="button"
                    onClick={() => setDocumentTheme(themeOpt.value as any)}
                    disabled={!editedText}
                    className={`py-2 px-2 disabled:opacity-50 text-[10px] sm:text-xs font-bold rounded-xl border text-center transition-all cursor-pointer truncate ${
                      documentTheme === themeOpt.value
                        ? "border-rose-500 bg-rose-50/50 text-rose-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {themeOpt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Spacing Settings */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block">Line Spacing Height</label>
              <select
                value={lineSpacing}
                onChange={(e: any) => setLineSpacing(e.target.value)}
                disabled={!editedText}
                className="w-full text-xs font-medium bg-slate-50 disabled:opacity-50 border border-slate-200 p-3 rounded-xl focus:bg-white outline-none text-slate-700 cursor-pointer"
              >
                <option value="1.0">Single Space (1.0)</option>
                <option value="1.15">Standard Executive Space (1.15)</option>
                <option value="1.5">Comfortable Wide (1.5)</option>
                <option value="2.0">Double Space (2.0)</option>
              </select>
            </div>

            {/* Preservation Options */}
            <div className="space-y-2 pt-1 border-t border-slate-50">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={addPageBreaks}
                  disabled={!editedText}
                  onChange={(e) => setAddPageBreaks(e.target.checked)}
                  className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                />
                <span>Preserve Page Breaks as Section Dividers</span>
              </label>
            </div>

          </div>

        </div>

        {/* Right Side: Interactive Smart Editor & Action Output Deck */}
        <div className="lg:col-span-8 space-y-6">
          
          {!editedText ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center space-y-4 flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center shadow-inner">
                <BookOpen size={28} />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="font-bold text-slate-800 text-base">Workspace Content View Empty</h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  Upload a standard PDF text report. Upon analyzing files, a draft document will compile here where you can write, edit, and optimize styling before generating MS Word outputs.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-slide-up">
              
              {/* Fallback Warning Box */}
              {extractedPages.some((p) => p.isFallback) && (
                <div className="bg-amber-50 rounded-2xl p-4.5 border border-amber-200/60 flex gap-3 text-amber-905 items-start shadow-xs font-sans text-xs">
                  <AlertTriangle className="shrink-0 text-amber-600 mt-0.5" size={18} />
                  <div className="space-y-1.5 text-xs text-amber-900 leading-relaxed">
                    <h4 className="font-bold tracking-tight text-slate-900">
                      AI Project Quota Reached or Prepayment Depleted (RESOURCE_EXHAUSTED)
                    </h4>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      Your OpenAI API quota is completed or has run out of prepay key credits. To ensure continuous testing of the PDF-to-Word layouts, the system has automatically rendered a high-fidelity formatted document fallback.
                    </p>
                    {extractedPages.find((p) => p.apiError)?.apiError && (
                      <div className="mt-2 text-left">
                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">Exact API Error Response:</p>
                        <p className="font-mono text-[9px] bg-white/70 p-2.5 rounded-xl border border-amber-200/50 leading-relaxed text-amber-950 break-words select-all mt-1">
                          {(() => {
                            const rawError = extractedPages.find((p) => p.apiError)?.apiError || "";
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

              {/* Active Document Stats Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Word Index</span>
                  <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">{stats.words} words</span>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Density</span>
                  <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">{stats.characters} chars</span>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paragraph Map</span>
                  <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">{stats.paragraphs} blocks</span>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reading Duration</span>
                  <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">~{stats.readingTime} min read</span>
                </div>
              </div>

              {/* Advanced Editor Deck container */}
              <div className="bg-white border border-slate-200/85 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                
                {/* Visual Editor Action Toolbar */}
                <div className="bg-slate-50/85 border-b border-slate-100 px-4 py-3 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    
                    <button
                      type="button"
                      onClick={() => applyTextTransformer("heading")}
                      title="Wrap select text into H2 Heading"
                      className="p-1 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[10px] sm:text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Type size={12} className="text-rose-600" /> Heading Accent
                    </button>

                    <button
                      type="button"
                      onClick={() => applyTextTransformer("bullet")}
                      title="Prefix dashed bullet layout"
                      className="p-1 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[10px] sm:text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <List size={12} className="text-rose-600" /> List Bullet
                    </button>

                    <div className="w-[1px] h-5 bg-slate-200 mx-1"></div>

                    <button
                      type="button"
                      onClick={() => applyTextTransformer("uppercase")}
                      title="Transform block to UPPERCASE"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-bold text-slate-650 cursor-pointer"
                    >
                      AA
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTextTransformer("lowercase")}
                      title="Transform block to lowercase"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-bold text-slate-650 cursor-pointer"
                    >
                      aa
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTextTransformer("capitalize")}
                      title="Transform block to Capitalized Word Cases"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-bold text-slate-650 cursor-pointer"
                    >
                      Aa
                    </button>

                    <button
                      type="button"
                      onClick={removePageBreaks}
                      title="Remove all structural Page breaks section tags"
                      className="p-1 px-2.5 rounded-lg border border-rose-100 bg-rose-50/50 hover:bg-rose-100 text-[10px] font-bold text-rose-700 cursor-pointer transition-colors"
                    >
                      Strip Page Breaks
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={clearAll}
                      title="Discard file"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Main Text Contentarea Viewport */}
                <div className="relative">
                  <textarea
                    ref={editorRef}
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full min-h-[380px] max-h-[500px] p-6 text-xs sm:text-sm font-sans text-slate-700 leading-relaxed outline-none border-none resize-y bg-white/50 block focus:bg-white transition-all select-text"
                    placeholder="Extracted file textual layouts appear here..."
                    spellCheck="false"
                  />
                  <div className="bg-slate-50 border-t border-slate-100 px-5 py-2.5 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>💡 Tip: Highlight specific text and click "Heading Accent" or "List Bullet" to inject custom Word formatting tags</span>
                    <span>Scroll to edit text manually</span>
                  </div>
                </div>

              </div>

              {/* Action Buttons Desk (Word, Text, Clipboard options) */}
              <div className="bg-slate-100 border border-slate-200/60 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white px-4 py-2.5 rounded-xl transition-all font-semibold cursor-pointer active:scale-[0.98] shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-500" /> Copied Text!
                      </>
                    ) : (
                      <>
                        <Clipboard size={14} className="text-slate-500" /> Copy Raw Text
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={downloadAsTxt}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white px-4 py-2.5 rounded-xl transition-all font-semibold cursor-pointer active:scale-[0.98] shadow-xs"
                  >
                    <span>Raw TXT Plain</span>
                  </button>
                </div>

                <div className="w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={downloadAsWord}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-rose-500/10 active:scale-95 ${
                      downloadSuccess 
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-rose-600 hover:bg-rose-700"
                    }`}
                  >
                    {downloadSuccess ? (
                      <>
                        <Check size={15} /> Finalized File Downloaded!
                      </>
                    ) : (
                      <>
                        <Download size={15} /> Generate Docx Word File
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
