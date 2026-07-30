"""Documents how the 18 per-question photos (assets/questions/*.jpg) were
produced, and lets you re-run the same pipeline if you regenerate one.

The AI-generated source PNGs (~2MB each, ~36MB total) are NOT kept in this
repo — that would work against the "small, single-file" spirit of the
project for images that only ever exist to be resized down anyway. To
refresh an image:

  1. Generate (or otherwise source) a new photo for question N and save it
     as a PNG somewhere, e.g. assets/_incoming/q07.png.
  2. Point SRC below at that folder and run this script. It resizes to
     WIDTH px wide, re-compresses as JPEG, and writes both:
       - assets/questions/qNN.jpg   (the compressed image, kept in git)
       - assets/qimg.js.txt         (a QIMG[] JS array of base64 data URIs)
  3. Paste the relevant line(s) from qimg.js.txt into the QIMG array near
     the top of index.html's <script>, replacing the old entry at the same
     index (QIMG[qi] must stay index-matched to Q[qi]).
  4. Delete qimg.js.txt afterwards — it's scratch output, not shipped.
"""
import base64
from pathlib import Path

from PIL import Image

SRC = Path(__file__).parent / "_incoming"   # put fresh source PNGs here
DST = Path(__file__).parent / "questions"
DST.mkdir(exist_ok=True)

WIDTH = 640
QUALITY = 50

uris = []
total = 0
for i in range(1, 19):
    name = f"q{i:02d}"
    src_path = SRC / f"{name}.png"
    if not src_path.exists():
        continue   # only re-process images you've actually dropped in SRC

    img = Image.open(src_path).convert("RGB")
    ratio = WIDTH / img.width
    img = img.resize((WIDTH, round(img.height * ratio)), Image.LANCZOS)

    out_path = DST / f"{name}.jpg"
    img.save(out_path, "JPEG", quality=QUALITY, optimize=True)
    size = out_path.stat().st_size
    total += size

    b64 = base64.b64encode(out_path.read_bytes()).decode("ascii")
    uris.append((i - 1, f"data:image/jpeg;base64,{b64}"))
    print(f"{name}: {size/1024:.1f} KB")

if uris:
    js = "\n".join(f'  // QIMG[{idx}]:\n  "{u}",' for idx, u in uris)
    (Path(__file__).parent / "qimg.js.txt").write_text(js, encoding="utf-8")
    print(f"TOTAL: {total/1024:.1f} KB across {len(uris)} image(s)")
    print("Wrote", Path(__file__).parent / "qimg.js.txt")
else:
    print(f"No source PNGs found in {SRC} — nothing to do.")
