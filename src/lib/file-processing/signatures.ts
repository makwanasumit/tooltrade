export type DetectedFileKind =
  | "jpeg"
  | "png"
  | "webp"
  | "pdf"
  | "docx"
  | "html"
  | "text"
  | "unknown";

function matchesBytes(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, i) => bytes[offset + i] === byte);
}

export async function readHeaderBytes(file: Blob, count = 64): Promise<Uint8Array> {
  const slice = file.slice(0, count);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

export function detectBinarySignature(bytes: Uint8Array): DetectedFileKind {
  // JPEG: FF D8 FF
  if (matchesBytes(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (matchesBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  // WebP: RIFF....WEBP
  if (
    matchesBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    matchesBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "webp";
  }
  // PDF: %PDF-
  if (matchesBytes(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "pdf";
  // ZIP / DOCX: PK 03 04
  if (matchesBytes(bytes, [0x50, 0x4b, 0x03, 0x04])) return "docx";

  // Check if binary null bytes appear (reject binary masquerading as text)
  let hasNullByte = false;
  for (let i = 0; i < Math.min(bytes.length, 512); i++) {
    if (bytes[i] === 0) {
      hasNullByte = true;
      break;
    }
  }
  if (!hasNullByte && bytes.length > 0) {
    const sample = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 256)).trimStart();
    if (/^<!doctype\s+html/i.test(sample) || /^<html[\s>]/i.test(sample)) {
      return "html";
    }
    return "text";
  }

  return bytes.length === 0 ? "text" : "unknown";
}

export async function validateFileSignature(
  file: File,
  allowedKinds: readonly DetectedFileKind[],
): Promise<{ valid: boolean; detected: DetectedFileKind; reason?: string }> {
  const bytes = await readHeaderBytes(file, 512);
  let detected = detectBinarySignature(bytes);

  // Refine HTML vs plain text by filename hint only after verifying it's non-binary text
  if (detected === "text" && /\.html?$/i.test(file.name)) {
    detected = "html";
  }

  if (detected === "docx") {
    // Confirm DOCX isn't just an arbitrary zip if text/docx expected
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".docx") && !allowedKinds.includes("docx")) {
      return { valid: false, detected: "unknown", reason: "File signature does not match accepted formats." };
    }
  }

  if (!allowedKinds.includes(detected)) {
    return {
      valid: false,
      detected,
      reason: `File content appears to be "${detected}", which is not supported by this tool.`,
    };
  }

  return { valid: true, detected };
}

