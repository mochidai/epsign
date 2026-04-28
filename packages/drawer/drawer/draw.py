from PIL import Image
import epaper


def draw(model: str, img: Image.Image):
    try:
        epd = epaper.epaper(model).EPD()
        epd.init()
        epd.display(epd.getbuffer(img))
        epd.sleep()

    except IOError as e:
        print(e)

    except KeyboardInterrupt:
        epaper.epaper(model).epdconfig.module_exit(cleanup=True)
        exit()


def clear(model: str):
    try:
        epd = epaper.epaper(model).EPD()
        epd.init()
        epd.Clear()
        epd.sleep()

    except IOError as e:
        print(e)

    except KeyboardInterrupt:
        epaper.epaper(model).epdconfig.module_exit(cleanup=True)
        exit()
