import { toast } from "sonner";
import { t } from "./i18n";
import { isOfficeFile } from "./office-compression";

// Allowed image formats
export const ALLOWED_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// Maximum number of files per upload
export const MAX_FILES = 1000;

// Validate file type: images by MIME type, Office files by extension
// (browsers often report an empty or vendor-specific type for them).
export const validateFileType = (file: File): boolean => {
  return (
    ALLOWED_FORMATS.includes(file.type.toLowerCase()) || isOfficeFile(file)
  );
};

// Filter valid files and show error for invalid ones
export const filterValidFiles = (files: FileList | File[]): File[] => {
  const filesArray = Array.from(files);
  const validFiles: File[] = [];
  const invalidFiles: File[] = [];

  filesArray.forEach((file) => {
    if (validateFileType(file)) {
      validFiles.push(file);
    } else {
      invalidFiles.push(file);
    }
  });

  // Show error toast for invalid files
  if (invalidFiles.length > 0) {
    const invalidFileNames = invalidFiles.map((file) => file.name).join(", ");
    toast.error(t("toast.invalidFile"), {
      description: invalidFileNames,
      duration: 5000,
      position: "top-right",
    });
  }

  // Every setting change reprocesses the whole batch in memory, so cap it.
  if (validFiles.length > MAX_FILES) {
    toast.warning(
      t("toast.tooManyFiles", { max: MAX_FILES, count: validFiles.length }),
      { duration: 5000, position: "top-right" }
    );
    return validFiles.slice(0, MAX_FILES);
  }

  return validFiles;
};
