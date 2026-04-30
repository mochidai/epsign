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
sudo apt install -y git curl ca-certificates python3-pip python3-pil python3-numpy python3-gpiozero python3-dev build-essential swig liblgpio-dev
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
cd e-Paper/E-paper_Separate_Program/10.85inch_e-Paper/RaspberryPi
ls lib/waveshare_epd
```

10.85 inch は専用ディレクトリ構成です。以下が見えることを確認してください。

```sh
ls python/lib/waveshare_epd/epd10in85.py
ls python/examples/epd_10in85_test.py
```

## 5. 配線

| e-Paper | Raspberry Pi |
|---|---|
| VCC | 3.3V |
| GND | GND |
| DIN | GPIO10 (MOSI) |
| CLK | GPIO11 (SCLK) |
| CS_M | GPIO8 (CE0) |
| CS_S | GPIO7 (CE1) |
| DC | GPIO25 |
| RST | GPIO17 |
| BUSY | GPIO24 |
| PWR | GPIO18 |

ボタンと LED の配線は以下です。

| 部品 | Raspberry Pi |
|---|---|
| override ボタン | GPIO5 と GND |
| location ボタン | GPIO6 と GND |
| override LED | GPIO16 |
| location LED | GPIO23 |

ボタンは `pull_up=True` 前提なので、押したときに GPIO と GND が導通する配線にします。

LED は GPIO から抵抗を介して接続してください。既定では「GPIO を High にすると点灯」する前提です。配線方向や LED モジュールの極性が逆の場合は、点灯ロジックの調整が必要です。

## 6. Waveshare 単体テスト

```sh
cd python/examples
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
次の変数を設定する
- GOOGLE_CALENDAR_ID: GoogleカレンダーのID
- GOOGLE_API_KEY: Google Calendar API を呼び出すための API キー
- SERVER_PORT: 電子ペーパに表示する画像を保持しているDocker上のサーバのポート
- DASHBOARD_URL: 電子ペーパに表示する画像のURL
- UPDATE_EPD_TIMEOUT_SECONDS: ボタンを押してトリガーする電子ペーパー描画のタイムアウト時間（秒）


```properties
GOOGLE_CALENDAR_ID="your_calendar_id@example.com"
GOOGLE_API_KEY="your_google_api_key"
SERVER_PORT=3000
DASHBOARD_URL=http://127.0.0.1:3000/dithered-image.png
UPDATE_EPD_TIMEOUT_SECONDS=0
```

`drawer` とボタン監視スクリプトもこの `packages/doorsign/.env` を参照します。

## 9. doorsign を起動

```sh
docker compose up -d --build
```

起動確認:

```sh
docker compose ps
```

## 10. uv をインストール

```sh
curl -LsSf https://astral.sh/uv/install.sh | sh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
uv --version
```

## 11. drawer の依存をインストール

```sh
cd packages/drawer
uv sync
```

補足:

- `lgpio` のビルドで `swig` が必要です
- `uv sync` 時に `error: command 'swig' failed: No such file or directory` が出た場合は、`swig`, `build-essential`, `python3-dev` が不足しています
- `uv sync` 時に `/usr/bin/ld: cannot find -llgpio` が出た場合は、`liblgpio-dev` が不足しています

## 12. 状態ファイルを初期化

`doorsign` は以下の状態ファイルを参照します。

- `$HOME/override.json`
- `$HOME/location_state.json`

初期化用スクリプトを実行します。

```sh
cd ~/epsign
./scripts/init-state-files.sh
```

デフォルトでは `$HOME` に作成されます。別ディレクトリへ作る場合は引数で指定できます。

```sh
./scripts/init-state-files.sh /tmp/test-state
```

この構成では、以下の固定パスを使います。

- `$HOME/button_controller.py`
- `$HOME/update_epd.py`
- `$HOME/override.json`
- `$HOME/location_state.json`

## 14. ボタン監視スクリプトを配置

リポジトリのスクリプトをホームディレクトリへ配置します。

