import { filterValidFiles } from "@/lib/file-validation";
import { processImages } from "@/lib/image-compression";
import { useEffect, useState } from "react";
import type { CompressedImage } from "../types/image-compressor";

export const useImageCompression = () => {
  const [compressedImages, setCompressedImages] = useState<CompressedImage[]>(
    []
  );
  const [zipFile, setZipFile] = useState<Blob | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [value, setValue] = useState<number>(60);
  const [filelist, setFilelist] = useState<FileList | File[]>([]);
  const [compressProgress, setCompressProgress] = useState<number>(0);

  const handleImageUpload = (files: FileList | File[]) => {
    const validFiles = filterValidFiles(files);
    if (validFiles.length === 0) {
      return;
    }
    setCompressedImages([]);
    setCompressProgress(0);
    setFilelist(validFiles);
  };

  const onImageQualityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(parseInt(event.target.value, 10));
  };

  const resetCompression = () => {
    setValue(60);
    setCompressProgress(0);
    setCompressedImages([]);
    setFilelist([]);
  };

  useEffect(() => {
    const filesArr = Array.from(filelist as FileList | File[]);
    if (filesArr.length === 0) {
      return;
    }

    // Each slider move or upload aborts the previous run, so a stale batch
    // neither keeps burning CPU nor overwrites the newer result.
    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);
    setCompressProgress(0);
    processImages(
      filesArr,
      value,
      (progress) => {
        if (!signal.aborted) setCompressProgress(progress);
      },
      signal
    )
      .then(({ compressedImages, zipFile }) => {
        if (signal.aborted) return;
        setCompressedImages(compressedImages);
        setZipFile(zipFile);
      })
      .catch((error) => {
        if (!signal.aborted) console.error("Error processing images:", error);
      })
      .finally(() => {
        if (!signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
      setLoading(false);
    };
  }, [value, filelist]);

  return {
    compressedImages,
    zipFile,
    loading,
    value,
    filelist,
    compressProgress,
    handleImageUpload,
    onImageQualityChange,
    resetCompression,
  };
};
