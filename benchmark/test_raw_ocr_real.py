import cv2
import easyocr
import time

reader = easyocr.Reader(['es', 'en'], gpu=False)

img_paths = [
    r"C:\Users\Alex\Downloads\Photos-1-001 (1)\20260903_173856.jpg",
    r"C:\Users\Alex\Downloads\Photos-1-001 (1)\20260903_173915.jpg",
    r"C:\Users\Alex\Downloads\Photos-1-001 (1)\20260903_173946.jpg"
]

for p in img_paths:
    print("="*60)
    print("Testing OCR on:", p)
    t0 = time.time()
    # Downscale image to a reasonable size so EasyOCR doesn't choke on 4080x3060
    img = cv2.imread(p)
    h, w = img.shape[:2]
    scale = 1600.0 / max(h, w)
    resized = cv2.resize(img, (int(w * scale), int(h * scale)))
    
    results = reader.readtext(resized, detail=0)
    print(f"Elapsed: {time.time()-t0:.2f}s, Detected {len(results)} text snippets:")
    for text in results[:25]:
        print("  -", text)
