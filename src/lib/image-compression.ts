import Compressor from "compressorjs";
import JSZip from "jszip";
import type { CompressedImage } from "../types/image-compressor";
import { compressOfficeFile, isOfficeFile } from "./office-compression";
import { compressPdfFile, isPdfFile } from "./pdf-compression";
import { stripJpegMetadata } from "./strip-jpeg-metadata";

export const compressImage = async (
  file: File,
  quality: number,
  scale: number,
  stripMetadata: boolean
): Promise<string> => {
  // Browsers encode PNG losslessly and ignore quality, so PNG is re-encoded as JPEG:
  // it shrinks and opens everywhere (Office, Outlook). compressorjs paints
  // transparent areas white for JPEG output.
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
      mimeType: isPng ? "image/jpeg" : "auto",
      convertSize: Infinity,
      convertTypes: [],
      // Canvas re-encoding drops all metadata; retainExif copies EXIF back (JPEG only).
      retainExif: !stripMetadata,
      // strict would hand back the original file (metadata included) when the result
      // is larger; optimizeImage applies its own size fallback instead.
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

const readAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

// Compresses one image and picks the smallest acceptable output.
export const optimizeImage = async (
  file: File,
  quality: number,
  scale: number,
  stripMetadata: boolean
): Promise<{ dataUrl: string; size: number; type: string }> => {
  const compressedImg = await compressImage(
    file,
    quality,
    scale,
    stripMetadata
  );
  const compressedImageSize = atob(compressedImg.split(",")[1]).length;

  // Re-encoding can make a file larger (e.g. an already-lossy image). At 100% resolution
  // fall back to the original, or when removing metadata to a losslessly cleaned JPEG
  // (PNG/WebP can only be cleaned by re-encoding). Resizing always keeps the re-encode.
  let fallback: Blob | null = null;
  if (scale === 100 && !stripMetadata) {
    fallback = file;
  } else if (scale === 100 && file.type === "image/jpeg") {
    fallback = stripJpegMetadata(new Uint8Array(await file.arrayBuffer()));
  }

  if (fallback && compressedImageSize >= fallback.size) {
    return {
      dataUrl: await readAsDataUrl(fallback),
      size: fallback.size,
      type: file.type,
    };
  }
  return {
    dataUrl: compressedImg,
    size: compressedImageSize,
    type: compressedImg.slice(5, compressedImg.indexOf(";")),
  };
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

  const optimizeToBlob = async (image: File) => {
    signal?.throwIfAborted();
    const result = await optimizeImage(image, quality, scale, stripMetadata);
    return {
      blob: await (await fetch(result.dataUrl)).blob(),
      type: result.type,
    };
  };

  for (const file of files) {
    signal?.throwIfAborted();
    const dotIndex = file.name.lastIndexOf(".");
    const baseName = dotIndex !== -1 ? file.name.slice(0, dotIndex) : file.name;
    const originalExt = dotIndex !== -1 ? file.name.slice(dotIndex) : "";
    const rateOf = (size: number) =>
      (((size - file.size) / file.size) * 100).toFixed(2);

    if (isOfficeFile(file) || isPdfFile(file)) {
      const doc = isPdfFile(file)
        ? await compressPdfFile(
            file,
            quality,
            stripMetadata,
            async (image) => (await optimizeToBlob(image)).blob,
            signal
          )
        : await compressOfficeFile(file, stripMetadata, optimizeToBlob);
      const fileName = baseName + "-compressed" + originalExt;
      compressedImgs.push({
        fileName,
        originalImageSize: file.size,
        compressedImageSize: doc.blob.size,
        fileType: doc.blob.type || file.type,
        content: await readAsDataUrl(doc.blob),
        compressionPercentage: rateOf(doc.blob.size),
        kind: "document",
        imagesTotal: doc.imagesTotal,
        imagesCompressed: doc.imagesCompressed,
        note: doc.note,
      });
      if (doc.note !== "unreadable") img?.file(fileName, doc.blob);
    } else {
      const result = await optimizeImage(file, quality, scale, stripMetadata);
      // PNG is re-encoded as JPEG, so the extension must follow the actual output type.
      const outputExt =
        result.type === file.type
          ? originalExt
          : "." + result.type.split("/")[1].replace("jpeg", "jpg");

      compressedImgs.push({
        fileName: baseName + "-compressed" + outputExt,
        originalImageSize: file.size,
        compressedImageSize: result.size,
        fileType: result.type,
        content: result.dataUrl,
        compressionPercentage: rateOf(result.size),
        kind: "image",
      });

      const blob = await (await fetch(result.dataUrl)).blob();
      img?.file(`${baseName}-compressed${outputExt}`, blob);
    }

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
