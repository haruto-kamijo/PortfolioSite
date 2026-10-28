# Portfolio Site

上條遥都のポートフォリオサイト（Next.js App Router / Tailwind CSS / three.js）。

## 開発

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 本番ビルド（型チェックとLintも走る）
npm run lint
```

## デプロイ

Firebase Hosting（プロジェクト: `portfoliosite-b12da`）。

```bash
npm run build
firebase deploy
```

## 画面構成

| ルート  | 内容                                             |
|--------|--------------------------------------------------|
| `/`    | スタート画面。ボタン／Space／無操作8秒でワープして `/home` へ |
| `/home`| 本編トップ（Hero / Skills / Works / Contact）        |
| `/about` | プロフィール（写真・所属・学年・趣味・使用言語） |
| `/portfolio?tab=` | 作品一覧。`sites` / `games` / `models` / `photos` をタブで切り替え |
| `/contact` | お問い合わせフォーム |
| `/login` | 管理者ログイン（Googleサインイン） |
| `/admin` | CMS。受信箱・プロフィール編集・TOPカード・ポートフォリオ管理 |

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
        portfolio/page.tsx // ?tab= でカテゴリを切り替え
        contact/page.tsx
    admin/                 // 認証必須のCMS。layout.tsx が未認証を弾く
      layout.tsx
      page.tsx             // ダッシュボード
      contacts/            // 受信箱（Server Actions: actions.ts）
      profile/             // プロフィール編集
      works/               // TOPカード（home の WORKS 5枚）の管理
      portfolio/           // /portfolio の中身（カテゴリ別の個々の作品）の管理
    login/page.tsx         // 管理者ログイン。有効なセッションがあれば /admin へ即リダイレクト
    api/
      contact/route.ts     // 問い合わせの受け口
      admin/session/route.ts // セッションCookieの発行・失効
  components/
    layout/                // Header / Footer / LanguageSwitch（日英の切り替えボタン）
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
    notify/                 // メール(Resend) / チャット(Discord・Slack) 通知
    firebase/
      client.ts             // ブラウザ用SDK（管理画面のログイン・アップロードで使用）
      admin.ts              // サーバー専用Admin SDK（Firestore/Auth/Storage）
    admin/
      session.ts            // 管理者セッションの発行・検証
      cookieName.ts          // Cookie名（middlewareとも共有するため独立）
      contacts.ts / portfolio.ts // 管理画面向けの読み出し
      revalidatePublic.ts    // 保存後に公開ページ（日英とも）のキャッシュを捨てる
    content/
      types.ts               // Firestoreと静的既定値で共通の型
      fields.ts              // 日英の値と Firestore のフィールド（title / titleEn）の変換
      portfolioItem.ts       // 作品の入力チェックと変換（管理画面と登録スクリプトで共通）
      defaults.ts             // site.ts から作る既定値
      getSiteContent.ts       // 公開ページ向け（profile/skillGroups/works）
      getPortfolioItems.ts    // 公開ページ向け（portfolioItems）
    metadata.ts               // 公開ページの OGP（各ページが自分の URL で呼ぶ）
    three/shaders/            // GLSL
scripts/
  content.ts                  // 登録ファイル（portfolio.json）から作品を本番に登録する
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
| `portfolioItems/{id}` | `/portfolio` の中身。カテゴリごとの個々の作品（`category` `order` `ready` `coverUrl` `links`） | ○（`ready:true` のみ） | 管理者のみ |
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
IPごとのレート制限（60秒に3件）。レート制限は Cloud Run インスタンスごとのメモリなので厳密ではない。

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
  "cover": "cover.png",
  "ready": true
}
```

- `id` は Firestore のドキュメントIDになる。同じ `id` で再度 `add` すると更新になる（重複しない）
- `category` は `sites` `games` `models` `photos` `pocs` `kaggle` `blog` のどれか
- `en` を空にした項目は、英語ページでも日本語で表示される
- `href` はカード全体のリンク（記事など）、`links` はカードの下に並べる補助リンク（5個まで）
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
`links` は管理画面では表示だけで編集できない（管理画面で保存しても消えない）。

### フォールバック設計

`src/lib/content/getSiteContent.ts` は Firestore が未設定・空・接続不可のとき
`src/lib/content/defaults.ts`（= `src/lib/site.ts` の静的な値）を返す。
そのため CMS が未完成でも、認証情報が無い環境でビルドしてもサイトは壊れない。

`/home` `/about` は ISR（`revalidate = 300`）。`/portfolio` はカテゴリを `?tab=` で受け取るため
Next.js が自動的に完全動的レンダリングにする（`revalidate` は効かない）。
どちらも CMS の保存アクションが `revalidatePath` を呼ぶため、保存直後に反映される。
