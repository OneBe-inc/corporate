# OneBe security operations

対象は https://onebe-create.com/ 。2026-10-22の診断に対応する。GitHub Pagesは静的配信であり、HTMLのmeta指定ではHSTS・X-Frame-Options・CSP frame-ancestorsを有効化できない。

## 実装した範囲と有効化の境界

- ビルド時に全HTMLへCSPとReferrer-Policyのmetaを追加する。スクリプトは自社資材、Google計測先、ビルドで計算した正確なインラインハッシュだけを許可する。script-srcへunsafe-inline/unsafe-evalは追加しない。既存の動的スタイルを維持するためstyle-srcのunsafe-inlineは残す。
- GitHubのビルドは読取権限で実行し、依存ライブラリを実行しない記事保存ジョブだけcontents:write、公開ジョブだけpages:write/id-token:writeを持つ。Actionは完全SHAに固定。記事同期と既存の公開条件は維持する。
- `node scripts/prepare-security-edge.mjs` は無効状態のCloudflareルール案だけを出力する。GitHubへpushしてもCloudflareやDNSへは適用しない。
- 実際の有効化はCloudflareのログイン、対象アカウント・ゾーン・プラン・現在のDNS/ルール照合後。既存ルールはrefで追記・更新し、全置換しない。メールのMX/TXT、サブドメイン、DNSSECの移行条件を確認する。費用・新しい外部共有・ネームサーバー変更は内容を具体化して確認する。
- 本番有効化後、プライバシーポリシーの実際の配信/保護事業者の説明を更新する。導入前に利用済みと記載しない。

## 有効化する保護設定

HTTPS転送、TLS Full (strict)、適用可能な既存の管理ルールを確認する。レスポンスヘッダーは生成されたresponse-headers.jsonに従う。HSTSは最初はmax-age=86400のみ。includeSubDomains/preloadは未検証のサブドメインへ広げない。全ページのCSP metaと、埋め込み制限等のHTTPヘッダーは組み合わせて適用する。

カスタムルールは自社ホストの存在しない機密ファイルパスのみを対象にする。国・一般的なブラウザ・検索クローラー・User-Agent全体での遮断はしない。FormSubmitは外部サービスであり、自社WAFではその送信APIへの直接通信を保護できない。迷惑送信がある場合は、同サービス側の実効制限確認またはサーバー側検証付きフォーム入口を別途準備する。見かけのJavaScript対策だけで解決済みとしない。

## 攻撃の記録を確認する

Cloudflare → 対象ゾーン → Analytics / Security Eventsで、期間・検知元・処理・パスを確認する。検知/遮断は攻撃成功の証拠ではない。0件も攻撃がない証拠ではない。Freeプランはサンプルを含み、Security Eventsは公式文書上最大31日の保持、クエリ窓最大30日。実効プランと表示上の期間を必ず確認する。全通信の完全な監査ログではない。

有効化直後に一度だけ `https://onebe-create.com/__onebe_security_probe__` へアクセスする。403と、その時間帯のカスタムルール記録を照合する。このパスは検証用であり実攻撃に数えない。自分のアクセス以外へ攻撃リクエストを送らない。通常ページ、問い合わせ確認まで、GA4が動作することも確認し、実メール送信は明示されたテストのみ実施する。

## 必要時のローカルレポート

公式APIに対するゾーン限定のAnalytics/Security読取トークンを使い、トークンはローカル環境変数から読む。GitHub・HTML・チャットへ貼らない。

```
CLOUDFLARE_API_TOKEN   読取専用トークン
CLOUDFLARE_ZONE_ID     対象ゾーンID
SECURITY_SINCE        任意：開始日時UTC
SECURITY_UNTIL        任意：終了日時UTC
SECURITY_REPORT_DIR   任意：ローカル保存先
npm run security:report
```

既定は直近24時間。1回の最大取得は1000イベントで、上限に達したら時間を短くして再確認する。サンプリングや保持期間により全イベントを保証しない。生のIP・クエリ文字列・User-Agent・フォーム本文はレポートへ取得しない。パス自体に個人情報を含めない運用も必要。APIが失敗/権限不足ならレポート生成を停止し、0件の正常結果を作らない。出力はローカルJSON/HTMLで、公開リポジトリへ追加しない。定期実行とSlack/メール通知は未設定。

## 継続確認と切り戻し

公開直後：全27HTMLのmeta、主要4ページの実ヘッダー、無許可インラインJSの遮断、既存メニュー・動画・フォームの確認・GA4を検証。設定変更後は検証用通信が記録されることを確認する。障害時は追加した個別ルールを無効化し、既存の正常なDNS・公開版へ戻せる記録を保持する。監視やTLS検証そのものを無効化しない。

攻撃記録が見つかったら、日時UTC、処理、検知元、パス、Ray ID等を非公開の記録へ保存する。侵入の疑いがある場合はGitHub公開履歴・DNS変更履歴・メールの不正ログインを別途調査する。GitHubの直配信URL等、Cloudflareを経由しないアクセスはこの記録の対象外。導入前の履歴は復元できない。

性能設計：新規のブラウザJS・外部タグ・動画/画像は追加しない。CSPはHTMLメタデータだけ増加し、既存の資材取得と再生停止条件を維持する。LCP/INP/CLS改善を主張しない。検証は静的チェック、単体、ローカルブラウザの既存フローとCSP拒否を対象とする。

公式資料：
- https://developers.cloudflare.com/waf/analytics/security-events/
- https://developers.cloudflare.com/rules/transform/response-header-modification/create-api/
- https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-firewall-events/
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
- https://docs.github.com/en/actions/reference/security/secure-use
