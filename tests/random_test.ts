import { assert, assertEquals, assertThrows } from "@std/assert";
import { pickRandom } from "../src/lib/random.ts";
import type { WordResult } from "../src/lib/types.ts";

function words(count: number): WordResult[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    reading: `あ${id}`,
    spellings: [],
  }));
}

Deno.test("候補から現在表示中を除いて最大件数を抽選する", () => {
  const result = pickRandom(words(100), words(10), 10);
  assertEquals(result.words.length, 10);
  assert(result.words.every((word) => word.id >= 10));
  assertEquals(new Set(result.words.map((word) => word.id)).size, 10);
  assertEquals(result.exhausted, false);
});

Deno.test("候補不足を通知できる", () => {
  const current = words(9);
  const result = pickRandom(words(10), current, 10);
  assertEquals(result.words.length, 1);
  assertEquals(result.words[0].id, 9);
  assertEquals(result.exhausted, true);
});

Deno.test("候補がすべて表示中なら現在の表示を維持する", () => {
  const current = words(2);
  const result = pickRandom(current, current, 2);
  assertEquals(result.words.map((word) => word.id), [0, 1]);
  assertEquals(result.exhausted, true);
});

Deno.test("不正な表示件数を拒否する", () => {
  assertThrows(() => pickRandom([], [], 0), RangeError);
});
