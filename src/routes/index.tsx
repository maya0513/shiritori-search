import { Head } from "fresh/runtime";
import SearchIsland from "../islands/SearchIsland.tsx";
import { define } from "../utils.ts";

export default define.page(() => (
  <>
    <Head>
      <title>しりとり検索</title>
    </Head>
    <main class="min-h-dvh overflow-x-hidden bg-[#f6f1e8] bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.6)_0_12rem,transparent_30rem)] text-[#172a3a]">
      <section
        class="mx-auto flex min-h-dvh w-[calc(100%-2rem)] max-w-[58rem] flex-col py-[clamp(1rem,4vh,3rem)]"
        aria-labelledby="page-title"
      >
        <div
          class="grid h-11 w-11 place-items-center rounded-2xl bg-[#e56b55] text-2xl font-extrabold text-[#fffaf2] shadow-[0_.5rem_1.5rem_rgba(189,89,64,0.27)] max-sm:h-9 max-sm:w-9"
          aria-hidden="true"
        >
          し
        </div>
        <h1
          id="page-title"
          class="mt-5 text-[clamp(1.8rem,5vw,3rem)] font-bold tracking-[-.05em] max-sm:mt-2 max-sm:text-[1.6rem]"
        >
          しりとり検索
        </h1>
        <p class="my-2 mb-5 max-w-[42rem] text-[.95rem] text-[#607080] max-sm:my-1 max-sm:mb-3">
          先頭・末尾のひらがな、またはその両方から、使える名詞を探します。
        </p>
        <SearchIsland />
        <footer class="mt-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-4 text-[.7rem] text-[#928a81] max-sm:pt-2">
          <a
            class="whitespace-nowrap text-[#a84435] underline decoration-[#d99b8e] underline-offset-2 hover:text-[#8f382d]"
            href="/license"
          >
            辞書データとライセンス
          </a>
          <span class="whitespace-nowrap">JMdict common-only</span>
          <span aria-hidden="true">/</span>
          <a
            class="whitespace-nowrap text-[#928a81] underline decoration-[#c9beb1] underline-offset-2 hover:text-[#a84435]"
            href="https://github.com/maya0513/shiritori-search"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </footer>
      </section>
    </main>
  </>
));
