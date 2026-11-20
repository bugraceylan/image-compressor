import type { Conversion as ConversionType } from "mediabunny";

// Videos are re-encoded with the browser's own encoders (WebCodecs, usually hardware
// accelerated) through mediabunny, which is loaded only when a video is added.

const VIDEO_EXTENSION = /\.(mp4|m4v|mov|webm|mkv)$/i;

export const isVideoFile = (file: File) =>
  file.type.toLowerCase().startsWith("video/") ||
  VIDEO_EXTENSION.test(file.name);

export interface VideoResult {
  blob: Blob;
  // Extension of the returned blob, including the dot.
  extension: string;
  width?: number;
  height?: number;
  outputWidth?: number;
  outputHeight?: number;
  // "original": the input was returned (re-encoding did not make it smaller).
  // "unsupported": this browser cannot decode or encode the video.
  note?: "original" | "unsupported";
}

const extensionOf = (file: File) => {
  const dot = file.name.lastIndexOf(".");
  return dot !== -1 ? file.name.slice(dot) : "";
};

// H.264 and most hardware encoders require even dimensions.
const even = (value: number) => Math.max(2, Math.round(value / 2) * 2);

const runConversion = async (
  conversion: ConversionType,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal
) => {
  conversion.onProgress = (progress) => onProgress(progress);
  const cancel = () => void conversion.cancel();
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    await conversion.execute();
  } finally {
    signal?.removeEventListener("abort", cancel);
  }
  signal?.throwIfAborted();
};

const convertVideo = async (
  file: File,
  quality: number,
  scale: number,
  stripMetadata: boolean,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal
): Promise<VideoResult> => {
  const unsupported: VideoResult = {
    blob: file,
    extension: extensionOf(file),
    note: "unsupported",
  };
  if (
    typeof VideoEncoder === "undefined" ||
    typeof VideoDecoder === "undefined"
  ) {
    return unsupported;
  }

  const {
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    Conversion,
    Input,
    Mp4OutputFormat,
    Output,
    Quality,
    WebMOutputFormat,
    getFirstEncodableAudioCodec,
    getFirstEncodableVideoCodec,
  } = await import("mediabunny");

  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  });
  try {
    let track;
    try {
      track = await input.getPrimaryVideoTrack();
    } catch {
      return unsupported; // not a container mediabunny can read
    }
    if (!track) return unsupported;

    const width = track.displayWidth;
    const height = track.displayHeight;
    const outputWidth = scale < 100 ? even((width * scale) / 100) : undefined;
    const outputHeight = scale < 100 ? even((height * scale) / 100) : undefined;

    // MP4 with H.264 and AAC plays everywhere (Windows, macOS, iOS, Office, messaging
    // apps); the other codecs are only used where the browser cannot encode those.
    const videoCodec = await getFirstEncodableVideoCodec(
      ["avc", "hevc", "vp9", "av1"],
      {
        width: outputWidth ?? even(width),
        height: outputHeight ?? even(height),
      }
    );
    if (!videoCodec) return unsupported;
    const audioCodec = await getFirstEncodableAudioCodec(["aac", "opus"]);

    const output = new Output({
      format: new Mp4OutputFormat({ fastStart: "in-memory" }),
      target: new BufferTarget(),
    });
    const conversion = await Conversion.init({
      input,
      output,
      tracks: "primary",
      video: {
        codec: videoCodec,
        width: outputWidth,
        height: outputHeight,
        // Both sides keep the aspect ratio up to even-pixel rounding.
        fit: "fill",
        // The quality slider maps directly onto mediabunny's 0 (very low) to 1 (very high).
        quality: new Quality({ quality: quality / 100 }),
        forceTranscode: true,
      },
      audio: audioCodec ? { codec: audioCodec } : { discard: true },
      // An empty tag set drops title, artist, comments, location and similar tags.
      tags: stripMetadata ? {} : undefined,
      showWarnings: false,
    });

    // Never silently lose the picture or the sound.
    const lostTrack = conversion.discardedTracks.some(
      (d) =>
        d.reason !== "discarded_by_user" &&
        (d.track.type === "video" || d.track.type === "audio")
    );
    const hasAudio = (await input.getPrimaryAudioTrack()) !== null;
    if (!conversion.isValid || lostTrack || (hasAudio && !audioCodec)) {
      return unsupported;
    }

    // At full resolution a larger result falls back to the original, or when removing
    // metadata to a remuxed copy without tags (packets copied, nothing re-encoded).
    // A remux is cheap, so the encode gets most of the progress bar.
    const canFallBack = scale === 100;
    await runConversion(
      conversion,
      (p) => onProgress(canFallBack && stripMetadata ? p * 0.9 : p),
      signal
    );
    const encoded = new Blob([output.target.buffer!], { type: "video/mp4" });
    const result: VideoResult = {
      blob: encoded,
      extension: ".mp4",
      width,
      height,
      outputWidth: outputWidth ?? width,
      outputHeight: outputHeight ?? height,
    };
    if (!canFallBack || encoded.size < file.size) return result;

    const original: VideoResult = {
      blob: file,
      extension: extensionOf(file),
      width,
      height,
      outputWidth: width,
      outputHeight: height,
      note: "original",
    };
    if (!stripMetadata) return original;

    // Remux into the input's own container family so codecs keep fitting.
    const isWebm =
      /webm|matroska/i.test(file.type) || /\.(webm|mkv)$/i.test(file.name);
    const remuxOutput = new Output({
      format: isWebm
        ? new WebMOutputFormat()
        : new Mp4OutputFormat({ fastStart: "in-memory" }),
      target: new BufferTarget(),
    });
    try {
      const remux = await Conversion.init({
        input,
        output: remuxOutput,
        tracks: "primary",
        copy: { mode: "forced" },
        tags: {},
        showWarnings: false,
      });
      // The original still carries its metadata, so the clean re-encode is kept.
      if (!remux.isValid || remux.discardedTracks.length > 0) return result;
      await runConversion(remux, (p) => onProgress(0.9 + p * 0.1), signal);
    } catch (error) {
      signal?.throwIfAborted();
      console.warn(`Could not remux ${file.name}:`, error);
      return result;
    }
    const remuxed = new Blob([remuxOutput.target.buffer!], {
      type: isWebm ? "video/webm" : "video/mp4",
    });
    if (remuxed.size >= encoded.size) return result;
    return {
      ...original,
      blob: remuxed,
      extension: isWebm ? ".webm" : ".mp4",
      note: undefined,
    };
  } finally {
    input.dispose();
  }
};

// A video this browser cannot handle is reported on its card instead of failing the batch.
export const compressVideoFile = async (
  file: File,
  quality: number,
  scale: number,
  stripMetadata: boolean,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal
): Promise<VideoResult> => {
  try {
    return await convertVideo(
      file,
      quality,
      scale,
      stripMetadata,
      onProgress,
      signal
    );
  } catch (error) {
    signal?.throwIfAborted();
    console.warn(`Could not compress ${file.name}:`, error);
    return { blob: file, extension: extensionOf(file), note: "unsupported" };
  }
};
