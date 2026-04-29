#!/usr/bin/env python3

import os
import signal
import subprocess
import sys
from pathlib import Path


HOME_DIR = Path.home()
UV_BIN = os.getenv("UV_BIN", str(HOME_DIR / ".local/bin/uv"))
DRAW_SCRIPT = os.getenv("DRAW_SCRIPT", str(HOME_DIR / "epsign/packages/drawer/draw-dashboard.py"))
UPDATE_EPD_TIMEOUT_SECONDS = float(os.getenv("UPDATE_EPD_TIMEOUT_SECONDS", "100"))


def main():
    cmd = [UV_BIN, "run", DRAW_SCRIPT]
    timeout = None if UPDATE_EPD_TIMEOUT_SECONDS <= 0 else UPDATE_EPD_TIMEOUT_SECONDS
    proc = subprocess.Popen(cmd, start_new_session=True)
    try:
        returncode = proc.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        os.killpg(proc.pid, signal.SIGTERM)
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            os.killpg(proc.pid, signal.SIGKILL)
            proc.wait()
        print(
            f"update_epd timed out after {UPDATE_EPD_TIMEOUT_SECONDS} seconds",
            file=sys.stderr,
        )
        sys.exit(124)
    if returncode != 0:
        print(f"update_epd failed with exit status {returncode}", file=sys.stderr)
        sys.exit(returncode)


if __name__ == "__main__":
    main()
