"use client";

import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Download, AlertTriangle, QrCode } from "lucide-react";
import { StatusAnnouncer } from "@/components/tools/workspace/StatusAnnouncer";
import {
  buildVCardQrString,
  buildWifiQrString,
  calculateContrastRatio,
  type QrPayloadType,
} from "./qrPayloadBuilder";
import { triggerBlobDownload } from "@/lib/file-processing/filenames";
import { trackToolEvent } from "@/lib/analytics/tracker";
import { useToolStage } from "@/components/tools/workspace/ToolFlow";

export function QrGeneratorTool() {
  const [payloadType, setPayloadType] = useState<QrPayloadType>("url");
  const [urlOrText, setUrlOrText] = useState("https://example.com");
  const [email, setEmail] = useState("");
  const [emailSubj, setEmailSubj] = useState("");
  const [phone, setPhone] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiEnc, setWifiEnc] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);
  const [vcard, setVcard] = useState({
    firstName: "",
    lastName: "",
    organization: "",
    phone: "",
    email: "",
    url: "",
  });

  const [fgColor, setFgColor] = useState("#0F0F0F");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [sizePx, setSizePx] = useState(320);
  const [ecLevel, setEcLevel] = useState<"L" | "M" | "Q" | "H">("M");

  const [qrState, setQrState] = useState<{
    payload: string;
    pngUrl: string;
    svgString: string;
    errorMsg: string | null;
  }>({ payload: "", pngUrl: "", svgString: "", errorMsg: null });

  const encodedPayload = useMemo(() => {
    switch (payloadType) {
      case "url":
      case "text":
        return urlOrText.trim();
      case "email":
        if (!email.trim()) return "";
        return emailSubj.trim()
          ? `mailto:${email.trim()}?subject=${encodeURIComponent(emailSubj.trim())}`
          : `mailto:${email.trim()}`;
      case "phone":
        return phone.trim() ? `tel:${phone.trim()}` : "";
      case "wifi":
        return wifiSsid.trim()
          ? buildWifiQrString({
              ssid: wifiSsid,
              password: wifiPass,
              encryption: wifiEnc,
              hidden: wifiHidden,
            })
          : "";
      case "vcard":
        return vcard.firstName.trim() || vcard.lastName.trim() || vcard.email.trim()
          ? buildVCardQrString(vcard)
          : "";
    }
  }, [payloadType, urlOrText, email, emailSubj, phone, wifiSsid, wifiPass, wifiEnc, wifiHidden, vcard]);

  const contrastRatio = useMemo(() => calculateContrastRatio(fgColor, bgColor), [fgColor, bgColor]);
  const lowContrast = contrastRatio < 4.5;

  useEffect(() => {
    let cancelled = false;
    if (!encodedPayload) return;

    const opts = {
      errorCorrectionLevel: ecLevel,
      margin: 2,
      width: sizePx,
      color: { dark: fgColor, light: bgColor },
    };

    Promise.all([
      QRCode.toDataURL(encodedPayload, opts),
      QRCode.toString(encodedPayload, { ...opts, type: "svg" }),
    ])
      .then(([dataUrl, svg]) => {
        if (cancelled) return;
        setQrState({ payload: encodedPayload, pngUrl: dataUrl, svgString: svg, errorMsg: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setQrState({
          payload: encodedPayload,
          pngUrl: "",
          svgString: "",
          errorMsg: err instanceof Error ? err.message : "Payload exceeds QR code capacity.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [encodedPayload, ecLevel, sizePx, fgColor, bgColor]);

  const pngUrl = encodedPayload && qrState.payload === encodedPayload ? qrState.pngUrl : "";
  const svgString = encodedPayload && qrState.payload === encodedPayload ? qrState.svgString : "";
  const errorMsg = encodedPayload && qrState.payload === encodedPayload ? qrState.errorMsg : null;

  const downloadPng = async () => {
    if (!pngUrl) return;
    const res = await fetch(pngUrl);
    const blob = await res.blob();
    triggerBlobDownload(blob, `qr-${payloadType}.png`);
    trackToolEvent("download", { tool_id: "qr-code-generator", output_format: "png" });
  };

  const downloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    triggerBlobDownload(blob, `qr-${payloadType}.svg`);
    trackToolEvent("download", { tool_id: "qr-code-generator", output_format: "svg" });
  };

  useToolStage(pngUrl ? 2 : 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <StatusAnnouncer message={pngUrl ? "Static QR code preview updated." : ""} />

      {/* Left Controls */}
      <div className="lg:col-span-7 space-y-5">
        <div>
          <span className="text-sm font-semibold block mb-2">1. Choose QR content type</span>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["url", "URL"],
                ["text", "Plain Text"],
                ["wifi", "Wi-Fi"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["vcard", "vCard Contact"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPayloadType(id)}
                className={`px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold cursor-pointer border transition-colors ${
                  payloadType === id
                    ? "bg-[var(--swatch-accent)] text-white border-[var(--swatch-accent)]"
                    : "bg-[var(--theme-surface-muted)] text-[var(--theme-text)] border-transparent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {(payloadType === "url" || payloadType === "text") && (
          <div>
            <label htmlFor="qr-text-input" className="text-sm font-semibold block mb-1.5">
              {payloadType === "url" ? "Destination URL" : "Plain text content"}
            </label>
            <textarea
              id="qr-text-input"
              rows={3}
              value={urlOrText}
              onChange={(e) => setUrlOrText(e.target.value)}
              placeholder={payloadType === "url" ? "https://your-site.example" : "Enter text..."}
              className="tool-input resize-y leading-relaxed"
            />
          </div>
        )}

        {payloadType === "wifi" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="wifi-ssid" className="tool-label">
                Network Name (SSID)
              </label>
              <input
                id="wifi-ssid"
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                className="tool-input"
              />
            </div>
            <div>
              <label htmlFor="wifi-enc" className="tool-label">
                Security
              </label>
              <select
                id="wifi-enc"
                value={wifiEnc}
                onChange={(e) => setWifiEnc(e.target.value as "WPA" | "WEP" | "nopass")}
                className="tool-input"
              >
                <option value="WPA">WPA / WPA2 / WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None (Open)</option>
              </select>
            </div>
            {wifiEnc !== "nopass" && (
              <div className="sm:col-span-2">
                <label htmlFor="wifi-pass" className="tool-label">
                  Password (kept in browser only)
                </label>
                <input
                  id="wifi-pass"
                  type="text"
                  value={wifiPass}
                  onChange={(e) => setWifiPass(e.target.value)}
                  className="tool-input tool-input--mono"
                />
              </div>
            )}
            <label className="sm:col-span-2 inline-flex items-center gap-2 text-xs font-medium">
              <input
                type="checkbox"
                checked={wifiHidden}
                onChange={(e) => setWifiHidden(e.target.checked)}
              />
              <span>Hidden network SSID</span>
            </label>
          </div>
        )}

        {payloadType === "email" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="qr-email" className="tool-label">
                Email address
              </label>
              <input
                id="qr-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="tool-input"
              />
            </div>
            <div>
              <label htmlFor="qr-subj" className="tool-label">
                Subject (optional)
              </label>
              <input
                id="qr-subj"
                type="text"
                value={emailSubj}
                onChange={(e) => setEmailSubj(e.target.value)}
                className="tool-input"
              />
            </div>
          </div>
        )}

        {payloadType === "phone" && (
          <div>
            <label htmlFor="qr-phone" className="tool-label">
              Phone number (with country code)
            </label>
            <input
              id="qr-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 0100"
              className="tool-input"
            />
          </div>
        )}

        {payloadType === "vcard" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                ["firstName", "First name"],
                ["lastName", "Last name"],
                ["organization", "Organization"],
                ["phone", "Phone"],
                ["email", "Email"],
                ["url", "Website"],
              ] as const
            ).map(([field, label]) => (
              <div key={field}>
                <label htmlFor={`vc-${field}`} className="tool-label">
                  {label}
                </label>
                <input
                  id={`vc-${field}`}
                  type="text"
                  value={vcard[field]}
                  onChange={(e) => setVcard((prev) => ({ ...prev, [field]: e.target.value }))}
                  className="tool-input"
                />
              </div>
            ))}
          </div>
        )}

        {/* Styling Options */}
        <div className="pt-2 border-t border-[var(--theme-border)] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label htmlFor="qr-fg" className="tool-label">
              Foreground
            </label>
            <input
              id="qr-fg"
              type="color"
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              className="tool-input !h-10 !p-1 cursor-pointer"
            />
          </div>
          <div>
            <label htmlFor="qr-bg" className="tool-label">
              Background
            </label>
            <input
              id="qr-bg"
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="tool-input !h-10 !p-1 cursor-pointer"
            />
          </div>
          <div>
            <label htmlFor="qr-size" className="tool-label">
              PNG Size ({sizePx}px)
            </label>
            <select
              id="qr-size"
              value={sizePx}
              onChange={(e) => setSizePx(Number(e.target.value))}
              className="tool-input !h-10 !p-1 cursor-pointer"
            >
              <option value={256}>256 × 256 px</option>
              <option value={320}>320 × 320 px</option>
              <option value={512}>512 × 512 px</option>
              <option value={1024}>1024 × 1024 px</option>
            </select>
          </div>
          <div>
            <label htmlFor="qr-ec" className="tool-label">
              Error Correction
            </label>
            <select
              id="qr-ec"
              value={ecLevel}
              onChange={(e) => setEcLevel(e.target.value as "L" | "M" | "Q" | "H")}
              className="tool-input !h-10 !p-1 cursor-pointer"
            >
              <option value="L">L (7%)</option>
              <option value="M">M (15%)</option>
              <option value="Q">Q (25%)</option>
              <option value="H">H (30%)</option>
            </select>
          </div>
        </div>

        {lowContrast && (
          <div
            role="alert"
            className="rounded-xl px-4 py-3 text-xs border flex items-start gap-2"
            style={{
              color: "var(--status-estimated-fg)",
              backgroundColor: "var(--status-estimated-bg)",
              borderColor: "var(--status-estimated-border)",
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Low color contrast ({contrastRatio}:1). Phone cameras scan dark patterns on bright
              backgrounds most reliably (aim for ≥ 4.5:1).
            </span>
          </div>
        )}
      </div>

      {/* Right Preview */}
      <div className="lg:col-span-5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-muted)]/45 p-6 flex flex-col items-center text-center gap-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-muted)]">
          Static QR Preview ({payloadType.toUpperCase()})
        </div>

        {errorMsg ? (
          <p className="text-sm text-[var(--status-finding-fg)]">{errorMsg}</p>
        ) : pngUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pngUrl}
            alt="Generated static QR code preview"
            className="w-56 h-56 rounded-2xl border border-[var(--theme-border)] bg-white p-2 shadow-sm object-contain"
          />
        ) : (
          <div className="w-56 h-56 rounded-2xl border border-dashed border-[var(--theme-border)] flex flex-col items-center justify-center text-xs text-[var(--theme-text-muted)] gap-2">
            <QrCode className="w-8 h-8 opacity-40" aria-hidden="true" />
            <span>Enter fields to generate preview</span>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2.5 w-full">
          <button
            type="button"
            disabled={!pngUrl}
            onClick={() => void downloadPng()}
            className="tool-btn"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Download PNG</span>
          </button>
          <button
            type="button"
            disabled={!svgString}
            onClick={downloadSvg}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] text-sm font-semibold disabled:opacity-45 cursor-pointer"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Download SVG</span>
          </button>
        </div>

        <p className="text-xs text-[var(--theme-text-muted)] leading-relaxed">
          Static QR codes encode your exact payload directly with zero tracking servers.{" "}
          <strong>Always test-scan with a phone camera before printing.</strong>
        </p>
      </div>
    </div>
  );
}

