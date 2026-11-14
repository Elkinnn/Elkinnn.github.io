"""Prepare supplied portraits without altering faces, poses, or existing CV photo.

Requires Pillow. Run with the four original PNG paths; originals are retained in
assets/profile, plus responsive WebP exports and bilingual Open Graph artwork.
No generated facial details, background removal, or second circular crop is used.
"""
import argparse
import json
from pathlib import Path
from shutil import copyfile

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "assets" / "profile"


def font(size, bold=False):
    # Only the authoring step uses system fonts; the site serves local WOFF2 fonts.
    paths = [Path("C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
             Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")]
    for path in paths:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default(size=size)


def og_art(source, lang):
    size = (1200, 630)
    image = Image.new("RGB", size)
    pixels = image.load()
    for y in range(size[1]):
        for x in range(size[0]):
            t = min(1, max(0, (x / 1200 + y / 630) / 2))
            a, b = (17, 28, 61), (68, 49, 122)
            pixels[x, y] = tuple(round(a[i] * (1-t) + b[i] * t) for i in range(3))
    draw = ImageDraw.Draw(image)
    draw.ellipse((660, -170, 1350, 520), fill="#4b4ed0")
    draw.ellipse((744, 62, 1230, 548), outline="#b8a8ed", width=2)
    portrait = Image.open(source).convert("RGB")
    portrait.thumbnail((350, 429), Image.Resampling.LANCZOS)
    frame = Image.new("RGB", (portrait.width + 20, portrait.height + 20), "#f5f4ff")
    frame.paste(portrait, (10, 10))
    image.paste(frame, (800, 92))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((64, 59, 128, 123), radius=18, fill="#f4f3ff")
    draw.text((77, 69), "EL", font=font(28, True), fill="#343285")
    draw.text((65, 179), "Elkin López", font=font(83, True), fill="#ffffff")
    title = "Estudiante de Ingeniería de Software" if lang == "es" else "Software Engineering Student"
    draw.text((69, 295), title, font=font(29), fill="#e0dcff")
    lines = ("Interfaces. Sistemas conectados.", "Inteligencia artificial aplicada.") if lang == "es" else ("Interfaces. Connected systems.", "Applied artificial intelligence.")
    for i, line in enumerate(lines):
        draw.text((69, 362 + 44*i), line, font=font(28), fill="#d0d9f1")
    draw.line((69, 495, 730, 495), fill="#776fba", width=1)
    draw.text((69, 528), "elkinnn.github.io", font=font(24), fill="#bdeef5")
    image.save(DEST / f"og-portfolio-{lang}.jpg", quality=90, optimize=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--main", required=True, help="Transparent blazer portrait PNG")
    parser.add_argument("--secondary", required=True, help="Transparent tuxedo close portrait PNG")
    parser.add_argument("--round", required=True, help="Already circular tuxedo portrait PNG")
    parser.add_argument("--alternate", required=True, help="White-background sweater portrait PNG")
    args = parser.parse_args()
    DEST.mkdir(parents=True, exist_ok=True)
    stems = {"main": "elkin-blazer", "secondary": "elkin-tuxedo", "round": "elkin-round", "alternate": "elkin-sweater"}
    alts = {"main": "Elkin López wearing a navy blazer and white shirt", "secondary": "Elkin López wearing a black tuxedo with a pink brooch", "round": "Elkin López wearing a tuxedo with a pink flower", "alternate": "Elkin López wearing a navy sweater"}
    portraits = {}
    for role, stem in stems.items():
        supplied = Path(getattr(args, role))
        source = DEST / f"{stem}.png"
        if supplied.resolve() != source.resolve():
            copyfile(supplied, source)
        with Image.open(source) as original:
            # Preserve supplied alpha; the round portrait is never cropped again.
            portrait = original.convert("RGBA" if "A" in original.getbands() else "RGB")
            dimensions = {}
            for width in (640, 1133):
                height = round(portrait.height * width / portrait.width)
                export = portrait.resize((width, height), Image.Resampling.LANCZOS)
                export.save(DEST / f"{stem}-{width}.webp", "WEBP", quality=88, method=6, exact=True)
                dimensions[width] = height
        portraits[role] = {
            "src": f"/assets/profile/{stem}-1133.webp",
            "srcset": f"/assets/profile/{stem}-640.webp 640w, /assets/profile/{stem}-1133.webp 1133w",
            "width": 1133, "height": dimensions[1133], "alt": alts[role]
        }
    profile_path = ROOT / "content" / "profile.json"
    profile = json.loads(profile_path.read_text(encoding="utf-8"))
    old_photo = profile["photo"]
    profile["portraits"] = portraits
    profile_path.write_text(json.dumps(profile, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    assert json.loads(profile_path.read_text(encoding="utf-8"))["photo"] == old_photo
    for lang in ("en", "es"):
        og_art(DEST / "elkin-sweater.png", lang)
    for path in sorted(DEST.glob("*.webp")):
        print(f"{path.name}: {path.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
