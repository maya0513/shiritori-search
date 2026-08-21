import type {
  DictionaryIndexAsset,
  DictionaryMetadata,
  IndexedWord,
} from "./types.ts";

export interface AssetFetcher {
  fetch(input: Request | URL | string): Promise<Response>;
}

type Dimension = "first" | "last";

const cache = new WeakMap<
  object,
  Map<Dimension, Promise<DictionaryIndexAsset>>
>();

export class DictionaryAssetError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDictionaryMetadata(value: unknown): value is DictionaryMetadata {
  if (!isRecord(value)) return false;

  return typeof value.source === "string" &&
    typeof value.release === "string" &&
    typeof value.sourceUrl === "string" &&
    typeof value.sha256 === "string" &&
    typeof value.generatedAt === "string" &&
    typeof value.wordCount === "number";
}

function isIndexedWord(value: unknown): value is IndexedWord {
  if (!isRecord(value)) return false;

  return typeof value.id === "number" &&
    typeof value.reading === "string" &&
    Array.isArray(value.spellings) &&
    value.spellings.every((spelling) => typeof spelling === "string") &&
    typeof value.first === "string" &&
    typeof value.last === "string";
}

function isIndexDimension(
  value: unknown,
): value is Record<string, IndexedWord[]> {
  return isRecord(value) &&
    Object.values(value).every((words) =>
      Array.isArray(words) && words.every(isIndexedWord)
    );
}

function isDictionaryIndexAsset(value: unknown): value is DictionaryIndexAsset {
  if (!isRecord(value) || !isDictionaryMetadata(value.metadata)) return false;

  const hasFirst = "byFirst" in value;
  const hasLast = "byLast" in value;
  return (hasFirst || hasLast) &&
    (!hasFirst || isIndexDimension(value.byFirst)) &&
    (!hasLast || isIndexDimension(value.byLast));
}

export function loadDictionaryIndex(
  assets: AssetFetcher,
  dimension: Dimension,
): Promise<DictionaryIndexAsset> {
  let dimensions = cache.get(assets);
  if (!dimensions) {
    dimensions = new Map();
    cache.set(assets, dimensions);
  }

  const cached = dimensions.get(dimension);
  if (cached) return cached;

  const loading: Promise<DictionaryIndexAsset> = (async () => {
    const response = await assets.fetch(
      new URL(`https://assets.local/data/index-${dimension}.json`),
    );
    if (!response.ok) {
      throw new DictionaryAssetError(
        `Dictionary asset unavailable: ${dimension}`,
      );
    }
    let value: unknown;
    try {
      value = await response.json();
    } catch {
      throw new DictionaryAssetError(
        `Dictionary asset is not valid JSON: ${dimension}`,
      );
    }
    if (!isDictionaryIndexAsset(value)) {
      throw new DictionaryAssetError(
        `Dictionary asset has an invalid shape: ${dimension}`,
      );
    }
    return value;
  })();

  dimensions.set(dimension, loading);
  void loading.catch(() => {
    if (dimensions?.get(dimension) === loading) dimensions.delete(dimension);
  });
  return loading;
}
