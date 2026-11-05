# Portfolio Site

上條遥都のポートフォリオサイト（Next.js App Router / Tailwind CSS / three.js）。

## 開発

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 本番ビルド（型チェックとLintも走る）
npm run lint
```

Windows の新しい Node（22.23 など）では、Next 14 に同梱の `@vercel/og` がフォントや wasm の場所を読めず、ビルドや dev で `/og.png` などを作るところが `Invalid URL` で止まる。
`npm install` のあとに `scripts/patch-vercel-og.mjs`（`postinstall`）がそこを書き換えるので、ふつうは何もしなくてよい。Windows 以外（CI・本番の Linux）では書き換えない。
それでも止まるときは、`node scripts/patch-vercel-og.mjs` を実行して、出たメッセージを見る。

### ユニットテスト

`src/**/*.test.ts` に、画面を使わずに決まりを確かめるテスト（Node の `node:test` を `tsx` で動かす）がある。
いまは `/portfolio` のタグでの絞り込みの決まり（`src/lib/content/tags.test.ts`）。CI（`ci.yml` の共通 CI）が `npm test` を動かす。

```bash
npm test
```

### E2E テスト

`e2e/` に、ブラウザで画面を操作して確かめるテスト（Playwright）がある。
公開ページが日英とも開けること、デザインカタログでパーツを指す・押す・図鑑と行き来すること、スマホの幅で画面からはみ出さないことなどを確かめる。
`portfolio/` か `e2e.yml` を変える PR と、main への push で、GitHub Actions（`.github/workflows/e2e.yml`）が自動で動かす。
Firebase の秘密の値は使わず、静的な既定値で表示されたサイトを確かめる（Firestore の中身・問い合わせの送信・管理画面は対象外）。
外の RSS（Zenn・note）も `BLOG_FEEDS_DISABLED=true` で読まないので、ブログのタブの記事の表示も対象外。
経歴のページ（`/career`）は、Firestore の代わりに例の登録ファイル（`scripts/career.example.json`、`CAREER_EXAMPLE_FILE`）を読んで年表を出す。

```bash
npx cross-env BLOG_FEEDS_DISABLED=true CAREER_EXAMPLE_FILE=scripts/career.example.json npm run build   # テストは next start でビルド済みのものを動かす（外の RSS を読まず、経歴は例のファイルでビルド）
npm run test:e2e:edge                  # Windows では Edge で動かせる（Playwright のブラウザを入れなくてよい）
npx playwright install chromium && npm run test:e2e   # Playwright の Chromium で動かす場合
```

落ちたときは `npx playwright show-report` で、どの操作で何が起きたかを見られる（手元で動かしたあと）。
CI で落ちたときは、ワークフローの artifact（`playwright-report`）を落として、同じコマンドで開く。
デザインカタログの見本には `data-testid`（`catalog-stage` / `catalog-part-label` / `catalog-part-box`）を付けてあり、テストはこれを目印にする。見本の中身は iframe の中にあるので、テストでは `frameLocator` で探す。
見本は動かせるようになると `data-ready` が付くので、テストはそれを待ってから操作する（ハイドレーションの前に指しても反応しないため）。

## デプロイ

Firebase Hosting（プロジェクト: `portfoliosite-b12da`）。

main に push すると GitHub Actions（`.github/workflows/deploy.yml`）が自動でデプロイする。
SSR 用 Cloud Functions の Node のバージョンは `package.json` の `engines.node` で決まる。Cloud Functions で提供が終わると（Node 20 は 2026-10-30 に終了）デプロイが止まるので、そのときは `engines.node` を上げる（`deploy.yml` もここから Node の版を読む）。共通 CI は `engines.node` を読まない（`.nvmrc` / `.node-version` しか見ない）ので、`.github/workflows/ci.yml` の `node-version` を手で合わせる。

手元からデプロイする場合：

```bash
npm run build
firebase deploy
```

### 更新とサポート期限の通知

- **Dependabot**（`.github/dependabot.yml`）：毎週月曜に、npm の依存と GitHub Actions の更新を PR で出す。
  - minor・patch の更新は、1つの PR にまとめる。ただし `three`・`@types/three` は 0.x で壊れやすいので、まとめずに別の PR にする。
  - Next.js・React・Tailwind・ESLint などのメジャー更新は、作り直しを伴うので出さない。
  - TypeScript（Next 14 では 7 が使えない）のメジャー更新も出さない。Next を上げるときに手で上げる。
  - firebase・firebase-admin のメジャー更新も出さない。デプロイのときに firebase-tools が足す `firebase-frameworks` が firebase 12・firebase-admin 13 までしか対応しておらず、それより上ではデプロイが止まる（PR の CI では分からない）。外すのは、`deploy.yml` で固定した firebase-tools が足す範囲（今は `firebase-frameworks ^0.11.0`）の中に、対応した版が出てから。範囲の外の版でしか対応していなければ、先に firebase-tools を上げる。firebase 13 は Node 24.12 以上も求めるので、`engines.node` を 24（24.12 以上）に上げることも条件。
  - この除外が効くのは、毎週の通常の更新だけ。リポジトリで Dependabot のセキュリティ更新を有効にしていると、脆弱性を直すためのメジャー更新は除外していても PR が出る。
- **サポート期限の確認**（`.github/workflows/lifecycle.yml`）：毎週月曜に、次の期限や遅れを確かめる。
  - Cloud Functions の Node のランタイム：期限は firebase-tools の対応表から読む。
  - Node.js・Next.js：期限は endoflife.date から読む。
  - Next.js の同じ系列の新しいパッチ。
  - `deploy.yml` で固定している firebase-tools の版の遅れ。

  次のどれかに当てはまれば、ラベル `lifecycle` の Issue「サポート期限の確認：対応が必要なものがあります」を作る。
  - 期限まで半年を切った、または切れた。
  - 同じ系列に新しいパッチが出た。
  - firebase-tools がメジャーで遅れた。
  - 情報を読めなかった。

  開いている Issue は毎週本文を書き換える。要対応・注意の項目のうち、前回から状態が変わったもの（新しく出た・重くなった・軽くなった）があるときはコメントを付けるので、通知が届く（問題なしに戻っただけのものはコメントしない）。
  対応が必要なものが無くなったら閉じる。Next.js 14 はすでにサポートが終わっているので、Next.js 15 以降に移るまで Issue は開いたままになる。
  手で動かすときは Actions の画面から `workflow_dispatch` で実行する。
  公開リポジトリでは、60 日間リポジトリに活動が無いと GitHub が schedule を止めるので、Issue の日付が古いままなら Actions の画面で有効に戻す。
- Dependabot のコミットと PR のタイトルは、`[chore]` の後ろに Dependabot がコロンを足して `[chore]: Bump ...` になることがある。

## 画面構成

| ルート  | 内容                                             |
|--------|--------------------------------------------------|
| `/`    | スタート画面。ボタン／Space／無操作8秒でワープして `/home` へ |
| `/home`| 本編トップ（Hero / Latest / Skills / Works / Contact）。Latest は作品と記事の新しい順に3件 |
| `/about` | プロフィール（写真・所属・学年・趣味・使用言語） |
| `/career` | 経歴の年表。学歴・研究と発表・職歴と資格・制作と受賞を、年ごとに新しい順に並べ、種類で絞り込める。始まりが今より先の項目には「予定」と付ける。登録ファイルから登録スクリプトで書き込む（「経歴を登録する」） |
| `/portfolio?tab=` | 作品一覧。`sites` / `games` / `models` / `photos` / `pocs` / `kaggle` / `blog` をタブで切り替え。`blog` には Zenn・note の記事を RSS から自動で並べる |
| `/portfolio?tag=` | タグでの絞り込み。すべてのカテゴリから、選んだタグを全部持つ作品を並べる（`?tag=Next.js&tag=Firebase` のように5個まで。大文字・小文字は区別しない）。タブの下のタグの列か、カードのタグを押して選ぶ。`?tab=` も残り、解除するとそのタブに戻る。RSS の記事（配信元の名前）は絞り込みの対象外 |
| `/contact` | お問い合わせフォーム |
| `/catalog` | デザインカタログ。目的の違う架空のサイト4つを、見た目の流派ごとに作った見本の一覧。制作物の `sites` タブの先頭にもカードを出す |
| `/catalog/<見本>` | 見本のページ（`kissa` / `saas` / `magazine` / `studio`）。見方は2つで、枠の上のボタンで切り替える。既定の「ページを操作する」では、ナビ・CTA ボタン・タブ・アコーディオン・ページ送り・フォームがページの中で動く（フォームはどこにも送らない）。「パーツの名前を見る」（`?view=parts`）では、パーツを指すと名前が出て、押すとパーツ図鑑のその項目へ移る。見本は `/catalog-frame/<見本>` を iframe に入れて描く。表示する幅も選べ（`?width=pc` / `tablet` / `phone`。既定は枠の幅に合わせる）、その幅の iframe にして本物の画面と同じように並び替わらせる（枠より広いときは縮める。スマホの画面では選べない）。どの幅でも同じ iframe なので、見本の中で開いたものや入力した文字は残る |
| `/catalog-frame/<見本>` | 見本のページだけを描く、iframe 用のページ。ヘッダー・フッター・星空の背景は出さず、検索にも載せない（canonical は `/catalog/<見本>`） |
| `/catalog/parts` | パーツ図鑑。UI パーツの名前・別名・役割と、各見本での見え方。「ページで見る」で `/catalog/<見本>?part=<パーツ>` に戻る（「パーツの名前を見る」で開く）。各見本の「コードを見る」で、描いた HTML と Tailwind CSS のクラスを出し、コピーできる |
| `/og.png` | リンクを貼ったときに出る画像（OGP、ビルド時に生成） |
| `/login` | 管理者ログイン（Googleサインイン） |
| `/admin` | CMS。受信箱・プロフィール編集・TOPカード・ポートフォリオ管理・アクセス解析（操作の回数） |

公開ページは日本語と英語の2言語で配信する。日本語が既定で上の URL のまま、
英語は先頭に `/en` を付ける（`/en/home`、`/en/portfolio?tab=games` など）。
ヘッダーの `EN` / `JA` ボタンで、今いるページのもう一方の言語へ切り替わる。

未実装ページは `src/lib/site.ts` の `ready` を `true` にするとヘッダーとカードのリンクが有効になる。

## ファイル構成

```text
src/
  middleware.ts            // 言語の振り分け（/home → /ja/home に rewrite）と /admin の目隠し
  app/
    layout.tsx             // 全ページ共通。星空背景をここで1つだけ描画する
    not-found.tsx           // 共通404（日英併記）。/admin の未認証もここに来る（応答を一致させるため）
    global.css
    [lang]/                // 公開ページ。lang は ja か en（それ以外は404）
      layout.tsx           // 言語ごとのタイトル・OGP・hreflang
      page.tsx             // スタート画面（リング演出＋ワープ）
      (site)/              // Header/Footer が付く本編ページのグループ
        layout.tsx
        home/page.tsx
        about/page.tsx
        portfolio/page.tsx // ?tab= でカテゴリを切り替え、?tag= でタグで絞り込む
        contact/page.tsx
        catalog/           // デザインカタログ（page.tsx・[concept]/page.tsx・parts/page.tsx）
      catalog-frame/[concept]/page.tsx // 見本だけのページ（見本のページの iframe の中身。(site) の外なのでヘッダーが付かない）
    admin/                 // 認証必須のCMS。layout.tsx が未認証を弾く
      layout.tsx
      page.tsx             // ダッシュボード
      contacts/            // 受信箱（Server Actions: actions.ts）
      profile/             // プロフィール編集
      works/               // TOPカード（home の WORKS 5枚）の管理
      portfolio/           // /portfolio の中身（カテゴリ別の個々の作品）の管理
      analytics/           // アクセス解析（操作の回数を期間ごとに。閲覧数は Cloudflare のダッシュボードへ）
    login/page.tsx         // 管理者ログイン。有効なセッションがあれば /admin へ即リダイレクト
    og.png/route.tsx       // OGP 画像（1200×630）。拡張子付きなので middleware を通らない
    catalog-cover.png/route.tsx // デザインカタログのカードのカバー画像
    api/
      contact/route.ts     // 問い合わせの受け口
      events/route.ts      // 操作の回数の受け口（外へのリンク・タグ・カタログ）
      admin/session/route.ts // セッションCookieの発行・失効
  components/
    layout/                // Header / Footer / LanguageSwitch（日英の切り替えボタン）
    analytics/             // CloudflareAnalytics（閲覧数のスクリプト）/ AnalyticsEvents（押されたリンクを見て操作を数える）
    i18n/HtmlLang.tsx      // 英語ページで <html lang> を en に書き換える
    space/
      SpaceSceneProvider.tsx // 背景シーンの状態（idle→spinup→flash→warp→cruise）
      SpaceBackground.tsx    // 全ページ共通の背景ラッパ
    three/
      SpaceCanvas.tsx      // Canvasラッパ（SSR無効・dpr上限あり）
      SceneRoot.tsx        // シーンのルート＋カメラ視差
      StarField.tsx        // ランダムに瞬く星
      NebulaBackground.tsx // ガス雲（調整中・未使用）
    ui/
      Panel.tsx / SectionTitle.tsx / AcademicStatusLine.tsx
    portfolio/PortfolioCard.tsx // 作品1件のカード（/portfolio とホームの Latest で共通）
    portfolio/FocusOnTagChange.tsx // タグを選び直したら、結果の件数へ画面とフォーカスを動かす
    catalog/
      concepts/            // 見本のページ4つ（Kissa / Saas / Magazine / Studio）。パーツは <Part id> で印を付ける
      Part.tsx             // パーツの印（data-part）
      CatalogViewer.tsx    // 見本をブラウザの枠に入れ、2つの見方と幅の切り替え・指す・押す・一覧との連動を受け持つ（見本は iframe に入れ、その中も読む）
      SampleCode.tsx       // パーツ図鑑の「コードを見る」（描いた見本を class 付きの HTML にする）
      Interactive.tsx      // 見本の中で動く部品（ナビ・CTA ボタン・タブの絞り込み・ページ送り・フォーム）
      CatalogNav.tsx / HashHighlight.tsx
    admin/
      AdminShell.tsx       // 管理画面の外枠（ナビ・ログアウト）
      CoverUploader.tsx    // 画像アップロード共通部品（works/portfolioItems両方で使う）
      LocalizedField.tsx   // 日本語と英語を並べて入力する欄
      ContactList.tsx / ProfileForm.tsx / WorksList.tsx / PortfolioItemsManager.tsx
    contact/ContactForm.tsx
  lib/
    site.ts                 // 名前・リンク・ナビ・スキル・作品の単一ソース（静的既定値・日英）
    i18n.ts                 // 対応言語、表示する言語の値の取り出し、/en を付ける関数
    dictionary.ts           // 画面の固定文言（ボタン・見出し・案内文）の日英
    academicYear.ts         // 学年の自動計算
    warpTimeline.ts         // ワープ演出のタイミング定数
    useReducedMotion.ts     // prefers-reduced-motion の判定
    rateLimit.ts            // API の簡易レート制限（問い合わせ・操作の回数で共通）
    analytics/
      events.ts             // 数える操作の種類と対象の形（クライアントとサーバーで共通）
      known.ts              // サイトに出ている外へのリンクとタグ（ここに無いものは数えない）
      track.ts              // 操作を /api/events に送る（sendBeacon）
    notify/                 // メール(Resend) / チャット(Discord・Slack) 通知
    firebase/
      client.ts             // ブラウザ用SDK（管理画面のログイン・アップロードで使用）
      admin.ts              // サーバー専用Admin SDK（Firestore/Auth/Storage）
    admin/
      session.ts            // 管理者セッションの発行・検証
      cookieName.ts          // Cookie名（middlewareとも共有するため独立）
      contacts.ts / portfolio.ts // 管理画面向けの読み出し
      analytics.ts           // 操作の回数を期間ごとに足し合わせる
      revalidatePublic.ts    // 保存後に公開ページ（日英とも）のキャッシュを捨てる
    content/
      types.ts               // Firestoreと静的既定値で共通の型
      fields.ts              // 日英の値と Firestore のフィールド（title / titleEn）の変換
      portfolioItem.ts       // 作品の入力チェックと変換（管理画面と登録スクリプトで共通）
      defaults.ts             // site.ts から作る既定値
      getSiteContent.ts       // 公開ページ向け（profile/skillGroups/works）
      getPortfolioItems.ts    // 公開ページ向け（portfolioItems）
      career.ts               // 経歴の型・登録ファイルの確かめ・並べ方（画面と登録スクリプトで共通）
      getCareer.ts            // 公開ページ向け（career/timeline）
      tags.ts                 // /portfolio のタグでの絞り込み（?tag= の読み取り・絞り込み・URL）
      feeds.ts                // Zenn・note の RSS からブログのカードを作る（1時間キャッシュ）
      claudeUsage.ts          // About の Claude Code 利用状況の型・検査（画面と登録スクリプトで共通）
      getClaudeUsage.ts       // 公開ページ向け（stats/claudeUsage）
    catalog/
      parts.ts                // パーツ図鑑の項目（名前・別名・役割）。見本の <Part id> はここの id
      concepts.ts             // 見本のページの説明（目的・流派・書体・配色）。どれも架空のサイト
      portfolioItem.ts        // 制作物の sites タブに出すカタログのカード（Firestore には置かない）
      widths.ts               // 見本を表示する幅（PC・タブレット・スマホ）と、見本だけのページのパス
    metadata.ts               // 公開ページの OGP（各ページが自分の URL で呼ぶ）
    three/shaders/            // GLSL
