import Compressor from "compressorjs";
import JSZip from "jszip";
import type { CompressedImage } from "../types/image-compressor";
import { stripJpegMetadata } from "./strip-jpeg-metadata";

export const compressImage = async (
  file: File,
  quality: number,
  scale: number,
  stripMetadata: boolean
): Promise<string> => {
  const isPng = file.type === "image/png";

  // Scale applies to the displayed (EXIF-oriented) size: createImageBitmap reports it,
  // and compressorjs interprets maxWidth/maxHeight in the same orientation.
  let maxWidth: number | undefined;
  let maxHeight: number | undefined;
  if (scale < 100) {
    const bitmap = await createImageBitmap(file);
    maxWidth = Math.max(1, Math.round((bitmap.width * scale) / 100));
    maxHeight = Math.max(1, Math.round((bitmap.height * scale) / 100));
    bitmap.close();
  }

  return new Promise((resolve, reject) => {
    new Compressor(file, {
      maxWidth,
      maxHeight,
      minWidth: 0,
      minHeight: 0,
      width: undefined,
      height: undefined,
      quality: quality / 100,
      mimeType: isPng ? "image/webp" : "auto",
      convertSize: Infinity,
      convertTypes: [],
      // Canvas re-encoding drops all metadata; retainExif copies EXIF back (JPEG only).
      retainExif: !stripMetadata,
      // strict would hand back the original file (metadata included) when the result
      // is larger; processImages applies its own size fallback instead.
      strict: false,
      success(result: Blob) {
        // compressorjs also returns the original file when canvas encoding fails.
        if (stripMetadata && result === file) {
          reject(
            new Error(`Could not re-encode ${file.name}; metadata not removed.`)
          );
          return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(result);
        reader.onload = () => {
          resolve(reader.result as string);
        };
      },
      error(err: Error) {
        reject(err);
      },
    });
  });
};

export const processImages = async (
  files: File[],
  quality: number,
  scale: number,
  stripMetadata: boolean,
  onProgress: (progress: number) => void,
  signal?: AbortSignal
): Promise<{ compressedImages: CompressedImage[]; zipFile: Blob }> => {
  const compressedImgs: CompressedImage[] = [];
  const zip = new JSZip();
  const img = zip.folder("compressed_images");
  let counter = files.length;

  for (const file of files) {
    signal?.throwIfAborted();
    const compressedImg = await compressImage(
      file,
      quality,
      scale,
      stripMetadata
    );
    const base64Data = (compressedImg as string).split(",")[1];
    const binaryData = atob(base64Data);
    const compressedImageSize = binaryData.length;
    const dotIndex = file.name.lastIndexOf(".");
    const baseName = dotIndex !== -1 ? file.name.slice(0, dotIndex) : file.name;
    const originalExt = dotIndex !== -1 ? file.name.slice(dotIndex) : "";

    // Re-encoding can make a file larger (e.g. an already-lossy image). At 100% resolution
    // fall back to the original, or when removing metadata to a losslessly cleaned JPEG
    // (PNG/WebP can only be cleaned by re-encoding). Resizing always keeps the re-encode.
    let fallback: Blob | null = null;
    if (scale === 100 && !stripMetadata) {
      fallback = file;
    } else if (scale === 100 && file.type === "image/jpeg") {
      fallback = stripJpegMetadata(new Uint8Array(await file.arrayBuffer()));
    }
    const useFallback =
      fallback !== null && compressedImageSize >= fallback.size;

    // PNG is re-encoded as WebP, so the extension must follow the actual output type.
    const outputType = useFallback
      ? file.type
      : compressedImg.slice(5, compressedImg.indexOf(";"));
    const outputExt =
      outputType === file.type ? originalExt : "." + outputType.split("/")[1];

    let finalContent: string;
    let finalSize: number;

    if (fallback && useFallback) {
      const source = fallback;
      finalContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(source);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      finalSize = fallback.size;
    } else {
      finalContent = compressedImg as string;
      finalSize = compressedImageSize;
    }

    const rate = ((finalSize - file.size) / file.size) * 100;

    compressedImgs.push({
      fileName: baseName + "-compressed" + outputExt,
      originalImageSize: file.size,
      compressedImageSize: finalSize,
      fileType: outputType,
      content: finalContent,
      compressionPercentage: rate.toFixed(2),
    });

    const response = await fetch(finalContent);
    const blob = await response.blob();
    img?.file(`${baseName}-compressed${outputExt}`, blob);
    counter = counter - 1;

    const progress = Math.floor(
      ((files.length - counter) / files.length) * 100
    );
    onProgress(progress);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });

  return {
    compressedImages: compressedImgs,
    zipFile: zipBlob,
  };
};
