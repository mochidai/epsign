#!/usr/bin/env python3

import json
import os
import signal
import subprocess
import sys
import threading
import time
from datetime import datetime
from pathlib import Path

from gpiozero import Button, LED

HOME_DIR = Path.home()
OVERRIDE_BUTTON_GPIO = int(os.getenv("OVERRIDE_BUTTON_GPIO", "5"))
LOCATION_BUTTON_GPIO = int(os.getenv("LOCATION_BUTTON_GPIO", "6"))
OVERRIDE_LED_GPIO = int(os.getenv("OVERRIDE_LED_GPIO", "16"))
LOCATION_LED_GPIO = int(os.getenv("LOCATION_LED_GPIO", "23"))
BUTTON_HOLD_SECONDS = float(os.getenv("BUTTON_HOLD_SECONDS", "1.5"))

OVERRIDE_PATH = Path(os.getenv("OVERRIDE_PATH", str(HOME_DIR / "override.json")))
LOCATION_STATE_PATH = Path(os.getenv("LOCATION_STATE_PATH", str(HOME_DIR / "location_state.json")))
UPDATE_EPD_COMMAND = os.getenv(
    "UPDATE_EPD_COMMAND",
    f"/usr/bin/python3 {HOME_DIR / 'update_epd.py'}",
)
update_requested = threading.Event()
shutdown_requested = threading.Event()


def today_jst() -> str:
    return datetime.now().astimezone().strftime("%Y-%m-%d")


def load_override_state() -> dict:
    try:
        return json.loads(OVERRIDE_PATH.read_text())
    except Exception:
        return {"override": None}


def save_override_state(override_value):
    OVERRIDE_PATH.write_text(
        json.dumps({"override": override_value}, ensure_ascii=False),
    )


def load_location_state() -> dict:
    today = today_jst()
    try:
        data = json.loads(LOCATION_STATE_PATH.read_text())
    except Exception:
        return {"date": today, "location": "off_campus"}

    if data.get("date") != today:
        return {"date": today, "location": "off_campus"}

    location = data.get("location")
    if location not in {"on_campus", "off_campus"}:
        location = "off_campus"

    return {"date": today, "location": location}


def save_location_state(location: str):
    LOCATION_STATE_PATH.write_text(
        json.dumps({"date": today_jst(), "location": location}, ensure_ascii=False),
    )


def run_update_epd():
    print(f"Running update command: {UPDATE_EPD_COMMAND}", flush=True)
    try:
        subprocess.run(UPDATE_EPD_COMMAND, shell=True, check=True)
    except subprocess.CalledProcessError as exc:
        print(f"update_epd failed: {exc}", file=sys.stderr, flush=True)


def request_update_epd():
    update_requested.set()


def update_worker():
    while not shutdown_requested.is_set():
        if not update_requested.wait(timeout=0.1):
            continue
        update_requested.clear()
        run_update_epd()


def refresh_led(override_led: LED):
    state = load_override_state()
    if state.get("override") == "force_off":
        override_led.on()
    else:
        override_led.off()


def refresh_location_led(location_led: LED):
    state = load_location_state()
    if state.get("location") == "on_campus":
        location_led.on()
    else:
        location_led.off()


def toggle_override(override_led: LED):
    state = load_override_state()
    next_value = None if state.get("override") == "force_off" else "force_off"
    save_override_state(next_value)
    refresh_led(override_led)
    print(f"override set to: {next_value}", flush=True)
    request_update_epd()


def toggle_location(location_led: LED):
    state = load_location_state()
    next_location = "off_campus" if state.get("location") == "on_campus" else "on_campus"
    save_location_state(next_location)
    refresh_location_led(location_led)
    print(f"location set to: {next_location}", flush=True)
    request_update_epd()


def ensure_state_files():
    OVERRIDE_PATH.parent.mkdir(parents=True, exist_ok=True)
    LOCATION_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)

    if not OVERRIDE_PATH.exists():
        save_override_state(None)

    if not LOCATION_STATE_PATH.exists():
        save_location_state("off_campus")


def main():
    ensure_state_files()

    override_led = LED(OVERRIDE_LED_GPIO)
    location_led = LED(LOCATION_LED_GPIO)
    refresh_led(override_led)
    refresh_location_led(location_led)

    override_button = Button(
        OVERRIDE_BUTTON_GPIO,
        pull_up=True,
        bounce_time=0.05,
        hold_time=BUTTON_HOLD_SECONDS,
    )
    location_button = Button(
        LOCATION_BUTTON_GPIO,
        pull_up=True,
        bounce_time=0.05,
    )

    state = {
        "override_pressed_at": None,
        "override_held": False,
    }
    worker = threading.Thread(target=update_worker, daemon=True)
    worker.start()

    def on_override_pressed():
        state["override_pressed_at"] = time.monotonic()
        state["override_held"] = False

    def on_override_held():
        state["override_held"] = True
        toggle_override(override_led)

    def on_override_released():
        if state["override_pressed_at"] is None:
            return
        if not state["override_held"]:
            request_update_epd()
        state["override_pressed_at"] = None
        state["override_held"] = False

    def on_location_pressed():
        toggle_location(location_led)

    override_button.when_pressed = on_override_pressed
    override_button.when_held = on_override_held
    override_button.when_released = on_override_released
    location_button.when_pressed = on_location_pressed

    def shutdown_handler(signum, frame):
        shutdown_requested.set()
        update_requested.set()
        override_led.close()
        location_led.close()
        override_button.close()
        location_button.close()
        sys.exit(0)

    signal.signal(signal.SIGTERM, shutdown_handler)
    signal.signal(signal.SIGINT, shutdown_handler)

    print("button controller started", flush=True)
    signal.pause()


if __name__ == "__main__":
    main()