scripts/
  content.ts                  // 登録ファイル（portfolio.json）から作品を本番に登録する
  career.ts                   // 登録ファイル（career.json）から経歴を本番に書き込む
  career.example.json         // 経歴の登録ファイルの書き方の例（E2E でも使う。中身は架空）
  usage.ts                    // Claude Code の利用状況を集計して本番に書き込む
  usage-task.cmd              // usage.ts を毎日動かすためのタスクスケジューラ用
```

## 設計上の約束

- 背景の Canvas は `app/layout.tsx` に1つだけ。ページ遷移で WebGL を作り直さないため世界観が途切れない。
  ページ側は `useSpaceScene()` で状態を変えるだけにする。
- 表示テキスト・リンクはページに直書きせず `src/lib/site.ts` に置く。
  ボタンや見出しなどの固定文言は `src/lib/dictionary.ts` に日英で置く。
- 管理画面で編集する文章は日英で持ち、Firestore には日本語を `title`、英語を `titleEn` のように保存する。
  英語が空の項目は、英語ページでも日本語を代わりに表示する。
- サイト内リンクは日本語版のパスで書き、`localizePath()` で英語ページ用に `/en` を付ける。
- `prefers-reduced-motion: reduce` のときはワープ演出とフラッシュを行わず即遷移する。
- `/admin` は**存在自体を隠す**。未認証は redirect ではなく 404 を返し、
  `/admin` の404と存在しないパスの404は応答が完全に一致するようにしている
  （`middleware.ts` がCookie無しのリクエストを存在しないパスへ rewrite する）。
- Server Actions は画面の認証状態と独立に、アクション内で毎回 `getAdminUser()` を呼んで権限を確認する
  （レイアウトで弾いているから安全、とは考えない）。
- 保存は必須・通知はベストエフォート、という非対称性を各所で守る
  （問い合わせの保存とメール通知、カバー画像のアップロードと本体の保存、など）。

## Firebase 構成

問い合わせの保存と管理画面(CMS)のために Firestore / Auth / Storage を使う。

### データモデル

| コレクション | 内容 | 公開読み取り | 書き込み |
|---|---|---|---|
| `profile/main` | 名前・role・tagline・学年の上書き・専攻など | ○ | 管理者のみ |
| `skillGroups/{id}` | Skills の分野と項目（`order` で並び順） | ○ | 管理者のみ |
| `works/{id}` | home の WORKS カード5枚（カテゴリへの入口。`ready` `order` `coverUrl`） | ○ | 管理者のみ |
| `portfolioItems/{id}` | `/portfolio` の中身。カテゴリごとの個々の作品（`category` `order` `ready` `coverUrl` `links` `tags`） | ○（`ready:true` のみ） | 管理者のみ |
| `career/timeline` | `/career` の年表（`items` に全項目をまとめて持つ） | ×（サーバーが読む） | 登録スクリプトのみ |
| `stats/claudeUsage` | About の Claude Code 利用状況（日ごとのトークン数・応答数・セッション数と合計） | ×（サーバーが読む） | 登録スクリプトのみ |
| `analytics/{日付}` | 操作の日ごとの回数（日本時間の `2026-11-05` ごと。`external` `tag` `catalog` に対象ごとの回数） | × | サーバーのみ（`/api/events`） |
| `contacts/{id}` | 問い合わせ内容 | × | サーバーのみ |

works と portfolioItems は役割が違う：works は「Web Sites」などカテゴリへの入口カード（常に5枚）、
portfolioItems はそのカテゴリの中に並ぶ実際の作品（数は自由）。管理画面でも
「TOPカード」と「ポートフォリオ」に分けている。

Storage は `works/{workId}/{fileName}` と `portfolioItems/{itemId}/{fileName}` に
それぞれのカバー画像を置く（画像のみ・5MBまで、パスにつき1枚を上書き）。

### 問い合わせの流れ

ユーザーの操作はサイト内で完結させ、内容はメールでも受け取れるようにする。

```text
フォーム(/contact) → POST /api/contact → Admin SDK で contacts に保存（必須）
                                       → Resend でメール通知      ┐ ベストエフォート
                                       → チャットWebhookに通知    ┘
                    → /admin の受信箱で一覧・既読管理（未実装）
