import cv2
import numpy as np
import re
import easyocr
from PIL import Image

class NoteOCREngine:
    def __init__(self):
        print("Initializing EasyOCR Engine...")
        self.reader = easyocr.Reader(['es', 'en'], gpu=False)

    def extract_text(self, img_crop):
        """Runs OCR on cropped image slice"""
        if img_crop is None or img_crop.size == 0:
            return ""
        # Upscale slightly for better handwriting recognition
        h, w = img_crop.shape[:2]
        if h < 30 or w < 30:
            img_crop = cv2.resize(img_crop, (max(w * 2, 40), max(h * 2, 40)), interpolation=cv2.INTER_CUBIC)
        
        results = self.reader.readtext(img_crop, detail=0, paragraph=False)
        return " ".join(results).strip()

    def detect_checkbox(self, img_crop):
        """Detects if checkbox has an X or mark"""
        if img_crop is None or img_crop.size == 0:
            return False
        gray = cv2.cvtColor(img_crop, cv2.COLOR_BGR2GRAY) if len(img_crop.shape) == 3 else img_crop
        # Count dark pixels in the center of checkbox
        h, w = gray.shape
        center = gray[int(h*0.2):int(h*0.8), int(w*0.2):int(w*0.8)]
        dark_pixels = np.sum(center < 160)
        total_pixels = center.size
        ratio = dark_pixels / total_pixels
        return ratio > 0.08

    def parse_currency(self, text):
        clean = re.sub(r'[^\d.]', '', text.replace(',', '.'))
        try:
            return float(clean)
        except:
            return 0.0

    def parse_integer(self, text):
        clean = re.sub(r'[^\d]', '', text)
        try:
            return int(clean)
        except:
            return 0

    def parse_concepto(self, text):
        prenda = ""
        corte = ""
        genero = ""
        talla = ""
        talla_filipina = ""
        talla_pantalon = ""
        notas = ""

        # Prenda
        for p in ['Filipina', 'Pantalon', 'Bata', 'Quirurgico', 'Conjunto', 'Bordado', 'Playera', 'Gorro']:
            if re.search(rf'\b{p}\b', text, re.IGNORECASE):
                prenda = p
                break
        
        # Genero
        if re.search(r'\bDama\b', text, re.IGNORECASE):
            genero = "Dama"
        elif re.search(r'\bCaballero\b', text, re.IGNORECASE):
            genero = "Caballero"
        elif re.search(r'\bUnisex\b', text, re.IGNORECASE):
            genero = "Unisex"

        # Talla split F-M P-G
        f_p_match = re.search(r'F-([XSMLG0-9]+)\s+P-([XSMLG0-9]+)', text, re.IGNORECASE)
        if f_p_match:
            talla_filipina = f_p_match.group(1).upper()
            talla_pantalon = f_p_match.group(2).upper()
        else:
            # Talla simple: T-34, T-M, T-G, T-40
            t_match = re.search(r'T[-]?([XSMLG0-9]+)', text, re.IGNORECASE)
            if t_match:
                talla = t_match.group(1).upper()

        # Notas operativas
        if "bordado" in text.lower() or "logo" in text.lower():
            notas = text
        if "cliente" in text.lower():
            notas = text

        return {
            "prenda": prenda,
            "corte": corte,
            "genero": genero,
            "talla": talla,
            "talla_filipina": talla_filipina,
            "talla_pantalon": talla_pantalon,
            "notas": notas
        }

    def process_image(self, img_path):
        img = cv2.imread(img_path)
        if img is None:
            raise FileNotFoundError(f"Could not load image: {img_path}")

        # 1. Folio in red (x: 830-930, y: 68-105)
        folio_crop = img[65:105, 830:930]
        raw_folio = self.extract_text(folio_crop)
        folio = re.sub(r'[^\d]', '', raw_folio)

        # 2. Date in 3 boxes (y: 106-138)
        # Box 1 (Dia): 710-808
        # Box 2 (Mes): 808-906
        # Box 3 (Ano): 906-1005
        d_crop = img[106:138, 715:800]
        m_crop = img[106:138, 815:900]
        y_crop = img[106:138, 915:995]
        dia = self.parse_integer(self.extract_text(d_crop))
        mes = self.parse_integer(self.extract_text(m_crop))
        ano = self.parse_integer(self.extract_text(y_crop))
        fecha_emision = f"{dia:02d}/{mes:02d}/{ano}" if dia and mes and ano else ""

        # 3. Payment Method Checkboxes (y: 145-165)
        # Transf: 388-406
        # Efectivo: 584-602
        # Debito: 902-920
        # Credito: 982-1000
        payment_method = "NO_ESPECIFICADO"
        if self.detect_checkbox(img[145:165, 388:408]):
            payment_method = "TRANSFERENCIA"
        elif self.detect_checkbox(img[145:165, 584:604]):
            payment_method = "EFECTIVO"
        elif self.detect_checkbox(img[145:165, 902:922]):
            payment_method = "TARJETA_DEBITO"
        elif self.detect_checkbox(img[145:165, 982:1002]):
            payment_method = "TARJETA_CREDITO"

        # 4. Customer Info
        # Cliente: x: 80 to 495, y: 175 to 205
        cliente = self.extract_text(img[175:205, 80:495])
        # Tel: x: 540 to 835, y: 175 to 205
        tel = re.sub(r'[^\d]', '', self.extract_text(img[175:205, 540:835]))
        # RFC: x: 50 to 250, y: 208 to 238
        rfc = self.extract_text(img[208:238, 50:250]).replace(" ", "").upper()
        # Direccion: x: 335 to 835, y: 208 to 238
        direccion = self.extract_text(img[208:238, 335:835])

        # 5. Table Rows (9 rows)
        row_y_ranges = [
            (268, 299),
            (299, 332),
            (332, 363),
            (363, 395),
            (395, 427),
            (427, 458),
            (458, 490),
            (490, 522),
            (522, 554)
        ]

        items = []
        for idx, (y1, y2) in enumerate(row_y_ranges):
            # Check if row has any content (e.g. check col 0, 1, 2, 3)
            row_slice = img[y1:y2, 120:575]
            concepto_raw = self.extract_text(row_slice)
            if not concepto_raw or len(concepto_raw) < 2:
                continue

            # PED/APA/ENT: x: 0 to 32
            status_raw = self.extract_text(img[y1:y2, 0:32]).upper()
            status = "P"
            if "A" in status_raw: status = "A"
            elif "E" in status_raw: status = "E"
            elif "B" in status_raw: status = "B"
            elif "P" in status_raw: status = "P"

            # CANT: x: 32 to 65
            cant_raw = self.extract_text(img[y1:y2, 32:65])
            cant = self.parse_integer(cant_raw)

            # CLAVE: x: 65 to 120
            clave_raw = self.extract_text(img[y1:y2, 65:120])
            clave_num = self.parse_integer(clave_raw)

            # REGLA SKU vs CANTIDAD:
            # Si 'CLAVE' contiene un número y CANT está vacía o 0, tratar como cantidad
            if clave_num > 0 and cant == 0:
                cant = clave_num

            # P.UNIT: x: 721 to 863
            p_unit_raw = self.extract_text(img[y1:y2, 721:863])
            p_unit = self.parse_currency(p_unit_raw)

            # IMPORTE: x: 863 to 1006
            importe_raw = self.extract_text(img[y1:y2, 863:1006])
            importe = self.parse_currency(importe_raw)

            # Rule: Si P.UNIT en blanco pero IMPORTE tiene cifra:
            # Si cant == 0 o vacia: cant = 1
            if p_unit == 0.0 and importe > 0.0:
                if cant == 0:
                    cant = 1
                p_unit = importe / cant

            if importe == 0.0 and cant > 0 and p_unit > 0.0:
                importe = cant * p_unit

            # Concept breakdown
            breakdown = self.parse_concepto(concepto_raw)

            items.append({
                "row_idx": idx,
                "ped_apa_ent": status,
                "cant": cant,
                "concepto": concepto_raw,
                "prenda": breakdown["prenda"],
                "corte": breakdown["corte"],
                "genero": breakdown["genero"],
                "talla": breakdown["talla"],
                "talla_filipina": breakdown["talla_filipina"],
                "talla_pantalon": breakdown["talla_pantalon"],
                "notas": breakdown["notas"],
                "p_unit": p_unit,
                "importe": importe
            })

        # 6. Footer (y: 554 to 586)
        # Entrega: x: 105 to 255
        fecha_entrega = self.extract_text(img[554:586, 105:255])
        # Anticipo: x: 345 to 495
        anticipo = self.parse_currency(self.extract_text(img[554:586, 345:495]))
        # Resta: x: 570 to 735
        resta = self.parse_currency(self.extract_text(img[554:586, 570:735]))
        # Total: x: 855 to 1006
        total = self.parse_currency(self.extract_text(img[554:586, 855:1006]))

        # Financial Cross-Validation
        sum_importes = sum(item["importe"] for item in items)
        if total == 0.0 and sum_importes > 0.0:
            total = sum_importes
        if resta == 0.0 and total > 0.0 and anticipo > 0.0 and anticipo < total:
            resta = total - anticipo

        return {
            "motor": "OCR_TRADICIONAL_CV",
            "folio": folio,
            "fecha_emision": fecha_emision,
            "metodo_pago": payment_method,
            "cliente": cliente,
            "telefono": tel,
            "rfc": rfc,
            "direccion": direccion,
            "items": items,
            "fecha_entrega": fecha_entrega,
            "anticipo": anticipo,
            "resta": resta,
            "total": total,
            "validacion_financiera": {
                "suma_importes": sum_importes,
                "total_coincide": abs(sum_importes - total) < 0.01 if total > 0 else False,
                "cuadre_cierre": abs(total - anticipo - resta) < 0.01 if total > 0 else False
            }
        }
