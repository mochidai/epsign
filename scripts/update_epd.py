#!/usr/bin/env python3

import os
import signal
import subprocess
import sys
from pathlib import Path


HOME_DIR = Path.home()
ENV_FILE_PATH = Path(os.getenv("DOORSIGN_ENV_PATH", str(HOME_DIR / "epsign/packages/doorsign/.env")))


def load_env_file_defaults(path: Path):
    if not path.exists():
        return
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if not key or key in os.environ:
            continue
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        os.environ[key] = value


load_env_file_defaults(ENV_FILE_PATH)

UV_BIN = os.getenv("UV_BIN", str(HOME_DIR / ".local/bin/uv"))
DRAW_SCRIPT = os.getenv("DRAW_SCRIPT", str(HOME_DIR / "epsign/packages/drawer/draw-dashboard.py"))
UPDATE_EPD_TIMEOUT_SECONDS = float(os.getenv("UPDATE_EPD_TIMEOUT_SECONDS", "100"))


def terminate_process_group(proc: subprocess.Popen, sig: int):
    try:
        os.killpg(proc.pid, sig)
    except ProcessLookupError:
        return


def main():
    cmd = [UV_BIN, "run", DRAW_SCRIPT]
    timeout = None if UPDATE_EPD_TIMEOUT_SECONDS <= 0 else UPDATE_EPD_TIMEOUT_SECONDS
    proc = subprocess.Popen(cmd, start_new_session=True)
    try:
        returncode = proc.wait(timeout=timeout)
    except KeyboardInterrupt:
        terminate_process_group(proc, signal.SIGTERM)
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            terminate_process_group(proc, signal.SIGKILL)
            proc.wait()
        sys.exit(130)
    except subprocess.TimeoutExpired:
        terminate_process_group(proc, signal.SIGTERM)
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            terminate_process_group(proc, signal.SIGKILL)
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
