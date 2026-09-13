# OneBe corporate website

OneBeのコーポレートサイト。PC・タブレット・スマートフォンに対応する21ページを静的HTMLとして生成し、GitHub Pagesで公開します。

公開URL：<https://onebe-inc.github.io/corporate/>

## 開発・更新

Node.js 22以上を使用します。

```sh
npm ci
npm run dev
```

ローカルURL：`http://127.0.0.1:4173/corporate/`

`src/content.mjs`で実績・サービス・パッケージを、`src/templates.mjs`でページ構成を更新します。スタイルと操作は`public/assets/`、本番URLと送信先は`src/config.mjs`で管理します。編集後はビルドを再実行してください。

```sh
npm test
npm run check:aio:browser
npm run check:aio:http
```

ブラウザ検証はWindowsではEdgeを使用します。他の環境では、初回に`npx playwright install chromium`を実行してください。ブラウザ検証でFormSubmit宛のリクエストはモックに差し替え、実際のメールは送りません。

## 公開

GitHub Settings → Pages → Sourceを **GitHub Actions** に設定します。`main`へのpushでビルド・検証後にPagesへデプロイします。静的HTML、CSS、JavaScript、画像のみを配信し、開発用ソースや内部台帳は配信しません。

独自ドメインに変更する場合は`src/config.mjs`の`origin`と`base`を変更して再ビルドしてください。`/corporate/`からの移行には旧URLの扱いを別途決めてください。

## お問い合わせ

送信先：`info@onebe-create.com`。ユーザー指定によりFormSubmitを利用します。

初回送信時、受信先に届くFormSubmitの確認メールから有効化が必要です。有効化状態と実際の受信はブラウザ内のモックテストでは確認できません。公開URLから運営者が送信確認し、メールの有効化を完了してください。架空の顧客情報を使った実送信テストは実行していません。

入力→検証→確認→送信→Thanksに対応。失敗時は入力を保持し、再試行できます。任意の相談項目を複数選択でき、確認画面に実際の内容が表示されます。フォーム内容は同じタブのsessionStorageに一時保存し、送信完了時に消去します。24時間経過した下書きは次回読み込み時に破棄します。

## 素材と原稿

ロゴ・代表写真は提供された元画像を使用。代表写真はWeb配信用に縮小・圧縮しており、人物の生成や差し替えは行っていません。制作の画像は事前のデザイン案に含まれるイメージで、実制作写真ではない旨を表示しています。公開実績は確認済みのUMUI・そよかぜ・VAIZOの3件です。検討案の架空5件、未確認の成果数値、所在地、法人情報、料金は追加していません。

SEO・AI検索に関する設計、確認範囲と運用は`ops/OPERATIONS.md`、ページ台帳は`ops/pages.json`をご参照ください。検証通過は検索への登録やAI引用を保証するものではありません。
