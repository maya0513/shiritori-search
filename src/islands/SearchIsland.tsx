import { useEffect, useState } from "preact/hooks";
import { displayLimitForViewport } from "../lib/layout.ts";
import { pickRandom } from "../lib/random.ts";
import type { SearchResponse, WordResult } from "../lib/types.ts";

const PAGE_SIZE = 10;

function isHiragana(value: string): boolean {
  return Array.from(value).length === 1 && /^\p{Script=Hiragana}$/u.test(value);
}

function getBrowserWindow(): Window | null {
  return typeof globalThis.window === "undefined" ? null : globalThis.window;
}

function displayLimit(): number {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) return PAGE_SIZE;
  return displayLimitForViewport(
    browserWindow.innerWidth,
    browserWindow.innerHeight,
  );
}

export default function SearchIsland() {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [limit, setLimit] = useState(displayLimit);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [shown, setShown] = useState<WordResult[]>([]);
  const [randomMode, setRandomMode] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const browserWindow = getBrowserWindow();
    if (!browserWindow) return;

    const update = () => {
      const next = displayLimit();
      setLimit((previous) => {
        if (previous === next) return previous;
        if (response) {
          if (randomMode) {
            const picked = pickRandom(response.candidates, shown, next);
            setShown(picked.words);
          } else {
            setShown(response.results.slice(0, next));
          }
        }
        return next;
      });
    };
    browserWindow.addEventListener("resize", update);
    browserWindow.visualViewport?.addEventListener("resize", update);
    return () => {
      browserWindow.removeEventListener("resize", update);
      browserWindow.visualViewport?.removeEventListener("resize", update);
    };
  }, [response, randomMode, shown]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    setError("");
    setNotice("");
    setResponse(null);
    setShown([]);
    setRandomMode(false);

    if (
      (!first && !last) || (first && !isHiragana(first)) ||
      (last && !isHiragana(last))
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
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "検索に失敗しました。");
        return body as SearchResponse;
      })
      .then((result) => {
        if (!active) return;
        setResponse(result);
        if (result.total === 0) {
          setShown([]);
          setRandomMode(false);
          setNotice("条件に合う名詞は見つかりませんでした。");
          return;
        }
        const picked = pickRandom(result.candidates, [], limit);
        setShown(picked.words);
        setRandomMode(true);
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
    setRandomMode(true);
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
              class="rounded-2xl border-0 bg-[#f3dfd7] px-4 py-3 font-extrabold text-[#a84435] transition hover:bg-[#efd0c5] disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={randomRefresh}
            >
              別の名詞を表示
            </button>
          </div>
        </section>
      )}

      {!response && !error && !loading && (
        <p class="grid min-h-40 flex-1 place-items-center rounded-3xl border border-dashed border-[#d9cec0] p-4 text-center text-sm text-[#687786]">
          ひらがなを1文字入力すると自動で検索します。
        </p>
      )}
    </div>
  );
}
