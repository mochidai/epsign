#!/usr/bin/python
# -*- coding:utf-8 -*-
import os
from pathlib import Path

from drawer import draw, get_url_image
from dotenv import load_dotenv


REPO_ROOT = Path(__file__).resolve().parents[1]
DOORSIGN_ENV_PATH = REPO_ROOT / "doorsign" / ".env"
DRAWER_ENV_PATH = Path(__file__).resolve().parent / ".env"

load_dotenv(DOORSIGN_ENV_PATH)
load_dotenv(DRAWER_ENV_PATH)

url = os.getenv("DASHBOARD_URL")

if url is None:
    print("Please set DASHBOARD_URL in packages/doorsign/.env")
    exit()

print("get image from :", url)

img = get_url_image(url)

print("draw image")
draw("epd10in85", img)
