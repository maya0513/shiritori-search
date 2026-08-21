import type { SearchResponse, WordResult } from "./types.ts";

export const DEFAULT_SEARCH_ERROR =
  "検索サーバーでエラーが発生しました。時間をおいて再試行してください。";
const INVALID_RESPONSE_ERROR = "検索結果を読み込めませんでした。";

function isWordResult(value: unknown): value is WordResult {
  if (typeof value !== "object" || value === null) return false;
  if (!("id" in value) || !("reading" in value) || !("spellings" in value)) {
    return false;
  }

  return typeof value.id === "number" &&
    typeof value.reading === "string" &&
    Array.isArray(value.spellings) &&
    value.spellings.every((spelling) => typeof spelling === "string");
}

function isSearchResponse(value: unknown): value is SearchResponse {
  if (typeof value !== "object" || value === null) return false;
  if (
    !("first" in value) || !("last" in value) || !("page" in value) ||
    !("limit" in value) || !("total" in value) || !("pageCount" in value) ||
    !("results" in value) || !("candidates" in value)
  ) {
    return false;
  }

  return (typeof value.first === "string" || value.first === null) &&
    (typeof value.last === "string" || value.last === null) &&
    typeof value.page === "number" &&
    typeof value.limit === "number" &&
    typeof value.total === "number" &&
    typeof value.pageCount === "number" &&
    Array.isArray(value.results) && value.results.every(isWordResult) &&
    Array.isArray(value.candidates) && value.candidates.every(isWordResult);
}

function getApiError(body: unknown): string | null {
  if (typeof body !== "object" || body === null || !("error" in body)) {
    return null;
  }

  return typeof body.error === "string" ? body.error : null;
}

export async function readSearchResponse(
  response: Response,
): Promise<SearchResponse> {
  const rawBody = await response.text();
  let body: unknown = null;

  try {
    body = JSON.parse(rawBody);
  } catch {
    // Some proxy and platform errors are returned as plain text.
  }

  if (!response.ok) {
    throw new Error(getApiError(body) ?? DEFAULT_SEARCH_ERROR);
  }

  if (!isSearchResponse(body)) {
    throw new Error(INVALID_RESPONSE_ERROR);
  }

  return body;
}
