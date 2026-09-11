import { toast } from "sonner";

export const downloadZip = async (zipFile: Blob | null) => {
  if (!zipFile) {
    toast.error("No zip file available.");
    return;
  }

  try {
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(zipFile);
    downloadLink.download = "compressed_images.zip";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success("ZIP downloaded successfully!");
  } catch (err) {
    console.error(err);
    toast.error("Failed to download ZIP.");
  }
};

export const downloadSingleImage = async (file: string, fileName?: string) => {
  try {
    const regexResult = /^data:(.+?)(?:;(?:.+?))?,/.exec(file);
    let extension = "jpg";
    if (regexResult && regexResult[1]) {
      const contentType = regexResult[1];
      extension = contentType.split("/")[1] || "jpg";
    }

    const defaultFileName = fileName || `compressed_image.${extension}`;

    const downloadLink = document.createElement("a");
    downloadLink.href = file;
    downloadLink.download = defaultFileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success("Image downloaded successfully!");
  } catch (err) {
    console.error(err);
    toast.error("Failed to download image.");
  }
};
