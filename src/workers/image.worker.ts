import { processImageFile, type ImageTaskOptions } from "@/features/image-tools/imageProcessor";

export interface ImageWorkerRequest {
  id: string;
  file: Blob;
  options: ImageTaskOptions;
}

self.onmessage = async (event: MessageEvent<ImageWorkerRequest>) => {
  const { id, file, options } = event.data;
  try {
    const result = await processImageFile(file, options);
    self.postMessage({ id, ok: true, result });
  } catch (err) {
    self.postMessage({
      id,
      ok: false,
      error: err instanceof Error ? err.message : "Image processing failed.",
    });
  }
};

