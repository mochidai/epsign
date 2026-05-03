# epsign

Raspberry Pi 4 と Waveshare 10.85 inch e-Paper HAT+ を使った電子ペーパードアサインです。

`packages/doorsign` で在室表示ページと画像を生成し、`packages/drawer` でその画像を取得して電子ペーパーへ描画します。

<img src="img/sample_doorsign.png" width="400">
<img src="img/ua_sample_doorsign.png" width="400">

## 入口

- 実機セットアップ
  - [`RASPBERRY_PI_SETUP.md`](./RASPBERRY_PI_SETUP.md)
  - 配線図もこのドキュメントに含む
- 表示サーバーの詳細
  - [`packages/doorsign/README.md`](./packages/doorsign/README.md)
- 描画スクリプトの詳細
  - [`packages/drawer/README.md`](./packages/drawer/README.md)

この README は全体像と最小起動手順に絞っています。

## 構成

- `packages/doorsign`
  - Remix 製の表示サーバー
  - `/dashboard`, `/image.png`, `/dithered-image.png` を提供
- `packages/drawer`
  - Raspberry Pi 上で画像を取得し、電子ペーパーへ描画する Python スクリプト
- `scripts/button_controller.py`
  - `$HOME/override.json` と `$HOME/location_state.json` を更新する 2 ボタン監視スクリプト
  - location LED は既定で 60 秒ごとに再評価する
- `scripts/update_epd.py`
  - `$HOME/update_epd.py` として配置し、`uv run draw-dashboard.py` を呼ぶ更新ラッパー
  - 既定で 100 秒タイムアウト。`UPDATE_EPD_TIMEOUT_SECONDS` で変更可能。`0` 以下で無制限
- `systemd/epsign-button.service`
  - ボタン監視スクリプトを常駐させるための systemd テンプレート

## 処理の流れ

1. Google Calendar から予定の busy 情報を取得する
2. 在室状態、時間帯、祝日判定を統合してドアサイン画面を生成する
3. Playwright で `/dashboard` をスクリーンショットする
4. モノクロ表示向けにディザリングする
5. Raspberry Pi で画像を取得して電子ペーパーへ描画する

<img src="img/dithered-image.png" width="600">

## 動作の分担

- `docker compose up -d --build`
  - `doorsign` の Web サーバーだけを起動する
- `button_controller.py`
  - GPIO ボタンと LED を管理する
  - ボタン押下時に `$HOME/update_epd.py` を呼ぶ
- cron
  - `packages/drawer/draw-dashboard.py` を定期実行して e-Paper を更新する

Compose だけではボタン監視は起動しません。実機では `systemd/epsign-button.service` を別途有効化してください。

## 最小起動手順

以下は `epsign/` ディレクトリで実行します。

```sh
cp packages/doorsign/.env.example packages/doorsign/.env
docker compose up -d --build
```

実機で e-Paper とボタンも使う場合は、この後に `uv sync`、状態ファイル初期化、`systemd` 設定、cron 設定が必要です。

Google Calendar を使わずに画面だけ確認したい場合は、`.env` の `GOOGLE_CALENDAR_ID` と `GOOGLE_API_KEY` を空のままでも `/dashboard` は起動します。

確認先:

- `http://127.0.0.1:3000/dashboard`
- `http://127.0.0.1:3000/image.png`
- `http://127.0.0.1:3000/dithered-image.png`

## 環境変数の初期設定

### 共有 .env

`packages/doorsign/.env` を作成して以下を設定します。

```properties
GOOGLE_CALENDAR_ID="your_calendar_id@example.com"
GOOGLE_API_KEY="your_google_api_key"
SERVER_PORT=3000
DASHBOARD_URL="http://127.0.0.1:3000/dithered-image.png"
UPDATE_EPD_TIMEOUT_SECONDS=0
LED_REFRESH_INTERVAL_SECONDS=60
```

作成例:

```sh
cp packages/doorsign/.env.example packages/doorsign/.env
```

その後、`packages/doorsign/.env` を編集して値を埋めます。

このファイルは `doorsign` だけでなく、`packages/drawer/draw-dashboard.py` と `scripts/button_controller.py` からも参照されます。同じ Raspberry Pi 上で `doorsign` を動かすなら、この URL のままで構いません。

補足:

- `GOOGLE_CALENDAR_ID`, `GOOGLE_API_KEY`
  - `doorsign` が busy 情報と祝日を取得するために使う
- `DASHBOARD_URL`
  - `draw-dashboard.py` が取得する画像 URL
- `UPDATE_EPD_TIMEOUT_SECONDS`
  - ボタン経由で起動する `update_epd.py` のタイムアウト秒数
- `LED_REFRESH_INTERVAL_SECONDS`
  - `button_controller.py` が location LED を再評価する間隔。既定値は 60 秒

## 実行時ファイル

Raspberry Pi では次の状態ファイルを使います。

- `$HOME/override.json`
- `$HOME/location_state.json`

ボタン監視スクリプトはこれらを更新し、`doorsign` はそれらを読んで表示内容を決めます。

## Docker Compose

`compose.yaml` では `doorsign` を起動できます。

```sh
docker compose up -d --build
```

これで起動するのは表示サーバーだけです。ボタン監視は含まれません。

## Raspberry Pi 側の追加セットアップ

実機では Compose だけでは足りません。最低限、次も必要です。

1. `uv` をインストールして `packages/drawer` で `uv sync` する
2. `scripts/init-state-files.sh` で状態ファイルを作る
3. `scripts/button_controller.py` と `scripts/update_epd.py` を `$HOME` に配置する
4. `systemd/epsign-button.service` を有効化する
5. cron で `uv run draw-dashboard.py` を定期実行する

詳細な手順は [`RASPBERRY_PI_SETUP.md`](./RASPBERRY_PI_SETUP.md) を参照してください。
