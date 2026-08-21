import { useEffect, useState } from "preact/hooks";
import { displayLimitForViewport } from "../lib/layout.ts";
import { isHiraganaCharacter } from "../lib/normalize.ts";
import { pickRandom } from "../lib/random.ts";
import { readSearchResponse } from "../lib/search-client.ts";
import type { SearchResponse, WordResult } from "../lib/types.ts";

const PAGE_SIZE = 10;

function getDisplayLimit(): number {
  if (typeof globalThis.window === "undefined") return PAGE_SIZE;
  return displayLimitForViewport(
    globalThis.window.innerWidth,
    globalThis.window.innerHeight,
  );
}

function useViewportLimit(): number {
  const [limit, setLimit] = useState(getDisplayLimit);

  useEffect(() => {
    if (typeof globalThis.window === "undefined") return;

    const update = () => setLimit(getDisplayLimit());
    update();
    globalThis.window.addEventListener("resize", update);
    globalThis.window.visualViewport?.addEventListener("resize", update);

    return () => {
      globalThis.window.removeEventListener("resize", update);
      globalThis.window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return limit;
}

function DiceIcon() {
  return (
    <svg
      class="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function SearchIsland() {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const limit = useViewportLimit();
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [shown, setShown] = useState<WordResult[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!response || response.total === 0) return;

    setShown((current) =>
      pickRandom(response.candidates, current, limit).words
    );
  }, [limit, response]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    setError("");
    setNotice("");
    setResponse(null);
    setShown([]);

    if (
      (!first && !last) || (first && !isHiraganaCharacter(first)) ||
      (last && !isHiraganaCharacter(last))
    ) {
      if (first || last) {
        setError("先頭文字または末尾文字を、ひらがな1文字で入力してください。");
      }
      setLoading(false);
      return () => {
        active = false;
        controller.abort();
      };
    }

    const params = new URLSearchParams({
      page: "1",
      limit: String(PAGE_SIZE),
    });
    if (first) params.set("first", first);
    if (last) params.set("last", last);

    setLoading(true);
    void fetch(`/api/search?${params}`, { signal: controller.signal })
      .then(readSearchResponse)
      .then((result) => {
        if (!active) return;
        setResponse(result);
        if (result.total === 0) {
          setShown([]);
          setNotice("条件に合う名詞は見つかりませんでした。");
        }
      })
      .catch((caught: unknown) => {
        if (
          !active ||
          (caught instanceof DOMException && caught.name === "AbortError")
        ) {
          return;
        }
        setError(
          caught instanceof Error ? caught.message : "検索に失敗しました。",
        );
        setResponse(null);
        setShown([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [first, last]);

  function randomRefresh() {
    if (!response || shown.length === 0) return;
    const picked = pickRandom(response.candidates, shown, limit);
    setShown(picked.words);
    setNotice(
      picked.exhausted
        ? "候補が少ないため、表示できる別の名詞が限られています。"
        : "",
    );
  }

  return (
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="flex flex-wrap items-end gap-2.5">
        <label class="grid gap-1.5 text-xs font-bold text-[#607080]">
          <span>先頭の文字</span>
          <input
            class="h-[3.25rem] w-[4.5rem] rounded-2xl border border-[#d9cec0] bg-[#fffdf8] text-center text-2xl text-[#172a3a] outline-none placeholder:text-[#b5aaa0] focus:border-[#e56b55] focus:ring-4 focus:ring-[#e56b5533] max-sm:h-[2.7rem] max-sm:w-[3.5rem]"
            value={first}
            onInput={(event) =>
              setFirst(
                (event.currentTarget as HTMLInputElement).value.slice(0, 1),
              )}
            maxLength={1}
            inputMode="text"
            autoComplete="off"
            lang="ja"
            placeholder="あ"
            aria-label="先頭のひらがな"
          />
        </label>
        <span
          class="self-end pb-4 text-xs text-[#9a958f] max-sm:pb-3"
          aria-hidden="true"
        >
          または
        </span>
        <label class="grid gap-1.5 text-xs font-bold text-[#607080]">
          <span>末尾の文字</span>
          <input
            class="h-[3.25rem] w-[4.5rem] rounded-2xl border border-[#d9cec0] bg-[#fffdf8] text-center text-2xl text-[#172a3a] outline-none placeholder:text-[#b5aaa0] focus:border-[#e56b55] focus:ring-4 focus:ring-[#e56b5533] max-sm:h-[2.7rem] max-sm:w-[3.5rem]"
            value={last}
            onInput={(event) =>
              setLast(
                (event.currentTarget as HTMLInputElement).value.slice(0, 1),
              )}
            maxLength={1}
            inputMode="text"
            autoComplete="off"
            lang="ja"
            placeholder="ん"
            aria-label="末尾のひらがな"
          />
        </label>
      </div>

      <div class="flex min-h-9 items-center" aria-live="polite">
        {loading && <p class="my-3 text-xs text-[#687786]">検索中…</p>}
        {!loading && error && <p class="my-3 text-xs text-[#b33f35]">{error}
        </p>}
        {!loading && !error && notice && (
          <p class="my-3 text-xs text-[#687786]">{notice}</p>
        )}
        {!loading && !error && !notice && response && response.total > 0 && (
          <p class="m-0 min-h-5 text-xs text-[#687786]">
            ランダム表示・全{response.total}件
          </p>
        )}
      </div>

      {shown.length > 0 && (
        <section class="flex min-h-0 flex-1 flex-col" aria-label="検索結果">
          <div class="grid min-h-0 grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-5">
            {shown.map((word) => (
              <article
                class="flex min-h-[4rem] min-w-0 flex-col justify-center gap-1 overflow-hidden rounded-2xl border border-[#e2d8cb] bg-[#fffdf8cc] px-3 py-2.5 shadow-[0_.25rem_.8rem_rgba(108,80,48,0.05)] max-sm:min-h-[3rem] max-sm:gap-0.5 max-sm:px-2 max-sm:py-1"
                key={word.id}
              >
                <strong class="truncate text-lg text-[#172a3a] max-sm:text-base">
                  {word.reading}
                </strong>
                {word.spellings.length > 0 && (
                  <span class="truncate text-xs text-[#e56b55]">
                    {word.spellings.join("・")}
                  </span>
                )}
              </article>
            ))}
          </div>
          <div class="flex items-center justify-between gap-3 pt-3">
            <button
              class="inline-flex items-center gap-2 rounded-2xl border-0 bg-[#e56b55] px-4 py-3 font-extrabold text-[#fffaf2] shadow-[0_.5rem_1.25rem_rgba(189,89,64,0.22)] transition hover:-translate-y-0.5 hover:bg-[#cf5946] focus:outline-none focus:ring-4 focus:ring-[#e56b5533] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={randomRefresh}
            >
              <DiceIcon />
              別の名詞を表示
            </button>
          </div>
        </section>
      )}

      {!response && !error && !loading && (
        <p class="grid min-h-40 flex-1 place-items-center rounded-3xl border border-dashed border-[#d9cec0] p-4 text-center text-sm text-[#687786]">
          ひらがなを1文字入力すると自動で検索
        </p>
      )}
    </div>
  );
}
