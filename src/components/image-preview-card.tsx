import { formatPercent, useT } from "@/lib/i18n";
import { formatBytes } from "@/lib/utils";
import {
  DownloadIcon,
  Eye,
  FileSpreadsheet,
  FileText,
  MoveRight,
  Presentation,
} from "lucide-react";
import { memo } from "react";
import { PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import type { CompressedImage } from "../types/image-compressor";
import { Button } from "./ui/button";

const documentIcon = (fileName: string) =>
  /\.xlsx$/i.test(fileName)
    ? FileSpreadsheet
    : /\.pptx$/i.test(fileName)
      ? Presentation
      : FileText;

const ImagePreviewCard = memo(
  ({
    onSingleFileDownload,
    ...props
  }: CompressedImage & {
    onSingleFileDownload: (file: string, fileName?: string) => void;
  }) => {
    // Subscribes this memoized card to language changes (number formatting).
    const t = useT();
    const isDocument = props.kind === "document";
    const DocumentIcon = documentIcon(props.fileName);

    const documentStatus = () => {
      if (props.note === "signed") return t("document.signed");
      if (props.note === "unreadable") return t("document.unreadable");
      if (!props.imagesTotal) return t("document.noImages");
      return t("document.images", {
        done: props.imagesCompressed ?? 0,
        total: props.imagesTotal,
      });
    };

    return (
      <div className="bg-background flex items-center justify-between gap-2 rounded-lg border p-2 pe-3 will-change-transform">
        <div className="flex items-center gap-3 overflow-hidden">
          {isDocument ? (
            <div className="bg-accent flex size-12 shrink-0 items-center justify-center rounded-[6px]">
              <DocumentIcon
                className="text-muted-foreground size-6"
                aria-hidden="true"
              />
            </div>
          ) : (
            <div className="bg-accent relative aspect-square shrink-0 cursor-pointer rounded-[6px]">
              <PhotoView src={props.content}>
                <div>
                  <img
                    src={props.content}
                    alt={props.fileName}
                    className="size-12 rounded-[6px] object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-[6px] bg-black/25">
                    <Eye className="text-[#fafafa]" />
                  </div>
                </div>
              </PhotoView>
            </div>
          )}
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-sm font-medium">{props.fileName}</p>
            <span className="text-muted-foreground flex items-center text-xs">
              <span className="text-destructive">
                {formatBytes(props.originalImageSize)}
              </span>
              <MoveRight className="mx-1 h-4 w-4" />
              <span className="text-success">
                {formatBytes(props.compressedImageSize)}{" "}
                <span className="inline-flex">
                  ({formatPercent(Number(props.compressionPercentage), 2)})
                </span>
              </span>
            </span>
            {isDocument && (
              <span className="text-muted-foreground truncate text-xs">
                {documentStatus()}
              </span>
            )}
          </div>
        </div>
        {props.note !== "unreadable" && (
          <Button
            size="icon"
            variant="ghost"
            aria-label={t("results.download", { name: props.fileName })}
            className="text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent"
            onClick={() => onSingleFileDownload(props.content, props.fileName)}
          >
            <DownloadIcon aria-hidden="true" />
          </Button>
        )}
      </div>
    );
  }
);

export default ImagePreviewCard;
