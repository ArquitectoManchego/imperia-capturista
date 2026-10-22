import cv2
import easyocr
import json
import re

reader = easyocr.Reader(['es', 'en'], gpu=False)

def analyze_real_ocr(img_path):
    img = cv2.imread(img_path)
    h, w = img.shape[:2]
    scale = 1600.0 / max(h, w)
    resized = cv2.resize(img, (int(w * scale), int(h * scale)))
    
    # Read text with bounding boxes
    results = reader.readtext(resized)
    print(f"\n--- Analizando {img_path} ({len(results)} detecciones) ---")
    
    folio = ""
    fecha = ""
    cliente = ""
    tel = ""
    metodo = "NO_ESPECIFICADO"
    items = []
    total = 0.0
    anticipo = 0.0
    resta = 0.0
    
    for bbox, text, conf in results:
        t_clean = text.strip()
        # Look for folio
        if re.search(r'\b(79\d{2}|78\d{2})\b', t_clean):
            folio = re.search(r'\b(79\d{2}|78\d{2})\b', t_clean).group(1)
        # Look for phone
        if re.search(r'\b\d{10}\b', t_clean.replace("-", "").replace(" ", "")):
            tel = re.search(r'\b\d{10}\b', t_clean.replace("-", "").replace(" ", "")).group(0)
            
    print(f"Extracción preliminar OCR: Folio='{folio}', Tel='{tel}'")
    return results

analyze_real_ocr(r"C:\PROYECTOS ANTIGRAVITY\CAPTURISTA\benchmark\data_real\caso_real_1.jpg")
