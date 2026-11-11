export interface GuideEntry {
  slug: string;
  title: string;
  summary: string;
  readingMinutes: number;
  categoryLabel: string;
  updatedAt: string;
  relatedToolSlugs: readonly string[];
  sections: ReadonlyArray<{
    heading: string;
    paragraphs: readonly string[];
    bullets?: readonly string[];
  }>;
}

export const GUIDES: readonly GuideEntry[] = [
  {
    slug: "verify-local-processing",
    title: "How to Check in Your Browser That a Tool Never Uploads Your Files",
    summary:
      "Do not take any website's privacy badge on faith. Follow this 60-second DevTools Network tab check to confirm every byte stays on your machine.",
    readingMinutes: 3,
    categoryLabel: "Trust & Verification",
    updatedAt: "2026-11-11",
    relatedToolSlugs: ["pii-redactor", "merge-pdf", "image-compressor", "hidden-text-scanner"],
    sections: [
      {
        heading: "Why claims alone are not proof",
        paragraphs: [
          "Many file-utility sites claim privacy in marketing copy while quietly sending files to temporary backend buckets or logging inputs inside analytics snippets. A real browser-local tool finishes processing with zero outbound payload requests.",
        ],
      },
      {
        heading: "Step-by-step Network tab check",
        paragraphs: [
          "You can audit any tool on Everyday Tools Hub in under a minute using built-in browser developer tools:",
        ],
        bullets: [
          "Open the tool page (for example, Safe-to-Paste Redactor or Merge PDF) and press F12 (or Cmd+Option+I on Mac) to open DevTools.",
          "Switch to the Network tab, click Clear (the crossed-circle icon), and optionally check Preserve log.",
          "Now drop your file or paste test text and run the tool from start to download.",
          "Inspect the Network list: once the page and worker script loaded, zero XHR or Fetch requests carrying your document should appear.",
          "You can even toggle Offline mode in the Network panel before running the tool — local workflows keep working without internet.",
        ],
      },
      {
        heading: "How our registry enforces audit honesty",
        paragraphs: [
          "Every tool page on this site reads its 'Processed on your device' badge directly from our typed tool registry. A badge cannot render unless a dated network-inspection audit record is stored for that tool.",
        ],
      },
    ],
  },
  {
    slug: "what-a-redactor-can-and-cannot-find",
    title: "What a Pattern-Based PII Redactor Can and Cannot Find",
    summary:
      "Understand why deterministic checksums catch cards, IBANs, emails, and API tokens reliably — and where human review remains essential.",
    readingMinutes: 4,
    categoryLabel: "AI Prep",
    updatedAt: "2026-11-11",
    relatedToolSlugs: ["pii-redactor", "hidden-text-scanner"],
    sections: [
      {
        heading: "What deterministic rules catch reliably",
        paragraphs: [
          "Structured identifiers follow strict syntax or mathematical checksums. Safe-to-Paste Redactor validates credit card candidates with the Luhn check, validates IBAN bank accounts by modulo-97 verification, matches E.164/common phone formats, detects IPv4/IPv6 addresses, flags URLs embedding credentials, and finds well-known API token prefixes such as JWTs and private-key headers.",
        ],
      },
      {
        heading: "What pattern matching cannot find alone",
        paragraphs: [
          "Free-form personal names, company names, internal project codenames, and unstructured street addresses cannot be identified reliably with regular expressions without flagging everyday words or missing unfamiliar names. Always review the highlighted draft and manually mask context-specific details before pasting into an external AI.",
        ],
      },
    ],
  },
  {
    slug: "understanding-broken-llm-json",
    title: "Why LLM 'JSON Mode' Still Breaks — and How Deterministic Repair Fixes It",
    summary:
      "A practical breakdown of markdown fence wrapping, trailing commas, Python literals, and mid-stream truncation in model responses.",
    readingMinutes: 4,
    categoryLabel: "AI Prep & Dev",
    updatedAt: "2026-11-11",
    relatedToolSlugs: ["llm-json-repair", "json-formatter"],
    sections: [
      {
        heading: "The five common LLM JSON failure modes",
        paragraphs: [
          "Even with structured output flags enabled, language models regularly wrap payloads inside ```json markdown fences, trail objects with commas, substitute single quotes or unquoted keys, emit Python None/True/False literals, or hit output token limits mid-string.",
        ],
      },
      {
        heading: "Why silent auto-repair can be dangerous",
        paragraphs: [
          "Naive repair scripts quietly close truncated data or guess missing defaults so JSON.parse succeeds — leaving silent data corruption downstream. Our LLM JSON Repair logs every single rule edit with individual undo, highlights truncation explicitly, and validates against your JSON Schema without inventing missing values.",
        ],
      },
    ],
  },
  {
    slug: "what-is-hidden-in-a-pdf",
    title: "Invisible Prompt Injections & Hidden Unicode: What Can Hide Inside Documents",
    summary:
      "How zero-width characters, Unicode tag blocks, white-on-white PDF text, and tiny fonts conceal instructions inside everyday files.",
    readingMinutes: 4,
    categoryLabel: "AI Prep & Security",
    updatedAt: "2026-11-11",
    relatedToolSlugs: ["hidden-text-scanner", "merge-pdf"],
    sections: [
      {
        heading: "Characters humans skip that tokenizers still read",
        paragraphs: [
          "Zero-width joiners, directional overrides, and the Unicode Tag block (U+E0000–U+E007F) render invisibly in standard viewers while passing straight into LLM context windows. Similarly, PDFs and DOCX files can hold near-white text, sub-2pt fonts, invisible PDF render mode 3 text, or hidden HTML elements.",
        ],
      },
      {
        heading: "Treat untrusted documents as untrusted data",
        paragraphs: [
          "Static scanners catch known structural tricks, not every conceivable bypass (for example, instructions inside rasterized screenshots fed to vision models). Always combine scanning with strong privilege separation in AI pipelines.",
        ],
      },
    ],
  },
  {
    slug: "how-token-counts-differ-across-models",
    title: "Why Token Counts Differ Across OpenAI, Claude, and Gemini",
    summary:
      "How BPE vocabularies diverge across English prose, source code, JSON, and non-Latin text — and why honest estimates beat false precision.",
    readingMinutes: 3,
    categoryLabel: "AI Prep",
    updatedAt: "2026-11-11",
    relatedToolSlugs: ["token-counter", "word-counter"],
    sections: [
      {
        heading: "Exact local BPE vs. estimated multipliers",
        paragraphs: [
          "OpenAI publishes open BPE rank tables (o200k_base and cl100k_base) that can run 100% locally in your browser for exact token counts. Proprietary Claude and Gemini tokenizers are not distributed for offline client bundling, meaning any purely client-side counter for those models must report an estimate range.",
        ],
      },
    ],
  },
  {
    slug: "choosing-image-format-jpeg-png-webp",
    title: "Choosing Between JPEG, PNG, and WebP for Speed, Transparency & File Size",
    summary:
      "A quick guide to picking the right image format when compressing photos, screenshots, and logos.",
    readingMinutes: 3,
    categoryLabel: "Image Workflows",
    updatedAt: "2026-11-11",
    relatedToolSlugs: ["image-compressor", "image-converter", "photo-signature-resizer"],
    sections: [
      {
        heading: "Simple format rule of thumb",
        paragraphs: [
          "Use WebP for the smallest web payloads supporting both photos and transparency. Use JPEG when universal compatibility or strict KB limits matter for photos (remembering JPEG fills transparent areas with a solid background). Use PNG for lossless graphics, UI text screenshots, or crisp transparency.",
        ],
      },
    ],
  },
  {
    slug: "merging-and-splitting-pdfs-cleanly",
    title: "Best Practices for Combining Scans, Stripping PDF Metadata & Splitting Ranges",
    summary:
      "Practical tips on page size matching, orientation handling, and removing author metadata before sharing merged PDFs.",
    readingMinutes: 3,
    categoryLabel: "PDF Workflows",
    updatedAt: "2026-11-11",
    relatedToolSlugs: ["merge-pdf", "split-pdf", "jpg-to-pdf"],
    sections: [
      {
        heading: "Before combining scans or contracts",
        paragraphs: [
          "Check whether mixed-size scans should be normalized through JPG to PDF (e.g., all A4) first, verify page order in the keyboard-accessible list, and toggle metadata stripping when sharing final PDFs externally.",
        ],
      },
    ],
  },
  {
    slug: "calendar-date-arithmetic-explained",
    title: "Why Calendar Date Math Beats Millisecond Division Across Leap Years",
    summary:
      "Understanding Feb-29 conventions, month-end clamping, and exclusive vs. inclusive day spans.",
    readingMinutes: 3,
    categoryLabel: "Date Math",
    updatedAt: "2026-11-11",
    relatedToolSlugs: ["age-calculator", "date-difference-calculator"],
    sections: [
      {
        heading: "Preventing DST and leap-year bugs",
        paragraphs: [
          "Dividing epoch milliseconds by 86,400,000 produces off-by-one errors during Daylight Saving transitions and cannot express true calendar years/months. Pure UTC calendar arithmetic guarantees predictable results worldwide.",
        ],
      },
    ],
  },
];

export function getGuideBySlug(slug: string): GuideEntry | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

