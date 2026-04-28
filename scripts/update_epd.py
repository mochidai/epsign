#!/usr/bin/env python3

import os
import subprocess
import sys
from pathlib import Path


HOME_DIR = Path.home()
UV_BIN = os.getenv("UV_BIN", str(HOME_DIR / ".local/bin/uv"))
DRAW_SCRIPT = os.getenv("DRAW_SCRIPT", str(HOME_DIR / "epsign/packages/drawer/draw-dashboard.py"))


def main():
    cmd = [UV_BIN, "run", DRAW_SCRIPT]
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as exc:
        print(f"update_epd failed: {exc}", file=sys.stderr)
        sys.exit(exc.returncode)


if __name__ == "__main__":
    main()
