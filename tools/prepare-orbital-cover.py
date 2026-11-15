"""Encode responsive covers from an actual Orbital screenshot, without retouching.

Requires Pillow. The source is captured from the local game renderer without HUD.
"""
from pathlib import Path

from PIL import Image


DEST = Path(__file__).resolve().parents[1] / "assets" / "orbital"


def main():
    with Image.open(DEST / "cover-source.jpg") as source:
        image = source.convert("RGB")
        for width in (640, 1280):
            height = round(image.height * width / image.width)
            output = DEST / f"cover-{width}.webp"
            image.resize((width, height), Image.Resampling.LANCZOS).save(
                output, "WEBP", quality=88, method=6
            )
            print(f"{output.name}: {width} x {height}, {output.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
