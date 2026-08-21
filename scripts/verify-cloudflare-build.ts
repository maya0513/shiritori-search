type ManifestEntry = {
  file?: string;
  name?: string;
};

type BuildManifest = Record<string, ManifestEntry>;

type WranglerConfig = {
  main?: unknown;
  assets?: {
    binding?: unknown;
  };
};

const serverRoot = new URL("../_fresh/server/", import.meta.url);

async function readBuildFile(path: string): Promise<string> {
  try {
    return await Deno.readTextFile(new URL(path, serverRoot));
  } catch (error) {
    throw new Error(`Cloudflare build file is missing: ${path}`, {
      cause: error,
    });
  }
}

const wranglerConfig = JSON.parse(
  await readBuildFile("wrangler.json"),
) as WranglerConfig;

if (typeof wranglerConfig.main !== "string") {
  throw new Error("Cloudflare build does not contain a Worker entry point.");
}

if (wranglerConfig.assets?.binding !== "ASSETS") {
  throw new Error("Cloudflare build does not contain the ASSETS binding.");
}

await readBuildFile(wranglerConfig.main);

const manifest = JSON.parse(
  await readBuildFile(".vite/manifest.json"),
) as BuildManifest;
const workerEntry = Object.values(manifest).find((entry) =>
  entry.name === "worker-entry" || entry.name === "_fresh_server_entry"
);

if (!workerEntry?.file) {
  throw new Error(
    "Cloudflare build manifest does not contain the Worker route entry.",
  );
}

const workerSource = await readBuildFile(workerEntry.file);
const routeMatch = workerSource.match(
  /id:\s*["']\/api\/search["'][\s\S]{0,400}?mod:\s*\(\)\s*=>\s*import\(\s*["']([^"']+)["']\s*\)/,
);

if (!routeMatch) {
  throw new Error(
    "Cloudflare Worker route table does not contain /api/search.",
  );
}

const routeFile = new URL(routeMatch[1], new URL(workerEntry.file, serverRoot));
const routeSource = await Deno.readTextFile(routeFile);

if (!/from\s+["']cloudflare:workers["']/.test(routeSource)) {
  throw new Error(
    "The /api/search route is not using the Cloudflare Workers env binding.",
  );
}

const developmentOnlyMarkers = [
  "cloudflare-stub",
  'dataDirectory = new URL("../static/data/"',
  "Deno.readFile",
];

const developmentMarker = developmentOnlyMarkers.find((marker) =>
  routeSource.includes(marker)
);

if (developmentMarker) {
  throw new Error(
    `The /api/search route contains development-only code: ${developmentMarker}`,
  );
}

console.log(`Cloudflare build verified: /api/search -> ${routeMatch[1]}`);
