export interface ImageTaskOptions {
  targetFormat: "image/jpeg" | "image/png" | "image/webp";
  quality: number; // 0.1 - 1.0 (only applied to lossy targets)
  width?: number;
  height?: number;
  fitMode?: "stretch" | "contain";
  backgroundColor?: string;
  targetMaxBytes?: number;
}

export interface ImageProcessOutput {
  blob: Blob;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  mimeType: string;
  hitTargetBytes?: boolean;
  note?: string;
}

async function encodeBitmapToBlob(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  format: ImageTaskOptions["targetFormat"],
  quality: number,
  fitMode: "stretch" | "contain",
  backgroundColor?: string,
): Promise<Blob> {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context is unavailable.");

    if (format === "image/jpeg" || (fitMode === "contain" && backgroundColor && backgroundColor !== "transparent")) {
      ctx.fillStyle = backgroundColor || "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }

    if (fitMode === "contain") {
      const scale = Math.min(width / bitmap.width, height / bitmap.height);
      const dw = Math.max(1, Math.round(bitmap.width * scale));
      const dh = Math.max(1, Math.round(bitmap.height * scale));
      const dx = Math.round((width - dw) / 2);
      const dy = Math.round((height - dh) / 2);
      ctx.drawImage(bitmap, dx, dy, dw, dh);
    } else {
      ctx.drawImage(bitmap, 0, 0, width, height);
    }

    return canvas.convertToBlob({
      type: format,
      quality: format === "image/png" ? undefined : quality,
    });
  }

  // Fallback for browsers lacking OffscreenCanvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context is unavailable.");

  if (format === "image/jpeg" || (fitMode === "contain" && backgroundColor && backgroundColor !== "transparent")) {
    ctx.fillStyle = backgroundColor || "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  if (fitMode === "contain") {
    const scale = Math.min(width / bitmap.width, height / bitmap.height);
    const dw = Math.max(1, Math.round(bitmap.width * scale));
    const dh = Math.max(1, Math.round(bitmap.height * scale));
    const dx = Math.round((width - dw) / 2);
    const dy = Math.round((height - dh) / 2);
    ctx.drawImage(bitmap, dx, dy, dw, dh);
  } else {
    ctx.drawImage(bitmap, 0, 0, width, height);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image encoding returned empty blob."))),
      format,
      format === "image/png" ? undefined : quality,
    );
  });
}

export async function processImageFile(
  file: Blob,
  options: ImageTaskOptions,
): Promise<ImageProcessOutput> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  try {
    const originalWidth = bitmap.width;
    const originalHeight = bitmap.height;
    const targetWidth = Math.max(1, Math.round(options.width ?? originalWidth));
    const targetHeight = Math.max(1, Math.round(options.height ?? originalHeight));
    const fitMode = options.fitMode ?? "stretch";

    // Standard single-pass encode when no targetMaxBytes is set
    if (!options.targetMaxBytes || options.targetMaxBytes <= 0) {
      const blob = await encodeBitmapToBlob(
        bitmap,
        targetWidth,
        targetHeight,
        options.targetFormat,
        options.quality,
        fitMode,
        options.backgroundColor,
      );
      return {
        blob,
        width: targetWidth,
        height: targetHeight,
        originalWidth,
        originalHeight,
        mimeType: options.targetFormat,
      };
    }

    // Iterative binary-search solver for Photo & Signature Resizer KB target
    const targetBytes = options.targetMaxBytes;
    if (options.targetFormat === "image/png") {
      const pngBlob = await encodeBitmapToBlob(
        bitmap,
        targetWidth,
        targetHeight,
        "image/png",
        1,
        fitMode,
        options.backgroundColor,
      );
      const hit = pngBlob.size <= targetBytes;
      return {
        blob: pngBlob,
        width: targetWidth,
        height: targetHeight,
        originalWidth,
        originalHeight,
        mimeType: "image/png",
        hitTargetBytes: hit,
        note: hit
          ? undefined
          : "PNG compression is lossless and exceeded your KB target; switch output format to JPEG for precise KB targeting.",
      };
    }

    let low = 0.08;
    let high = 0.96;
    let bestFitting: Blob | null = null;
    let smallestSeen: Blob | null = null;

    for (let iter = 0; iter < 8; iter++) {
      const mid = (low + high) / 2;
      const candidate = await encodeBitmapToBlob(
        bitmap,
        targetWidth,
        targetHeight,
        options.targetFormat,
        mid,
        fitMode,
        options.backgroundColor,
      );
      if (!smallestSeen || candidate.size < smallestSeen.size) {
        smallestSeen = candidate;
      }
      if (candidate.size <= targetBytes) {
        bestFitting = candidate;
        low = mid; // Try higher quality while staying within budget
      } else {
        high = mid;
      }
    }

    if (bestFitting) {
      return {
        blob: bestFitting,
        width: targetWidth,
        height: targetHeight,
        originalWidth,
        originalHeight,
        mimeType: options.targetFormat,
        hitTargetBytes: true,
      };
    }

    return {
      blob: smallestSeen!,
      width: targetWidth,
      height: targetHeight,
      originalWidth,
      originalHeight,
      mimeType: options.targetFormat,
      hitTargetBytes: false,
      note: "Even at lowest safe lossy quality, these dimensions exceed the KB limit. Reduce pixel dimensions or raise the KB ceiling.",
    };
  } finally {
    bitmap.close();
  }
}

