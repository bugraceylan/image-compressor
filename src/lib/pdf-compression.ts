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

const inflate = async (bytes: Uint8Array) =>
  new Uint8Array(
    await new Response(
      new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"))
    ).arrayBuffer()
  );

const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const PDFA_ID = "http://www.aiim.org/pdfa/ns/id/";
const PDFUA_ID = "http://www.aiim.org/pdfua/ns/id/";
const PDFA_EXTENSION = "http://www.aiim.org/pdfa/ns/extension/";
const DC = "http://purl.org/dc/elements/1.1/";
const KEPT_ATTRIBUTE_NAMESPACES = [
  RDF,
  "http://www.w3.org/XML/1998/namespace",
  "http://www.w3.org/2000/xmlns/",
];

// XMP properties are the children and attributes of top-level rdf:Description
// elements; nested ones belong to property values.
const xmpDescriptions = (xmp: Document) =>
  [...xmp.getElementsByTagNameNS(RDF, "Description")].filter(
    (d) =>
      d.parentElement?.namespaceURI === RDF &&
      d.parentElement.localName === "RDF"
  );

const hasXmpProperty = (xmp: Document, namespace: string) =>
  xmpDescriptions(xmp).some(
    (d) =>
      [...d.children].some((p) => p.namespaceURI === namespace) ||
      [...d.attributes].some((a) => a.namespaceURI === namespace)
  );

const pdfaPartOf = (xmp: Document) =>
  xmpDescriptions(xmp)
    .map(
      (d) =>
        d.getAttributeNS(PDFA_ID, "part") ??
        d.getElementsByTagNameNS(PDFA_ID, "part")[0]?.textContent
    )
    .find(Boolean)
    ?.trim();

// PDF/A and PDF/UA require the XMP packet and their conformance claims (PDF/UA also
// dc:title), so only everything else is removed.
const keepConformanceClaims = (xmp: Document) => {
  const ua = hasXmpProperty(xmp, PDFUA_ID);
  const keep = (namespace: string | null, localName: string) =>
    namespace === PDFA_ID ||
    namespace === PDFUA_ID ||
    namespace === PDFA_EXTENSION ||
    (ua && namespace === DC && localName === "title");
  for (const d of xmpDescriptions(xmp)) {
    for (const p of [...d.children]) {
      if (!keep(p.namespaceURI, p.localName)) p.remove();
    }
    for (const a of [...d.attributes]) {
      if (KEPT_ATTRIBUTE_NAMESPACES.includes(a.namespaceURI ?? "")) continue;
      if (!keep(a.namespaceURI, a.localName)) d.removeAttributeNode(a);
    }
  }
  return new TextEncoder().encode(new XMLSerializer().serializeToString(xmp));
};

const encodeJpeg = async (pixels: ImageData, quality: number) => {
  const canvas = new OffscreenCanvas(pixels.width, pixels.height);
  canvas.getContext("2d")!.putImageData(pixels, 0, 0);
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
  return new Uint8Array(await blob.arrayBuffer());
};

