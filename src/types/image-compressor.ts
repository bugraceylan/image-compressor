export interface CompressedImage {
  fileName: string;
  originalImageSize: number;
  compressedImageSize: number;
  fileType: string;
  content: string;
  compressionPercentage: string;
  // Word, Excel and PowerPoint results
  kind?: "image" | "document" | "video";
  imagesTotal?: number;
  imagesCompressed?: number;
  note?: "signed" | "unreadable" | "original" | "unsupported";
  // Video results: content is an object URL instead of a data URL
  width?: number;
  height?: number;
  outputWidth?: number;
  outputHeight?: number;
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
