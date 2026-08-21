import { define } from "../utils.ts";

export default define.page(() => (
  <main class="min-h-dvh bg-[#f6f1e8] p-8 text-[#172a3a] max-sm:p-4">
    <article class="mx-auto w-full max-w-[42rem] rounded-3xl bg-[#fffdf8] p-[clamp(1.25rem,4vw,3rem)] leading-[1.8]">
      <a class="mb-4 inline-block text-sm text-[#a84435]" href="/">
        ← 検索へ戻る
      </a>
      <h1 class="m-0 text-[clamp(1.6rem,5vw,2.4rem)] tracking-[-.05em]">
        辞書データとライセンス
      </h1>
      <p class="text-sm text-[#607080]">
        このサイトの検索データは、
        <a
          href="https://github.com/scriptin/jmdict-simplified"
          rel="noreferrer"
        >
          jmdict-simplified
        </a>
        の JMdict common-only JSON を基にしています。
      </p>
      <dl class="my-6 grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm max-sm:grid-cols-1">
        <dt class="font-bold text-[#687786]">使用版</dt>
        <dd class="m-0 text-[#607080]">3.6.2+20260817122448</dd>
        <dt class="font-bold text-[#687786]">加工内容</dt>
        <dd class="m-0 text-[#607080]">
          読みのひらがな化、名詞以外の除外、表記の統合、先頭・末尾検索用インデックス化
        </dd>
        <dt class="font-bold text-[#687786]">JMdict / JMnedict</dt>
        <dd class="m-0 text-[#607080]">
          <a
            class="text-[#a84435]"
            href="http://www.edrdg.org/edrdg/licence.html"
            rel="noreferrer"
          >
            EDRDG License
          </a>
        </dd>
        <dt class="font-bold text-[#687786]">jmdict-simplified</dt>
        <dd class="m-0 text-[#607080]">
          <a
            class="text-[#a84435]"
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            rel="noreferrer"
          >
            Creative Commons Attribution-ShareAlike 4.0 International
          </a>
        </dd>
      </dl>
      <p class="rounded-xl bg-[#f3dfd7] p-4 text-sm text-[#7c4339]">
        元データの著作権・ライセンスは各権利者に帰属します。詳細は上記の原典をご確認ください。
      </p>
    </article>
  </main>
));
