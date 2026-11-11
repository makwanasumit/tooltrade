import { CATEGORIES, TOOLS_REGISTRY } from "../src/lib/tools/registry";
import modelsData from "../src/lib/data/models.json";

function daysBetweenIso(isoDate: string, now = new Date()): number {
  const parsed = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed)) return Number.POSITIVE_INFINITY;
  const diffMs = now.getTime() - parsed;
  return Math.floor(diffMs / 86_400_000);
}

let hasError = false;

console.log(`Validating ${TOOLS_REGISTRY.length} registry tools and ${CATEGORIES.length} categories...`);

const seenIds = new Set<string>();
const seenSlugs = new Set<string>();
const categorySlugs = new Set(CATEGORIES.map((c) => c.slug));

for (const tool of TOOLS_REGISTRY) {
  if (seenIds.has(tool.id)) {
    console.error(`Duplicate tool id: ${tool.id}`);
    hasError = true;
  }
  seenIds.add(tool.id);

  if (seenSlugs.has(tool.slug)) {
    console.error(`Duplicate tool slug: ${tool.slug}`);
    hasError = true;
  }
  seenSlugs.add(tool.slug);

  if (!categorySlugs.has(tool.category)) {
    console.error(`Tool ${tool.id} references unknown category ${tool.category}`);
    hasError = true;
  }

  if (tool.status === "published" && !tool.audit) {
    console.error(`Published tool ${tool.id} is missing a dated network audit record`);
    hasError = true;
  }

  if (tool.dataAsset) {
    const ageDays = daysBetweenIso(tool.dataAsset.reviewedAt);
    if (ageDays > tool.dataAsset.maxAgeDays) {
      console.error(
        `Data asset "${tool.dataAsset.name}" on tool "${tool.id}" is ${ageDays} days old (max ${tool.dataAsset.maxAgeDays} days).`,
      );
      hasError = true;
    }
  }
}

for (const tool of TOOLS_REGISTRY) {
  for (const relId of tool.relatedToolIds) {
    if (!seenIds.has(relId)) {
      console.error(`Tool ${tool.id} links to unknown relatedToolId: ${relId}`);
      hasError = true;
    }
  }
}

const modelAge = daysBetweenIso(modelsData.reviewedAt);
if (modelAge > modelsData.maxAgeDays) {
  console.error(
    `models.json reviewedAt (${modelsData.reviewedAt}) is ${modelAge} days old (exceeds maxAgeDays=${modelsData.maxAgeDays}).`,
  );
  hasError = true;
} else {
  console.log(`models.json freshness OK (${modelAge} days old, max ${modelsData.maxAgeDays} days).`);
}

if (hasError) {
  process.exit(1);
}

console.log("Registry validation passed cleanly.");

