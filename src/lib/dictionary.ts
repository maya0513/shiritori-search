import type { DictionaryIndex } from "./types.ts";

export interface AssetFetcher {
  fetch(input: Request | URL | string): Promise<Response>;
}

type Dimension = "first" | "last";

const cache = new WeakMap<object, Map<Dimension, Promise<DictionaryIndex>>>();

export function loadDictionaryIndex(
  assets: AssetFetcher,
  dimension: Dimension,
): Promise<DictionaryIndex> {
  let dimensions = cache.get(assets);
  if (!dimensions) {
    dimensions = new Map();
    cache.set(assets, dimensions);
  }

  const cached = dimensions.get(dimension);
  if (cached) return cached;

  const loading = (async () => {
    const response = await assets.fetch(
      new URL(`https://assets.local/data/index-${dimension}.json`),
    );
    if (!response.ok) {
      throw new Error(`Dictionary asset unavailable: ${dimension}`);
    }
    return await response.json() as DictionaryIndex;
  })();

  dimensions.set(dimension, loading);
  return loading;
}
