import type { CategoryMeta, ToolCategory, ToolDefinition } from "./types";

export const CATEGORIES: readonly CategoryMeta[] = [
  {
    slug: "ai-prep-tools",
    name: "AI Prep Tools",
    shortName: "AI Prep",
    tagline: "Prepare data for LLMs, strip sensitive values, and inspect model output.",
    description:
      "Tools built for the AI workflow: repair broken JSON from chatbots, mask sensitive details before pasting, estimate exact vs. approximated token budgets, and inspect documents for hidden or invisible text.",
    guidance:
      "Start with Safe-to-Paste Redactor before sharing work documents with a chat model, check context limits in Token & Context Calculator, verify incoming files with Hidden Text Scanner, and fix malformed model responses in LLM JSON Repair.",
    themeVariant: "theme-sky",
    accentHex: "#2F6BFF",
    guideSlugs: [
      "verify-local-processing",
      "understanding-broken-llm-json",
      "what-a-redactor-can-and-cannot-find",
      "what-is-hidden-in-a-pdf",
      "how-token-counts-differ-across-models",
    ],
  },
  {
    slug: "image-tools",
    name: "Image Tools",
    shortName: "Images",
    tagline: "Compress, convert, and resize raster images right in your browser.",
    description:
      "Fast local image workflows for JPEG, PNG, and WebP files with side-by-side comparison, batch ZIP export, transparent-to-JPEG background fill, and iterative KB target sizing.",
    guidance:
      "Use Image Compressor to shrink photos for the web, Image Converter to switch between JPEG/PNG/WebP, Image Resizer for pixel or percentage scaling, and Photo & Signature Resizer when a form requires both dimensions and a max file size.",
    themeVariant: "theme-coral",
    accentHex: "#FF4D2E",
    guideSlugs: ["verify-local-processing", "choosing-image-format-jpeg-png-webp"],
  },
  {
    slug: "pdf-tools",
    name: "PDF Tools",
    shortName: "PDF",
    tagline: "Combine, split, and turn images into PDFs without uploading documents.",
    description:
      "Everyday PDF assembly and page extraction executed locally in your browser worker — no upload wait times, no account gates, and optional metadata stripping.",
    guidance:
      "Use Merge PDF to combine files in custom order, Split PDF to pull specific pages or ranges into PDFs or a ZIP archive, and JPG to PDF to arrange scans onto A4, Letter, or fit-to-image pages.",
    themeVariant: "theme-mint",
    accentHex: "#17A673",
    guideSlugs: ["verify-local-processing", "merging-and-splitting-pdfs-cleanly"],
  },
  {
    slug: "text-tools",
    name: "Text Tools",
    shortName: "Text",
    tagline: "Live word, character, reading time, and whitespace cleanup utilities.",
    description:
      "Clean, transparent text measurement with documented counting rules for contractions, hyphens, emoji, and CJK characters, plus instant links to LLM token estimation.",
    guidance:
      "Paste drafts into Word & Character Counter to check lengths against editorial or essay limits, tidy extra whitespace, and jump directly to Token & Context Calculator when preparing prompts.",
    themeVariant: "theme-accent",
    accentHex: "#5B2BFF",
    guideSlugs: ["verify-local-processing", "how-token-counts-differ-across-models"],
  },
  {
    slug: "developer-tools",
    name: "Developer Tools",
    shortName: "Developer",
    tagline: "Validate, format, minify, and inspect structured JSON payloads locally.",
    description:
      "Zero-telemetry JSON parsing and formatting with line/column diagnostics and seamless handoff to LLM JSON Repair when model outputs break strict JSON syntax.",
    guidance:
      "Use JSON Formatter & Validator for standard payloads and schema checks. If your text contains markdown code fences, trailing commas, or truncated model output, switch to LLM JSON Repair.",
    themeVariant: "theme-volt",
    accentHex: "#D6F23A",
    guideSlugs: ["verify-local-processing", "understanding-broken-llm-json"],
  },
  {
    slug: "qr-tools",
    name: "QR Tools",
    shortName: "QR",
    tagline: "Generate static PNG and SVG QR codes for URLs, Wi-Fi, and contacts.",
    description:
      "Private, static QR code generation with foreground/background contrast warnings so printed codes actually scan reliably on phone cameras.",
    guidance:
      "Choose your payload format (URL, Wi-Fi, vCard, email, phone, or plain text), verify a high-contrast color pair, export SVG for print or PNG for screens, and always test-scan before printing.",
    themeVariant: "theme-accent",
    accentHex: "#5B2BFF",
    guideSlugs: ["verify-local-processing"],
  },
  {
    slug: "date-calculators",
    name: "Date Calculators",
    shortName: "Dates",
    tagline: "Calendar-accurate age and date-span math across leap years and month ends.",
    description:
      "Exact timezone-independent calendar arithmetic for age breakdown and day/month/year intervals, with explicit inclusive/exclusive conventions.",
    guidance:
      "Use Age Calculator for exact years, months, days, and total days at any reference date. Use Date Difference Calculator for project spans with an optional inclusive end-date toggle.",
    themeVariant: "theme-volt",
    accentHex: "#D6F23A",
    guideSlugs: ["calendar-date-arithmetic-explained"],
  },
];

