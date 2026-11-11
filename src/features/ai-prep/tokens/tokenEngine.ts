import modelsDataset from "@/lib/data/models.json";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  tokenizerFamily: "o200k_base" | "cl100k_base" | "claude-est" | "gemini-est";
  accuracy: "exact" | "estimated";
  contextWindow: number;
  inputPricePer1M: number;
  outputPricePer1M: number;
  sourceUrl: string;
}

export interface TokenCountEstimate {
  model: ModelInfo;
  tokens: number;
  accuracy: "exact" | "estimated";
  minTokens: number;
  maxTokens: number;
  methodLabel: string;
  fitStatus: "fits" | "tight" | "exceeds";
  utilizationPct: number;
  estimatedInputCostUsd: number;
}

export interface TextChunk {
  index: number;
  text: string;
  estimatedTokens: number;
}

type EncoderModule = {
  encode: (text: string) => number[];
  decode: (tokens: number[]) => string;
};

let o200kCache: EncoderModule | null = null;
let cl100kCache: EncoderModule | null = null;

async function getO200k(): Promise<EncoderModule> {
  if (!o200kCache) {
    o200kCache = (await import("gpt-tokenizer/encoding/o200k_base")) as unknown as EncoderModule;
  }
  return o200kCache;
}

async function getCl100k(): Promise<EncoderModule> {
  if (!cl100kCache) {
    cl100kCache = (await import("gpt-tokenizer/encoding/cl100k_base")) as unknown as EncoderModule;
  }
  return cl100kCache;
}

/**
 * Estimates non-OpenAI token counts locally without API calls.
 * Note PRD E4: code/JSON and non-ASCII text vary up to ~30% vs English prose (~15%).
 */
export function estimateHeuristicTokens(text: string, multiplier: number): {
  tokens: number;
  minTokens: number;
  maxTokens: number;
} {
  if (!text) return { tokens: 0, minTokens: 0, maxTokens: 0 };
  const nonAsciiRatio = (text.match(/[^\x00-\x7F]/g)?.length ?? 0) / text.length;
  const punctuationRatio = (text.match(/[{}[\]():;,"'=<>/\\]/g)?.length ?? 0) / text.length;
  const charsPerToken = Math.max(1.8, 3.9 - nonAsciiRatio * 1.4 - punctuationRatio * 1.6);
  const raw = Math.ceil((text.length / charsPerToken) * multiplier);
  const margin = punctuationRatio > 0.08 || nonAsciiRatio > 0.15 ? 0.25 : 0.15;
  return {
    tokens: raw,
    minTokens: Math.max(1, Math.floor(raw * (1 - margin))),
    maxTokens: Math.ceil(raw * (1 + margin)),
  };
}

export async function calculateTokensForAllModels(
  text: string,
  reservedOutputTokens: number,
): Promise<{
  results: TokenCountEstimate[];
  sampleTokensForHighlight: string[];
}> {
  const models = modelsDataset.models as ModelInfo[];
  const [o200k, cl100k] = await Promise.all([getO200k(), getCl100k()]);

  const o200kIds = text ? o200k.encode(text) : [];
  const cl100kIds = text ? cl100k.encode(text) : [];

  const sampleTokensForHighlight = o200kIds
    .slice(0, 220)
    .map((tid) => o200k.decode([tid]));

  const results: TokenCountEstimate[] = models.map((model) => {
    let tokens = 0;
    let minTokens = 0;
    let maxTokens = 0;
    let methodLabel = "";

    if (model.tokenizerFamily === "o200k_base") {
      tokens = o200kIds.length;
      minTokens = tokens;
      maxTokens = tokens;
      methodLabel = "Local o200k_base BPE";
    } else if (model.tokenizerFamily === "cl100k_base") {
      tokens = cl100kIds.length;
      minTokens = tokens;
      maxTokens = tokens;
      methodLabel = "Local cl100k_base BPE";
    } else if (model.tokenizerFamily === "claude-est") {
      const est = estimateHeuristicTokens(text, 1.08);
      tokens = est.tokens;
      minTokens = est.minTokens;
      maxTokens = est.maxTokens;
      methodLabel = "Local char/density heuristic (±15–25%)";
    } else {
      const est = estimateHeuristicTokens(text, 1.04);
      tokens = est.tokens;
      minTokens = est.minTokens;
      maxTokens = est.maxTokens;
      methodLabel = "Local char/density heuristic (±15–25%)";
    }

    const availableInput = Math.max(1, model.contextWindow - Math.max(0, reservedOutputTokens));
    const utilizationPct = Math.min(999, Math.round((tokens / availableInput) * 100));
    const fitStatus: TokenCountEstimate["fitStatus"] =
      tokens > availableInput ? "exceeds" : utilizationPct >= 80 ? "tight" : "fits";

    return {
      model,
      tokens,
      accuracy: model.accuracy,
      minTokens,
      maxTokens,
      methodLabel,
      fitStatus,
      utilizationPct,
      estimatedInputCostUsd: (tokens / 1_000_000) * model.inputPricePer1M,
    };
  });

  return { results, sampleTokensForHighlight };
}

export async function splitTextIntoTokenChunks(
  text: string,
  budgetTokens: number,
  overlapTokens: number,
): Promise<TextChunk[]> {
  if (!text.trim() || budgetTokens < 20) return [];
  const o200k = await getO200k();

  // Prefer heading/paragraph boundaries before falling back to sentence/token slicing
  const blocks = text.split(/\n(?=#+\s)|\n\s*\n+/).filter((b) => b.trim().length > 0);
  const chunks: TextChunk[] = [];
  let buffer = "";

  const flushBuffer = () => {
    if (!buffer.trim()) return;
    const count = o200k.encode(buffer).length;
    chunks.push({ index: chunks.length + 1, text: buffer.trim(), estimatedTokens: count });
  };

  for (const block of blocks) {
    const candidate = buffer ? `${buffer}\n\n${block}` : block;
    const candTokens = o200k.encode(candidate).length;

    if (candTokens <= budgetTokens) {
      buffer = candidate;
      continue;
    }

    if (buffer) {
      flushBuffer();
      if (overlapTokens > 0) {
        const prevTokens = o200k.encode(buffer);
        const tail = prevTokens.slice(-Math.min(overlapTokens, prevTokens.length));
        buffer = `${o200k.decode(tail)}\n\n${block}`;
      } else {
        buffer = block;
      }
    } else {
      buffer = block;
    }

    // If a single block itself exceeds budgetTokens, split cleanly by BPE token window
    while (o200k.encode(buffer).length > budgetTokens) {
      const ids = o200k.encode(buffer);
      const sliceIds = ids.slice(0, budgetTokens);
      const step = Math.max(1, budgetTokens - Math.min(overlapTokens, Math.floor(budgetTokens / 2)));
      const remainingIds = ids.slice(step);
      chunks.push({
        index: chunks.length + 1,
        text: o200k.decode(sliceIds),
        estimatedTokens: sliceIds.length,
      });
      buffer = remainingIds.length > 0 ? o200k.decode(remainingIds) : "";
      if (remainingIds.length === 0) break;
    }
  }

  flushBuffer();
  return chunks;
}

