import React, { useState, useRef } from "react";
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
  Loader2,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Check,
  GripVertical
} from "lucide-react";

interface UploadedImage {
  id: string;
  name: string;
  dataUrl: string;
  size: string;
}

export default function ImgToPdf() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "executive">("a4");
  const [orientation, setOrientation] = useState<"p" | "l">("p");
  const [margin, setMargin] = useState<number>(10);
  const [fileName, setFileName] = useState<string>("Converted_Document");
  const [compiling, setCompiling] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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
      setDownloadSuccess(false);
    }
  };

  const compilePDF = async () => {
    if (images.length === 0) return;
    setCompiling(true);

    try {
      const doc = new jsPDF({
        orientation: orientation,
        unit: "mm",
        format: pageSize,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const targetWidth = pageWidth - margin * 2;
      const targetHeight = pageHeight - margin * 2;

      for (let i = 0; i < images.length; i++) {
        if (i > 0) {
          doc.addPage(pageSize, orientation);
        }

        const img = images[i];

        const sizeLoader = await new Promise<{ w: number; h: number }>((resolve) => {
          const tempImg = new Image();
          tempImg.onload = () => {
            resolve({ w: tempImg.naturalWidth, h: tempImg.naturalHeight });
          };
          tempImg.src = img.dataUrl;
        });

        const imageRatio = sizeLoader.w / sizeLoader.h;
        const pageRatio = targetWidth / targetHeight;

        let renderWidth = targetWidth;
        let renderHeight = targetHeight;

        if (imageRatio > pageRatio) {
          renderWidth = targetWidth;
          renderHeight = targetWidth / imageRatio;
        } else {
          renderHeight = targetHeight;
          renderWidth = targetHeight * imageRatio;
        }

        const xOffset = margin + (targetWidth - renderWidth) / 2;
        const yOffset = margin + (targetHeight - renderHeight) / 2;

        doc.addImage(img.dataUrl, "JPEG", xOffset, yOffset, renderWidth, renderHeight);
      }

      const cleanFileName = fileName.trim() ? fileName.replace(/\s+/g, "_") : "document";
      doc.save(`${cleanFileName}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (e) {
      console.error("PDF Compilation Error:", e);
      alert("An error occurred during PDF compilation. Please try again.");
    } finally {
      setCompiling(false);
    }
  };

  const estimatedSizeMB = (images.reduce((acc, img) => acc + parseFloat(img.size), 0) * 0.9 / 1024).toFixed(1);

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 pb-12 pt-6">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">Convert Images to PDF</h1>
        <p className="text-outline mt-3 max-w-xl mx-auto leading-relaxed">
          Easily combine multiple images into a single professional PDF document. Fast, secure, and formatting maintained.
        </p>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start mt-4">
        {/* LEFT COLUMN: Upload & Gallery */}
        <div className="space-y-6">
          {/* Main Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all relative cursor-pointer ${
              dragActive
                ? "border-primary bg-primary-fixed/50 scale-[1.01]"
                : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"
            }`}
          >
            <input
              type="file"
              multiple
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept="image/*"
            />
            <div className="mx-auto w-12 h-12 text-primary mb-4 flex items-center justify-center pointer-events-none">
              <FileImage size={40} strokeWidth={1.5} className={dragActive ? "animate-bounce" : ""} />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2 pointer-events-none">Drag & drop images here</h3>
            <p className="text-sm text-outline mb-6 pointer-events-none">Supports JPG, PNG, TIFF. Max 50MB total.</p>
            <button
              type="button"
              className="mx-auto flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-DEFAULT font-semibold text-sm transition-colors cursor-pointer pointer-events-none relative z-0 shadow-sm"
            >
              <Upload size={16} /> Select Files
            </button>
          </div>

          {/* Uploaded Images Header + Grid */}
          {images.length > 0 && (
            <div className="border border-outline-variant rounded-xl bg-surface-container-lowest overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-surface-container-highest">
                <h4 className="font-bold text-sm text-on-surface">Uploaded Images ({images.length})</h4>
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                >
                  <Trash2 size={14} /> Clear All
                </button>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 bg-surface-container-low/30">
                {images.map((img, index) => (
                  <div
                    key={img.id}
                    className="relative group border border-outline-variant rounded-lg overflow-hidden bg-surface-container-lowest shadow-none hover:shadow-md transition-all"
                  >
                    {/* Delete overlay button */}
                    <button
                      onClick={() => deleteImage(img.id)}
                      className="absolute top-2 right-2 bg-white/95 p-1.5 rounded-DEFAULT text-error opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50 shadow cursor-pointer border border-red-100"
                    >
                      <Trash2 size={14} />
                    </button>
                    {/* Image */}
                    <div className="aspect-[4/3] bg-surface-container-low flex items-center justify-center overflow-hidden border-b border-outline-variant">
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* Label */}
                    <div className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm flex items-center gap-1 border border-outline-variant">
                      <GripVertical size={10} className="text-outline-variant" /> {index + 1}
                    </div>
                    <div className="p-3 bg-surface-container-lowest">
                      <p className="text-xs font-bold text-on-surface truncate" title={img.name}>{img.name}</p>
                      <p className="text-[10px] text-outline mt-0.5">{img.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Settings Sidebar */}
        <div className="border border-outline-variant rounded-xl bg-surface-container-lowest p-6 sticky top-6">
          <h3 className="font-bold text-lg text-on-surface mb-6">Document Settings</h3>

          <div className="space-y-6">
            {/* Page Size */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-outline">Page Size</label>
              <select
                value={pageSize}
                onChange={(e: any) => setPageSize(e.target.value)}
                className="w-full text-sm font-medium bg-surface-container-lowest border border-outline-variant p-3 rounded-DEFAULT hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface-variant cursor-pointer transition-colors"
              >
                <option value="a4">A4 (210 x 297 mm)</option>
                <option value="letter">Letter (US)</option>
                <option value="executive">Executive</option>
              </select>
            </div>

            {/* Orientation */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-outline">Orientation</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrientation("p")}
                  className={`py-4 px-2 rounded-DEFAULT border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    orientation === "p"
                      ? "border-primary bg-primary-fixed/50 text-primary-container"
                      : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low hover:border-outline"
                  }`}
                >
                  <FileText size={20} strokeWidth={1.5} />
                  <span className="text-xs font-bold">Portrait</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation("l")}
                  className={`py-4 px-2 rounded-DEFAULT border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    orientation === "l"
                      ? "border-primary bg-primary-fixed/50 text-primary-container"
                      : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low hover:border-outline"
                  }`}
                >
                  <FileImage size={20} strokeWidth={1.5} />
                  <span className="text-xs font-bold">Landscape</span>
                </button>
              </div>
            </div>

            {/* Margins */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-outline">Margins</label>
              <select
                value={margin}
                onChange={(e: any) => setMargin(parseInt(e.target.value))}
                className="w-full text-sm font-medium bg-surface-container-lowest border border-outline-variant p-3 rounded-DEFAULT hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface-variant cursor-pointer transition-colors"
              >
                <option value="0">No Margin</option>
                <option value="5">Slim (5mm)</option>
                <option value="10">Standard (10mm)</option>
                <option value="20">Wide (20mm)</option>
              </select>
            </div>

            <div className="h-[1px] bg-surface-container-highest my-6" />

            {/* Action */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={compilePDF}
                disabled={compiling || images.length === 0}
                className={`w-full py-3.5 font-bold text-sm sm:text-base rounded-DEFAULT transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
                  images.length === 0
                    ? "bg-surface-container-highest text-outline-variant shadow-none cursor-not-allowed"
                    : downloadSuccess
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                    : compiling
                    ? "bg-primary-fixed text-primary cursor-wait"
                    : "bg-primary hover:bg-primary-container text-white shadow-lg shadow-primary/20"
                }`}
              >
                {compiling ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Compiling...
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Check size={18} /> Downloaded!
                  </>
                ) : (
                  <>
                    <FileCheck size={18} /> Create PDF
                  </>
                )}
              </button>
              {images.length > 0 && (
                <p className="text-[11px] text-outline mt-3 font-medium">
                  Estimated size: ~{estimatedSizeMB} MB
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
