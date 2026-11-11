export const DETECTOR_SET_VERSION = "2026.11.1";

export type PiiDetectorId =
  | "email"
  | "phone"
  | "credit_card"
  | "iban"
  | "ipv4"
  | "ipv6"
  | "credential_url"
  | "api_key_token"
  | "private_key_block"
  | "us_ssn"
  | "in_pan";

export interface DetectorMatch {
  id: string;
  detectorId: PiiDetectorId;
  label: string;
  placeholderPrefix: string;
  start: number;
  end: number;
  value: string;
  accuracy: "exact" | "heuristic";
}

export interface DetectorDefinition {
  id: PiiDetectorId;
  label: string;
  placeholderPrefix: string;
  accuracy: "exact" | "heuristic";
  pattern: RegExp;
  validate?: (matchText: string) => boolean;
}

export function passesLuhn(rawDigits: string): boolean {
  const digits = rawDigits.replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function passesIbanMod97(rawIban: string): boolean {
  const clean = rawIban.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(clean)) return false;
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  let remainder = 0;
  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i);
    const expanded = code >= 65 && code <= 90 ? String(code - 55) : rearranged[i]!;
    for (let j = 0; j < expanded.length; j++) {
      remainder = (remainder * 10 + Number(expanded[j])) % 97;
    }
  }
  return remainder === 1;
}

function isValidIpv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

export const PII_DETECTORS: readonly DetectorDefinition[] = [
  {
    id: "private_key_block",
    label: "Private Key Block",
    placeholderPrefix: "PRIVATE_KEY",
    accuracy: "exact",
    pattern: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g,
  },
  {
    id: "credential_url",
    label: "URL with Credentials / Token",
    placeholderPrefix: "CRED_URL",
    accuracy: "exact",
    pattern:
      /https?:\/\/(?:[^\s/:@]+:[^\s/@]+@[^\s,;)]+|[^\s]+[?&](?:api_key|apikey|token|secret|access_token|password)=[^\s&,;)]+)/gi,
  },
  {
    id: "api_key_token",
    label: "API Key / JWT Token",
    placeholderPrefix: "API_KEY",
    accuracy: "exact",
    pattern:
      /\b(?:sk-[A-Za-z0-9_-]{16,}|sk_(?:live|test)_[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|xox[bpas]-[0-9A-Za-z-]{16,}|eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})\b/g,
  },
  {
    id: "email",
    label: "Email Address",
    placeholderPrefix: "EMAIL",
    accuracy: "exact",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  {
    id: "iban",
    label: "IBAN Bank Account",
    placeholderPrefix: "IBAN",
    accuracy: "exact",
    pattern: /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,4})?\b/g,
    validate: passesIbanMod97,
  },
  {
    id: "credit_card",
    label: "Payment Card (Luhn)",
    placeholderPrefix: "CARD",
    accuracy: "exact",
    pattern: /\b(?:\d[ -]?){13,18}\d\b/g,
    validate: passesLuhn,
  },
  {
    id: "us_ssn",
    label: "US SSN Format",
    placeholderPrefix: "SSN",
    accuracy: "exact",
    pattern: /\b(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
  },
  {
    id: "in_pan",
    label: "India PAN Format",
    placeholderPrefix: "PAN",
    accuracy: "exact",
    pattern: /\b[A-Z]{3}[PCHFATBLJG][A-Z]\d{4}[A-Z]\b/g,
  },
  {
    id: "ipv4",
    label: "IPv4 Address",
    placeholderPrefix: "IP",
    accuracy: "exact",
    pattern: /(?<!\bv)\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    validate: (ip) => isValidIpv4(ip) && !/^0\.0\.0\.0$/.test(ip),
  },
  {
    id: "ipv6",
    label: "IPv6 Address",
    placeholderPrefix: "IPV6",
    accuracy: "exact",
    pattern: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
  },
  {
    id: "phone",
    label: "Phone Number",
    placeholderPrefix: "PHONE",
    accuracy: "heuristic",
    pattern: /(?<!\w)(?:\+\d{1,3}[-.\s]?|\(\d{3}\)[-.\s]?)\d{3,4}[-.\s]?\d{3,4}(?:[-.\s]?\d{2,4})?\b/g,
    validate: (text) => {
      const digits = text.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    },
  },
];
