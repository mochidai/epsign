from PIL import Image
from importlib import import_module


def draw(model: str, img: Image.Image):
    try:
        epd_module = import_module(f"waveshare_epd.{model}")
        epd = epd_module.EPD()
        epd.init()
        epd.display(epd.getbuffer(img))
        epd.sleep()

    except IOError as e:
        print(e)

    except KeyboardInterrupt:
        epd_module = import_module(f"waveshare_epd.{model}")
        epd_module.epdconfig.module_exit(cleanup=True)
        exit()


def clear(model: str):
    try:
        epd_module = import_module(f"waveshare_epd.{model}")
        epd = epd_module.EPD()
        epd.init()
        epd.Clear()
        epd.sleep()

    except IOError as e:
        print(e)

    except KeyboardInterrupt:
        epd_module = import_module(f"waveshare_epd.{model}")
        epd_module.epdconfig.module_exit(cleanup=True)
        exit()
