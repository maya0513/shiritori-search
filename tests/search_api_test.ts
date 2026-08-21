import { assertEquals } from "@std/assert";
import type { AssetFetcher } from "../src/lib/dictionary.ts";
import { handleSearchRequest } from "../src/lib/search-api.ts";
import type { DictionaryIndex } from "../src/lib/types.ts";

const index: DictionaryIndex = {
  metadata: {
    source: "test",
    release: "test",
    sourceUrl: "https://example.com",
    sha256: "test",
    generatedAt: "now",
    wordCount: 1,
  },
  byFirst: {
    あ: [{
      id: 1,
      reading: "あい",
      spellings: ["愛"],
      first: "あ",
      last: "い",
    }],
  },
  byLast: {},
};

function assets(response: Response): AssetFetcher {
  return { fetch: () => Promise.resolve(response.clone()) };
}

Deno.test("検索APIは成功結果をJSONで返す", async () => {
  const response = await handleSearchRequest(
    new URL("https://example.com/api/search?first=あ"),
    assets(
      Response.json({
        metadata: index.metadata,
        byFirst: index.byFirst,
      }),
    ),
  );

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Cache-Control"), "no-store");
  assertEquals((await response.json()).total, 1);
});

Deno.test("検索APIは入力エラーを400のJSONで返す", async () => {
  const response = await handleSearchRequest(
    new URL("https://example.com/api/search?first=カ"),
    assets(Response.json({})),
  );

  assertEquals(response.status, 400);
  assertEquals(await response.json(), {
    error: "先頭文字はひらがな1文字で入力してください。",
  });
});

Deno.test("検索APIは辞書障害を503のJSONで返す", async () => {
  const response = await handleSearchRequest(
    new URL("https://example.com/api/search?first=あ"),
    assets(new Response("Internal server error", { status: 500 })),
  );

  assertEquals(response.status, 503);
  assertEquals(await response.json(), {
    error: "辞書データを読み込めませんでした。",
  });
});
