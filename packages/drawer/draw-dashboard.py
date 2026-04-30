#!/usr/bin/python
# -*- coding:utf-8 -*-
import os
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

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

parts = urlsplit(url)
query = dict(parse_qsl(parts.query, keep_blank_values=True))
query["refresh"] = "1"
fresh_url = urlunsplit(parts._replace(query=urlencode(query)))

print("get image from :", fresh_url)

img = get_url_image(fresh_url)

print("draw image")
draw("epd10in85", img)
