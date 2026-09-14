import JSZip from "jszip";
import { resetJpegOrientation } from "./strip-jpeg-metadata";

// Word, Excel and PowerPoint files are ZIP packages (OOXML). Embedded pictures live in
// word/media, xl/media or ppt/media and are referenced by path from *.rels files.
const OFFICE_TYPES: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const extensionOf = (name: string) =>
  name.slice(name.lastIndexOf(".") + 1).toLowerCase();

export const isOfficeFile = (file: File) =>
  Object.prototype.hasOwnProperty.call(OFFICE_TYPES, extensionOf(file.name));

const MEDIA_IMAGE = /^(word|xl|ppt)\/media\/[^/]+\.(png|jpe?g)$/i;

export type ImageOptimizer = (
  image: File
) => Promise<{ blob: Blob; type: string }>;

export interface OfficeResult {
  blob: Blob;
  imagesTotal: number;
  imagesCompressed: number;
  note?: "signed" | "unreadable";
}

// Part a relationship points to: word/_rels/document.xml.rels + "media/a.png" -> "word/media/a.png"
const resolveTarget = (relsPath: string, target: string) => {
  const base = target.startsWith("/")
    ? ""
    : relsPath.replace(/_rels\/[^/]+$/, "");
  const segments: string[] = [];
  for (const part of (base + target).split("/")) {
    if (part === "..") segments.pop();
    else if (part && part !== ".") segments.push(part);
  }
  return segments.join("/");
};

export const compressOfficeFile = async (
  file: File,
  optimize: ImageOptimizer
): Promise<OfficeResult> => {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    // Password-protected documents are encrypted containers, not ZIP.
    return {
      blob: file,
      imagesTotal: 0,
      imagesCompressed: 0,
      note: "unreadable",
    };
  }

  const paths = Object.keys(zip.files).filter((path) => !zip.files[path].dir);
  const media = paths.filter((path) => MEDIA_IMAGE.test(path));
  const imagesTotal = media.length;

  // Any change invalidates a digital signature, so signed documents stay untouched.
  if (paths.some((path) => path.startsWith("_xmlsignatures/"))) {
    return { blob: file, imagesTotal, imagesCompressed: 0, note: "signed" };
  }

  const taken = new Set(paths.map((path) => path.toLowerCase()));
  const renamed = new Map<string, string>();
  let imagesCompressed = 0;

  for (const path of media) {
    const original = await zip.file(path)!.async("uint8array");
    const isPng = /\.png$/i.test(path);
    // Office ignores EXIF orientation; the browser would apply it and squeeze the
    // rotated pixels into the document's unrotated frame.
    const bytes = isPng ? original : resetJpegOrientation(original);
    const name = path.slice(path.lastIndexOf("/") + 1);
    const result = await optimize(
      new File([bytes], name, { type: isPng ? "image/png" : "image/jpeg" })
    );
    // Inside a document only a smaller picture is worth the change.
    if (result.blob.size >= original.length) continue;

    let target = path;
    if (isPng && result.type === "image/jpeg") {
      const stem = path.slice(0, -".png".length);
      target = `${stem}.jpeg`;
      for (let n = 1; taken.has(target.toLowerCase()); n++) {
        target = `${stem}-${n}.jpeg`;
      }
      taken.add(target.toLowerCase());
      renamed.set(path, target);
      zip.remove(path);
    }
    zip.file(target, result.blob);
    imagesCompressed++;
  }

  if (imagesCompressed === 0)
    return { blob: file, imagesTotal, imagesCompressed };

  if (renamed.size > 0) {
    // Point every relationship (document, headers, drawings, slides) at the new name.
    for (const relsPath of paths.filter((path) => path.endsWith(".rels"))) {
      const xml = await zip.file(relsPath)!.async("string");
      const updated = xml.replace(
        /(\sTarget=)(["'])(.*?)\2/g,
        (match, attr: string, quote: string, target: string) => {
          const next = renamed.get(resolveTarget(relsPath, target));
          if (!next) return match;
          const newName = next.slice(next.lastIndexOf("/") + 1);
          return `${attr}${quote}${target.replace(/[^/]+$/, newName)}${quote}`;
        }
      );
      if (updated !== xml) zip.file(relsPath, updated);
    }

    // Register the .jpeg extension (and move any per-part override).
    const typesFile = zip.file("[Content_Types].xml");
    if (typesFile) {
      let types = await typesFile.async("string");
      types = types.replace(/<Override\b[^>]*\/>/g, (override) => {
        const part = override.match(/PartName=(["'])\/?(.*?)\1/)?.[2];
        const next = part && renamed.get(part);
        return next
          ? `<Override PartName="/${next}" ContentType="image/jpeg"/>`
          : override;
      });
      if (!/<Default\b[^>]*Extension=(["'])jpeg\1/i.test(types)) {
        types = types.replace(
          "</Types>",
          '<Default Extension="jpeg" ContentType="image/jpeg"/></Types>'
        );
      }
      zip.file("[Content_Types].xml", types);
    }
  }

  // JSZip stores entries uncompressed unless told otherwise.
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
    mimeType: OFFICE_TYPES[extensionOf(file.name)],
  });
  return blob.size < file.size
    ? { blob, imagesTotal, imagesCompressed }
    : { blob: file, imagesTotal, imagesCompressed: 0 };
};
