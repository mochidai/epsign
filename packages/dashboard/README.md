# Dashboard

在室ステータスと予定を組み合わせたドアサイン画像を生成する Remix アプリです。

## 提供するページ

- `/`
  - デバッグ用トップ
- `/dashboard`
  - ドアサイン本体の HTML 表示
- `/image.png`
  - `/dashboard` のスクリーンショット画像
- `/dithered-image.png`
  - 7 色電子ペーパー向けに減色した画像

## 環境設定

`.env` に以下を設定します。

```properties
GOOGLE_CALENDAR_ID="your_calendar_id@example.com"
GOOGLE_API_KEY="your_google_api_key"
SERVER_PORT=3000
```

補足:

- `GOOGLE_CALENDAR_ID` は busy 判定に使う Google Calendar ID
- `GOOGLE_API_KEY` は Google Calendar API 呼び出しに利用
- `SERVER_PORT` は `/image.png` と `/dithered-image.png` が内部参照するポート

## 在室状態ファイル

以下のファイルを Raspberry Pi 側に置く前提です。

- `/home/pi/override.json`
- `/home/pi/location_state.json`

形式:

```json
{"override":"force_off"}
```

```json
{"date":"2026-04-28","location":"on_campus"}
```

`override` は `force_off` または `null`、`location` は `on_campus` または `off_campus` です。

## インストール

```sh
npm install
```

初回は Playwright の依存が必要です。

```sh
npx playwright install --with-deps
```

## 開発

```sh
npm run dev
```

## 本番起動

```sh
npm run build
npm run start
```

`pm2.config.cjs` も残っているので、必要なら PM2 での起動もできます。