export const TOOLS_REGISTRY: readonly ToolDefinition[] = [
  // === WAVE 0: IMAGE TOOLS (4) ===
  {
    id: "image-compressor",
    slug: "image-compressor",
    category: "image-tools",
    wave: 0,
    name: "Image Compressor",
    shortDescription: "Shrink JPEG, PNG, and WebP file sizes locally with side-by-side preview and batch ZIP.",
    title: "Image Compressor — Local Browser Compression | Everyday Tools Hub",
    metaDescription:
      "Compress JPEG, PNG, and WebP images right in your browser with before/after comparison, optional resize, metadata stripping, and batch ZIP downloads.",
    outcomeStatement: "Reduce image file size in your browser without uploading files to a server.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "exact",
    accuracyNote: "Output byte sizes, dimensions, and percentage reductions are measured directly on the generated Blob.",
    relatedToolIds: ["image-converter", "image-resizer", "photo-signature-resizer"],
    acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileBytes: 25 * 1024 * 1024,
    maxFileLabel: "25 MB per file (up to 15 files per batch)",
    supportedFormats: ["JPEG", "PNG", "WebP"],
    limitations: [
      "Canvas-based PNG export is lossless and ignores lossy quality sliders; switch output to WebP or JPEG if you need aggressive byte reduction on photos.",
      "If a compressed output turns out larger than the input, the tool warns you so you can keep the original.",
      "Very large multi-megapixel batches can hit mobile browser memory caps; process in smaller batches on phones.",
    ],
    instructions: [
      "Drop or choose one or more JPEG, PNG, or WebP images.",
      "Adjust lossy quality (for JPEG/WebP), optional max width, and metadata removal.",
      "Compare before/after previews and byte savings, then download individually or as a ZIP.",
    ],
    faqs: [
      {
        question: "Why is there no quality slider effect on PNG files?",
        answer:
          "Browser PNG encoders write lossless PNG streams, so a quality slider has no effect on PNG output. We only activate the quality slider when exporting JPEG or WebP.",
      },
      {
        question: "Does removing metadata change how my photo looks?",
        answer:
          "Re-encoding through canvas strips EXIF GPS, camera serial numbers, and XMP tags while preserving pixel appearance and applying EXIF orientation first.",
      },
    ],
    themeVariant: "theme-coral",
    featured: true,
    keywords: ["image compressor", "compress jpg", "reduce photo size", "webp compressor"],
  },
  {
    id: "image-converter",
    slug: "image-converter",
    category: "image-tools",
    wave: 0,
    name: "Image Converter",
    shortDescription: "Convert between JPEG, PNG, and WebP with transparency fill and EXIF orientation handling.",
    title: "Image Converter (JPEG, PNG, WebP) — Local Browser Tool | Everyday Tools Hub",
    metaDescription:
      "Convert images among JPEG, PNG, and WebP locally in your browser. Choose background fill for transparent PNGs converted to JPEG and export batches as ZIP.",
    outcomeStatement: "Convert images between JPEG, PNG, and WebP locally with full transparency control.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "exact",
    accuracyNote: "Output MIME type, pixel dimensions, and file byte count are read directly from the encoded image.",
    relatedToolIds: ["image-compressor", "image-resizer", "jpg-to-pdf"],
    acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileBytes: 25 * 1024 * 1024,
    maxFileLabel: "25 MB per file (up to 15 files per batch)",
    supportedFormats: ["JPEG", "PNG", "WebP"],
    limitations: [
      "JPEG does not support transparency; transparent pixels are filled with your chosen background color.",
      "Animated WebP files export as a single first frame when converted via browser canvas.",
    ],
    instructions: [
      "Select JPEG, PNG, or WebP images.",
      "Pick your target format, background fill color (when converting to JPEG), and quality (for lossy outputs).",
      "Convert and download individual images or a single ZIP archive.",
    ],
    faqs: [
      {
        question: "Is converting a JPEG to PNG lossless?",
        answer:
          "Converting JPEG to PNG stores the decoded pixels without further lossy artifacts, though it cannot restore detail already discarded by the original JPEG compression and usually increases file size.",
      },
    ],
    themeVariant: "theme-coral",
    keywords: ["image converter", "png to jpg", "jpg to webp", "webp to png"],
  },
  {
    id: "image-resizer",
    slug: "image-resizer",
    category: "image-tools",
    wave: 0,
    name: "Image Resizer",
    shortDescription: "Resize images by exact pixels or percentage with aspect-ratio lock and contain fit.",
    title: "Image Resizer — Resize Pixels & Percentage Locally | Everyday Tools Hub",
    metaDescription:
      "Resize JPEG, PNG, and WebP images by exact pixel dimensions or percentage right in your browser, with aspect-ratio lock and contain-fit preview.",
    outcomeStatement: "Scale images to exact pixel dimensions or percentages without server uploads.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "exact",
    accuracyNote: "Resulting pixel dimensions are rounded to whole integers and verified on the exported image.",
    relatedToolIds: ["photo-signature-resizer", "image-compressor", "image-converter"],
    acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileBytes: 25 * 1024 * 1024,
    maxFileLabel: "25 MB per file (max output 8000 × 8000 px)",
    supportedFormats: ["JPEG", "PNG", "WebP"],
    limitations: [
      "Upscaling small images beyond their original dimensions reduces sharpness.",
      "Extreme dimensions above 8000 px are blocked to prevent mobile browser tab crashes.",
    ],
    instructions: [
      "Upload a JPEG, PNG, or WebP file.",
      "Resize by pixels (width/height with optional aspect lock or contain fit) or percentage.",
      "Preview the updated dimensions and download in your preferred format.",
    ],
    faqs: [
      {
        question: "What does 'contain fit' do when aspect lock is off?",
        answer:
          "Contain fit scales your image to stay completely inside the target box without stretching or distorting proportions, optionally centering it on your chosen background.",
      },
    ],
    themeVariant: "theme-coral",
    keywords: ["image resizer", "resize image online", "resize photo pixels"],
  },
  {
    id: "photo-signature-resizer",
    slug: "photo-signature-resizer",
    category: "image-tools",
    wave: 0,
    name: "Photo & Signature Resizer",
    shortDescription: "Target both exact pixel dimensions and a maximum KB/MB limit for application uploads.",
    title: "Photo & Signature Resizer (Exact Dimensions + KB Target) | Everyday Tools Hub",
    metaDescription:
      "Resize a photo or signature image to custom pixel dimensions and attempt a user-entered max KB/MB file size locally in your browser.",
    outcomeStatement: "Meet custom pixel dimensions and file-size ceilings for form uploads locally.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "exact",
    accuracyNote: "Displayed dimensions and byte size are measured directly on the final exported file.",
    relatedToolIds: ["image-resizer", "image-compressor", "jpg-to-pdf"],
    acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileBytes: 20 * 1024 * 1024,
    maxFileLabel: "20 MB single image",
    supportedFormats: ["JPEG", "PNG", "WebP"],
    limitations: [
      "Extremely tiny byte targets (for example under 5 KB at large dimensions) may be impossible without changing format to JPEG or lowering dimensions; if the target cannot be reached cleanly, the tool explains why and shows the closest output.",
      "No unverified exam or government portal presets are hard-coded; always enter the dimensions and KB limits printed on your official form.",
    ],
    instructions: [
      "Select your photo or scanned signature image.",
      "Enter the required width, height, output format (JPEG gives predictable KB control), and max target KB.",
      "Inspect the exact output KB and pixels before downloading.",
    ],
    faqs: [
      {
        question: "Why aren't specific exam presets pre-filled?",
        answer:
          "Application portals change pixel and file-size rules frequently. Rather than risking outdated presets, you enter the exact specifications from your form instructions and we verify the output against them.",
      },
    ],
    themeVariant: "theme-coral",
    keywords: ["photo signature resizer", "resize photo 20 kb", "signature kb resizer"],
  },

  // === WAVE 0: PDF TOOLS (3) ===
  {
    id: "merge-pdf",
    slug: "merge-pdf",
    category: "pdf-tools",
    wave: 0,
    name: "Merge PDF",
    shortDescription: "Combine multiple PDFs in custom drag-or-keyboard order locally with optional metadata cleanup.",
    title: "Merge PDF — Combine PDFs Locally in Your Browser | Everyday Tools Hub",
    metaDescription:
      "Combine multiple PDF files in your chosen order directly in the browser. Zero file uploads, keyboard-accessible reordering, and optional metadata stripping.",
    outcomeStatement: "Merge multiple PDFs into one file locally without uploading private documents.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "exact",
    accuracyNote: "Page counts and merged byte size are read directly from the generated PDF structure.",
    relatedToolIds: ["split-pdf", "jpg-to-pdf", "hidden-text-scanner"],
    acceptedMimeTypes: ["application/pdf"],
    maxFileBytes: 50 * 1024 * 1024,
    maxFileLabel: "50 MB per file / 100 MB combined",
    supportedFormats: ["PDF (unencrypted)"],
    limitations: [
      "Password-protected or DRM-encrypted PDFs cannot be merged and will report a clear error.",
      "Interactive form fields or digital signatures may be flattened or invalidated when copied across PDF documents.",
    ],
    instructions: [
      "Add two or more PDF files from your device.",
      "Reorder files using drag handles or keyboard up/down buttons, and optionally drop document info metadata.",
      "Click Merge PDF and download the combined document.",
    ],
    faqs: [
      {
        question: "Are my PDFs sent to any server during merging?",
        answer:
          "No. Pages are copied inside a local browser Web Worker using pdf-lib. You can verify zero network uploads using your browser DevTools Network tab.",
      },
    ],
    themeVariant: "theme-mint",
    featured: true,
    keywords: ["merge pdf", "combine pdf files", "local pdf merger"],
  },
  {
    id: "split-pdf",
    slug: "split-pdf",
    category: "pdf-tools",
    wave: 0,
    name: "Split PDF",
    shortDescription: "Preview every page, click the ones you want, and export only those pages in your chosen order.",
    title: "Split PDF — Extract Pages & Ranges Locally | Everyday Tools Hub",
    metaDescription:
      "Preview every page of a PDF, click the pages you want, and export only those pages in your selection order — right in your browser. Zero uploads.",
    outcomeStatement: "Pick the exact pages you need from a PDF — in the order you want — without uploading it.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "exact",
    accuracyNote: "Selected pages are validated against the source document's exact page count and copied in your selection order. Thumbnails are a visual preview only.",
    relatedToolIds: ["merge-pdf", "jpg-to-pdf", "hidden-text-scanner"],
    acceptedMimeTypes: ["application/pdf"],
    maxFileBytes: 50 * 1024 * 1024,
    maxFileLabel: "50 MB single PDF",
    supportedFormats: ["PDF (unencrypted)"],
    limitations: [
      "Password-protected PDFs cannot be split without removing protection first in your PDF viewer.",
      "Page thumbnails are drawn in your browser and may take a moment on very large documents; selection works even if a preview cannot be drawn.",
      "Invalid or out-of-range page syntax in Quick select is blocked before processing.",
    ],
    instructions: [
      "Select an unencrypted PDF — every page appears as a thumbnail.",
      "Click the pages you want. The number in each page's top-right corner is its position in the output (use Shift+click for a run, or type a range like 1-3, 5).",
      "Click Split PDF, then download the combined PDF — or a ZIP if you chose one file per page.",
    ],
    faqs: [
      {
        question: "When does Split PDF create a ZIP vs. a single PDF?",
        answer:
          "By default your selected pages are combined into one PDF. Tick \"Save each selected page as its own PDF\" to receive a ZIP of single-page files instead.",
      },
      {
        question: "How is the page order decided?",
        answer:
          "Pages appear in the output in the order you click them — the number badge on each selected page shows its position. Deselecting a page renumbers the rest.",
      },
    ],
    themeVariant: "theme-mint",
    keywords: ["split pdf", "extract pdf pages", "pdf page range extractor"],
  },
  {
    id: "jpg-to-pdf",
    slug: "jpg-to-pdf",
    category: "pdf-tools",
    wave: 0,
    name: "JPG to PDF",
    shortDescription: "Turn one or more JPEG or PNG images into a clean A4, Letter, or fit-to-image PDF.",
    title: "JPG & PNG to PDF — Local Image-to-PDF Builder | Everyday Tools Hub",
    metaDescription:
      "Convert JPEG and PNG images into a multi-page PDF locally in your browser with page size (A4, Letter, Fit), orientation, margins, and reordering.",
    outcomeStatement: "Arrange JPEG and PNG scans into a downloadable PDF without uploading.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "exact",
    accuracyNote: "Page dimensions, orientation, and embedded image count match your selected layout.",
    relatedToolIds: ["merge-pdf", "photo-signature-resizer", "image-compressor"],
    acceptedMimeTypes: ["image/jpeg", "image/png"],
    maxFileBytes: 25 * 1024 * 1024,
    maxFileLabel: "25 MB per image / up to 30 images",
    supportedFormats: ["JPEG", "PNG"],
    limitations: [
      "WebP inputs are automatically decoded to PNG/JPEG canvas frames before PDF embedding.",
      "Very tall stitched screenshots look best in 'Fit to image' page mode rather than fixed A4.",
    ],
    instructions: [
      "Add your JPEG or PNG images and arrange them in page order.",
      "Select page size (A4, US Letter, or Fit to image), orientation, and margin padding.",
      "Generate and download your PDF.",
    ],
    faqs: [
      {
        question: "Does it fix rotated smartphone photos?",
        answer:
          "Yes — browser bitmap decoding applies EXIF orientation automatically before embedding images onto PDF pages.",
      },
    ],
    themeVariant: "theme-mint",
    keywords: ["jpg to pdf", "images to pdf", "png to pdf converter"],
  },

  // === WAVE 0: TEXT, DEVELOPER, QR & DATE TOOLS (5) ===
  {
    id: "word-counter",
    slug: "word-counter",
    category: "text-tools",
    wave: 0,
    name: "Word & Character Counter",
    shortDescription: "Live word, character, sentence, paragraph, and reading-time stats with transparent counting rules.",
    title: "Word & Character Counter — Local Text Stats | Everyday Tools Hub",
    metaDescription:
      "Count words, characters with and without spaces, sentences, paragraphs, and reading time locally with clear rules and one-click whitespace cleanup.",
    outcomeStatement: "Measure words, characters, and reading time instantly with documented counting rules.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "exact",
    accuracyNote: "Character, word, and line counts are exact under our documented Unicode rule set; reading/speaking times are estimated from standard WPM rates.",
    relatedToolIds: ["token-counter", "pii-redactor", "hidden-text-scanner"],
    supportedFormats: ["Plain text", ".txt", ".md"],
    limitations: [
      "Word boundaries follow Unicode segmentation; hyphenated words count as one token and CJK ideographs count per word/segment rule explained below.",
      "Reading (~225 WPM) and speaking (~130 WPM) times are helpful averages, not exact timers.",
    ],
    instructions: [
      "Paste or type text into the workspace.",
      "Review live counts, optionally collapse extra spaces, and copy or download as .txt.",
      "Click 'Estimate LLM tokens' if you are preparing text for ChatGPT, Claude, or Gemini.",
    ],
    faqs: [
      {
        question: "Why do word counters sometimes disagree by 1–2 words?",
        answer:
          "Tools differ on hyphenated terms (well-known), contractions (don't), emoji, and numbers. Open the 'How we count' breakdown on this page to see our exact rules.",
      },
    ],
    themeVariant: "theme-accent",
    keywords: ["word counter", "character count", "reading time calculator"],
  },
  {
    id: "json-formatter",
    slug: "json-formatter",
    category: "developer-tools",
    wave: 0,
    name: "JSON Formatter & Validator",
    shortDescription: "Parse, pretty-print, minify, and pinpoint JSON syntax errors without transmitting payloads.",
    title: "JSON Formatter & Validator — Local Browser Parser | Everyday Tools Hub",
    metaDescription:
      "Format, validate, and minify JSON locally in your browser with line/column error diagnostics and quick handoff to LLM JSON Repair.",
    outcomeStatement: "Validate, beautify, or minify JSON payloads locally with clear line and column errors.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "exact",
    accuracyNote: "Uses strict ECMAScript JSON.parse validation with derived line and column mapping.",
    relatedToolIds: ["llm-json-repair", "token-counter", "pii-redactor"],
    supportedFormats: ["Strict RFC 8259 JSON", ".json", ".txt"],
    limitations: [
      "Strict JSON disallows trailing commas, single quotes, and comments — if your JSON came from an LLM or JS object, use LLM JSON Repair instead.",
    ],
    instructions: [
      "Paste JSON or load the sample payload.",
      "Choose indentation (2 spaces, 4 spaces, or tabs), Format, or Minify.",
      "If parsing fails on model output, use the suggested link to LLM JSON Repair.",
    ],
    faqs: [
      {
        question: "Is pasted API or config JSON stored anywhere?",
        answer:
          "Never. JSON is parsed purely in memory and never written to localStorage, cookies, or analytics.",
      },
    ],
    themeVariant: "theme-volt",
    keywords: ["json formatter", "json validator", "json beautifier", "minify json"],
  },
  {
    id: "qr-code-generator",
    slug: "qr-code-generator",
    category: "qr-tools",
    wave: 0,
    name: "QR Code Generator",
    shortDescription: "Create static PNG & SVG QR codes for URLs, Wi-Fi, email, phone, and vCard with contrast checks.",
    title: "Static QR Code Generator (PNG & SVG) — Local Tool | Everyday Tools Hub",
    metaDescription:
      "Generate static QR codes for URLs, Wi-Fi networks, vCards, email, phone, and text in PNG or SVG right in your browser — no tracking redirects.",
    outcomeStatement: "Build permanent static PNG and SVG QR codes locally with contrast validation.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "exact",
    accuracyNote: "Encodes your exact payload into ISO/IEC 18004 QR matrices locally; contrast ratios are computed via WCAG relative luminance.",
    relatedToolIds: ["image-converter", "image-resizer"],
    supportedFormats: ["PNG", "SVG (vector)"],
    limitations: [
      "Static QR codes encode data directly in the pattern and cannot be edited after printing — always test-scan before bulk printing.",
      "Low contrast (light foreground on light background) will trigger a contrast warning because phone cameras may fail to read it.",
    ],
    instructions: [
      "Select a QR type (URL, Text, Wi-Fi, Email, Phone, or vCard) and fill in the fields.",
      "Pick foreground/background colors with sufficient contrast and error correction level.",
      "Test-scan the preview with your phone camera, then download SVG or PNG.",
    ],
    faqs: [
      {
        question: "What is the difference between static and dynamic QR codes?",
        answer:
          "Dynamic QR codes route through a third-party short-link server that can break or charge subscriptions later. Static QR codes put your URL or Wi-Fi credentials directly in the image forever.",
      },
    ],
    themeVariant: "theme-accent",
    keywords: ["qr code generator", "wifi qr code", "svg qr code", "static qr code"],
  },
  {
    id: "age-calculator",
    slug: "age-calculator",
    category: "date-calculators",
    wave: 0,
    name: "Age Calculator",
    shortDescription: "Exact calendar-date age in years, months, days, and total days with explicit Feb-29 rules.",
    title: "Age Calculator — Exact Calendar Arithmetic | Everyday Tools Hub",
    metaDescription:
      "Calculate exact age in years, months, and days at any reference date using true calendar-date arithmetic and transparent leap-year Feb-29 rules.",
    outcomeStatement: "Calculate exact calendar age and next birthday countdown using true date arithmetic.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "exact",
    accuracyNote: "Uses timezone-free Gregorian calendar-date math rather than dividing elapsed milliseconds by 24 hours.",
    relatedToolIds: ["date-difference-calculator"],
    supportedFormats: ["ISO Calendar Dates (YYYY-MM-DD)"],
    limitations: [
      "Birth dates after the chosen 'calculate as of' reference date are rejected.",
      "For Feb 29 birthdays in non-leap years, you can inspect both Feb 28 and Mar 1 milestone conventions.",
    ],
    instructions: [
      "Enter your date of birth.",
      "Leave 'Calculate as of' at today's date or choose a custom past/future reference date.",
      "Read the years/months/days breakdown, total days lived, and next birthday countdown.",
    ],
    faqs: [
      {
        question: "Why not calculate age by dividing milliseconds by 365.25 days?",
        answer:
          "Millisecond division drifts across leap years, unequal month lengths (28–31 days), and Daylight Saving Time shifts. Calendar-date arithmetic preserves exact day-of-month milestones.",
      },
    ],
    themeVariant: "theme-volt",
    keywords: ["age calculator", "exact age in days", "birthday calculator"],
  },
  {
    id: "date-difference-calculator",
    slug: "date-difference-calculator",
    category: "date-calculators",
    wave: 0,
    name: "Date Difference Calculator",
    shortDescription: "Calculate exact days, weeks, and years/months/days between two dates with inclusive toggle.",
    title: "Date Difference Calculator — Days Between Dates | Everyday Tools Hub",
    metaDescription:
      "Find the exact calendar difference between two dates in days, weeks, and years/months/days with an explicit exclusive vs. inclusive toggle.",
    outcomeStatement: "Compute exact calendar spans between any two dates with clear inclusive rules.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "exact",
    accuracyNote: "Date-only UTC midnight arithmetic avoids Daylight Saving Time off-by-one errors.",
    relatedToolIds: ["age-calculator"],
    supportedFormats: ["ISO Calendar Dates (YYYY-MM-DD)"],
    limitations: [
      "Does not account for public holidays when reporting weekday/business-day counts.",
    ],
    instructions: [
      "Pick a start date and an end date.",
      "Keep 'Exclusive (elapsed nights/days)' or check 'Inclusive (count both start and end days)'.",
      "If the end date precedes the start date, the direction is clearly labelled.",
    ],
    faqs: [
      {
        question: "What does Inclusive vs. Exclusive mean?",
        answer:
          "From Jan 1 to Jan 1 is 0 elapsed days (exclusive) or 1 calendar day counted (inclusive). Making this explicit prevents confusion on rental, visa, and project counts.",
      },
    ],
    themeVariant: "theme-volt",
    keywords: ["date difference calculator", "days between dates", "duration calculator"],
  },

  // === WAVE 1: AI PREP CATEGORY (4) ===
  {
    id: "llm-json-repair",
    slug: "llm-json-repair",
    category: "ai-prep-tools",
    wave: 1,
    name: "LLM JSON Repair & Schema Check",
    shortDescription: "Repair malformed model JSON, inspect every change with per-rule undo, and validate schemas.",
    title: "LLM JSON Repair & Schema Check — Fix Broken Model JSON | Everyday Tools Hub",
    metaDescription:
      "Fix broken JSON from ChatGPT, Claude, or Gemini locally. Strips code fences, closes truncated brackets, logs every repair with undo, and validates draft 2020-12 JSON Schemas.",
    outcomeStatement: "Repair malformed LLM JSON output, review every edit, and validate against a schema.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "exact",
    accuracyNote:
      "Syntax repair rules and supported draft 2020-12 schema checks are deterministic (Exact); truncation detection is Heuristic.",
    relatedToolIds: ["json-formatter", "token-counter", "pii-redactor"],
    supportedFormats: ["Pasted text", ".json", ".txt"],
    limitations: [
      "When an LLM response was cut off mid-generation, repair only closes open strings/brackets — it never fabricates missing fields.",
      "Schema check supports core JSON Schema draft 2020-12 keywords (type, properties, required, enum, items, minimum/maximum, pattern, oneOf/anyOf, additionalProperties); unsupported keywords are listed explicitly.",
    ],
    instructions: [
      "Paste raw broken output from an LLM (including markdown fences or surrounding explanation).",
      "Review the 'What changed' list and toggle/undo individual repairs if needed.",
      "Optionally paste a JSON Schema to list path-level errors or copy a targeted fix prompt.",
    ],
    faqs: [
      {
        question: "Will this silently invent values to make a broken schema pass?",
        answer:
          "No. We strictly separate syntax repair from schema compliance. Missing required properties or wrong types are reported with JSON paths and a ready-to-paste fix prompt so you stay in control.",
      },
    ],
    themeVariant: "theme-sky",
    featured: true,
    keywords: ["fix broken json", "json repair", "fix json from chatgpt", "json schema validator"],
  },
  {
    id: "pii-redactor",
    slug: "pii-redactor",
    category: "ai-prep-tools",
    wave: 1,
    name: "Safe-to-Paste Redactor",
    shortDescription: "Mask emails, phones, cards, IBANs, IPs, and API keys locally — then restore originals in AI replies.",
    title: "Safe-to-Paste Redactor — Local PII & Secret Masker | Everyday Tools Hub",
    metaDescription:
      "Detect and mask emails, phone numbers, Luhn payment cards, IBANs, IPs, and API keys right in your browser before pasting into AI chats, then restore placeholders locally.",
    outcomeStatement: "Mask common sensitive patterns before pasting into chatbots and restore them in replies.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "exact",
    accuracyNote:
      "Pattern and checksum detectors (Luhn card, IBAN, IP, JWT/API prefixes) are Exact for their patterns; human names and street addresses are NOT detected in Wave 1.",
    relatedToolIds: ["hidden-text-scanner", "token-counter", "word-counter"],
    supportedFormats: ["Pasted text", ".txt", ".md", ".csv", ".log"],
    limitations: [
      "This tool finds common patterns. It can miss things. Review the result before sharing.",
      "Personal names, company names, and free-form street addresses are not detected automatically — use manual selection to mask those.",
      "The restore mapping exists purely in browser memory and is erased immediately on reset, navigation, or tab close.",
    ],
    instructions: [
      "Paste text or drop a .txt/.md/.csv/.log file.",
      "Accept, reject, or manually mask additional spans in the Findings review panel.",
      "Copy the masked text for your AI chat, then paste the AI's reply into Step 2 to swap placeholders back.",
    ],
    faqs: [
      {
        question: "Where is the placeholder-to-original mapping stored?",
        answer:
          "Only inside a single in-memory JavaScript map in your open browser tab. Nothing is written to localStorage, cookies, URLs, or network requests, and closing or resetting clears it.",
      },
    ],
    themeVariant: "theme-sky",
    featured: true,
    keywords: ["redact pii before chatgpt", "remove personal information from text", "mask api keys"],
  },
  {
    id: "token-counter",
    slug: "token-counter",
    category: "ai-prep-tools",
    wave: 1,
    name: "Token & Context Calculator",
    shortDescription: "Honest Exact vs. Estimated token counts, context-fit meter, dated API pricing, and chunk splitter.",
    title: "Token & Context Calculator — Honest Model Budgets & Chunker | Everyday Tools Hub",
    metaDescription:
      "Count LLM tokens locally with clear Exact vs. Estimated labels, check context-window fit with output buffers, estimate API cost from dated pricing, and split text into chunks.",
    outcomeStatement: "Check context fit, split prompts into chunks, and see which token counts are exact vs. estimated.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "estimated",
    accuracyNote:
      "OpenAI models using local o200k_base / cl100k_base BPE run Exact in-browser; Claude and Gemini rows show Estimated ranges with documented error bands.",
    dataAsset: {
      name: "llm-models-and-pricing",
      reviewedAt: "2026-11-11",
      maxAgeDays: 30,
      sourceUrl: "https://openai.com/api/pricing/",
    },
    relatedToolIds: ["word-counter", "pii-redactor", "llm-json-repair"],
    supportedFormats: ["Pasted text", ".txt", ".md", ".json", ".csv"],
    limitations: [
      "Anthropic Claude and Google Gemini tokenizers are not bundled as open BPE tables; counts for those models are honest estimates rather than API queries.",
      "Code, JSON, and non-Latin scripts vary much more across tokenizers than plain English prose.",
    ],
    instructions: [
      "Paste text or drop a text/JSON/Markdown file and choose a target model.",
      "Reserve your expected output tokens to see whether the input fits comfortably, runs tight, or overflows.",
      "Use the Chunk Splitter to break long inputs along paragraph and heading boundaries.",
    ],
    faqs: [
      {
        question: "Why doesn't this tool call vendor APIs for Claude or Gemini counts?",
        answer:
          "Sending your text to a remote API just to count tokens breaks our zero-upload guarantee. Instead we run open tokenizers locally for Exact OpenAI counts and label proprietary counts clearly as Estimated.",
      },
    ],
    themeVariant: "theme-sky",
    keywords: ["token counter", "llm context window calculator", "text chunk splitter", "api cost calculator"],
  },
  {
    id: "hidden-text-scanner",
    slug: "hidden-text-scanner",
    category: "ai-prep-tools",
    wave: 1,
    name: "Hidden Text & Invisible Character Scanner",
    shortDescription: "Inspect text, HTML, DOCX, and PDFs for zero-width chars, Unicode tags, white/tiny text, and hidden layers.",
    title: "Hidden Text & Invisible Character Scanner — Local Inspector | Everyday Tools Hub",
    metaDescription:
      "Scan pasted text, HTML, DOCX, and text-layer PDFs locally for zero-width characters, bidirectional controls, Unicode tags, tiny/white PDF text, and hidden markup.",
    outcomeStatement: "Locate invisible Unicode characters and hidden document markup locally before feeding files to AI.",
    status: "published",
    processing: "local",
    audit: {
      verifiedAt: "2026-11-11",
      method: "network-inspection",
      by: "playwright-network-audit",
    },
    accuracy: "exact",
    accuracyNote:
      "Unicode and DOM/DOCX/PDF rule detections are Exact for the inspected patterns; overall evasion coverage is incomplete and optional instruction heuristics are Heuristic.",
    relatedToolIds: ["pii-redactor", "merge-pdf", "word-counter"],
    acceptedMimeTypes: [
      "text/plain",
      "text/markdown",
      "text/html",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxFileBytes: 25 * 1024 * 1024,
    maxFileLabel: "25 MB (.txt, .md, .html, .docx, text-layer .pdf)",
    supportedFormats: ["Text", "HTML", "DOCX", "Text-layer PDF"],
    limitations: [
      "Some evasion techniques cannot be detected by static inspection; a 'No known patterns found' result is never a guarantee that a document is harmless.",
      "Uploaded HTML and embedded PDF scripts are inspected as raw structure and are never executed or rendered as active DOM.",
      "Scanned image-only PDFs have no text layer to inspect.",
    ],
    instructions: [
      "Paste text or drop a .txt, .md, .html, .docx, or text-layer .pdf file.",
      "Inspect every located finding with page/offset context and why it triggered.",
      "Export a cleaned plain-text copy stripped of invisible Unicode controls.",
    ],
    faqs: [
      {
        question: "Why doesn't the scanner display a green 'Safe' badge when 0 findings appear?",
        answer:
          "Because determined prompt-injection concealment (such as text drawn inside rasterized images) can bypass structural scanners. We report 'No known patterns found' so you always treat untrusted documents carefully.",
      },
    ],
    themeVariant: "theme-sky",
    featured: true,
    keywords: ["check pdf for hidden text", "zero width character remover", "invisible unicode scanner"],
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS_REGISTRY.find((tool) => tool.slug === slug && tool.status === "published");
}

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOLS_REGISTRY.find((tool) => tool.id === id && tool.status === "published");
}

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return CATEGORIES.find((cat) => cat.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return TOOLS_REGISTRY.filter((t) => t.category === category && t.status === "published");
}

export function getRelatedTools(tool: ToolDefinition): ToolDefinition[] {
  return tool.relatedToolIds
    .map((id) => getToolById(id))
    .filter((t): t is ToolDefinition => Boolean(t));
}

