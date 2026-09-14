import type { PDFRawStream as RawStream, PDFRef as Ref } from "@cantoo/pdf-lib";
import { readJpegSize, resetJpegOrientation } from "./strip-jpeg-metadata";

// In PDFs exported from Office, text and vector graphics stay as they are; the size is
// mostly embedded pictures: photos as JPEG (DCTDecode) and screenshots, charts or logos
// as deflated raw pixels (FlateDecode), with transparency in a separate soft mask.

export const isPdfFile = (file: File) =>
  file.type === "application/pdf" || /\.pdf$/i.test(file.name);

export type JpegOptimizer = (image: File) => Promise<Blob>;

export interface PdfResult {
  blob: Blob;
  imagesTotal: number;
  imagesCompressed: number;
  note?: "signed" | "unreadable";
}

const containsAscii = (haystack: Uint8Array, text: string) => {
  const needle = Array.from(text, (c) => c.charCodeAt(0));
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
};

const inflate = async (bytes: Uint8Array) =>
  new Uint8Array(
    await new Response(
      new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"))
    ).arrayBuffer()
  );

const encodeJpeg = async (pixels: ImageData, quality: number) => {
  const canvas = new OffscreenCanvas(pixels.width, pixels.height);
  canvas.getContext("2d")!.putImageData(pixels, 0, 0);
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
  return new Uint8Array(await blob.arrayBuffer());
};

export const compressPdfFile = async (
  file: File,
  quality: number,
  optimizeJpeg: JpegOptimizer,
  signal?: AbortSignal
): Promise<PdfResult> => {
  const unchanged = (note?: PdfResult["note"]): PdfResult => ({
    blob: file,
    imagesTotal: 0,
    imagesCompressed: 0,
    note,
  });

  const input = new Uint8Array(await file.arrayBuffer());
  // Any change invalidates a digital signature, so signed PDFs stay untouched.
  if (containsAscii(input, "/ByteRange")) return unchanged("signed");

  // Loaded only when a PDF is added, so image-only use stays light.
  const { PDFDocument, PDFArray, PDFName, PDFNumber, PDFRawStream, PDFRef } =
    await import("@cantoo/pdf-lib");

  let doc;
  try {
    // Infinity: no setTimeout pauses between objects, which background tabs stretch
    // to a second each.
    doc = await PDFDocument.load(input, {
      ignoreEncryption: true,
      updateMetadata: false,
      parseSpeed: Infinity,
    });
  } catch {
    return unchanged("unreadable");
  }
  // Rewriting would drop the password or permission restrictions.
  if (doc.isEncrypted) return unchanged("unreadable");

  const context = doc.context;
  const name = (key: string) => PDFName.of(key);
  const numberOf = (value: unknown) =>
    value instanceof PDFNumber ? value.asNumber() : NaN;

  const images: [Ref, RawStream][] = [];
  const masks = new Set<string>();
  for (const [ref, object] of context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFRawStream)) continue;
    if (object.dict.get(name("Subtype")) !== name("Image")) continue;
    images.push([ref, object]);
    const mask = object.dict.get(name("SMask"));
    if (mask instanceof PDFRef) masks.add(mask.tag);
  }
  const pictures = images.filter(([ref]) => !masks.has(ref.tag));

  let imagesCompressed = 0;
  for (const [ref, stream] of pictures) {
    signal?.throwIfAborted();
    const dict = stream.dict;
    const rawFilter = dict.get(name("Filter"));
    const filter =
      rawFilter instanceof PDFArray && rawFilter.size() === 1
        ? rawFilter.get(0)
        : rawFilter;
    const colorSpace = dict.get(name("ColorSpace"));
    const width = numberOf(dict.get(name("Width")));
    const height = numberOf(dict.get(name("Height")));
    const supported =
      numberOf(dict.get(name("BitsPerComponent"))) === 8 &&
      (colorSpace === name("DeviceRGB") || colorSpace === name("DeviceGray")) &&
      !dict.get(name("Decode")) &&
      !dict.get(name("ImageMask")) &&
      !dict.get(name("DecodeParms"));
    if (!supported) continue;

    let jpeg: Uint8Array;
    if (filter === name("DCTDecode")) {
      // Photos: quality and resolution settings apply. PDF viewers ignore EXIF
      // orientation, so the browser must not apply it either.
      const image = new File(
        [resetJpegOrientation(stream.contents)],
        "image.jpg",
        {
          type: "image/jpeg",
        }
      );
      jpeg = new Uint8Array(await (await optimizeJpeg(image)).arrayBuffer());
    } else if (filter === name("FlateDecode")) {
      // Screenshots, charts and logos: re-encode at full resolution only, because
      // downscaling blurs their text.
      const raw = await inflate(stream.contents);
      const channels = colorSpace === name("DeviceRGB") ? 3 : 1;
      if (raw.length !== width * height * channels) continue;
      const rgba = new Uint8ClampedArray(width * height * 4);
      for (let p = 0, q = 0; p < width * height; p++, q += channels) {
        rgba[p * 4] = raw[q];
        rgba[p * 4 + 1] = raw[channels === 3 ? q + 1 : q];
        rgba[p * 4 + 2] = raw[channels === 3 ? q + 2 : q];
        rgba[p * 4 + 3] = 255;
      }
      jpeg = await encodeJpeg(
        new ImageData(rgba, width, height),
        quality / 100
      );
    } else {
      continue;
    }

    const size = readJpegSize(jpeg);
    // Only a smaller, plain RGB or grayscale JPEG is worth the change.
    if (
      !size ||
      size.components === 4 ||
      jpeg.length >= stream.contents.length
    ) {
      continue;
    }

    const next = dict.clone(context);
    next.set(name("Filter"), name("DCTDecode"));
    next.set(
      name("ColorSpace"),
      name(size.components === 1 ? "DeviceGray" : "DeviceRGB")
    );
    next.set(name("BitsPerComponent"), PDFNumber.of(8));
    next.set(name("Width"), PDFNumber.of(size.width));
    next.set(name("Height"), PDFNumber.of(size.height));
    next.set(name("Length"), PDFNumber.of(jpeg.length));
    context.assign(ref, PDFRawStream.of(next, jpeg));
    imagesCompressed++;
  }

  const imagesTotal = pictures.length;
  if (imagesCompressed === 0)
    return { blob: file, imagesTotal, imagesCompressed };

  const output = await doc.save({
    useObjectStreams: true,
    updateFieldAppearances: false,
    objectsPerTick: Infinity,
  });
  return output.length < file.size
    ? {
        blob: new Blob([output], { type: "application/pdf" }),
        imagesTotal,
        imagesCompressed,
      }
    : { blob: file, imagesTotal, imagesCompressed: 0 };
};
