import type { WordResult } from "./types.ts";

function randomUint(maxExclusive: number): number {
  const values = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive;
  do {
    crypto.getRandomValues(values);
  } while (values[0] >= limit);
  return values[0] % maxExclusive;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = randomUint(index + 1);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function pickRandom(
  candidates: WordResult[],
  current: WordResult[],
  limit: number,
): { words: WordResult[]; exhausted: boolean } {
  if (limit < 1) throw new RangeError("limit must be positive");
  const currentIds = new Set(current.map((word) => word.id));
  const alternatives = candidates.filter((word) => !currentIds.has(word.id));
  if (alternatives.length === 0) {
    return { words: current.slice(0, limit), exhausted: true };
  }
  return {
    words: shuffle(alternatives).slice(0, limit),
    exhausted: alternatives.length < limit,
  };
}
