const dataDirectory = new URL("../static/data/", import.meta.url);

function dataFile(pathname: string): URL | null {
  if (pathname.endsWith("index-first.json")) {
    return new URL("index-first.json", dataDirectory);
  }
  if (pathname.endsWith("index-last.json")) {
    return new URL("index-last.json", dataDirectory);
  }
  return null;
}

export const env = {
  ASSETS: {
    async fetch(input: Request | URL | string): Promise<Response> {
      const file = dataFile(new URL(input.toString()).pathname);
      if (!file) return new Response("Not Found", { status: 404 });

      try {
        return new Response(await Deno.readFile(file), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          return new Response("Dictionary data is not generated", {
            status: 404,
          });
        }
        throw error;
      }
    },
  },
};
