export interface CompressedImage {
  fileName: string;
  originalImageSize: number;
  compressedImageSize: number;
  fileType: string;
  content: string;
  compressionPercentage: string;
  // Word, Excel and PowerPoint results
  kind?: "image" | "document";
  imagesTotal?: number;
  imagesCompressed?: number;
  note?: "signed" | "unreadable";
}

export interface ImageCompressorState {
  compressedImages: CompressedImage[];
  zipFile: Blob | null;
  isDragActive: boolean;
  loading: boolean;
  value: number;
  filelist: FileList | File[];
  compressProgress: number;
}
