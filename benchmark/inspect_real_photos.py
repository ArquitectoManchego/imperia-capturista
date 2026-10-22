import os
import glob
from PIL import Image

PHOTOS_DIR = r"C:\Users\Alex\Downloads\Photos-1-001 (1)"

photos = sorted(glob.glob(os.path.join(PHOTOS_DIR, "*.jpg")))
print(f"Total fotos encontradas: {len(photos)}")

for p in photos:
    im = Image.open(p)
    print(f"{os.path.basename(p)}: size={im.size}, mode={im.mode}")
