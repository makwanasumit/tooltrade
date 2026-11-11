export type QrPayloadType = "url" | "text" | "wifi" | "email" | "phone" | "vcard";

export interface WifiPayloadInput {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}

export interface VCardPayloadInput {
  firstName: string;
  lastName: string;
  organization: string;
  phone: string;
  email: string;
  url: string;
}

function escapeWifiField(val: string): string {
  return val.replace(/([\\;,:"])/g, "\\$1");
}

function escapeVCardField(val: string): string {
  return val.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

export function buildWifiQrString(input: WifiPayloadInput): string {
  const enc = input.encryption;
  const passPart = enc === "nopass" ? "" : `P:${escapeWifiField(input.password)};`;
  const hiddenPart = input.hidden ? "H:true;" : "";
  return `WIFI:T:${enc};S:${escapeWifiField(input.ssid)};${passPart}${hiddenPart};`;
}

export function buildVCardQrString(input: VCardPayloadInput): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCardField(input.lastName)};${escapeVCardField(input.firstName)};;;`,
    `FN:${escapeVCardField(`${input.firstName} ${input.lastName}`.trim())}`,
  ];
  if (input.organization.trim()) lines.push(`ORG:${escapeVCardField(input.organization.trim())}`);
  if (input.phone.trim()) lines.push(`TEL:${input.phone.trim()}`);
  if (input.email.trim()) lines.push(`EMAIL:${input.email.trim()}`);
  if (input.url.trim()) lines.push(`URL:${input.url.trim()}`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function calculateContrastRatio(fgHex: string, bgHex: string): number {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  if (!fg || !bg) return 1;
  const l1 =
    0.2126 * channelLuminance(fg[0]) +
    0.7152 * channelLuminance(fg[1]) +
    0.0722 * channelLuminance(fg[2]);
  const l2 =
    0.2126 * channelLuminance(bg[0]) +
    0.7152 * channelLuminance(bg[1]) +
    0.0722 * channelLuminance(bg[2]);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

