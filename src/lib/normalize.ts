const HIRAGANA_RE = /^\p{Script=Hiragana}$/u;

export function toHiragana(value: string): string {
  return Array.from(value.normalize("NFC"), (character) => {
    const codePoint = character.codePointAt(0) ?? 0;

    if (
      (codePoint >= 0x30a1 && codePoint <= 0x30f6) ||
      codePoint === 0x30fd ||
      codePoint === 0x30fe
    ) {
      return String.fromCodePoint(codePoint - 0x60);
    }

    return character;
  }).join("").normalize("NFC");
}

export function isHiraganaCharacter(value: string): boolean {
  return Array.from(value).length === 1 && HIRAGANA_RE.test(value);
}

export function isNounPartOfSpeech(tag: string): boolean {
  // JMdict noun tags are n, n-adv, n-pr, n-pref, n-suf, n-t, etc.
  // Pronouns (pn) and numerals (num) are intentionally not included.
  return tag === "n" || tag.startsWith("n-");
}

export interface RawSense {
  partOfSpeech?: string[];
  appliesToKanji?: string[];
  appliesToKana?: string[];
}

export interface RawKana {
  text: string;
  appliesToKanji?: string[];
}

export interface RawKanji {
  text: string;
}

export interface RawWord {
  id: string;
  kana: RawKana[];
  kanji: RawKanji[];
  sense: RawSense[];
}

function appliesTo(
  values: string[] | undefined,
  value: string | undefined,
): boolean {
  if (value === undefined) {
    return values === undefined || values.length === 0 || values.includes("*");
  }
  return values === undefined || values.length === 0 || values.includes("*") ||
    values.includes(value);
}

export function hasNounSense(
  senses: RawSense[],
  kanaText: string,
  kanjiText?: string,
): boolean {
  return senses.some((sense) => {
    const isNoun = (sense.partOfSpeech ?? []).some(isNounPartOfSpeech);
    return isNoun && appliesTo(sense.appliesToKana, kanaText) &&
      appliesTo(sense.appliesToKanji, kanjiText);
  });
}

export function normalizeBoundary(
  reading: string,
): { first: string; last: string } | null {
  const characters = Array.from(reading);
  if (characters.length === 0) return null;

  const first = characters[0];
  const last = characters[characters.length - 1];
  if (!isHiraganaCharacter(first) || !isHiraganaCharacter(last)) return null;

  return { first, last };
}
