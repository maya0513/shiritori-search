import {
  hasNounSense,
  normalizeBoundary,
  type RawWord,
  toHiragana,
} from "./normalize.ts";
import type {
  DictionaryIndex,
  DictionaryMetadata,
  IndexedWord,
} from "./types.ts";

export interface RawDictionary {
  words: RawWord[];
}

const JAPANESE_COLLATOR = new Intl.Collator("ja");

interface MutableWord {
  reading: string;
  spellings: Set<string>;
}

function compareWords(left: IndexedWord, right: IndexedWord): number {
  return JAPANESE_COLLATOR.compare(left.reading, right.reading) ||
    JAPANESE_COLLATOR.compare(
      left.spellings.join("・"),
      right.spellings.join("・"),
    );
}

function addSpelling(
  target: MutableWord,
  spelling: string,
  reading: string,
): void {
  // A hiragana spelling identical to the reading adds no information.
  if (spelling !== reading) target.spellings.add(spelling);
}

export function buildDictionaryIndex(
  dictionary: RawDictionary,
  metadata: Omit<DictionaryMetadata, "wordCount">,
): DictionaryIndex {
  const groups = new Map<string, MutableWord>();

  for (const word of dictionary.words) {
    for (const kana of word.kana ?? []) {
      const reading = toHiragana(kana.text);
      const boundary = normalizeBoundary(reading);
      if (!boundary) continue;

      const applicableKanji = (word.kanji ?? []).filter((kanji) => {
        const applies = kana.appliesToKanji ?? [];
        return applies.includes("*") || applies.includes(kanji.text);
      });

      // An empty appliesToKanji list means that this kana spelling is kana-only.
      const pairs = applicableKanji.length > 0 ? applicableKanji : [undefined];
      for (const kanji of pairs) {
        if (!hasNounSense(word.sense ?? [], kana.text, kanji?.text)) continue;

        const current = groups.get(reading) ??
          { reading, spellings: new Set<string>() };
        addSpelling(current, kana.text, reading);
        if (kanji) addSpelling(current, kanji.text, reading);
        groups.set(reading, current);
      }
    }
  }

  const words: IndexedWord[] = [...groups.values()]
    .map((group, index) => {
      const boundary = normalizeBoundary(group.reading);
      if (!boundary) {
        throw new Error(`Invalid normalized reading: ${group.reading}`);
      }
      return {
        id: index,
        reading: group.reading,
        spellings: [...group.spellings].sort(JAPANESE_COLLATOR.compare),
        first: boundary.first,
        last: boundary.last,
      };
    })
    .sort(compareWords)
    .map((word, index) => ({ ...word, id: index }));

  const byFirst: Record<string, IndexedWord[]> = {};
  const byLast: Record<string, IndexedWord[]> = {};
  for (const word of words) {
    (byFirst[word.first] ??= []).push(word);
    (byLast[word.last] ??= []).push(word);
  }

  return {
    metadata: { ...metadata, wordCount: words.length },
    byFirst,
    byLast,
  };
}