export const compressPdfFile = async (
  file: File,
  quality: number,
  stripMetadata: boolean,
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

  // Loaded only when a PDF is added, so image-only use stays light.
  const {
    PDFDocument,
    PDFArray,
    PDFDict,
    PDFName,
    PDFNumber,
    PDFRawStream,
    PDFRef,
    PDFStream,
  } = await import("@cantoo/pdf-lib");

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
  const dictOf = (object: unknown) =>
    object instanceof PDFStream
      ? object.dict
      : object instanceof PDFDict
        ? object
        : undefined;
  // Direct children of an object: dict values and array items, not followed refs.
  const childrenOf = (object: unknown) =>
    object instanceof PDFArray
      ? object.asArray()
      : (dictOf(object)?.values() ?? []);

  // Any change invalidates a digital signature, so signed PDFs stay untouched.
  // Signature dictionaries always carry /ByteRange and may sit in a compressed
  // object stream, so search the parsed objects, not the raw bytes.
  const pending: unknown[] = context
    .enumerateIndirectObjects()
    .map(([, object]) => object);
  while (pending.length > 0) {
    const object = pending.pop();
    if (dictOf(object)?.has(name("ByteRange"))) return unchanged("signed");
    for (const child of childrenOf(object)) pending.push(child);
  }

  // The document's XMP packet, when readable: it states PDF/A and PDF/UA conformance.
  const xmpRef = doc.catalog.get(name("Metadata"));
  const xmpStream = context.lookup(xmpRef);
  let xmp: Document | undefined;
  if (xmpRef instanceof PDFRef && xmpStream instanceof PDFRawStream) {
    const filter = xmpStream.dict.get(name("Filter"));
    const bytes = !filter
      ? xmpStream.contents
      : filter === name("FlateDecode")
        ? await inflate(xmpStream.contents).catch(() => undefined)
        : undefined;
    const parsed =
      bytes &&
      new DOMParser().parseFromString(
        new TextDecoder().decode(bytes),
        "application/xml"
      );
    if (parsed && !parsed.getElementsByTagName("parsererror").length) {
      xmp = parsed;
    }
  }
  const isPdfA = !!xmp && hasXmpProperty(xmp, PDFA_ID);
  const conformanceClaimed = isPdfA || (!!xmp && hasXmpProperty(xmp, PDFUA_ID));

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

  // Document properties (author, title, creating app, dates), XMP packets and
  // application private data. Objects left unreferenced are dropped so they are
  // not written to the output. Without the information dictionary, PDF/A's rule
  // that it must match the XMP packet no longer applies.
  let metadataRemoved = false;
  if (stripMetadata) {
    if (context.trailerInfo.Info) {
      context.trailerInfo.Info = undefined;
      metadataRemoved = true;
    }
    for (const [, object] of context.enumerateIndirectObjects()) {
      for (const key of ["Metadata", "PieceInfo"]) {
        if (conformanceClaimed && object === doc.catalog && key === "Metadata")
          continue;
        if (dictOf(object)?.delete(name(key))) metadataRemoved = true;
      }
    }
    if (conformanceClaimed && xmp && xmpRef instanceof PDFRef) {
      const cleaned = keepConformanceClaims(xmp);
      // Written unfiltered: PDF/A-1 forbids filters on metadata streams.
      const dict = (xmpStream as RawStream).dict.clone(context);
      dict.delete(name("Filter"));
      dict.delete(name("DecodeParms"));
      dict.set(name("Length"), PDFNumber.of(cleaned.length));
      context.assign(xmpRef, PDFRawStream.of(dict, cleaned));
      metadataRemoved = true;
    }
    const reachable = new Set<string>();
    const queue: unknown[] = [context.trailerInfo.Root];
    while (queue.length > 0) {
      const object = queue.pop();
      if (object instanceof PDFRef) {
        if (reachable.has(object.tag)) continue;
        reachable.add(object.tag);
        queue.push(context.lookup(object));
      } else {
        for (const child of childrenOf(object)) queue.push(child);
      }
    }
    for (const [ref] of context.enumerateIndirectObjects()) {
      if (!reachable.has(ref.tag)) context.delete(ref);
    }
  }

  const imagesTotal = pictures.length;
  if (imagesCompressed === 0 && !metadataRemoved)
    return { blob: file, imagesTotal, imagesCompressed };

  const output = await doc.save({
    // PDF/A-1 is based on PDF 1.4, which has no object streams.
    useObjectStreams: !(isPdfA && pdfaPartOf(xmp!) === "1"),
    updateFieldAppearances: false,
    objectsPerTick: Infinity,
  });
  // Like images: when metadata was removed, never hand back the original.
  return output.length < file.size || metadataRemoved
    ? {
        blob: new Blob([output], { type: "application/pdf" }),
        imagesTotal,
        imagesCompressed,
      }
    : { blob: file, imagesTotal, imagesCompressed: 0 };
};
