import { assertEquals, assertRejects } from "@std/assert";
import {
  DEFAULT_SEARCH_ERROR,
  readSearchResponse,
} from "../src/lib/search-client.ts";

const result = {
  first: "あ",
  last: null,
  page: 1,
  limit: 10,
  total: 1,
  pageCount: 1,
  results: [{ id: 1, reading: "あい", spellings: ["愛"] }],
  candidates: [{ id: 1, reading: "あい", spellings: ["愛"] }],
};

Deno.test("検索クライアントは正常なJSONを検証して返す", async () => {
  assertEquals(await readSearchResponse(Response.json(result)), result);
});

Deno.test("検索クライアントはAPIのJSONエラーを表示する", async () => {
  await assertRejects(
    () =>
      readSearchResponse(
        Response.json(
          { error: "辞書データを読み込めませんでした。" },
          { status: 503 },
        ),
      ),
    Error,
    "辞書データを読み込めませんでした。",
  );
});

Deno.test("検索クライアントは非JSONの500エラーを安全に扱う", async () => {
  await assertRejects(
    () =>
      readSearchResponse(
        new Response("Internal server error", { status: 500 }),
      ),
    Error,
    DEFAULT_SEARCH_ERROR,
  );
});

Deno.test("検索クライアントは成功扱いの不正レスポンスを拒否する", async () => {
  await assertRejects(
    () => readSearchResponse(Response.json({ ok: true })),
    Error,
    "検索結果を読み込めませんでした。",
  );
});
