import { env } from "cloudflare:workers";
import { define } from "../../utils.ts";
import { handleSearchRequest } from "../../lib/search-api.ts";

export const handlers = define.handlers({
  async GET(ctx) {
    return await handleSearchRequest(ctx.url, env.ASSETS);
  },
});
