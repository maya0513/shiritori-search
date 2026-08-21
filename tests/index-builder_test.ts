import { assertEquals } from "@std/assert";
import {
  buildDictionaryIndex,
  type RawDictionary,
} from "../src/lib/index-builder.ts";

const metadata = {
  source: "test",
  release: "test",
  sourceUrl: "https://example.com",
  sha256: "test",
  generatedAt: "now",
};

Deno.test("名詞だけを読みごとに統合する", () => {
  const index = buildDictionaryIndex({
    words: [
      {
        id: "1",
        kana: [{ text: "リンゴ", appliesToKanji: ["*"] }],
        kanji: [{ text: "林檎" }],
        sense: [{ partOfSpeech: ["n"] }],
      },
      {
        id: "2",
        kana: [{ text: "りんご", appliesToKanji: ["*"] }],
        kanji: [{ text: "リンゴ" }],
        sense: [{ partOfSpeech: ["v5r"] }],
      },
      {
        id: "3",
        kana: [{ text: "たべる", appliesToKanji: ["*"] }],
        kanji: [{ text: "食べる" }],
        sense: [{ partOfSpeech: ["v1"] }],
      },
    ],
  }, metadata);

  assertEquals(index.metadata.wordCount, 1);
  assertEquals(index.byFirst.り[0].reading, "りんご");
  assertEquals(index.byFirst.り[0].spellings, ["リンゴ", "林檎"]);
});

Deno.test("かな表記を元のカタカナで保持する", () => {
  const index = buildDictionaryIndex({
    words: [{
      id: "1",
      kana: [{ text: "テレビ" }],
      kanji: [],
      sense: [{ partOfSpeech: ["n"] }],
    }],
  }, metadata);

  assertEquals(index.byFirst.て[0].reading, "てれび");
  assertEquals(index.byFirst.て[0].spellings, ["テレビ"]);
});

Deno.test("kanaごとのkanji対応を尊重する", () => {
  const index = buildDictionaryIndex({
    words: [{
      id: "1",
      kana: [{ text: "はし", appliesToKanji: ["箸"] }],
      kanji: [{ text: "箸" }, { text: "橋" }],
      sense: [{
        partOfSpeech: ["n"],
        appliesToKana: ["はし"],
        appliesToKanji: ["箸"],
      }],
    }],
  }, metadata);

  assertEquals(index.byFirst.は[0].spellings, ["箸"]);
});

Deno.test("境界外の読みを除外し、同じ読みの表記を並べ替える", () => {
  const index = buildDictionaryIndex({
    words: [
      {
        id: "1",
        kana: [{ text: "ーりんご", appliesToKanji: ["*"] }],
        kanji: [{ text: "林檎" }],
        sense: [{ partOfSpeech: ["n"] }],
      },
      {
        id: "2",
        kana: [{ text: "はし", appliesToKanji: ["*"] }],
        kanji: [{ text: "橋" }],
        sense: [{ partOfSpeech: ["n"] }],
      },
      {
        id: "3",
        kana: [{ text: "はし", appliesToKanji: ["*"] }],
        kanji: [{ text: "箸" }],
        sense: [{ partOfSpeech: ["n"] }],
      },
      {
        id: "4",
        kana: [{ text: "あし", appliesToKanji: ["*"] }],
        kanji: [{ text: "足" }],
        sense: [{ partOfSpeech: ["n"] }],
      },
    ],
  }, metadata);

  assertEquals(index.metadata.wordCount, 2);
  assertEquals(index.byFirst.は[0].spellings, ["橋", "箸"]);
});

Deno.test("不完全な辞書エントリを安全に除外する", () => {
  const index = buildDictionaryIndex({
    words: [
      { id: "1" },
      {
        id: "2",
        kana: [{ text: "ねこ" }],
      },
    ] as unknown as RawDictionary["words"],
  }, metadata);

  assertEquals(index.metadata.wordCount, 0);
});
