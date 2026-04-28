import requests
from PIL import Image
from io import BytesIO


def get_url_image(url: str) -> Image.Image:
    response = requests.get(url)
    response.raise_for_status()
    img = Image.open(BytesIO(response.content))
    return img
