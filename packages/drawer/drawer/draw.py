import os
import sys
from importlib import import_module
from pathlib import Path

from PIL import Image


def _ensure_waveshare_lib_on_path():
    home_dir = Path.home()
    env_lib = os.getenv("WAVESHARE_EPD_LIB")
    candidates = []

    if env_lib:
        candidates.append(Path(env_lib))

    candidates.extend(
        [
            home_dir / "e-Paper/E-paper_Separate_Program/10.85inch_e-Paper/RaspberryPi/python/lib",
            home_dir / "e-Paper/RaspberryPi_JetsonNano/python/lib",
        ]
    )

    for candidate in candidates:
        if candidate.exists():
            candidate_str = str(candidate)
            if candidate_str in sys.path:
                sys.path.remove(candidate_str)
            sys.path.insert(0, candidate_str)
            return

    raise ModuleNotFoundError(
        "waveshare_epd library not found. Set WAVESHARE_EPD_LIB or clone "
        "~/e-Paper and use the 10.85inch separate program."
    )


def _load_epd_module(model: str):
    _ensure_waveshare_lib_on_path()
    return import_module(f"waveshare_epd.{model}")


def draw(model: str, img: Image.Image):
    try:
        epd_module = _load_epd_module(model)
        epd = epd_module.EPD()
        epd.init()
        epd.display(epd.getbuffer(img))
        epd.sleep()

    except IOError as e:
        print(e)

    except KeyboardInterrupt:
        epd_module = _load_epd_module(model)
        epd_module.epdconfig.module_exit(cleanup=True)
        exit()


def clear(model: str):
    try:
        epd_module = _load_epd_module(model)
        epd = epd_module.EPD()
        epd.init()
        epd.Clear()
        epd.sleep()

    except IOError as e:
        print(e)

    except KeyboardInterrupt:
        epd_module = _load_epd_module(model)
        epd_module.epdconfig.module_exit(cleanup=True)
        exit()
