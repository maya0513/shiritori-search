import { define } from "../utils.ts";

export default define.page(({ Component }) => (
  <html lang="ja">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta
        name="description"
        content="先頭や末尾のひらがなから、しりとりに使える名詞を探します。"
      />
      <title>しりとり検索</title>
    </head>
    <body>
      <Component />
    </body>
  </html>
));
