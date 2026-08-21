const serverEntry = "_fresh/server.js";
let source = await Deno.readTextFile(serverEntry);

source = source.replace(
  'import server, { registerStaticFile } from "./server/index.mjs";',
  'import server from "./server/index.mjs";',
);

await Deno.writeTextFile(serverEntry, source);
