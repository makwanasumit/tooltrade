export function sanitizeFilename(rawName: string, fallback = "output"): string {
  const withoutPath = rawName.split(/[/\\]/).pop() ?? fallback;
  const cleaned = withoutPath
    .replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "")
    .replace(/\s+/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+/, "")
    .trim();
  return cleaned.length > 0 ? cleaned.slice(0, 120) : fallback;
}

export function buildOutputFilename(
  originalName: string,
  suffix: string,
  newExtension?: string,
): string {
  const safe = sanitizeFilename(originalName, "file");
  const lastDot = safe.lastIndexOf(".");
  const base = lastDot > 0 ? safe.slice(0, lastDot) : safe;
  const ext = newExtension
    ? newExtension.replace(/^\./, "")
    : lastDot > 0
      ? safe.slice(lastDot + 1)
      : "bin";
  return `${base}${suffix}.${ext}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = sanitizeFilename(filename, "download");
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

