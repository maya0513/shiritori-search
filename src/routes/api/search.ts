import { env } from "cloudflare:workers";
import { define } from "../../utils.ts";
import { SearchValidationError, searchWords } from "../../lib/search.ts";

function json(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export const handlers = define.handlers({
  async GET(ctx) {
    try {
      const result = await searchWords(ctx.url, env.ASSETS);
      return json(result);
    } catch (error) {
      if (error instanceof SearchValidationError) {
        return json({ error: error.message }, 400);
      }
      console.error(error);
      return json({ error: "辞書データを読み込めませんでした。" }, 503);
    }
  },
});
