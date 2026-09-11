import { downloadSingleImage } from "@/lib/download";
import { formatPercent, useT } from "@/lib/i18n";
import { formatBytes } from "@/lib/utils";
import { Inbox } from "lucide-react";
import { PhotoProvider } from "react-photo-view";
import type { CompressedImage } from "../types/image-compressor";
import ImagePreviewCard from "./image-preview-card";

interface CompressedImagesGridProps {
  compressedImages: CompressedImage[];
}

const CompressedImagesGrid = ({
  compressedImages,
}: CompressedImagesGridProps) => {
  const t = useT();

  if (compressedImages.length === 0) {
    return (
      <div className="text-muted-foreground animate-fadeIn flex flex-col items-center justify-center py-6 text-center md:py-10">
        <Inbox className="size-14" strokeWidth={1.5} />
        <h3 className="mb-1 text-base font-medium">
          {t("results.emptyTitle")}
        </h3>
        <p className="max-w-xs text-sm">{t("results.emptyText")}</p>
      </div>
    );
  }

  const totalOriginal = compressedImages.reduce(
    (sum, image) => sum + image.originalImageSize,
    0
  );
  const totalFinal = compressedImages.reduce(
    (sum, image) => sum + image.compressedImageSize,
    0
  );
  const saved = totalOriginal - totalFinal;
  const savedPercentage = (Math.abs(saved) / totalOriginal) * 100;

  return (
    <PhotoProvider>
      <div className="grid grid-cols-1 gap-4 py-4 will-change-transform md:grid-cols-2 lg:grid-cols-3">
        {compressedImages.map((image, i) => (
          <div
            key={`${image.fileName}-${i}`}
            className="animate-fadeInFast"
            style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
          >
            <ImagePreviewCard
              onSingleFileDownload={downloadSingleImage}
              {...image}
            />
          </div>
        ))}
      </div>
      <div className="animate-fadeInFast mb-4 grid grid-cols-1 gap-3 rounded-lg border p-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">
            {compressedImages.length === 1
              ? t("summary.totalOriginalOne")
              : t("summary.totalOriginal", { count: compressedImages.length })}
          </p>
          <p className="text-destructive text-base font-bold">
            {formatBytes(totalOriginal)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">
            {saved >= 0 ? t("summary.saved") : t("summary.increase")}
          </p>
          <p
            className={`text-base font-bold ${saved >= 0 ? "text-success" : "text-destructive"}`}
          >
            {formatBytes(Math.abs(saved))} ({formatPercent(savedPercentage, 2)})
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">{t("summary.final")}</p>
          <p className="text-success text-base font-bold">
            {formatBytes(totalFinal)}
          </p>
        </div>
      </div>
    </PhotoProvider>
  );
};

export default CompressedImagesGrid;
