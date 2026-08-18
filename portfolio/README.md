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

`/about`・`/portfolio`・`/contact` はリプレイス中で未実装。
実装したら `src/lib/site.ts` の `ready` を `true` にするとヘッダーとカードのリンクが有効になる。

## ファイル構成

```
src/
  app/
    layout.tsx            // 全ページ共通。星空背景をここで1つだけ描画する
    page.tsx              // スタート画面（リング演出＋ワープ）
    global.css
    (site)/               // Header/Footer が付く本編ページのグループ
      layout.tsx
      home/page.tsx
  components/
    layout/               // Header / Footer
    space/
      SpaceSceneProvider.tsx // 背景シーンの状態（idle→spinup→flash→warp→cruise）
      SpaceBackground.tsx    // 全ページ共通の背景ラッパ
    three/
      SpaceCanvas.tsx      // Canvasラッパ（SSR無効・dpr上限あり）
      SceneRoot.tsx        // シーンのルート＋カメラ視差
      StarField.tsx        // ランダムに瞬く星
      NebulaBackground.tsx // ガス雲（調整中・未使用）
    ui/
      Panel.tsx            // 星空の上に置く半透明パネル
  lib/
    site.ts                // 名前・リンク・ナビ・スキル・作品の単一ソース
    warpTimeline.ts        // ワープ演出のタイミング定数
    useReducedMotion.ts    // prefers-reduced-motion の判定
    three/shaders/         // GLSL
```

## 設計上の約束

- 背景の Canvas は `app/layout.tsx` に1つだけ。ページ遷移で WebGL を作り直さないため世界観が途切れない。
  ページ側は `useSpaceScene()` で状態を変えるだけにする。
- 表示テキスト・リンクはページに直書きせず `src/lib/site.ts` に置く。
- `prefers-reduced-motion: reduce` のときはワープ演出とフラッシュを行わず即遷移する。

## Firebase 構成

問い合わせの保存と管理画面(CMS)のために Firestore / Auth / Storage を使う。

### データモデル

| コレクション | 内容 | 公開読み取り | 書き込み |
|---|---|---|---|
| `profile/main` | 名前・role・tagline・学年の上書き・専攻など | ○ | 管理者のみ |
| `skillGroups/{id}` | Skills の分野と項目（`order` で並び順） | ○ | 管理者のみ |
| `works/{id}` | 作品カード（`ready` `order` `coverUrl`） | ○ | 管理者のみ |
| `contacts/{id}` | 問い合わせ内容 | × | サーバーのみ |

Storage は `works/{workId}/{fileName}` に作品のカバー画像を置く（画像のみ・5MBまで）。

### 問い合わせの流れ

ユーザーの操作はサイト内で完結させ、内容はメールでも受け取れるようにする。

```
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

### ローカル開発

```bash
cp .env.local.example .env.local        # 値を埋める
firebase emulators:start                # Auth:9099 / Firestore:8080 / Storage:9199 / UI:4000
npm run dev
```

`.env.local` の `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` でエミュレータに繋がる。

### フォールバック設計

`src/lib/content/getSiteContent.ts` は Firestore が未設定・空・接続不可のとき
`src/lib/content/defaults.ts`（= `src/lib/site.ts` の静的な値）を返す。
そのため CMS が未完成でも、認証情報が無い環境でビルドしてもサイトは壊れない。

`/home` は ISR（`revalidate = 300`）。CMS の保存処理で `revalidatePath` を呼んで即時反映も足す予定。
