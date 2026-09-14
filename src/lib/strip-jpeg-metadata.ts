// Lossless JPEG metadata removal: the compressed image data is copied untouched and only
// metadata segments are dropped, so quality is unchanged and the file can only shrink.

// APP0 (JFIF) and APP14 (Adobe color transform) are needed to decode correctly.
const KEPT_APP_MARKERS = [0xe0, 0xee];

const ascii = (b: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...b.subarray(start, start + length));

// Position of the Orientation value inside an EXIF block starting at `tiff`.
const orientationEntry = (b: Uint8Array, tiff: number, end: number) => {
  if (tiff + 8 > end) return null;
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const le = b[tiff] === 0x49; // "II" = little-endian
  const ifd = tiff + view.getUint32(tiff + 4, le);
  if (ifd + 2 > end) return null;
  const entriesEnd = Math.min(ifd + 2 + view.getUint16(ifd, le) * 12, end);
  for (let e = ifd + 2; e + 12 <= entriesEnd; e += 12) {
    if (view.getUint16(e, le) === 0x0112) return { pos: e + 8, le };
  }
  return null;
};

const readOrientation = (b: Uint8Array, tiff: number, end: number) => {
  const entry = orientationEntry(b, tiff, end);
  return entry
    ? new DataView(b.buffer, b.byteOffset, b.byteLength).getUint16(
        entry.pos,
        entry.le
      )
    : 1;
};

/**
 * Returns a copy of the JPEG with EXIF orientation set to 1 (pixels as stored),
 * or the input itself when there is nothing to reset. Office ignores orientation,
 * so pictures taken from documents must be decoded without it.
 */
export const resetJpegOrientation = (b: Uint8Array): Uint8Array => {
  if (b[0] !== 0xff || b[1] !== 0xd8) return b;
  let i = 2;
  while (i + 4 <= b.length && b[i] === 0xff) {
    const marker = b[i + 1];
    if (marker === 0xff) {
      i++; // fill byte
      continue;
    }
    if (marker === 0xda || marker === 0xd9) break; // image data: no EXIF ahead
    const end = i + 2 + ((b[i + 2] << 8) | b[i + 3]);
    if (end > b.length) break;
    if (marker === 0xe1 && ascii(b, i + 4, 6) === "Exif\0\0") {
      const entry = orientationEntry(b, i + 10, end);
      const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
      if (!entry || view.getUint16(entry.pos, entry.le) === 1) return b;
      const copy = b.slice();
      new DataView(copy.buffer).setUint16(entry.pos, 1, entry.le);
      return copy;
    }
    i = end;
  }
  return b;
};

// Minimal big-endian EXIF block holding only the Orientation tag, so rotated photos
// still display upright after the original EXIF is dropped.
const orientationSegment = (orientation: number) =>
  new Uint8Array([
    ...[0xff, 0xe1, 0x00, 0x22], // APP1, length 34
    ...[0x45, 0x78, 0x69, 0x66, 0x00, 0x00], // "Exif\0\0"
    ...[0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08], // TIFF header, IFD0 at 8
    ...[0x00, 0x01], // one entry
    ...[0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01], // Orientation, SHORT, 1
    ...[0x00, orientation, 0x00, 0x00], // value
    ...[0x00, 0x00, 0x00, 0x00], // no next IFD
  ]);

/** Returns the JPEG without metadata, or null if it cannot be parsed safely. */
export const stripJpegMetadata = (b: Uint8Array): Blob | null => {
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  const parts: Uint8Array[] = [b.subarray(0, 2)];
  let exifAt = 1;
  let orientation = 1;
  let i = 2;

  while (i + 1 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];

    if (marker === 0xff) {
      i++; // fill byte
      continue;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(b.subarray(i, i + 2)); // standalone marker, no length
      i += 2;
      continue;
    }
    if (marker === 0xd9) {
      // EOI. Anything appended after it (e.g. a motion-photo video) is dropped.
      parts.push(b.subarray(i, i + 2));
      if (orientation > 1 && orientation <= 8) {
        parts.splice(exifAt, 0, orientationSegment(orientation));
      }
      return new Blob(parts, { type: "image/jpeg" });
    }

    if (i + 4 > b.length) return null;
    const end = i + 2 + ((b[i + 2] << 8) | b[i + 3]);
    if (end > b.length) return null;

    if (marker === 0xe1 && ascii(b, i + 4, 6) === "Exif\0\0") {
      orientation = readOrientation(b, i + 10, end);
    }
    const isApp = marker >= 0xe0 && marker <= 0xef;
    const isIcc = marker === 0xe2 && ascii(b, i + 4, 12) === "ICC_PROFILE\0";
    const keep =
      marker !== 0xfe && (!isApp || isIcc || KEPT_APP_MARKERS.includes(marker));
    if (keep) {
      parts.push(b.subarray(i, end));
      if (marker === 0xe0 && parts.length === 2) exifAt = 2;
    }
    i = end;

    if (marker === 0xda) {
      // Entropy-coded scan data runs until the next real marker
      // (not FF00 byte stuffing and not a restart marker FFD0-FFD7).
      let j = i;
      while (
        j + 1 < b.length &&
        !(
          b[j] === 0xff &&
          b[j + 1] !== 0x00 &&
          (b[j + 1] < 0xd0 || b[j + 1] > 0xd7)
        )
      ) {
        j++;
      }
      parts.push(b.subarray(i, j));
      i = j;
    }
  }
  return null; // no EOI
};