```

クライアントから Firestore に直接書かせないのは、サーバー側で検証とレート制限を行い、
問い合わせ内容をクライアントから読めない状態に保つため。

**保存は必須、通知はベストエフォート。** 通知が失敗しても内容は Firestore に残るので 200 を返す。
逆に保存できないときは 503 を返す（受け付けたふりをして問い合わせを失わないため）。

スパム対策は、人間には見えないハニーポット項目（埋まっていたら成功を装って破棄）と
IPごとのレート制限（60秒に3件、`src/lib/rateLimit.ts`）。レート制限は Cloud Run インスタンスごとのメモリなので厳密ではない。

保存する値は氏名・メール・本文・`createdAt`・`read`・UserAgent・**IPのハッシュ**。
生のIPは保存しない（連投判定に使えれば十分なため）。

### 通知の設定

| 環境変数 | 用途 |
|---|---|
| `RESEND_API_KEY` | Resend の送信専用APIキー |
| `CONTACT_NOTIFY_TO` | 通知の宛先 |
| `CONTACT_NOTIFY_FROM` | 差出人（要ドメイン認証） |
| `CONTACT_CHAT_WEBHOOK_URL` | Discord / Slack の Incoming Webhook（任意） |
| `CONTACT_CHAT_WEBHOOK_KIND` | `discord` または `slack` |

**未設定の通知チャネルは自動でスキップ**され、エラーにはならない。
メールには `Reply-To` に訪問者のアドレスが入るので、受信メールで返信すればそのままやり取りできる。

### 権限

管理者判定は `firestore.rules` / `storage.rules` 内の**検証済みメールアドレスのリスト**で行う。
管理者を増やすときは両ファイルの `isAdmin()` のリストに追記する。

### 初回セットアップ（Firebase コンソール側）

1. Firestore を有効化（**リージョンは後から変更できない**）
2. Cloud Storage を有効化
3. Authentication → Google プロバイダを有効化し、承認済みドメインに公開ドメインを追加
4. プロジェクトの設定 → マイアプリ（ウェブ）の値を `.env.local` にコピー（`.env.local.example` を複製して使う）
5. ルールを反映： `firebase deploy --only firestore:rules,storage:rules`

### ローカルでの動作確認（エミュレータ）

本番データに触れず、ログインから CMS の保存まで手元で試せる。

```bash
cp .env.local.example .env.local   # 値を埋める（初回のみ）
npm run dev:emulators              # エミュレータ一式 + dev サーバーを1コマンドで起動
```

起動したら <http://localhost:3000/login> を開く。

- **「Google でサインイン」を押すと、実際の Google の代わりに Auth エミュレータの
  テスト用サインイン画面が開く。** メールアドレスに `ADMIN_EMAILS`（`.env.local`）に
  設定したアドレスを入力すれば、実在のGoogleアカウントを使わずにログインできる。
  Google 連携のサインインは常に email_verified=true 扱いになるため、確認チェックは不要。
- 許可していないメールアドレスでログインすると、画面には「ログインできませんでした」
  とだけ表示されるが、**`npm run dev:emulators` を実行しているターミナルには
  `[admin] ログイン拒否: ... は ADMIN_EMAILS に含まれていません` のように理由が出る**
  （ブラウザ側に理由を返さないのは、管理者のメールアドレスを外部から推測されないようにするため）。
- Firestore/Storage の中身は <http://localhost:4000> （Emulator UI）で直接確認・編集できる。
- エミュレータのデータはプロセスを止めると消える（永続化はしていない）。

`npm run dev:emulators` は `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` を自動で設定するため、
`.env.local` 自体は書き換えない。素の `npm run dev`（本番Firestoreに接続）と使い分けられる。

**本番の実データに対する動作確認**は、今のところローカルからはできない
（このマシンにサービスアカウント等の認証情報が無いため、`npm run dev` で
`NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false` にしても Admin SDK が本番Firestoreに繋がらず、
既定値表示にフォールバックする）。Cloud Run 上では既定のサービスアカウントで自動的に繋がるため、
実データでの確認はデプロイ後に行う。
例外は下の登録スクリプトで、これだけは gcloud の認証情報で本番に繋ぐ。

エミュレータは firebase-tools の都合で **Java 21 以上**が要る。

### 登録スクリプトで作品を追加する

PoC や Kaggle の成果を、管理画面を開かずに `/portfolio` へ載せるための道具（`scripts/content.ts`）。
**本番への登録はこの PC からだけ行う。** 別のマシン（Mac の Playground など）では登録ファイルを
作って GitHub に push するだけにし、この PC が gh コマンドでそれを読みに行く。

```text
Mac：PoC が終わる → 記事と公開リポジトリを出す → pocs/<PoC>/portfolio.json を書いて push
この PC：npm run content -- pending       … 未登録・変更ありの登録ファイルを一覧
         npm run content -- add gh:...    … 中身・リンク・差分を確認（dry-run。何も書き込まない）
         npm run content -- add gh:... --run  … 本番に書き込む
