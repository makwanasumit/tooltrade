import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, Newsreader, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { TransitionOverlay } from "@/components/motion/TransitionOverlay";
import { CursorMarquee } from "@/components/motion/CursorMarquee";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-loaded",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  display: "swap",
});

const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif-loaded",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Everyday Tools Hub — Free Browser-Local Utilities & AI Prep Tools",
    template: "%s",
  },
  description:
    "Fast, friendly online tools for images, PDFs, text, JSON, QR codes, dates, and AI preparation — executed locally in your browser with honest accuracy labels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${serif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="theme-light min-h-screen flex flex-col">
        <Analytics />
        <SpeedInsights />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <MotionProvider>
          <TransitionOverlay />
          <CursorMarquee />
          <SiteHeader />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </MotionProvider>
      </body>
    </html>
  );
}

