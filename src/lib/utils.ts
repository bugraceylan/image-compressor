import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatNumber } from "./i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Decimals follow the UI language: "1.77 MB" in English, "1,77 MB" in Turkish.
export const formatBytes = (bytes: number) => {
  const kilobyte = 1024;
  const megabyte = kilobyte * 1024;
  const gigabyte = megabyte * 1024;
  const terabyte = gigabyte * 1024;

  if (bytes < kilobyte) {
    return bytes + " B";
  } else if (bytes < megabyte) {
    return formatNumber(bytes / kilobyte, 2) + " KB";
  } else if (bytes < gigabyte) {
    return formatNumber(bytes / megabyte, 2) + " MB";
  } else if (bytes < terabyte) {
    return formatNumber(bytes / gigabyte, 2) + " GB";
  } else {
    return formatNumber(bytes / terabyte, 2) + " TB";
  }
};