```

初回だけ、本番に繋ぐための認証をする（鍵ファイルは作らない）：

```bash
gcloud auth application-default login
```

登録ファイル `portfolio.json`（カバー画像は同じフォルダに置く）：

```json
{
  "id": "melody-next-note",
  "category": "pocs",
  "title": { "ja": "譜面エディタの「次の音」候補をモデルで出す", "en": "Suggesting the next note in a score editor" },
  "caption": { "ja": "音楽専用モデルと判断モデルを 280 か所で比較した", "en": "" },
  "href": "https://zenn.dev/...",
  "links": [{ "label": { "ja": "GitHub", "en": "GitHub" }, "href": "https://github.com/haruto-kamijo/melody-next-note" }],
  "tags": ["Python", "PyTorch"],
  "cover": "cover.png",
  "ready": true
}
```

- `id` は Firestore のドキュメントIDになる。同じ `id` で再度 `add` すると更新になる（重複しない）
- `category` は `sites` `games` `models` `photos` `pocs` `kaggle` `blog` のどれか
- `en` を空にした項目は、英語ページでも日本語で表示される
- `href` はカード全体のリンク（記事など）、`links` はカードの下に並べる補助リンク（5個まで）
- `tags` は使った技術（省略可。8個まで、1つ30文字まで）。日英で同じ表記をカードに出す
- `ready` は必須。`false` にすると非公開で登録され、管理画面で確認してから公開できる。
  `ready` が効くのは新規登録のときだけで、登録済みの作品の公開・非公開は管理画面で切り替える
  （もう一度 `add --run` しても、公開中の作品が非公開に戻らないようにするため）
- `cover` は登録ファイルと同じフォルダにある画像のファイル名だけを書く
- タイトル・説明文・リンク・カバー画像は登録ファイルが正。管理画面で直しても、次の `add --run` で登録ファイルの内容に戻る
- 入力チェックは管理画面と同じ（`lib/content/portfolioItem.ts`）

**公開前のチェック**として、URL を正規化（`/../` の解決など）してから、GitHub のリポジトリへのリンクは
公開設定を gh で確かめ、非公開（playground や kaggle 本体など）なら登録を止める。ほかのリンクも開けるかを確かめる
（接続できないときはネットワーク側の都合のこともあるので、注意を出すだけで止めない。GitHub のページだけは止める）。
登録ファイルの場所は、誰でも読める `portfolioItems` には保存しない。
`links` と `tags` は管理画面では表示だけで編集できない（管理画面で保存しても消えない）。

**ブログのタブ**は、手動で登録したカードのあとに、`src/lib/site.ts` の `blogFeeds`（Zenn・note の RSS）の記事を新しい順に並べる。
記事を出すたびに登録しなくてよい。公開中の作品の `href` か `links` と同じ記事は出さないので、
PoC の検証記事は PoC のカードの `href` に Zenn の URL を書けば、ブログのタブとで二重にならない。
RSS は1時間ごとに読み直し、読めなかった RSS は飛ばして表示する。

### 経歴を登録する

`/career` の年表は、登録ファイル（`career.json`）に全部の項目をまとめて書き、スクリプトで `career/timeline` を丸ごと置き換える。
ファイルから消した項目は、ページからも消える。登録ファイルは個人の経歴なので、このリポジトリには置かない（置き場所は自分で決める）。
書き方は `scripts/career.example.json`（架空の例）を見る。

```bash
npm run career -- <career.json の場所>          # 確かめて、足す・変わる・消す項目を表示する（dry-run。何も書き込まない）
npm run career -- <career.json の場所> --run    # 本番に書き込む（ページには 5 分ほどで出る）
```

| 項目 | 書き方 |
|---|---|
| `id` | 英小文字・数字・ハイフン。ファイルの中で重ならないもの |
| `kind` | `education`（学歴）/ `research`（研究・発表）/ `work`（職歴・資格）/ `achievement`（制作・受賞） |
| `start` | `"2024"` か `"2024-04"`。今より先の年月なら、ページで「予定」と付く（その月になると外れる） |
| `end` | 期間のあるものの終わり（`"2026-03"`。年だけならその年の終わり）。続いているものは `"present"`。一時点のもの（受賞・発表）は書かない |
| `title` | `{ "ja": "...", "en": "..." }`。日本語は必須。英語が空なら英語のページで日本語を出す |
| `org` / `description` | 学校・研究室・会社などの名前と、1〜2文の説明。どちらも省いてよい |
| `links` | `[{ "label": { "ja": "..." }, "href": "..." }]`。`https://` の URL か、`/portfolio?tag=Python` のようなサイトの中のパス（`/en` は付けない。英語のページでは自動で付く）。5 個まで |

