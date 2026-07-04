import React, { useState, useRef, useEffect } from "react";
import { 
  FileText, 
  Upload, 
  Download, 
  Loader2, 
  Type, 
  Trash2, 
  Sliders, 
  Check, 
  MoveUp, 
  MoveDown, 
  Plus, 
  X,
  Undo2,
  Minimize,
  Maximize,
  PenTool,
  Square,
  Sparkles,
  ClipboardCheck,
  RotateCcw,
  BookOpen,
  Crown,
  MessageSquare,
  FolderOpen,
  List,
  Bookmark,
  MoreHorizontal,
  Minus,
  ZoomIn,
  ZoomOut,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Trash,
  HelpCircle
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { jsPDF } from "jspdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "6.0.227"}/build/pdf.worker.min.mjs`;

interface EditorTextOverlay {
  id: string;
  text: string;
  x: number; // percentage coordinate 0 to 100 for responsiveness
  y: number; // percentage coordinate 0 to 100
  fontSize: number;
  color: string;
  fontStyle: "italic" | "normal";
  fontWeight: "bold" | "normal";
  textDecoration: "underline" | "none" | "line-through";
  alignment: "left" | "center" | "right";
  fontFamily: string;
}

interface EditorShapeOverlay {
  id: string;
  type: "highlight" | "censor";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface EditorStampOverlay {
  id: string;
  type: "APPROVED" | "CONFIDENTIAL" | "DRAFT" | "CERTIFIED";
  x: number;
  y: number;
  scale: number;
}

interface PdfEditorPage {
  id: string;
  pageNumberIndex: number; // reference origin index
  dataUrl: string;
  width: number;
  height: number;
  texts: EditorTextOverlay[];
  shapes: EditorShapeOverlay[];
  stamps: EditorStampOverlay[];
}

export default function PdfEditor() {
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);

  // Editor page tree state
  const [pages, setPages] = useState<PdfEditorPage[]>([]);
  const [activePageIdx, setActivePageIdx] = useState(0);

  // Selection model
  const [selectedElement, setSelectedElement] = useState<{ type: "text" | "shape" | "stamp"; id: string; pageIndex: number } | null>(null);

  // Active tools state
  const [activeTab, setActiveTab] = useState<"annotate" | "edit">("edit");
  const [activeTool, setActiveTool] = useState<"select" | "add-text" | "add-highlight" | "add-censor" | "add-stamp">("add-text");
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Left sidebar state
  const [leftSidebarTab, setLeftSidebarTab] = useState<"pages" | "list" | "bookmarks" | "more">("pages");
  const [thumbnailSize, setThumbnailSize] = useState<number>(45); // slider scale of page thumbnails
  
  // Center Zoom level
  const [zoomLevel, setZoomLevel] = useState<number>(55.0); // slider percent

  // Formatting parameters (synced to the current selection or sets defaults)
  const [textColor, setTextColor] = useState<string>("#000052"); // dark royal indigo default
  const [textSize, setTextSize] = useState<number>(14);
  const [textFontFamily, setTextFontFamily] = useState<string>("Inter");
  const [textFontWeight, setTextFontWeight] = useState<"bold" | "normal">("bold");
  const [textFontStyle, setTextFontStyle] = useState<"italic" | "normal">("normal");
  const [textDecoration, setTextDecoration] = useState<"underline" | "none" | "line-through">("none");
  const [textAlignment, setTextAlignment] = useState<"left" | "center" | "right">("left");
  
  const [stampSelectedType, setStampSelectedType] = useState<"APPROVED" | "CONFIDENTIAL" | "DRAFT" | "CERTIFIED">("CONFIDENTIAL");
  const [customColorsList, setCustomColorsList] = useState<string[]>(["#000000", "#e11d48", "#2563eb", "#16a34a", "#d97706", "#6b21a8"]);
  const [isAddingCustomColor, setIsAddingCustomColor] = useState(false);
  const [newColorInput, setNewColorInput] = useState("#3b82f6");

  const [downloadSuccess, setDownloadSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activePageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Automatically update formatting controls if user selects an existing text
  useEffect(() => {
    if (selectedElement && selectedElement.type === "text") {
      const page = pages[selectedElement.pageIndex];
      const text = page.texts.find(t => t.id === selectedElement.id);
      if (text) {
        setTextColor(text.color);
        setTextSize(text.fontSize);
        setTextFontFamily(text.fontFamily || "Inter");
        setTextFontWeight(text.fontWeight);
        setTextFontStyle(text.fontStyle);
        setTextDecoration(text.textDecoration || "none");
        setTextAlignment(text.alignment || "left");
      }
    }
  }, [selectedElement, pages]);

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
        loadPdfForEditing(file);
      } else {
        alert("Only valid PDF documents are supported inside the edit deck.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadPdfForEditing(e.target.files[0]);
    }
  };

  const loadPdfForEditing = async (file: File) => {
    setLoading(true);
    setPdfFile(file);
    setFileName(file.name);
    setPages([]);
    setActivePageIdx(0);
    setSelectedElement(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      const list: PdfEditorPage[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");

        if (context) {
          await page.render({ canvasContext: context, viewport } as any).promise;
          const dataUrl = canvas.toDataURL("image/png");

          list.push({
            id: `page_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            pageNumberIndex: i - 1,
            dataUrl,
            width: viewport.width,
            height: viewport.height,
            texts: [],
            shapes: [],
            stamps: []
          });
        }
      }

      setPages(list);
    } catch (err) {
      console.error("PDF Parsing edit load defect:", err);
      alert("Could not render selected PDF. Ensure it is not encrypted or protected.");
    } finally {
      setLoading(false);
    }
  };

  // Pre-load layout with interactive practice document instantly 
  const loadInvoiceTemplatePractice = () => {
    setLoading(true);
    setFileName("Tax_Invoice_Mortakazat_Al_Amaar.pdf");
    
    // Create pre-built mock canvas elements to fake standard tax invoice structures for fast testing without uploading
    setTimeout(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 794; // Standard A4 points ratio
      canvas.height = 1123;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        // Draw elegant mockup background invoice papers
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid background lines
        ctx.strokeStyle = "#f1f5f9";
        ctx.lineWidth = 1;
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Invoice header blocks
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(50, 60, 60, 60); // logo box
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 22px Helvetica";
        ctx.fillText("M", 72, 98);

        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 16px Helvetica";
        ctx.fillText("Mortakazat Al-Amaar Company", 130, 80);
        
        ctx.fillStyle = "#475569";
        ctx.font = "11px Helvetica";
        ctx.fillText("VAT Number: 314258292040003", 130, 96);
        ctx.fillText("Makkah, Kingdom of Saudi Arabia", 130, 112);

        // Arabic Header Right
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 15px sans-serif";
        ctx.fillText("شركة مرتكزات الإعمار مقاولات عامة", 480, 80);
        ctx.fillStyle = "#475569";
        ctx.font = "11px sans-serif";
        ctx.fillText("الرقم الضريبي ٣١٤٢٥٨٢٩٢٠٤٠٠٠٣", 480, 98);

        // Centered Invoice title
        ctx.fillStyle = "#0f172a";
        ctx.font = "black 26px Helvetica";
        ctx.fillText("Tax Invoice فاتورة ضريبية", 220, 190);

        // Divider
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(50, 220); ctx.lineTo(744, 220); ctx.stroke();

        // Customer details
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 12px Helvetica";
        ctx.fillText("CLIENT / العميل:", 50, 250);
        ctx.font = "12px Helvetica";
        ctx.fillText("Consul Arabia Contracting Ltd.", 160, 250);
        ctx.fillText("Date / التاريخ: 2026-06-08", 50, 270);
        ctx.fillText("Invoice No: INV-000100", 50, 290);

        // Table headers
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(50, 320, 694, 30);
        ctx.strokeRect(50, 320, 694, 30);
        
        ctx.fillStyle = "#334155";
        ctx.font = "bold 11px Helvetica";
        ctx.fillText("No.", 65, 340);
        ctx.fillText("Description / الوصف", 110, 340);
        ctx.fillText("Qty / الكمية", 450, 340);
        ctx.fillText("Price / السعر", 530, 340);
        ctx.fillText("Line Total / المجموع", 630, 340);

        // Line Item 1
        ctx.fillStyle = "#1e293b";
        ctx.font = "11px Helvetica";
        ctx.fillText("1", 65, 385);
        ctx.fillText("Cladding Work (Alucobond cladding installation)", 110, 385);
        ctx.fillText("337.24 m²", 450, 385);
        ctx.fillText("90.00 SAR", 530, 385);
        ctx.fillText("30,351.60 SAR", 630, 385);

        // Line Item 2
        ctx.fillText("2", 65, 425);
        ctx.fillText("Finishing and Paint Works", 110, 425);
        ctx.fillText("20 days", 450, 425);
        ctx.fillText("650.00 SAR", 530, 425);
        ctx.fillText("13,000.00 SAR", 630, 425);

        // Double fine total grid divider
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(50, 460); ctx.lineTo(744, 460); ctx.stroke();

        // Totals summary section
        ctx.font = "bold 11px Helvetica";
        ctx.fillText("Subtotal / المجموع الفرعي:", 460, 490);
        ctx.fillText("VAT (15%) / ضريبة القيمة المضافة:", 460, 510);
        ctx.font = "bold 13px Helvetica";
        ctx.fillStyle = "#dc2626";
        ctx.fillText("TOTAL DUE / المجموع الإجمالي:", 460, 540);

        ctx.font = "bold 11px Helvetica";
        ctx.fillStyle = "#1e293b";
        ctx.fillText("43,351.60 SAR", 640, 490);
        ctx.fillText("6,502.74 SAR", 640, 510);
        ctx.font = "bold 13px Helvetica";
        ctx.fillStyle = "#dc2626";
        ctx.fillText("49,854.34 SAR", 640, 540);

        // Place mock physical stamp graphic at the bottom right
        ctx.strokeStyle = "rgba(30, 58, 138, 0.4)";
        ctx.lineWidth = 3;
        ctx.strokeRect(550, 640, 140, 60);
        ctx.fillStyle = "rgba(30, 58, 138, 0.7)";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("MORTAKAZAT AL-AMAAR", 560, 665);
        ctx.font = "9px sans-serif";
        ctx.fillText("CONTRACTING CO.", 580, 685);

        // Render QR Code placeholder
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(80, 640, 90, 90);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(90, 650, 70, 70);
        
        ctx.fillStyle = "#1e293b";
        // simulate some QR boxes
        ctx.fillRect(95, 655, 15, 15);
        ctx.fillRect(140, 655, 15, 15);
        ctx.fillRect(95, 700, 15, 15);
        ctx.fillRect(115, 675, 10, 10);
        ctx.fillRect(135, 685, 15, 10);
        ctx.fillRect(145, 705, 10, 10);

        // Add bottom footer notes
        ctx.fillStyle = "#64748b";
        ctx.font = "italic 9px Helvetica";
        ctx.fillText("Thank you for your business. Payment is expected within 15 working days.", 220, 820);
      }

      setPages([
        {
          id: "page_practice_1",
          pageNumberIndex: 0,
          dataUrl: canvas.toDataURL("image/png"),
          width: 794,
          height: 1123,
          texts: [
            {
              id: "text_practice_1",
              text: "URGENT PAYMENT DUE",
              x: 58,
              y: 22,
              fontSize: 12,
              color: "#dc2626",
              fontStyle: "normal",
              fontFamily: "Inter",
              fontWeight: "bold",
              textDecoration: "underline",
              alignment: "center"
            }
          ],
          shapes: [
            {
              id: "shape_practice_1",
              type: "highlight",
              x: 62.5,
              y: 47.1,
              width: 15,
              height: 2.2,
              color: "rgba(253, 224, 71, 0.35)"
            }
          ],
          stamps: [
            {
              id: "stamp_practice_1",
              type: "APPROVED",
              x: 18,
              y: 19.5,
              scale: 1.1
            }
          ]
        }
      ]);
      setLoading(false);
    }, 1100);
  };

  // Thumbnail navigation actions
  const movePageUp = (idx: number) => {
    if (idx === 0) return;
    setPages(prev => {
      const copy = [...prev];
      const target = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = target;
      return copy;
    });
    setActivePageIdx(prev => Math.max(0, prev - 1));
  };

  const movePageDown = (idx: number) => {
    if (idx === pages.length - 1) return;
    setPages(prev => {
      const copy = [...prev];
      const target = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = target;
      return copy;
    });
    setActivePageIdx(prev => Math.min(pages.length - 1, prev + 1));
  };

  const deletePage = (idx: number) => {
    if (pages.length === 1) {
      alert("Cannot delete the only remaining page of the document workspace.");
      return;
    }
    if (confirm("Are you sure you want to delete this page from your file layout?")) {
      setPages(prev => prev.filter((_, i) => i !== idx));
      setSelectedElement(null);
      setActivePageIdx(prev => Math.max(0, prev - 1));
    }
  };

  // Interactive sandbox click drop-in tools
  const handlePageStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === "select") {
      // Clear selection if they click background directly
      if (e.target === activePageRef.current) {
        setSelectedElement(null);
      }
      return;
    }

    const rect = activePageRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Relative percentage offsets
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const currentId = `el_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    if (activeTool === "add-text") {
      const newText: EditorTextOverlay = {
        id: currentId,
        text: "Add custom notes here...",
        x: Math.max(2, Math.min(x, 80)),
        y: Math.max(2, Math.min(y - 2, 95)),
        fontSize: textSize,
        color: textColor,
        fontFamily: textFontFamily,
        fontStyle: textFontStyle,
        fontWeight: textFontWeight,
        textDecoration: textDecoration,
        alignment: textAlignment
      };

      setPages(prev => {
        const copy = [...prev];
        copy[activePageIdx].texts.push(newText);
        return copy;
      });

      setSelectedElement({ type: "text", id: currentId, pageIndex: activePageIdx });
      setEditingTextId(currentId);
      setActiveTool("select"); // switch back to selection pointer
    } else if (activeTool === "add-highlight") {
      const newShape: EditorShapeOverlay = {
        id: currentId,
        type: "highlight",
        x: Math.max(0, Math.min(x, 90)),
        y: Math.max(0, Math.min(y - 1, 95)),
        width: 14, 
        height: 2.2,  
        color: "rgba(253, 224, 71, 0.4)" // transparent highlight yellow
      };

      setPages(prev => {
        const copy = [...prev];
        copy[activePageIdx].shapes.push(newShape);
        return copy;
      });

      setSelectedElement({ type: "shape", id: currentId, pageIndex: activePageIdx });
      setActiveTool("select");
    } else if (activeTool === "add-censor") {
      const newShape: EditorShapeOverlay = {
        id: currentId,
        type: "censor",
        x: Math.max(0, Math.min(x, 85)),
        y: Math.max(0, Math.min(y - 1.5, 95)),
        width: 16,
        height: 3.5,
        color: "#0c0d12" // black block
      };

      setPages(prev => {
        const copy = [...prev];
        copy[activePageIdx].shapes.push(newShape);
        return copy;
      });

      setSelectedElement({ type: "shape", id: currentId, pageIndex: activePageIdx });
      setActiveTool("select");
    } else if (activeTool === "add-stamp") {
      const newStamp: EditorStampOverlay = {
        id: currentId,
        type: stampSelectedType,
        x: Math.max(2, Math.min(x - 5, 80)),
        y: Math.max(2, Math.min(y - 3, 90)),
        scale: 1.0
      };

      setPages(prev => {
        const copy = [...prev];
        copy[activePageIdx].stamps.push(newStamp);
        return copy;
      });

      setSelectedElement({ type: "stamp", id: currentId, pageIndex: activePageIdx });
      setActiveTool("select");
    }
  };

  // Dragging logic for overlays
  const [draggedElement, setDraggedElement] = useState<{ type: "text" | "shape" | "stamp"; id: string; offsetX: number; offsetY: number } | null>(null);

  const startDragOverlay = (e: React.MouseEvent, type: "text" | "shape" | "stamp", id: string) => {
    e.stopPropagation();
    setSelectedElement({ type, id, pageIndex: activePageIdx });
    
    const element = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - element.left;
    const offsetY = e.clientY - element.top;

    setDraggedElement({
      type,
      id,
      offsetX,
      offsetY
    });
  };

  const handleMovingOverlay = (e: React.MouseEvent) => {
    if (!draggedElement || !activePageRef.current) return;
    e.preventDefault();

    const rect = activePageRef.current.getBoundingClientRect();
    
    // Position of cursor relative to page center
    let clientX = e.clientX;
    let clientY = e.clientY;

    const x = ((clientX - rect.left - draggedElement.offsetX) / rect.width) * 100;
    const y = ((clientY - rect.top - draggedElement.offsetY) / rect.height) * 100;

    // Bounds limit 0 to 100
    const clampedX = Math.max(0, Math.min(95, x));
    const clampedY = Math.max(0, Math.min(95, y));

    setPages(prev => {
      const copy = [...prev];
      const page = copy[activePageIdx];

      if (draggedElement.type === "text") {
        const elementIndex = page.texts.findIndex(t => t.id === draggedElement.id);
        if (elementIndex !== -1) {
          page.texts[elementIndex] = { ...page.texts[elementIndex], x: clampedX, y: clampedY };
        }
      } else if (draggedElement.type === "shape") {
        const elementIndex = page.shapes.findIndex(s => s.id === draggedElement.id);
        if (elementIndex !== -1) {
          page.shapes[elementIndex] = { ...page.shapes[elementIndex], x: clampedX, y: clampedY };
        }
      } else if (draggedElement.type === "stamp") {
        const elementIndex = page.stamps.findIndex(s => s.id === draggedElement.id);
        if (elementIndex !== -1) {
          page.stamps[elementIndex] = { ...page.stamps[elementIndex], x: clampedX, y: clampedY };
        }
      }

      return copy;
    });
  };

  const handleStopOverlayDrag = () => {
    if (draggedElement) {
      setDraggedElement(null);
    }
  };

  const deleteSelectedElement = () => {
    if (!selectedElement) return;

    setPages(prev => {
      const copy = [...prev];
      const page = copy[selectedElement.pageIndex];

      if (selectedElement.type === "text") {
        page.texts = page.texts.filter(t => t.id !== selectedElement.id);
      } else if (selectedElement.type === "shape") {
        page.shapes = page.shapes.filter(s => s.id !== selectedElement.id);
      } else if (selectedElement.type === "stamp") {
        page.stamps = page.stamps.filter(s => s.id !== selectedElement.id);
      }

      return copy;
    });

    setSelectedElement(null);
    setEditingTextId(null);
  };

  // Formatting state mutations mapping back to active text selection
  const updateSelectedTextStyle = (key: keyof EditorTextOverlay, value: any) => {
    if (!selectedElement || selectedElement.type !== "text") return;
    setPages(prev => {
      const copy = [...prev];
      const page = copy[selectedElement.pageIndex];
      const textIdx = page.texts.findIndex(t => t.id === selectedElement.id);
      if (textIdx !== -1) {
        page.texts[textIdx] = { ...page.texts[textIdx], [key]: value };
      }
      return copy;
    });
  };

  const handleTextValueChange = (val: string) => {
    updateSelectedTextStyle("text", val);
  };

  const handleTextSizeChange = (size: number) => {
    setTextSize(size);
    updateSelectedTextStyle("fontSize", size);
  };

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    updateSelectedTextStyle("color", color);
  };

  const handleTextFontFamilyChange = (fam: string) => {
    setTextFontFamily(fam);
    updateSelectedTextStyle("fontFamily", fam);
  };

  const handleTextAlignmentChange = (align: "left" | "center" | "right") => {
    setTextAlignment(align);
    updateSelectedTextStyle("alignment", align);
  };

  const toggleTextBold = () => {
    const nextWeight = textFontWeight === "bold" ? "normal" : "bold";
    setTextFontWeight(nextWeight);
    updateSelectedTextStyle("fontWeight", nextWeight);
  };

  const toggleTextItalic = () => {
    const nextStyle = textFontStyle === "italic" ? "normal" : "italic";
    setTextFontStyle(nextStyle);
    updateSelectedTextStyle("fontStyle", nextStyle);
  };

  const toggleTextUnderline = () => {
    const nextDecor = textDecoration === "underline" ? "none" : "underline";
    setTextDecoration(nextDecor);
    updateSelectedTextStyle("textDecoration", nextDecor);
  };

  const toggleTextStrikethrough = () => {
    const nextDecor = textDecoration === "line-through" ? "none" : "line-through";
    setTextDecoration(nextDecor);
    updateSelectedTextStyle("textDecoration", nextDecor);
  };

  const handleResizeShape = (id: string, dimension: "w" | "h", change: number) => {
    setPages(prev => {
      const copy = [...prev];
      const page = copy[activePageIdx];
      const idx = page.shapes.findIndex(s => s.id === id);
      if (idx !== -1) {
        if (dimension === "w") {
          page.shapes[idx].width = Math.max(1.5, page.shapes[idx].width + change);
        } else {
          page.shapes[idx].height = Math.max(0.5, page.shapes[idx].height + change);
        }
      }
      return copy;
    });
  };

  const handleScaleStamp = (id: string, multiplier: number) => {
    setPages(prev => {
      const copy = [...prev];
      const page = copy[activePageIdx];
      const idx = page.stamps.findIndex(s => s.id === id);
      if (idx !== -1) {
        page.stamps[idx].scale = Math.max(0.4, Math.min(2.5, page.stamps[idx].scale * multiplier));
      }
      return copy;
    });
  };

  const handleAddCustomColor = () => {
    if (newColorInput && !customColorsList.includes(newColorInput)) {
      setCustomColorsList(prev => [...prev, newColorInput]);
      setTextColor(newColorInput);
      updateSelectedTextStyle("color", newColorInput);
    }
    setIsAddingCustomColor(false);
  };

  // Build finalized document & download
  const saveFinalizedPdf = async () => {
    if (pages.length === 0) return;
    setLoading(true);

    try {
      // Establish jsPDF document mapping base sizes
      const doc = new jsPDF({
        orientation: pages[0].width > pages[0].height ? "landscape" : "portrait",
        unit: "pt", // points mapping
        format: [pages[0].width, pages[0].height]
      });

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          doc.addPage([pages[i].width, pages[i].height], pages[i].width > pages[i].height ? "landscape" : "portrait");
        }

        const page = pages[i];
        
        // Background Page PNG
        doc.addImage(
          page.dataUrl,
          "PNG",
          0,
          0,
          page.width,
          page.height,
          undefined,
          "FAST"
        );

        // Render shapes rectangles (highlights + blackout censors)
        page.shapes.forEach(shape => {
          const pX = (shape.x / 100) * page.width;
          const pY = (shape.y / 100) * page.height;
          const pW = (shape.width / 100) * page.width;
          const pH = (shape.height / 100) * page.height;

          if (shape.type === "highlight") {
            doc.setFillColor(254, 240, 138); // light canary yellow marker
            doc.rect(pX, pY, pW, pH, "F");
          } else {
            doc.setFillColor(15, 23, 42); // deep slate censorship matte blackout
            doc.rect(pX, pY, pW, pH, "F");
          }
        });

        // Add corporate stamp overlays
        page.stamps.forEach(stamp => {
          const pX = (stamp.x / 100) * page.width;
          const pY = (stamp.y / 100) * page.height;
          const sizeW = 120 * stamp.scale;
          const sizeH = 45 * stamp.scale;

          let r = 220, g = 38, b = 38; // standard red
          if (stamp.type === "CERTIFIED") { r = 13; g = 148; b = 136; } // teal
          if (stamp.type === "APPROVED") { r = 22; g = 163; b = 74; } // emerald
          if (stamp.type === "DRAFT") { r = 217; g = 119; b = 6; } // orange

          doc.setDrawColor(r, g, b);
          doc.setLineWidth(2.5 * stamp.scale);
          doc.rect(pX, pY, sizeW, sizeH, "D");

          doc.setTextColor(r, g, b);
          doc.setFont("Helvetica", "bold");
          const fontSizeAdjust = Math.round(11 * stamp.scale);
          doc.setFontSize(fontSizeAdjust);

          const textMarginX = sizeW / 2;
          const textMarginY = sizeH / 2 + (fontSizeAdjust / 3.5);

          doc.text(stamp.type, pX + textMarginX, pY + textMarginY, { align: "center" });
        });

        // Add customized Draggable text layers on top
        page.texts.forEach(text => {
          const ptSize = text.fontSize || 12;
          const pX = (text.x / 100) * page.width;
          const pY = (text.y / 100) * page.height + ptSize;

          doc.setFontSize(ptSize);
          
          // Parse hex to RGB
          const hex = text.color.replace("#", "");
          const r = parseInt(hex.substring(0, 2), 16) || 0;
          const g = parseInt(hex.substring(2, 4), 16) || 0;
          const b = parseInt(hex.substring(4, 6), 16) || 0;

          doc.setTextColor(r, g, b);
          doc.setFont("Helvetica", text.fontWeight);
          
          // Optional underline
          if (text.textDecoration === "underline") {
            doc.text(text.text, pX, pY);
            const stringWidth = doc.getTextWidth(text.text);
            doc.setDrawColor(r, g, b);
            doc.setLineWidth(1);
            doc.line(pX, pY + 2, pX + stringWidth, pY + 2);
          } else if (text.textDecoration === "line-through") {
            doc.text(text.text, pX, pY);
            const stringWidth = doc.getTextWidth(text.text);
            doc.setDrawColor(r, g, b);
            doc.setLineWidth(1);
            doc.line(pX, pY - (ptSize / 3.0), pX + stringWidth, pY - (ptSize / 3.0));
          } else {
            doc.text(text.text, pX, pY);
          }
        });
      }

      doc.save(`Edited_${fileName || "document.pdf"}`);
      setDownloadSuccess(true);
    } catch (e) {
      console.error("PDF compiling output error: ", e);
      alert("Failed to compile layout changes back into standard PDF structure.");
    } finally {
      setLoading(false);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const getActivePageDetails = () => {
    if (pages.length === 0) return { textCount: 0, annotationCount: 0 };
    const page = pages[activePageIdx];
    return {
      textCount: page.texts.length,
      annotationCount: page.shapes.length + page.stamps.length
    };
  };

  // Navigation page helper limits
  const prevPage = () => setActivePageIdx(p => Math.max(0, p - 1));
  const nextPage = () => setActivePageIdx(p => Math.min(pages.length - 1, p + 1));

  // Font family list
  const fontOptions = ["Inter", "Helvetica", "Arial", "Times New Roman", "Courier New", "Georgia", "Verdana"];
  const fontSizeOptions = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48];

  return (
    <div className="flex flex-col bg-surface-container-low border border-outline-variant rounded-lg overflow-hidden min-h-[780px] text-on-surface shadow-none animate-fade-in">
      
      {/* 1. TOP HEADER NAVIGATION BLOCK */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant bg-surface-container-lowest select-none shrink-0 min-h-[52px]">
        {/* Left Toggle and auxiliary tools */}
        <div className="flex items-center gap-3.5">
          {/* Segmented Button group: Annotate & Edit */}
          <div className="flex bg-surface-container p-0.5 rounded-lg border border-outline-variant">
            <button
              onClick={() => setActiveTab("annotate")}
              className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 cursor-pointer transition ${
                activeTab === "annotate"
                  ? "bg-surface-container-lowest text-on-surface shadow-none"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              <PenTool size={11} className="text-slate-650" />
              <span>Annotate</span>
            </button>
            <button
              onClick={() => setActiveTab("edit")}
              className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 cursor-pointer transition ${
                activeTab === "edit"
                  ? "bg-surface-container-lowest text-on-surface shadow-none border-none"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              <span>Edit</span>
              <Crown size={11} className="text-amber-500 fill-amber-500 animate-pulse" />
            </button>
          </div>

          <span className="w-px h-5 bg-surface-container-high"></span>

          {/* Book icon & hand icon tools */}
          <button 
            onClick={() => setLeftSidebarTab(leftSidebarTab === "pages" ? "more" : "pages")}
            className={`p-1.5 rounded-md cursor-pointer transition ${leftSidebarTab === "pages" ? "bg-red-50 text-red-600 border border-red-100" : "hover:bg-surface-container text-outline"}`}
            title="Toggle Split Layout Drawer"
          >
            <BookOpen size={14} className={leftSidebarTab === "pages" ? "text-red-500" : ""} />
          </button>
          
          <button 
            onClick={() => {
              setActiveTool("select");
              setSelectedElement(null);
            }}
            className={`p-1.5 rounded-md cursor-pointer transition ${activeTool === "select" ? "bg-surface-container text-on-surface border" : "hover:bg-surface-container text-outline"}`}
            title="Pan / Pointer Select"
          >
            <Sliders size={14} />
          </button>
        </div>

        {/* Center Main Action Ribbon buttons */}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={() => {
              setActiveTool("add-text");
              setActiveTab("edit");
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-DEFAULT flex items-center gap-1 cursor-pointer transition ${
              activeTool === "add-text"
                ? "bg-red-50 text-red-650 border border-red-200 shadow-none"
                : "hover:bg-surface-container-low text-slate-650"
            }`}
          >
            <Type size={13} className="text-red-600" />
            <span className="hidden sm:inline">Annotate</span>
          </button>

          <button
            onClick={() => {
              setActiveTool("add-highlight");
              setActiveTab("annotate");
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-DEFAULT flex items-center gap-1 cursor-pointer transition ${
              activeTool === "add-highlight"
                ? "bg-amber-50 text-amber-850 border border-amber-200 shadow-none"
                : "hover:bg-surface-container-low text-slate-650"
            }`}
          >
            <Square size={13} className="text-amber-500 fill-amber-200/50" />
            <span className="hidden sm:inline">Shapes</span>
          </button>

          <button
            onClick={() => {
              setActiveTool("add-censor");
              setActiveTab("annotate");
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-DEFAULT flex items-center gap-1 cursor-pointer transition ${
              activeTool === "add-censor"
                ? "bg-inverse-surface text-white shadow-none"
                : "hover:bg-surface-container-low text-slate-650"
            }`}
          >
            <Square size={12} className="fill-slate-800 text-outline" />
            <span className="hidden sm:inline">Insert Block</span>
          </button>

          <button
            onClick={() => {
              setActiveTool("add-text");
              setActiveTab("edit");
              // default cursor dropped
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-DEFAULT flex items-center gap-1 cursor-pointer transition ${
              activeTool === "add-text" && activeTab === "edit"
                ? "bg-red-500 text-white shadow-none"
                : "hover:bg-surface-container-low text-slate-650"
            }`}
          >
            <span className="text-xs font-extrabold text-red-600 block bg-red-100 rounded px-1 group-hover:bg-red-200">TI</span>
            <span className="ml-1">Edit Text</span>
          </button>

          <button
            onClick={() => {
              setActiveTool("add-stamp");
              setActiveTab("edit");
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-DEFAULT flex items-center gap-1.5 cursor-pointer transition ${
              activeTool === "add-stamp"
                ? "bg-primary-fixed text-teal-850 border border-teal-200 shadow-none"
                : "hover:bg-surface-container-low text-slate-650"
            }`}
          >
            <ClipboardCheck size={13} className="text-primary" />
            <span className="hidden sm:inline">Forms / Stamps</span>
          </button>
        </div>

        {/* Right Feedback Speech bubbles */}
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={loadInvoiceTemplatePractice}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-primary-container bg-primary-fixed hover:bg-primary-fixed-dim border border-teal-200/60 rounded-lg cursor-pointer transition"
          >
            <Sparkles size={11} className="text-primary" />
            <span>Load Practice Doc</span>
          </button>
          
          <button className="p-1.5 hover:bg-surface-container rounded-md text-outline-variant cursor-pointer transition">
            <MessageSquare size={14} />
          </button>
        </div>
      </div>

      {/* 2. SUB-ROW OPTIONAL DECORATIVE LINE FOR PILCROW, ALIGNMENTS AND IMAGES */}
      <div className="flex items-center justify-center gap-7 py-1 px-4 border-b border-slate-150 bg-surface-container-low text-outline-variant text-xs shadow-inner shrink-0 min-h-[30px]">
        <span className="flex items-center gap-1 select-none font-mono text-[10px] text-outline-variant">
          <span className="font-sans">¶</span> Paragraph Tools
        </span>
        <span className="w-px h-3.5 bg-surface-container-high"></span>
        <span className="flex items-center gap-1 font-mono text-[10px] text-outline-variant">
          <FolderOpen size={10} /> Graphics
        </span>
        <span className="w-px h-3.5 bg-surface-container-high"></span>
        <span className="flex items-center gap-1 text-[10px] font-bold text-red-650 bg-red-50 px-2 py-0.5 rounded-md">
          <Type size={10} /> Text formatting active
        </span>
      </div>

      {pages.length === 0 ? (
        /* Workspace state empty load form */
        <div className="flex-1 p-8 flex flex-col justify-center items-center min-h-[500px]">
          
          {/* Drag action box */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`w-full max-w-xl min-h-[300px] border-2 border-dashed rounded-lg transition-all flex flex-col justify-center items-center p-8 bg-surface-container-lowest ${
              dragActive
                ? "border-red-500 bg-red-50/10 scale-[0.99]"
                : "border-outline-variant hover:border-red-400 hover:shadow-none"
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
                <Loader2 className="w-10 h-10 text-red-600 animate-spin mx-auto" />
                <div>
                  <h4 className="font-bold text-on-surface-variant">Decompressing PDF Core Vectors...</h4>
                  <p className="text-xs text-outline-variant mt-1">Stitching document frames page-by-page</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-14 h-14 bg-red-50 rounded-DEFAULT flex items-center justify-center mx-auto text-red-500 shadow-inner">
                  <FileText size={24} />
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-extrabold text-on-surface text-base">
                    Drag & Drop PDF document here
                  </h3>
                  <p className="text-xs text-outline-variant font-sans max-w-sm">
                    Open invoices, corporate records, or certificate templates to insert seals, markup text blocks, or blackout details immediately.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 bg-inverse-surface hover:bg-slate-800 text-white text-xs font-bold rounded-DEFAULT transition shadow-none cursor-pointer"
                  >
                    Browse Local Files
                  </button>
                  
                  <button
                    type="button"
                    onClick={loadInvoiceTemplatePractice}
                    className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-650 text-xs font-bold rounded-DEFAULT border border-red-200 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Sparkles size={13} className="text-red-500" />
                    <span>Practice with Demo Invoice</span>
                  </button>
                </div>

                <div className="text-[10px] text-outline-variant pt-4 flex gap-4 justify-center">
                  <span>🔒 Safe client render processing</span>
                  <span>⚡ Merges text seamlessly</span>
                </div>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Workspace loaded sandbox dashboard matrix */
        <div className="flex-1 flex flex-col lg:flex-row min-h-[640px] bg-surface-container relative">
          
          {/* COLUMN 1: LEFT SLIDING THUMBNAILS PANEL */}
          <div className="w-full lg:w-[230px] border-b lg:border-b-0 lg:border-r border-outline-variant bg-surface-container-lowest flex flex-col shrink-0">
            {/* Headers Tab (4 icons as reference) */}
            <div className="grid grid-cols-4 border-b border-outline-variant">
              <button
                onClick={() => setLeftSidebarTab("pages")}
                className={`py-3 flex justify-center text-outline transition cursor-pointer ${leftSidebarTab === "pages" ? "border-b-2 border-red-500 bg-red-50/10 text-on-surface" : "hover:bg-surface-container-low"}`}
                title="Page Thumbnails"
              >
                <FolderOpen size={14} className={leftSidebarTab === "pages" ? "text-red-500" : ""} />
              </button>
              <button
                onClick={() => setLeftSidebarTab("list")}
                className={`py-3 flex justify-center text-outline transition cursor-pointer ${leftSidebarTab === "list" ? "border-b-2 border-red-500 bg-red-50/10 text-on-surface" : "hover:bg-surface-container-low"}`}
                title="Document Elements List"
              >
                <List size={14} className={leftSidebarTab === "list" ? "text-on-surface" : ""} />
              </button>
              <button
                onClick={() => setLeftSidebarTab("bookmarks")}
                className={`py-3 flex justify-center text-outline transition cursor-pointer ${leftSidebarTab === "bookmarks" ? "border-b-2 border-red-500 bg-red-50/10 text-on-surface" : "hover:bg-surface-container-low"}`}
                title="Bookmarks"
              >
                <Bookmark size={14} className={leftSidebarTab === "bookmarks" ? "text-on-surface" : ""} />
              </button>
              <button
                onClick={() => setLeftSidebarTab("more")}
                className={`py-3 flex justify-center text-outline transition cursor-pointer ${leftSidebarTab === "more" ? "border-b-2 border-red-500 bg-red-50/10 text-on-surface" : "hover:bg-surface-container-low"}`}
                title="More Options"
              >
                <MoreHorizontal size={14} className={leftSidebarTab === "more" ? "text-on-surface" : ""} />
              </button>
            </div>

            {/* Thumbnail sizing horizontal range bar under tabs */}
            <div className="p-2 border-b border-surface-container-highest flex items-center justify-between gap-1 bg-surface-container-low text-outline-variant shrink-0 select-none">
              <Minus size={11} />
              <input
                type="range"
                min="30"
                max="75"
                value={thumbnailSize}
                onChange={(e) => setThumbnailSize(parseInt(e.target.value))}
                className="w-full h-1 accent-red-500 cursor-pointer bg-surface-container-high rounded"
              />
              <Plus size={11} />
            </div>

            {/* Scrollable list content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[150px] lg:max-h-[500px]">
              
              {leftSidebarTab === "pages" && (
                <div className="space-y-4">
                  {pages.map((page, idx) => {
                    const isActive = activePageIdx === idx;
                    return (
                      <div
                        key={page.id}
                        onClick={() => {
                          setActivePageIdx(idx);
                          setSelectedElement(null);
                        }}
                        className={`group p-2 border rounded-DEFAULT transition cursor-pointer bg-surface-container-lowest ${
                          isActive
                            ? "ring-2 ring-red-500 border-transparent shadow shadow-red-200"
                            : "border-outline-variant hover:border-slate-400"
                        }`}
                      >
                        {/* Miniature layout viewbox resizing according to slider */}
                        <div 
                          className="mx-auto border border-surface-container-highest bg-surface-container-low rounded-md overflow-hidden relative shadow-none"
                          style={{ width: `${thumbnailSize * 2}px`, aspectRatio: "3/4" }}
                        >
                          <img 
                            src={page.dataUrl} 
                            alt={`Preview Thumbnail ${idx + 1}`}
                            className="w-full h-full object-contain pointer-events-none select-none"
                            referrerPolicy="no-referrer"
                          />
                          
                          {/* Elements Badge */}
                          {(page.texts.length > 0 || page.shapes.length > 0 || page.stamps.length > 0) && (
                            <span className="absolute bottom-1 right-1 bg-red-600 text-white text-[8px] font-extrabold px-1 rounded">
                              {page.texts.length + page.shapes.length + page.stamps.length}
                            </span>
                          )}
                        </div>

                        {/* Caption Page index */}
                        <span className="block text-center text-xs font-bold text-outline mt-2 font-mono group-hover:text-red-500 transition">
                          {idx + 1}
                        </span>

                        {/* Multi-page controls overlay */}
                        <div className="mt-1 flex items-center justify-between opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                          <div className="flex gap-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); movePageUp(idx); }}
                              disabled={idx === 0}
                              className="p-1 disabled:opacity-25 hover:bg-surface-container text-outline hover:text-on-surface rounded cursor-pointer"
                              title="Shift Up"
                            >
                              <MoveUp size={10} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); movePageDown(idx); }}
                              disabled={idx === pages.length - 1}
                              className="p-1 disabled:opacity-25 hover:bg-surface-container text-outline hover:text-on-surface rounded cursor-pointer"
                              title="Shift Down"
                            >
                              <MoveDown size={10} />
                            </button>
                          </div>
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); deletePage(idx); }}
                            className="p-1 text-outline-variant hover:text-red-650 hover:bg-red-50 rounded cursor-pointer"
                            title="Delete this page"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {leftSidebarTab === "list" && (
                <div className="space-y-3 font-sans text-xs">
                  <span className="font-bold text-[10px] text-outline-variant uppercase tracking-widest block">Active Elements</span>
                  {pages[activePageIdx].texts.length === 0 && pages[activePageIdx].shapes.length === 0 && pages[activePageIdx].stamps.length === 0 ? (
                    <p className="text-outline-variant italic text-center py-4">No overlay elements added on active page.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {pages[activePageIdx].texts.map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => setSelectedElement({ type: "text", id: t.id, pageIndex: activePageIdx })}
                          className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${selectedElement?.id === t.id ? "bg-red-50 border-red-200 text-red-950 font-bold" : "bg-surface-container-low hover:bg-surface-container border-outline-variant"}`}
                        >
                          <span className="truncate max-w-[120px] font-mono leading-none">"{t.text}"</span>
                          <span className="text-[9px] text-red-500 uppercase tracking-wider">text</span>
                        </div>
                      ))}
                      {pages[activePageIdx].shapes.map(s => (
                        <div 
                          key={s.id} 
                          onClick={() => setSelectedElement({ type: "shape", id: s.id, pageIndex: activePageIdx })}
                          className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${selectedElement?.id === s.id ? "bg-red-50 border-red-200 text-on-surface font-bold" : "bg-surface-container-low hover:bg-surface-container border-outline-variant"}`}
                        >
                          <span className="truncate capitalize font-mono text-[10px]">{s.type} frame</span>
                          <span className="text-[9px] text-amber-500 uppercase tracking-wider">shape</span>
                        </div>
                      ))}
                      {pages[activePageIdx].stamps.map(st => (
                        <div 
                          key={st.id} 
                          onClick={() => setSelectedElement({ type: "stamp", id: st.id, pageIndex: activePageIdx })}
                          className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${selectedElement?.id === st.id ? "bg-red-50 border-red-200 text-on-surface font-bold" : "bg-surface-container-low hover:bg-surface-container border-outline-variant"}`}
                        >
                          <span className="font-extrabold text-[10px] font-mono text-emerald-800">{st.type}</span>
                          <span className="text-[9px] text-primary uppercase tracking-wider">stamp</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {leftSidebarTab === "bookmarks" && (
                <div className="text-center py-6 text-outline-variant space-y-1">
                  <Bookmark className="w-5 h-5 mx-auto text-outline-variant" />
                  <p className="text-[11px] font-bold">No bookmarks found</p>
                  <p className="text-[10px] leading-tight text-outline-variant font-sans">Double click coordinates to save outlines.</p>
                </div>
              )}

              {leftSidebarTab === "more" && (
                <div className="space-y-2 pt-1 font-sans text-xs">
                  <button
                    onClick={() => {
                      if (confirm("Reset current draft page of document? Discards overlays.")) {
                        setPages(prev => {
                          const copy = [...prev];
                          copy[activePageIdx].texts = [];
                          copy[activePageIdx].shapes = [];
                          copy[activePageIdx].stamps = [];
                          return copy;
                        });
                        setSelectedElement(null);
                      }
                    }}
                    className="w-full text-left p-2.5 rounded-lg border border-outline-variant hover:bg-rose-50 hover:text-rose-700 transition font-bold"
                  >
                    Clear Page Elements
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Discard all changes and clear the entire PDF file?")) {
                        setPdfFile(null);
                        setPages([]);
                        setSelectedElement(null);
                      }
                    }}
                    className="w-full text-left p-2.5 rounded-lg border border-outline-variant hover:bg-surface-container text-red-600 transition font-bold"
                  >
                    Close PDF Document
                  </button>
                </div>
              )}

            </div>

            {/* Bottom auxiliary metadata block */}
            <div className="p-3.5 border-t border-outline-variant bg-surface-container-low text-[10px] font-mono text-outline-variant select-none shrink-0 mt-auto leading-relaxed">
              <span className="block font-bold">WORKSPACE DETAILS:</span>
              <span className="block truncate text-outline font-sans mt-0.5">{fileName}</span>
              <span className="block text-outline mt-0.5">Scale: {pages[activePageIdx].width}x{pages[activePageIdx].height} pt</span>
            </div>
          </div>

          {/* COLUMN 2: CENTER WORKSPACE CANVASED STAGE */}
          <div className="flex-1 bg-surface-container flex flex-col items-center justify-between p-4 relative overflow-hidden">
            
            {/* Quick alert context reminder */}
            {activeTool !== "select" && (
              <div className="w-full max-w-xl mx-auto mb-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-DEFAULT text-amber-900 text-xs font-semibold text-center shadow-none flex items-center justify-center gap-1.5 animate-fade-in z-20 shrink-0 select-none">
                <span className="w-2 h-2 rounded-DEFAULT bg-amber-500 animate-ping"></span>
                <span>Active Tool: Click on the PDF layout below to place styled element: <strong className="uppercase">{activeTool}</strong></span>
              </div>
            )}

            {/* Interactive central physical document representation wrapped in viewport boundaries with shadow */}
            <div
              ref={containerRef}
              className="flex-1 w-full overflow-auto flex items-center justify-center relative pattern-grid py-6 select-none"
            >
              
              {/* Dynamic Scaling Wrapper based on Zoom level */}
              <div
                ref={activePageRef}
                onClick={handlePageStageClick}
                onMouseMove={handleMovingOverlay}
                onMouseUp={handleStopOverlayDrag}
                onMouseLeave={handleStopOverlayDrag}
                className="relative bg-surface-container-lowest shadow-2xl rounded-sm border border-slate-350 select-none transition-all flex-shrink-0 origin-center"
                style={{
                  width: `${pages[activePageIdx].width}px`,
                  height: `${pages[activePageIdx].height}px`,
                  transform: `scale(${zoomLevel / 100.0})`,
                  cursor: activeTool !== "select" ? "crosshair" : "default"
                }}
              >
                
                {/* PDF Page Rastered background layout */}
                <img 
                  src={pages[activePageIdx].dataUrl} 
                  alt="Primary editor viewport render static canvas layer"
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                  referrerPolicy="no-referrer"
                />

                {/* Draw Shapes overlays */}
                {pages[activePageIdx].shapes.map(shape => {
                  const isSelected = selectedElement?.id === shape.id;
                  return (
                    <div
                      key={shape.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement({ type: "shape", id: shape.id, pageIndex: activePageIdx });
                      }}
                      onMouseDown={(e) => startDragOverlay(e, "shape", shape.id)}
                      className={`absolute rounded transition group border-2 ${
                        isSelected
                          ? "border-red-600 shadow-none ring-1 ring-red-300 cursor-move z-30"
                          : "border-transparent hover:border-slate-400 cursor-pointer z-10"
                      }`}
                      style={{
                        left: `${shape.x}%`,
                        top: `${shape.y}%`,
                        width: `${shape.width}%`,
                        height: `${shape.height}%`,
                        backgroundColor: shape.color,
                        boxSizing: "border-box"
                      }}
                    >
                      {/* Delete cross */}
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); deleteSelectedElement(); }}
                          className="absolute -top-3.5 -right-3.5 w-5 h-5 bg-red-600 rounded-DEFAULT text-white flex items-center justify-center cursor-pointer hover:bg-red-700 z-50 shadow"
                        >
                          <X size={10} />
                        </button>
                      )}

                      {/* Resize Handle widgets */}
                      {isSelected && (
                        <div className="absolute right-0 bottom-0 bg-red-600 text-white rounded p-1 text-[8px] translate-x-1 translate-y-1 flex gap-1 z-30">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleResizeShape(shape.id, "w", 2); }}
                            className="hover:bg-red-700 font-extrabold px-1 cursor-pointer"
                            title="Grow width size"
                          >
                            W+
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleResizeShape(shape.id, "h", 1.5); }}
                            className="hover:bg-red-700 font-extrabold px-1 cursor-pointer"
                            title="Grow height size"
                          >
                            H+
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Draw Signature corporate stamps */}
                {pages[activePageIdx].stamps.map(stamp => {
                  const isSelected = selectedElement?.id === stamp.id;
                  
                  let colorClass = "border-red-600 text-red-600";
                  if (stamp.type === "APPROVED") colorClass = "border-emerald-600 text-emerald-600 bg-emerald-50/10";
                  if (stamp.type === "CERTIFIED") colorClass = "border-primary text-primary bg-primary-fixed/10";
                  if (stamp.type === "DRAFT") colorClass = "border-amber-600 text-amber-600 bg-amber-50/10";

                  return (
                    <div
                      key={stamp.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement({ type: "stamp", id: stamp.id, pageIndex: activePageIdx });
                      }}
                      onMouseDown={(e) => startDragOverlay(e, "stamp", stamp.id)}
                      className={`absolute border-2 font-extrabold select-none text-center rounded shadow-none p-1 uppercase tracking-wider leading-tight ${colorClass} ${
                        isSelected
                          ? "ring-2 ring-red-500 scale-[1.01] cursor-move z-30"
                          : "hover:border-dashed hover:scale-[1.01] cursor-pointer z-10"
                      }`}
                      style={{
                        left: `${stamp.x}%`,
                        top: `${stamp.y}%`,
                        width: `${110 * stamp.scale}px`,
                        height: `${42 * stamp.scale}px`,
                        fontSize: `${10 * stamp.scale}px`,
                        borderWidth: `${2 * stamp.scale}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <span>{stamp.type}</span>

                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); deleteSelectedElement(); }}
                          className="absolute -top-3.5 -right-3.5 w-5 h-5 bg-red-600 rounded-DEFAULT text-white flex items-center justify-center cursor-pointer hover:bg-red-700 z-50 shadow"
                        >
                          <X size={10} />
                        </button>
                      )}

                      {/* Display scaling controls */}
                      {isSelected && (
                        <div className="absolute right-0 bottom-0 bg-slate-950 text-white text-[7px] translate-y-full rounded flex font-bold divide-x divide-slate-800 z-50">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleScaleStamp(stamp.id, 1.15); }}
                            className="p-1 px-1.5 hover:bg-slate-800 cursor-pointer"
                          >
                            +
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleScaleStamp(stamp.id, 0.85); }}
                            className="p-1 px-1.5 hover:bg-slate-800 cursor-pointer"
                          >
                            -
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Draw custom texts draggable overlay */}
                {pages[activePageIdx].texts.map(text => {
                  const isSelected = selectedElement?.id === text.id;
                  const isEditing = editingTextId === text.id;

                  return (
                    <div
                      key={text.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement({ type: "text", id: text.id, pageIndex: activePageIdx });
                      }}
                      onMouseDown={(e) => startDragOverlay(e, "text", text.id)}
                      className={`absolute p-1 py-1.5 rounded-md text-left select-text ${
                        isSelected 
                          ? "shadow-lg bg-surface-container-lowest border-2 border-red-500 cursor-move z-35" 
                          : "hover:ring-1 hover:ring-slate-400 bg-surface-container-lowest/70 backdrop-blur-xs cursor-pointer z-10"
                      }`}
                      style={{
                        left: `${text.x}%`,
                        top: `${text.y}%`,
                        color: text.color,
                        fontSize: `${text.fontSize}px`,
                        fontStyle: text.fontStyle,
                        fontWeight: text.fontWeight,
                        textDecoration: text.textDecoration,
                        textAlign: text.alignment,
                        fontFamily: text.fontFamily,
                        lineHeight: "1.0",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {/* Delete target text widget */}
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); deleteSelectedElement(); }}
                          className="absolute -top-3.5 -right-3.5 w-4.5 h-4.5 bg-red-650 rounded-DEFAULT text-white flex items-center justify-center cursor-pointer hover:bg-red-750 z-50 shadow"
                        >
                          <X size={9} />
                        </button>
                      )}

                      {isEditing ? (
                        <input
                          type="text"
                          value={text.text}
                          onChange={(e) => handleTextValueChange(e.target.value)}
                          onBlur={() => setEditingTextId(null)}
                          onKeyDown={(e) => { if (e.key === "Enter") setEditingTextId(null); }}
                          className="bg-surface-container-low border-b border-red-500 outline-none p-0 text-on-surface font-sans focus:bg-surface-container-lowest max-w-[280px]"
                          style={{ fontSize: `${text.fontSize}px`, color: text.color, textAlign: text.alignment, fontFamily: text.fontFamily }}
                          autoFocus
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => setEditingTextId(text.id)}
                          className="block min-w-[50px] select-all cursor-text text-sm font-sans"
                          style={{ fontFamily: text.fontFamily, fontSize: `${text.fontSize}px` }}
                          title="Double-click to fast type"
                        >
                          {text.text || "Type Note String..."}
                        </span>
                      )}
                    </div>
                  );
                })}

              </div>

            </div>

            {/* FLOATING STATUS & CONTROL NAV STRIP (Matches bottom of the centered sheet) */}
            <div className="w-full max-w-xl bg-inverse-surface text-outline-variant rounded-DEFAULT p-2 px-4 shadow-xl border border-slate-700/50 flex flex-wrap items-center justify-between gap-4 shrink-0 transition-all select-none z-10 my-1">
              {/* Page Selector Block: Up, Down keys, edit current field */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevPage}
                  disabled={activePageIdx === 0}
                  className="p-1 disabled:opacity-30 hover:bg-slate-800 rounded-lg text-slate-100 transition cursor-pointer"
                  title="Previous page frame"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {/* Index field preview */}
                <div className="flex items-center gap-1 font-mono text-xs">
                  <span className="bg-slate-800 text-white font-bold p-1 px-2.5 rounded border border-slate-700">
                    {activePageIdx + 1}
                  </span>
                  <span className="text-outline-variant">/</span>
                  <span className="text-outline-variant">{pages.length}</span>
                </div>

                <button
                  type="button"
                  onClick={nextPage}
                  disabled={activePageIdx === pages.length - 1}
                  className="p-1 disabled:opacity-30 hover:bg-slate-800 rounded-lg text-slate-100 transition cursor-pointer"
                  title="Next page frame"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Slider / Zoom control buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.max(20, z - 7))}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-100 transition cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>

                {/* Field percentage tracker */}
                <span className="text-xs font-mono font-bold bg-slate-800 p-1 px-3 rounded border border-slate-700 text-teal-400">
                  {zoomLevel.toFixed(1)}%
                </span>

                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.min(150, z + 7))}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-100 transition cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
              </div>

              {/* Layout Fit settings triggers */}
              <div className="flex items-center gap-1.5 text-outline-variant">
                <button
                  onClick={() => setZoomLevel(100.0)}
                  className="p-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-705 text-white p-1 px-2 rounded-lg cursor-pointer transition border border-slate-700"
                  title="Fit to Actual 100% Size"
                >
                  1:1 Ratio
                </button>
                <button
                  onClick={() => setZoomLevel(29.5)}
                  className="p-1 text-[10px] bg-slate-800 hover:bg-slate-705 text-white font-mono p-1 px-2 rounded-lg cursor-pointer transition border border-slate-700"
                  title="Set zoom scale like reference"
                >
                  29.5% View
                </button>
              </div>
            </div>

          </div>

          {/* COLUMN 3: RIGHT PANEL - ELEMENT STYLE FORMATTER DECK */}
          <div className="w-full lg:w-[280px] shrink-0 border-t lg:border-t-0 lg:border-l border-outline-variant bg-surface-container-lowest p-5 flex flex-col justify-between select-none max-h-full">
            
            <div className="space-y-6">
              {/* Header Label */}
              <div>
                <h3 className="font-extrabold text-xs text-outline-variant uppercase tracking-widest block border-b border-surface-container-highest pb-1.5 flex items-center justify-between">
                  <span>Text Styles</span>
                  {selectedElement?.type === "text" && (
                    <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded uppercase">
                      Selected
                    </span>
                  )}
                </h3>
              </div>

              {/* Dropdown selects layout */}
              <div className="space-y-3.5">
                {/* Font Selector Combobox */}
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider block">Font Family</span>
                  <select
                    value={textFontFamily}
                    onChange={(e) => handleTextFontFamilyChange(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-xs font-bold font-sans text-on-surface-variant focus:bg-surface-container-lowest focus:ring-1 focus:ring-red-500 outline-none cursor-pointer transition"
                  >
                    {fontOptions.map(fam => (
                      <option key={fam} value={fam}>{fam}</option>
                    ))}
                  </select>
                </div>

                {/* Font Size dropdown combobox */}
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider block">Font Size</span>
                  <select
                    value={textSize}
                    onChange={(e) => handleTextSizeChange(parseInt(e.target.value))}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-xs font-bold font-mono text-on-surface-variant focus:bg-surface-container-lowest focus:ring-1 focus:ring-red-500 outline-none cursor-pointer transition"
                  >
                    {fontSizeOptions.map(sz => (
                      <option key={sz} value={sz}>{sz} pt</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* FIRST ROW BUTTON CHIPS: B I U Strike-through */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider block text-left">Styles Weight</span>
                
                <div className="grid grid-cols-4 gap-1 select-none">
                  <button
                    onClick={toggleTextBold}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg text-center cursor-pointer flex items-center justify-center transition border ${
                      textFontWeight === "bold"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-surface-container-low hover:bg-surface-container border-outline-variant text-outline"
                    }`}
                    title="Bold"
                  >
                    <Bold size={13} className="stroke-[2.5]" />
                  </button>
                  <button
                    onClick={toggleTextItalic}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg text-center cursor-pointer flex items-center justify-center transition border ${
                      textFontStyle === "italic"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-surface-container-low hover:bg-surface-container border-outline-variant text-outline"
                    }`}
                    title="Italic"
                  >
                    <Italic size={13} />
                  </button>
                  <button
                    onClick={toggleTextUnderline}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg text-center cursor-pointer flex items-center justify-center transition border ${
                      textDecoration === "underline"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-surface-container-low hover:bg-surface-container border-outline-variant text-outline"
                    }`}
                    title="Underline"
                  >
                    <Underline size={13} />
                  </button>
                  <button
                    onClick={toggleTextStrikethrough}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg text-center cursor-pointer flex items-center justify-center transition border ${
                      textDecoration === "line-through"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-surface-container-low hover:bg-surface-container border-outline-variant text-outline"
                    }`}
                    title="Strike-through"
                  >
                    <Strikethrough size={13} />
                  </button>
                </div>
              </div>

              {/* SECOND ROW BUTTON CHIPS: Alignments left, center, right */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider block text-left">Alignments spacing</span>
                
                <div className="grid grid-cols-3 gap-1 select-none">
                  <button
                    onClick={() => handleTextAlignmentChange("left")}
                    className={`py-1.5 rounded-lg text-center cursor-pointer flex items-center justify-center transition border ${
                      textAlignment === "left"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-surface-container-low hover:bg-surface-container border-outline-variant text-outline"
                    }`}
                  >
                    <AlignLeft size={13} />
                  </button>
                  <button
                    onClick={() => handleTextAlignmentChange("center")}
                    className={`py-1.5 rounded-lg text-center cursor-pointer flex items-center justify-center transition border ${
                      textAlignment === "center"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-surface-container-low hover:bg-surface-container border-outline-variant text-outline"
                    }`}
                  >
                    <AlignCenter size={13} />
                  </button>
                  <button
                    onClick={() => handleTextAlignmentChange("right")}
                    className={`py-1.5 rounded-lg text-center cursor-pointer flex items-center justify-center transition border ${
                      textAlignment === "right"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-surface-container-low hover:bg-surface-container border-outline-variant text-outline"
                    }`}
                  >
                    <AlignRight size={13} />
                  </button>
                </div>
              </div>

              {/* LINK ICON ROW */}
              <div className="flex justify-start text-left">
                <button className="flex items-center gap-1.5 text-xs text-slate-450 hover:text-on-surface transition py-1 cursor-pointer">
                  <Link size={13} />
                  <span className="underline font-sans font-medium text-[11px]">Attach hyperlink target</span>
                </button>
              </div>

              <span className="block border-t border-surface-container-highest pt-1"></span>

              {/* CURRENT COLOR ROW */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-left">
                  <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider">Current Color</span>
                  <span className="text-[9px] font-mono font-bold text-outline-variant">{textColor}</span>
                </div>
                
                <div className="flex items-center gap-3 select-none">
                  {/* Big indicator circle */}
                  <div 
                    className="w-10 h-10 rounded-DEFAULT border border-outline shadow-inner flex items-center justify-center relative shrink-0"
                    style={{ backgroundColor: textColor }}
                  >
                    <span className="w-2.5 h-2.5 rounded-DEFAULT bg-surface-container-lowest shadow-none"></span>
                  </div>

                  {/* Fill toggle or double palette symbol mock */}
                  <div className="border border-outline-variant rounded-lg p-1 px-2.5 bg-surface-container-low text-[10px] max-w-full text-outline leading-tight text-left">
                    🎨 Font & Stroke merged color
                  </div>
                </div>
              </div>

              {/* CUSTOM SWATCHES VIEWBOARD */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider block text-left font-sans">Custom Swatches</span>
                
                <div className="flex flex-wrap gap-2 items-center">
                  {customColorsList.map((col) => {
                    const isPicked = textColor === col;
                    return (
                      <button
                        key={col}
                        onClick={() => handleTextColorChange(col)}
                        className={`w-7 h-7 rounded-DEFAULT border cursor-pointer hover:scale-110 transition shadow-inner relative flex items-center justify-center ${
                          isPicked ? "ring-2 ring-red-500 scale-105" : "border-outline"
                        }`}
                        style={{ backgroundColor: col }}
                        title={col}
                      >
                        {isPicked && <span className="w-1.5 h-1.5 rounded-DEFAULT bg-surface-container-lowest shadow"></span>}
                      </button>
                    );
                  })}

                  {/* Circle plus button */}
                  <button
                    onClick={() => setIsAddingCustomColor(!isAddingCustomColor)}
                    className="w-7 h-7 rounded-DEFAULT border border-outline bg-surface-container-lowest text-on-surface-variant hover:text-on-surface flex items-center justify-center cursor-pointer hover:bg-surface-container-low transition shadow-none font-bold"
                    title="Add Custom Hex Code Shader"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {isAddingCustomColor && (
                  <div className="bg-surface-container-low p-2.5 rounded-DEFAULT border border-outline-variant space-y-2 animate-fade-in text-left">
                    <span className="text-[9px] font-bold text-outline block leading-none">ENTER HEX CODE</span>
                    <div className="flex gap-1.5">
                      <input
                        type="color"
                        value={newColorInput}
                        onChange={(e) => setNewColorInput(e.target.value)}
                        className="w-7 h-7 rounded border border-outline cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={newColorInput}
                        onChange={(e) => setNewColorInput(e.target.value)}
                        className="flex-1 bg-surface-container-lowest border border-outline-variant rounded px-2 py-0 text-xs font-mono"
                        placeholder="#ffffff"
                      />
                      <button
                        onClick={handleAddCustomColor}
                        className="bg-red-500 hover:bg-red-650 text-white text-[10px] font-bold p-1 px-2.5 rounded cursor-pointer"
                      >
                        Set
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Stamp setup choices when Stamp tool is selected */}
              {activeTool === "add-stamp" && (
                <div className="bg-surface-container-low p-3 rounded-DEFAULT border border-slate-150 text-left space-y-2 pt-2 animate-fade-in">
                  <span className="text-[10px] font-bold text-on-primary-fixed uppercase tracking-widest block leading-none">Stamp Preset Config</span>
                  <p className="text-[9px] text-outline-variant font-sans leading-relaxed">Choose rubber stamp to affix on layout:</p>
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {(["APPROVED", "CONFIDENTIAL", "DRAFT", "CERTIFIED"] as const).map(style => (
                      <button
                        key={style}
                        onClick={() => setStampSelectedType(style)}
                        className={`p-1.5 rounded text-[10px] uppercase font-mono font-bold border transition cursor-pointer text-center ${
                          stampSelectedType === style
                            ? "bg-primary border-primary text-white shadow-none"
                            : "bg-surface-container-lowest hover:bg-surface-container border-outline-variant text-slate-650"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* BIG RED MATTE CORPORATE BUTTON "Save changes --->" (Matches the screenshot button beautifully!) */}
            <div className="pt-6 shrink-0 mt-6 lg:mt-0 select-none">
              <button
                type="button"
                onClick={saveFinalizedPdf}
                className={`w-full py-4 px-6 rounded-lg font-bold font-sans text-white text-base shadow-xl flex items-center justify-between transition-all duration-300 active:scale-95 border-none cursor-pointer ${
                  downloadSuccess 
                    ? "bg-emerald-600 shadow-emerald-500/20" 
                    : "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                }`}
              >
                <span className="tracking-wide">
                  {downloadSuccess ? "Compiling finished!" : "Save changes"}
                </span>

                <div className="w-8 h-8 rounded-DEFAULT bg-surface-container-lowest/20 flex items-center justify-center">
                  {downloadSuccess ? (
                    <Check size={16} className="text-white" />
                  ) : (
                    <span className="text-white font-extrabold text-sm font-mono">&rarr;</span>
                  )}
                </div>
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
