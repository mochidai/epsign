# epsign

Raspberry Pi 4 と Waveshare 7.3inch e-Paper HAT (F) を使った電子ペーパードアサインです。

`packages/dashboard` で在室表示ページと画像を生成し、`packages/drawer` でその画像を取得して電子ペーパーへ描画します。

<img src="img/sample_doorsign.png" width="400">
<img src="img/ua_sample_doorsign.png" width="400">

## 構成

- `packages/dashboard`
  - Remix 製の表示サーバー
  - `/dashboard`, `/image.png`, `/dithered-image.png` を提供
- `packages/drawer`
  - Raspberry Pi 上で画像を取得し、電子ペーパーへ描画する Python スクリプト

## 処理の流れ

1. Google Calendar から予定の busy 情報を取得する
2. 在室状態と統合してドアサイン画面を生成する
3. Playwright で `/dashboard` をスクリーンショットする
4. 7 色パレットへディザリングする
5. Raspberry Pi で画像を取得して電子ペーパーへ描画する

<img src="img/dithered-image.png" width="600">
## サーバー

現在の構成では、Raspberry Pi 4 上に server と drawer を同居させる前提です。

## Docker Compose

`epsign/compose.yaml` で dashboard を起動できます。

```sh
docker compose up -d --build
```