書き方の誤り（知らない名前・綴りの誤りも含む）は、どの項目のどこかを全部表示し、何も書き込まずに止まる。
登録済みの中身に形の崩れた項目があるときは、dry-run で「消える」と表示する（丸ごと置き換えるので、書き込むと消える）。本番に繋ぐ認証は作品の登録と同じ（`gcloud auth application-default login`）。

### Claude Code の利用状況を更新する

About ページの「Claude Code の利用状況」（日別ヒートマップと合計値）は、この PC の Claude Code のログ
（`~/.claude/projects/**/*.jsonl`）を集計して `stats/claudeUsage` に書いたものを表示する。
集計は `~/.claude/skills/claude-usage/usage.py`（Claude Code の skill。実体は非公開リポジトリ `claude-usage-log`）が行い、
Mac の分も合算する（各 PC が毎日 `machines/<PC 名>.json` を push し、それを読んで足す）。
公開するのは日ごとの数と合計だけ（プロジェクト名や会話の内容は書かない）。
Claude Code は古いログを消すため、usage.py は日ごとの集計を `~/.claude/usage-history.json` に積み上げて残す。

```bash
npm run usage           # 集計して書き込む内容を表示（dry-run）
npm run usage -- --run  # 本番に書き込む（認証は登録スクリプトと同じ gcloud の認証情報）
```

