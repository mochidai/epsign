#!/usr/bin/env python3

import os
import subprocess
import sys


UV_BIN = os.getenv("UV_BIN", "/home/pi/.local/bin/uv")
DRAW_SCRIPT = os.getenv("DRAW_SCRIPT", "/home/pi/epsign/packages/drawer/draw-dashboard.py")


def main():
    cmd = [UV_BIN, "run", DRAW_SCRIPT]
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as exc:
        print(f"update_epd failed: {exc}", file=sys.stderr)
        sys.exit(exc.returncode)


if __name__ == "__main__":
    main()
