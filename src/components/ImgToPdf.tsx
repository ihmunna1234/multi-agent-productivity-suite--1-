import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { 
  Upload, 
  Download, 
  Trash2, 
  FileImage, 
  ArrowUp, 
  ArrowDown, 
  FileText,
  Settings,
  X,
  FileCheck,
  Loader2
} from "lucide-react";

interface UploadedImage {
  id: string;
  name: string;
  dataUrl: string;
  size: string;
}

export default function ImgToPdf() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "executive">("a4");
  const [orientation, setOrientation] = useState<"p" | "l">("p"); // p: Portrait, l: Landscape
  const [margin, setMargin] = useState<number>(10); // Standard 10mm margins
  const [fileName, setFileName] = useState<string>("Converted_Document");
  const [compiling, setCompiling] = useState(false);

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

    if (e.dataTransfer.files) {
      loadImages(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      loadImages(Array.from(e.target.files));
    }
  };

  const loadImages = (files: File[]) => {
    const validImageFiles = files.filter((f) => f.type.startsWith("image/"));

    if (validImageFiles.length === 0) return;

    validImageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const sizeInKB = (file.size / 1024).toFixed(0);
        setImages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            dataUrl: reader.result as string,
            size: `${sizeInKB} KB`,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const deleteImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const clearAll = () => {
    if (images.length === 0) return;
    if (confirm("Are you sure you want to discard all uploaded images?")) {
      setImages([]);
    }
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === images.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setImages(updated);
  };

  const compilePDF = async () => {
    if (images.length === 0) return;
    setCompiling(true);

    try {
      // Initialize jsPDF instance with page settings
      const doc = new jsPDF({
        orientation: orientation,
        unit: "mm",
        format: pageSize,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Printable boundaries with customizable margins
      const targetWidth = pageWidth - margin * 2;
      const targetHeight = pageHeight - margin * 2;

      for (let i = 0; i < images.length; i++) {
        if (i > 0) {
          doc.addPage(pageSize, orientation);
        }

        const img = images[i];

        // Create an image element to read native dimensions and calculate appropriate proportions
        const sizeLoader = await new Promise<{ w: number; h: number }>((resolve) => {
          const tempImg = new Image();
          tempImg.onload = () => {
            resolve({ w: tempImg.naturalWidth, h: tempImg.naturalHeight });
          };
          tempImg.src = img.dataUrl;
        });

        // Calculate proportional scale dimensions that fit precisely into our printable page area
        const imageRatio = sizeLoader.w / sizeLoader.h;
        const pageRatio = targetWidth / targetHeight;

        let renderWidth = targetWidth;
        let renderHeight = targetHeight;

        if (imageRatio > pageRatio) {
          // Constrain by width
          renderWidth = targetWidth;
          renderHeight = targetWidth / imageRatio;
        } else {
          // Constrain by height
          renderHeight = targetHeight;
          renderWidth = targetHeight * imageRatio;
        }

        // Center position the proportional image inside standard printable bounds
        const xOffset = margin + (targetWidth - renderWidth) / 2;
        const yOffset = margin + (targetHeight - renderHeight) / 2;

        doc.addImage(img.dataUrl, "JPEG", xOffset, yOffset, renderWidth, renderHeight);
      }

      // Save document download
      const cleanFileName = fileName.trim() ? fileName.replace(/\s+/g, "_") : "document";
      doc.save(`${cleanFileName}.pdf`);
    } catch (e) {
      console.error("PDF Compilation Error:", e);
      alert("An error occurred during PDF compilation. Please try again.");
    } finally {
      setCompiling(false);
    }
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
            Image to PDF Converter
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Batch stitches uploaded images (JPG, PNG, WEBP) into a single, beautifully bound multi-page PDF document. Reorder elements and customize margins instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Document Compilation Settings sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
              <Settings size={18} className="text-teal-600" />
              Document Layout Config
            </h3>

            {/* Document Filename Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 block">PDF Output Name</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="File name"
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white p-3 rounded-xl outline-none transition-all text-slate-700 font-mono"
              />
            </div>

            {/* Document Size Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 block">Page Template Size</label>
              <select
                value={pageSize}
                onChange={(e: any) => setPageSize(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 p-3 rounded-xl focus:bg-white outline-none text-slate-700 cursor-pointer"
              >
                <option value="a4">A4 (Standard ISO Portrait Template)</option>
                <option value="letter">Letter (US Graphic Template Size)</option>
                <option value="executive">Executive Template</option>
              </select>
            </div>

            {/* Margins Scale */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 block">Print Limits Margin</label>
              <select
                value={margin}
                onChange={(e: any) => setMargin(parseInt(e.target.value))}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 p-3 rounded-xl focus:bg-white outline-none text-slate-700 cursor-pointer"
              >
                <option value="0">None (0mm Full Bleed Image View)</option>
                <option value="5">Slim (5mm Content Padding Borders)</option>
                <option value="10">Standard (10mm Default Margins)</option>
                <option value="20">Wide (20mm High Contrast Margins)</option>
              </select>
            </div>

            {/* PDF Orientation Selectors */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500">Document Direction</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOrientation("p")}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                    orientation === "p"
                      ? "border-teal-500 bg-teal-50/50 text-teal-700 font-semibold"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Portrait View
                </button>
                <button
                  onClick={() => setOrientation("l")}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                    orientation === "l"
                      ? "border-teal-500 bg-teal-50/50 text-teal-700 font-semibold"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Landscape View
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Arena & Interactive List reorder */}
        <div className="lg:col-span-8 space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`min-h-[180px] rounded-2xl border-2 border-dashed transition-all flex flex-col justify-center items-center p-6 bg-white relative ${
              dragActive
                ? "border-teal-500 bg-teal-50/50 scale-[0.99]"
                : "border-slate-200 hover:border-teal-400"
            }`}
          >
            <input
              type="file"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept="image/*"
            />
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto text-teal-600 shadow-sm">
                <FileImage size={24} />
              </div>
              <div>
                <h4 className="font-medium text-slate-700">Drag multiple images here</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Or <span className="text-teal-600 underline">select images from folder</span> to convert to multi-page PDF
                </p>
              </div>
            </div>
          </div>

          {/* Re-order list sheet page sequence */}
          {images.length > 0 && (
            <div className="space-y-4 animate-slide-up">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    Document Order List ({images.length} Pages)
                  </h4>
                  <p className="text-xs text-slate-400">Rearrange slides before exporting PDF</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={clearAll}
                    className="text-slate-500 hover:text-red-600 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                  >
                    Discard All
                  </button>
                  <button
                    onClick={compilePDF}
                    disabled={compiling}
                    className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    {compiling ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Compiling...
                      </>
                    ) : (
                      <>
                        <FileCheck size={14} /> Produce PDF Document
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Dynamic scroll list format */}
              <div className="space-y-3">
                {images.map((img, index) => (
                  <div
                    key={img.id}
                    className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
                  >
                    {/* Page ID Number */}
                    <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    {/* Image mini preview */}
                    <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                      <img
                        src={img.dataUrl}
                        alt="Preview node"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* File descriptive parameters */}
                    <div className="flex-1 truncate">
                      <p className="text-xs font-semibold text-slate-700 truncate leading-tight">
                        {img.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">{img.size}</p>
                    </div>

                    {/* Reordering Controls & Delete Action button */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveItem(index, "up")}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1.5 text-slate-400 hover:text-teal-600 disabled:text-slate-200 rounded hover:bg-slate-50 cursor-pointer"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => moveItem(index, "down")}
                        disabled={index === images.length - 1}
                        title="Move Down"
                        className="p-1.5 text-slate-400 hover:text-teal-600 disabled:text-slate-200 rounded hover:bg-slate-50 cursor-pointer"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        onClick={() => deleteImage(img.id)}
                        title="Remove page"
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer"
                      >
                        <Trash2 size={14} />
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
