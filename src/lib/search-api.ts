import type { AssetFetcher } from "./dictionary.ts";
import { SearchValidationError, searchWords } from "./search.ts";

const UNAVAILABLE_MESSAGE = "辞書データを読み込めませんでした。";

function json(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function handleSearchRequest(
  url: URL,
  assets: AssetFetcher,
): Promise<Response> {
  try {
    const result = await searchWords(url, assets);
    return json(result);
  } catch (error) {
    if (error instanceof SearchValidationError) {
      return json({ error: error.message }, 400);
    }

    console.error("検索APIで辞書を読み込めませんでした。", error);
    return json({ error: UNAVAILABLE_MESSAGE }, 503);
  }
}
