# 地図探検

小学3年生社会科・地域学習向けのWebアプリです。HTML/CSS/Vanilla JavaScriptのみで、ビルド不要です。

## 公開方法
1. ZIPを展開する
2. GitHubのリポジトリ直下へ、このフォルダーの中身をアップロードする
3. Settings → Pages → Deploy from a branch → main → /(root) → Save

`index.html` がリポジトリの最上位に見える状態にしてください。

## 構成
- `config.js`: 数値設定
- `data/`: OpenPOI、正規化、分類、重複除去、キャッシュ
- `geo/`: 距離・方位・地図座標
- `quiz/`: 問題生成と安全条件
- `state/`: localStorage
- `ui/`: 地図表示

## 注意
距離は直線距離です。施設データには欠落があり得るため、存在しないことを断定しません。授業前に学校ネットワークから `api.openpoiapi.com` と `cyberjapandata.gsi.go.jp` へ接続できるか確認してください。