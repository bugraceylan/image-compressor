import { downloadSingleImage } from "@/lib/download";
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
  if (compressedImages.length === 0) {
    return (
      <div className="text-muted-foreground animate-fadeIn flex flex-col items-center justify-center py-6 text-center md:py-10">
        <Inbox className="size-14" strokeWidth={1.5} />
        <h3 className="mb-1 text-base font-medium">No Compressed Images</h3>
        <p className="max-w-xs text-sm">
          Upload images and compress them to see your results here. Your
          compressed images will appear in this section.
        </p>
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
  const savedPercentage = ((Math.abs(saved) / totalOriginal) * 100).toFixed(2);

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
            Total original ({compressedImages.length}{" "}
            {compressedImages.length === 1 ? "image" : "images"})
          </p>
          <p className="text-destructive text-base font-bold">
            {formatBytes(totalOriginal)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">
            {saved >= 0 ? "Saved" : "Size increase"}
          </p>
          <p
            className={`text-base font-bold ${saved >= 0 ? "text-success" : "text-destructive"}`}
          >
            {formatBytes(Math.abs(saved))} ({savedPercentage}%)
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Final size</p>
          <p className="text-success text-base font-bold">
            {formatBytes(totalFinal)}
          </p>
        </div>
      </div>
    </PhotoProvider>
  );
};

export default CompressedImagesGrid;