毎日 23:30 に Windows のタスクスケジューラ（タスク名 `ClaudeUsageToPortfolio`）が
`scripts/usage-task.cmd` を実行する（この PC の集計を push → 合算して本番に書き込む）。PC が止まっていた日は次に起動したときに実行される。
結果は `%LOCALAPPDATA%\claude-usage\task.log` に残る。登録し直すときは PowerShell で：

```powershell
$f = "<このリポジトリ>\portfolio\scripts\usage-task.cmd"
Register-ScheduledTask -TaskName ClaudeUsageToPortfolio `
  -Action (New-ScheduledTaskAction -Execute cmd.exe -Argument "/c `"$f`"") `
  -Trigger (New-ScheduledTaskTrigger -Daily -At 23:30) `
  -Settings (New-ScheduledTaskSettingsSet -StartWhenAvailable)
```

1 の同期に失敗しても 2 は続ける（Mac の分が前回の同期時点のまま載るだけで、合計が減ることはないため）。
`task.log` は追記し続けるので、大きくなったら消してよい。

About ページは ISR（5 分）なので、書き込んでから 5 分以内に反映される。
タイルの右上には最後に集計した日を出し、「直近 7 日」「今月」もその日を基準に数える。
`stats/claudeUsage` が無い・読めないときはタイルを出さない。

### アクセス解析

Cookie を使わず、同意のバナーも出さない。数えていることはフッターに一文で知らせる。

- **ページの閲覧数**：Cloudflare Web Analytics。`src/lib/site.ts` の `analytics.cloudflareToken` に、
  Cloudflare のダッシュボード（Web Analytics → Add a site → `kamijoharuto.com`）で出る token を書く。
  token はページの HTML に載る値なので、コードに置いてよい。空のあいだと、本番のドメイン以外（手元・E2E）では読み込まない。
  `/admin` `/login` と、カタログの iframe の中（`/catalog-frame`）では読み込まない。
- **操作の回数**：Cloudflare では数えられないので、`/api/events` に送って `analytics/{日付}` に回数だけを足す（誰が押したかは残さない）。
  数えるのは、外へのリンク（リンク先の URL。`?` `#` 以降は除く）、タグでの絞り込み（新しく選んだタグ）、
  カタログの幅の切り替え・パーツの名前を見るモード・パーツ図鑑でのコードのコピー。
  誰でも送れるので、ほかのサイトからのもの（`Sec-Fetch-Site`）・ボット・連投（IP ごとに 1 分 30 回）・
  サイトに出ていないリンクやタグは数えない。
- **問い合わせの送信**：保存した `contacts` をその期間で数える。

回数は管理画面の「アクセス解析」で、直近 7 日・30 日・90 日を選んで見る。自分で公開ページを見た分も数えに入る。

### フォールバック設計

`src/lib/content/getSiteContent.ts` は Firestore が未設定・空・接続不可のとき
`src/lib/content/defaults.ts`（= `src/lib/site.ts` の静的な値）を返す。
そのため CMS が未完成でも、認証情報が無い環境でビルドしてもサイトは壊れない。

`/home` `/about` `/career` は ISR（`revalidate = 300`）。`/career` の経歴と `/about` の Claude Code の利用状況は、作り直すときに Firestore を読めないと、
直前に作れたページを出し続ける（ビルドのときだけは空で作る）。`/portfolio` はカテゴリを `?tab=` で受け取るため
Next.js が自動的に完全動的レンダリングにする（`revalidate` は効かない）。
どちらも CMS の保存アクションが `revalidatePath` を呼ぶため、保存直後に反映される。
