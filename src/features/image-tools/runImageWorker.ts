import {
  processImageFile,
  type ImageProcessOutput,
  type ImageTaskOptions,
} from "./imageProcessor";

export function runImageTask(
  file: Blob,
  options: ImageTaskOptions,
): Promise<ImageProcessOutput> {
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") {
    return processImageFile(file, options);
  }

  return new Promise<ImageProcessOutput>((resolve, reject) => {
    const worker = new Worker(new URL("@/workers/image.worker.ts", import.meta.url));
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const cleanup = () => worker.terminate();

    worker.onmessage = (
      ev: MessageEvent<{ id: string; ok: boolean; result?: ImageProcessOutput; error?: string }>,
    ) => {
      if (ev.data.id !== id) return;
      cleanup();
      if (ev.data.ok && ev.data.result) {
        resolve(ev.data.result);
      } else {
        reject(new Error(ev.data.error || "Image worker failed."));
      }
    };

    worker.onerror = () => {
      cleanup();
      // Fallback safely to main thread if worker fails to load
      processImageFile(file, options).then(resolve, reject);
    };

    worker.postMessage({ id, file, options });
  });
}

