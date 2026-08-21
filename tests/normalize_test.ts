import { assert, assertEquals } from "@std/assert";
import {
  hasNounSense,
  isHiraganaCharacter,
  normalizeBoundary,
  toHiragana,
} from "../src/lib/normalize.ts";

Deno.test("カタカナをひらがなへ正規化する", () => {
  assertEquals(toHiragana("カメラ"), "かめら");
  assertEquals(toHiragana("シーディー"), "しーでぃー");
});

Deno.test("先頭と末尾がひらがなの語だけを通す", () => {
  assertEquals(normalizeBoundary("りんご"), { first: "り", last: "ご" });
  assertEquals(normalizeBoundary(""), null);
  assertEquals(normalizeBoundary("ーりんご"), null);
  assertEquals(normalizeBoundary("りんごー"), null);
  assert(isHiraganaCharacter("ゔ"));
});

Deno.test("名詞タグだけを名詞として扱う", () => {
  assert(hasNounSense([{ partOfSpeech: ["n"] }], "りんご"));
  assert(hasNounSense([{ partOfSpeech: ["n-suf"] }], "りんご"));
  assert(!hasNounSense([{ partOfSpeech: ["v5r"] }], "りんご"));
  assert(!hasNounSense([{ partOfSpeech: ["pn"] }], "りんご"));
  assert(
    !hasNounSense(
      [{
        partOfSpeech: ["n"],
        appliesToKana: ["みかん"],
        appliesToKanji: ["蜜柑"],
      }],
      "りんご",
      "林檎",
    ),
  );
  assert(
    hasNounSense(
      [{ partOfSpeech: ["n"], appliesToKanji: [] }],
      "りんご",
    ),
  );
  assert(
    hasNounSense(
      [{ partOfSpeech: ["n"], appliesToKanji: ["*"] }],
      "りんご",
    ),
  );
  assert(
    !hasNounSense(
      [{ partOfSpeech: ["n"], appliesToKanji: ["蜜柑"] }],
      "りんご",
    ),
  );
});
