import { assertEquals, assertThrows } from "@std/assert";
import {
  parseSearchParams,
  SearchValidationError,
  searchWords,
} from "../src/lib/search.ts";
import type { DictionaryIndex } from "../src/lib/types.ts";

const index: DictionaryIndex = {
  metadata: {
    source: "test",
    release: "test",
    sourceUrl: "https://example.com",
    sha256: "test",
    generatedAt: "now",
    wordCount: 3,
  },
  byFirst: {
    あ: [
      { id: 1, reading: "あい", spellings: ["愛"], first: "あ", last: "い" },
      { id: 2, reading: "あめ", spellings: ["雨"], first: "あ", last: "め" },
    ],
  },
  byLast: {
    ん: [{
      id: 3,
      reading: "ごはん",
      spellings: ["ご飯"],
      first: "ご",
      last: "ん",
    }],
  },
};

function assets(): { fetch(input: Request | URL | string): Promise<Response> } {
  return {
    fetch: (input) => {
      const path = new URL(input.toString()).pathname;
      if (path.endsWith("index-first.json")) {
        return Promise.resolve(
          Response.json({
            metadata: index.metadata,
            byFirst: index.byFirst,
          }),
        );
      }
      return Promise.resolve(
        Response.json({ metadata: index.metadata, byLast: index.byLast }),
      );
    },
  };
}

Deno.test("先頭と末尾の両方で検索する", async () => {
  const result = await searchWords(
    new URL("https://example.com/api/search?first=あ&last=い"),
    assets(),
  );
  assertEquals(result.total, 1);
  assertEquals(result.results[0].reading, "あい");
});

Deno.test("末尾だけで検索する", async () => {
  const result = await searchWords(
    new URL("https://example.com/api/search?last=ん"),
    assets(),
  );
  assertEquals(result.results[0].spellings, ["ご飯"]);
});

Deno.test("入力が空ならエラーにする", () => {
  assertThrows(
    () => parseSearchParams(new URL("https://example.com/api/search")),
    SearchValidationError,
  );
});

Deno.test("不正な文字・ページ・件数を拒否する", () => {
  for (
    const query of [
      "first=カ",
      "first=あ&page=abc",
      "first=あ&page=0",
      "first=あ&limit=11",
    ]
  ) {
    assertThrows(
      () =>
        parseSearchParams(new URL(`https://example.com/api/search?${query}`)),
      SearchValidationError,
    );
  }
});

Deno.test("ページ番号を安全に扱う", async () => {
  const result = await searchWords(
    new URL("https://example.com/api/search?first=あ&page=999"),
    assets(),
  );
  assertEquals(result.page, 1);
  assertEquals(result.pageCount, 1);
});

Deno.test("存在しない先頭文字は空結果を返す", async () => {
  const result = await searchWords(
    new URL("https://example.com/api/search?first=う"),
    assets(),
  );
  assertEquals(result.total, 0);
  assertEquals(result.page, 1);
  assertEquals(result.pageCount, 1);
  assertEquals(result.results, []);
});
