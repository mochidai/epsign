#!/usr/bin/python
# -*- coding:utf-8 -*-
import os
from drawer import draw, get_url_image
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("DASHBOARD_URL")

if url is None:
    print("Please set DASHBOARD_URL in .env file")
    exit()

print("get image from :", url)

img = get_url_image(url)

print("draw image")
draw("epd7in3f", img)
