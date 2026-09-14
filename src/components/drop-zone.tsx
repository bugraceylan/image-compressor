import { filterValidFiles } from "@/lib/file-validation";
import { useT } from "@/lib/i18n";
import { ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDragAndDrop } from "../hooks/useDragAndDrop";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  hasCompressedImages: boolean;
}

const DropZone = ({ onFilesSelected, hasCompressedImages }: DropZoneProps) => {
  const t = useT();
  const dropAreaRef = useRef<HTMLLabelElement>(null);
  const [isPageDragActive, setIsPageDragActive] = useState(false);

  const {
    isDragActive,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop(onFilesSelected);

  const highlighted = isDragActive || isPageDragActive;

  // Files dragged or dropped anywhere on the page behave like the zone itself.
  // The zone's own handlers stop propagation, so its events never reach these.
  useEffect(() => {
    const hasFiles = (e: DragEvent) =>
      e.dataTransfer?.types.includes("Files") ?? false;

    // dragenter of the next element fires before dragleave of the previous one,
    // so the count only drops to 0 when the drag leaves the page.
    let depth = 0;

    const onDragEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth++;
      setIsPageDragActive(true);
    };

    const onDragLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setIsPageDragActive(false);
    };

    const onDragOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer!.dropEffect = "copy";
    };

    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault(); // keep the browser from opening the image
      depth = 0;
      setIsPageDragActive(false);
      const validFiles = filterValidFiles(e.dataTransfer!.files);
      if (validFiles.length > 0) onFilesSelected(validFiles);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [onFilesSelected]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      const validFiles = filterValidFiles(e.target.files);
      // Clear so picking the same file again (e.g. after Reset) still fires onChange.
      e.target.value = "";
      if (validFiles.length === 0) {
        return;
      }
      onFilesSelected(validFiles);
    }
  };

  return (
    <label
      ref={dropAreaRef}
      className={`relative flex flex-col items-center overflow-hidden rounded-xl border-2 border-dashed p-2 transition-all duration-200 ease-in-out ${
        highlighted
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-300 dark:border-gray-600"
      } ${hasCompressedImages ? "" : "justify-center"}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      htmlFor="file-input"
    >
      <input
        multiple
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,.docx,.xlsx,.pptx,.pdf,application/pdf"
        onChange={handleImageUpload}
        style={{ display: "none" }}
        id="file-input"
        className="sr-only"
        aria-label={t("dropzone.upload")}
      />
      <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
        <div className="mb-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white dark:bg-gray-800">
          <ImageIcon className="size-4 opacity-60" />
        </div>
        <p className="mb-1 text-base font-medium">
          {highlighted ? t("dropzone.active") : t("dropzone.idle")}
        </p>
        <p className="text-muted-foreground text-sm">
          JPG, PNG, WEBP, DOCX, XLSX, PPTX, PDF
        </p>
      </div>
    </label>
  );
};

export default DropZone;
