# Drawer

`doorsign` が生成した画像を取得し、Raspberry Pi 上で Waveshare 10.85 inch e-Paper HAT+ に描画する Python スクリプトです。

## 必要条件

- Python 3.10 以上
- `uv`

## インストール

```sh
uv sync
```

## 環境設定

`../doorsign/.env` に以下を設定します。`draw-dashboard.py` はこのファイルを優先して読み込みます。

```env
DASHBOARD_URL="http://127.0.0.1:3000/dithered-image.png"
```

## 使用方法

画像を取得して描画:

```sh
uv run draw-dashboard.py
```

電子ペーパーをクリア:

```sh
uv run clear.py
```