```sh
cd ~/epsign
cp scripts/button_controller.py ~/button_controller.py
cp scripts/update_epd.py ~/update_epd.py
chmod +x ~/button_controller.py
chmod +x ~/update_epd.py
```

このスクリプトは次の動作をします。

- override ボタン短押し: `$HOME/update_epd.py` を実行
- override ボタン長押し: `override.json` を `force_off` と `null` でトグル
- location ボタン短押し: `location_state.json` の `on_campus` / `off_campus` をトグル
- override LED: `override = force_off` の間だけ点灯
- location LED: `location = on_campus` の間だけ点灯

LED の点灯条件は時刻では変わりません。時間外かどうかは画面表示側の判定であり、LED は状態ファイルだけを見て切り替わります。

`button_controller.py` は、LED 更新とボタン応答を先に行い、`update_epd.py` はバックグラウンドスレッドで直列実行します。そのため、電子ペーパー更新に時間がかかっても LED の点灯は遅れません。

GPIO の既定値はスクリプト内で以下です。

- override ボタン: GPIO5
- location ボタン: GPIO6
- override LED: GPIO16
- location LED: GPIO23

必要なら `~/button_controller.py` 内の定数、または環境変数で変更できます。

`~/update_epd.py` は既定で 100 秒のタイムアウト付きです。電子ペーパー未接続や `BUSY` 待ちで停止した場合でも、100 秒で復帰します。必要なら環境変数で変更できます。`0` 以下を指定するとタイムアウトしません。

タイムアウト時や `Ctrl-C` 時には、`uv run draw-dashboard.py` の子プロセスまでまとめて終了します。以前のプロセスが残っていると `GPIO busy` になるため、テスト前に掃除したい場合は次を実行します。

```sh
pkill -f draw-dashboard.py
```

```sh
export UPDATE_EPD_TIMEOUT_SECONDS=30
```

表示完了まで 30 秒以上かかる環境では、次のどちらかを使ってください。

```sh
export UPDATE_EPD_TIMEOUT_SECONDS=0
export UPDATE_EPD_TIMEOUT_SECONDS=180
```

## 15. ボタン監視の起動テスト

```sh
python3 ~/button_controller.py
```

確認ポイント:

- `~/override.json` が `{"override": "force_off"}` なら override LED が点灯する
- location ボタンを押すと location LED が即時に切り替わる
- 画面更新がタイムアウトしても LED は切り替わる

## 16. ボタン監視を systemd 化

サービスファイルのテンプレートは `systemd/epsign-button.service` にあります。Raspberry Pi では以下の内容で配置します。

```ini
[Unit]
Description=e-Paper door sign button controller
After=network-online.target
Wants=network-online.target

[Service]
User=mochidai
ExecStart=/usr/bin/python3 /home/mochidai/button_controller.py
WorkingDirectory=/home/mochidai
Restart=always

[Install]
WantedBy=multi-user.target
```

配置:

```sh
sudo cp ~/epsign/systemd/epsign-button.service /etc/systemd/system/epsign-button.service
```

有効化:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now epsign-button.service
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

url = "http://localhost:3000/dithered-image.png"

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

このプロジェクトの `drawer` は、デフォルトで次のディレクトリを自動参照します。

```text
$HOME/e-Paper/E-paper_Separate_Program/10.85inch_e-Paper/RaspberryPi/python/lib
```

別の場所に clone した場合は、`WAVESHARE_EPD_LIB` で明示できます。

```sh
export WAVESHARE_EPD_LIB=/path/to/e-Paper/E-paper_Separate_Program/10.85inch_e-Paper/RaspberryPi/python/lib
```

## 19. 定期更新

```sh
crontab -e
```

5 分ごとに更新する例:

```cron
*/5 * * * * cd "$HOME/epsign/packages/drawer" && "$HOME/.local/bin/uv" run draw-dashboard.py
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
- `button_controller.py` は `$HOME/update_epd.py` を呼ぶ前提です
