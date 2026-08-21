import { assertEquals } from "@std/assert";
import { displayLimitForViewport } from "../src/lib/layout.ts";

Deno.test("PCは通常10件を表示する", () => {
  assertEquals(displayLimitForViewport(1024, 768), 10);
});

Deno.test("タブレットは通常6件を表示する", () => {
  assertEquals(displayLimitForViewport(640, 768), 6);
  assertEquals(displayLimitForViewport(1023, 768), 6);
});

Deno.test("スマホは通常4件を表示する", () => {
  assertEquals(displayLimitForViewport(639, 768), 4);
});

Deno.test("低い画面では表示件数を減らす", () => {
  assertEquals(displayLimitForViewport(639, 599), 3);
  assertEquals(displayLimitForViewport(639, 479), 2);
  assertEquals(displayLimitForViewport(1023, 599), 4);
});
