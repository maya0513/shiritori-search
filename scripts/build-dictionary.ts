import { strFromU8, unzipSync } from "fflate";
import {
  buildDictionaryIndex,
  type RawDictionary,
} from "../src/lib/index-builder.ts";
import { dictionaryManifest } from "./dictionary-manifest.ts";

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(data: Uint8Array): Promise<string> {
  const copy = new ArrayBuffer(data.byteLength);
  new Uint8Array(copy).set(data);
  const digest = await crypto.subtle.digest("SHA-256", copy);
  return toHex(new Uint8Array(digest));
}

async function fetchSource(): Promise<RawDictionary> {
  const response = await fetch(dictionaryManifest.sourceUrl);
  if (!response.ok) {
    throw new Error(`辞書の取得に失敗しました: HTTP ${response.status}`);
  }

  const archive = new Uint8Array(await response.arrayBuffer());
  const actualHash = await sha256(archive);
  if (actualHash !== dictionaryManifest.sha256) {
    throw new Error(
      `辞書のSHA-256が一致しません。expected=${dictionaryManifest.sha256} actual=${actualHash}`,
    );
  }

  const files = unzipSync(archive);
  const jsonEntry = Object.entries(files).find(([name]) =>
    name.endsWith(".json")
  );
  if (!jsonEntry) throw new Error("アーカイブ内にJSON辞書がありません。");

  return JSON.parse(strFromU8(jsonEntry[1])) as RawDictionary;
}

const dictionary = await fetchSource();
const index = buildDictionaryIndex(dictionary, {
  source: dictionaryManifest.source,
  release: dictionaryManifest.release,
  sourceUrl: dictionaryManifest.sourceUrl,
  sha256: dictionaryManifest.sha256,
  generatedAt: new Date().toISOString(),
});

await Deno.mkdir("static/data", { recursive: true });
await Deno.writeTextFile(
  "static/data/index-first.json",
  JSON.stringify({
    metadata: index.metadata,
    byFirst: index.byFirst,
  }),
);
await Deno.writeTextFile(
  "static/data/index-last.json",
  JSON.stringify({
    metadata: index.metadata,
    byLast: index.byLast,
  }),
);

console.log(`辞書インデックスを生成しました: ${index.metadata.wordCount}語`);
