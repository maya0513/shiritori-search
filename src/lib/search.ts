import { type AssetFetcher, loadDictionaryIndex } from "./dictionary.ts";
import { isHiraganaCharacter } from "./normalize.ts";
import type { IndexedWord, SearchResponse, WordResult } from "./types.ts";

export const PAGE_SIZE = 10;
export const CANDIDATE_SIZE = 100;

export class SearchValidationError extends Error {}

export interface SearchParams {
  first: string | null;
  last: string | null;
  page: number;
  limit: number;
}

function parseSingleKana(value: string | null, name: string): string | null {
  if (value === null || value === "") return null;
  if (!isHiraganaCharacter(value)) {
    throw new SearchValidationError(
      `${name}はひらがな1文字で入力してください。`,
    );
  }
  return value;
}

function parsePositiveInteger(
  value: string | null,
  name: string,
  fallback: number,
): number {
  if (value === null || value === "") return fallback;
  if (!/^\d+$/.test(value)) {
    throw new SearchValidationError(`${name}は正の整数で指定してください。`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new SearchValidationError(`${name}は正の整数で指定してください。`);
  }
  return parsed;
}

export function parseSearchParams(url: URL): SearchParams {
  const first = parseSingleKana(url.searchParams.get("first"), "先頭文字");
  const last = parseSingleKana(url.searchParams.get("last"), "末尾文字");
  if (!first && !last) {
    throw new SearchValidationError(
      "先頭文字または末尾文字を入力してください。",
    );
  }

  const page = parsePositiveInteger(url.searchParams.get("page"), "ページ", 1);
  const requestedLimit = parsePositiveInteger(
    url.searchParams.get("limit"),
    "件数",
    PAGE_SIZE,
  );
  if (requestedLimit > PAGE_SIZE) {
    throw new SearchValidationError(
      `件数は${PAGE_SIZE}件以下で指定してください。`,
    );
  }

  return { first, last, page, limit: requestedLimit };
}

function toPublicWord(word: IndexedWord): WordResult {
  return {
    id: word.id,
    reading: word.reading,
    spellings: word.spellings,
  };
}

export async function searchWords(
  url: URL,
  assets: AssetFetcher,
): Promise<SearchResponse> {
  const params = parseSearchParams(url);
  const index = await loadDictionaryIndex(
    assets,
    params.first ? "first" : "last",
  );
  const source = params.first
    ? index.byFirst[params.first] ?? []
    : params.last
    ? index.byLast[params.last] ?? []
    : [];
  const matched = params.last
    ? source.filter((word) => word.last === params.last)
    : source;

  const pageCount = Math.max(1, Math.ceil(matched.length / params.limit));
  const page = Math.min(params.page, pageCount);
  const start = Math.min(
    (page - 1) * params.limit,
    Math.max(0, matched.length - params.limit),
  );

  return {
    first: params.first,
    last: params.last,
    page,
    limit: params.limit,
    total: matched.length,
    pageCount,
    results: matched.slice(start, start + params.limit).map(toPublicWord),
    candidates: matched.slice(start, start + CANDIDATE_SIZE).map(toPublicWord),
  };
}
