# Raspberry Pi Setup

新しく用意した Raspberry Pi 4 Model B に `epsign` を GitHub からクローンして起動する手順です。

## 全体像

Raspberry Pi 上の Docker で `doorsign` を動かす前提です。

```text
doorsign (Docker)
  ↓ image.png / dithered-image.png
Raspberry Pi
  ↓
e-Paper (SPI)
```

## 前提

- Raspberry Pi OS Lite を推奨
- Raspberry Pi OS をインストール済み
- ネットワーク接続済み
- GitHub から `epsign` を取得できる
- Waveshare 10.85 inch e-Paper HAT+ を利用する

## 1. 初期セットアップ

```sh
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl ca-certificates python3-pip python3-pil python3-numpy python3-gpiozero
```

## 2. Docker をインストール

```sh
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

補足:

- うまく反映されない場合は、一度ログアウトして再ログインしてください

## 3. SPI を有効化

```sh
sudo raspi-config
```

`Interface Options` → `SPI` → `Enable` を選択します。

再起動:

```sh
sudo reboot
```

## 4. Waveshare ドライバを確認

```sh
git clone https://github.com/waveshare/e-Paper.git
cd e-Paper/RaspberryPi_JetsonNano/python
ls lib/waveshare_epd
```

10.85 inch 用として `epd10in85.py` があることを確認してください。

## 5. 配線

| e-Paper | Raspberry Pi |
|---|---|
| VCC | 3.3V |
| GND | GND |
| DIN | GPIO10 (MOSI) |
| CLK | GPIO11 (SCLK) |
| CS | GPIO8 |
| DC | GPIO25 |
| RST | GPIO17 |
| BUSY | GPIO24 |

## 6. Waveshare 単体テスト

```sh
cd examples
python3 epd_10in85_test.py
```

ここで表示されれば、SPI と配線は正常です。

## 7. リポジトリをクローン

```sh
git clone https://github.com/mochidai/epsign.git
cd epsign
```

Node.js だけ `mise` で入れる場合:

```sh
mise trust
mise install
```

このリポジトリでは Python は `mise` で管理せず、Raspberry Pi OS の system Python を使います。

## 8. doorsign の環境変数を設定

`.env` を作成します。

```sh
cp packages/doorsign/.env.example packages/doorsign/.env
nano packages/doorsign/.env
```

設定内容:

```properties
GOOGLE_CALENDAR_ID="your_calendar_id@example.com"
GOOGLE_API_KEY="your_google_api_key"
SERVER_PORT=3000
```

## 9. drawer の環境変数を設定

```sh
cat > packages/drawer/.env <<'EOF'
DASHBOARD_URL=http://127.0.0.1:3000/dithered-image.png
EOF
```

## 10. doorsign を起動

```sh
docker compose up -d --build
```

起動確認:

```sh
docker compose ps
```

## 11. uv をインストール

```sh
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env
```

## 12. drawer の依存をインストール

```sh
cd packages/drawer
uv sync
```

## 13. 状態ファイルを初期化

`doorsign` は以下の状態ファイルを参照します。

- `/home/pi/override.json`
- `/home/pi/location_state.json`

初期化用スクリプトを実行します。

```sh
cd ~/epsign
./scripts/init-state-files.sh
```

デフォルトでは `/home/pi` に作成されます。別ディレクトリへ作る場合は引数で指定できます。

```sh
./scripts/init-state-files.sh /tmp/test-state
```

この構成では、以下の固定パスを使います。

- `/home/pi/button_controller.py`
- `/home/pi/update_epd.py`
- `/home/pi/override.json`
- `/home/pi/location_state.json`

## 14. ボタン監視スクリプトを配置

リポジトリのスクリプトを `/home/pi` へ配置します。

```sh
cd ~/epsign
cp scripts/button_controller.py /home/pi/button_controller.py
cp scripts/update_epd.py /home/pi/update_epd.py
chmod +x /home/pi/button_controller.py
chmod +x /home/pi/update_epd.py
```

このスクリプトは次の動作をします。

- override ボタン短押し: `/home/pi/update_epd.py` を実行
- override ボタン長押し: `override.json` を `force_off` と `null` でトグル
- location ボタン短押し: `location_state.json` の `on_campus` / `off_campus` をトグル
- LED: `override = force_off` の間だけ点灯

GPIO の既定値はスクリプト内で以下です。

- override ボタン: GPIO5
- location ボタン: GPIO6
- override LED: GPIO16

必要なら `/home/pi/button_controller.py` 内の定数、または環境変数で変更できます。

## 15. ボタン監視の起動テスト

```sh
python3 /home/pi/button_controller.py
```

## 16. ボタン監視を systemd 化

サービスファイルのテンプレートは `systemd/epdash-button.service` にあります。Raspberry Pi では以下の内容で配置します。

```ini
[Unit]
Description=e-Paper door sign button controller
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/bin/python3 /home/pi/button_controller.py
WorkingDirectory=/home/pi
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

配置:

```sh
sudo cp ~/epsign/systemd/epdash-button.service /etc/systemd/system/epdash-button.service
```

有効化:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now epdash-button.service
```

## 17. 電子ペーパーへ描画

```sh
uv run draw-dashboard.py
```

## 18. 電子ペーパーをクリア

```sh
uv run clear.py
```

## 画像取得と表示の仕組み

`drawer` は `DASHBOARD_URL` から画像を取得して、電子ペーパーへ流し込みます。概念的には以下と同じです。

```python
import requests
from PIL import Image
from io import BytesIO

url = "http://<MacのIP>:3000/dithered-image.png"

res = requests.get(url)
img = Image.open(BytesIO(res.content))
```

Waveshare ドライバ側では次のように表示します。

```python
from waveshare_epd import epd10in85

epd = epd10in85.EPD()
epd.init()
epd.display(epd.getbuffer(img))
epd.sleep()
```

## 19. 定期更新

```sh
crontab -e
```

5 分ごとに更新する例:

```cron
*/5 * * * * cd /home/pi/epsign/packages/drawer && /home/pi/.local/bin/uv run draw-dashboard.py
```

## 注意点

### フルリフレッシュ制限

頻繁更新は避けてください。ゴーストが出やすくなります。

推奨は 5 分から 10 分間隔です。

### 解像度

10.85 inch モデルでは 1360 x 480 を前提に合わせるのが安全です。

### 電源

USB 電源が弱いと表示が不安定になります。5V 3A を推奨します。

## 補足

- `doorsign` は Docker コンテナで動作します
- `drawer` は Raspberry Pi 上の Python から直接実行します
- GPIO と電子ペーパーの配線が正しくないと `draw-dashboard.py` は失敗します
- `init-state-files.sh` は `override.json` と `location_state.json` の初期ファイルを作成します
- `button_controller.py` は `/home/pi/update_epd.py` を呼ぶ前提です
