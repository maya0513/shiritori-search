import { assertEquals, assertRejects, assertStrictEquals } from "@std/assert";
import {
  type AssetFetcher,
  loadDictionaryIndex,
} from "../src/lib/dictionary.ts";
import type { DictionaryIndex } from "../src/lib/types.ts";

const index: DictionaryIndex = {
  metadata: {
    source: "test",
    release: "test",
    sourceUrl: "https://example.com",
    sha256: "test",
    generatedAt: "now",
    wordCount: 0,
  },
  byFirst: {},
  byLast: {},
};

function assets(status = 200): AssetFetcher & { calls: number } {
  const value = {
    calls: 0,
    fetch: (_input: Request | URL | string) => {
      value.calls++;
      if (status !== 200) {
        return Promise.resolve(new Response(null, { status }));
      }
      return Promise.resolve(Response.json(index));
    },
  };
  return value;
}

Deno.test("辞書インデックスを次元ごとにキャッシュする", async () => {
  const source = assets();
  const first = await loadDictionaryIndex(source, "first");
  const sameFirst = await loadDictionaryIndex(source, "first");
  const last = await loadDictionaryIndex(source, "last");

  assertStrictEquals(first, sameFirst);
  assertEquals(last, index);
  assertEquals(source.calls, 2);
});

Deno.test("辞書アセットのHTTPエラーを伝播する", async () => {
  const source = assets(404);
  await assertRejects(
    () => loadDictionaryIndex(source, "first"),
    Error,
    "Dictionary asset unavailable: first",
  );
});
