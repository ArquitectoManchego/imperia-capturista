import cv2
import easyocr
import re
import numpy as np

class RealNoteOCREngine:
    def __init__(self):
        print("Inicializando Motor OCR Tradicional (EasyOCR + Heurística Espacial)...")
        self.reader = easyocr.Reader(['es', 'en'], gpu=False)

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

    def process_image(self, img_path):
        img = cv2.imread(img_path)
        if img is None:
            raise FileNotFoundError(f"No se pudo cargar la imagen: {img_path}")
            
        h, w = img.shape[:2]
        scale = 1600.0 / max(h, w)
        resized = cv2.resize(img, (int(w * scale), int(h * scale)))
        rh, rw = resized.shape[:2]

        # EasyOCR text detections: [ [bbox], text, conf ]
        detections = self.reader.readtext(resized)

        folio = ""
        fecha_emision = ""
        metodo_pago = "NO_ESPECIFICADO"
        cliente = ""
        tel = ""
        rfc = ""
        direccion = ""
        items = []
        fecha_entrega = ""
        anticipo = 0.0
        resta = 0.0
        total = 0.0

        # Spatial sorting by Y coordinate
        sorted_dets = sorted(detections, key=lambda d: (d[0][0][1], d[0][0][0]))

        # 1. Extraer Folio (parte superior derecha)
        for bbox, text, conf in sorted_dets:
            y_mid = (bbox[0][1] + bbox[2][1]) / 2.0
            x_mid = (bbox[0][0] + bbox[1][0]) / 2.0
            
            # Folio is in top 30% of image, right half
            if y_mid < rh * 0.35 and x_mid > rw * 0.5:
                folio_match = re.search(r'\b(79\d{2}|78\d{2})\b', text)
                if folio_match:
                    folio = folio_match.group(1)
                    break

        # 2. Extraer Teléfono y Cliente
        for idx, (bbox, text, conf) in enumerate(sorted_dets):
            y_mid = (bbox[0][1] + bbox[2][1]) / 2.0
            
            # Header zone (between 15% and 40% height)
            if rh * 0.15 < y_mid < rh * 0.45:
                # Telefono
                clean_digits = re.sub(r'[^\d]', '', text)
                if len(clean_digits) == 10 and clean_digits.startswith("2"):
                    tel = clean_digits

                # Metodo de pago
                u_text = text.upper()
                if "EFECTIVO" in u_text and ("[" in u_text or "X" in u_text or conf > 0.4):
                    # Check near detections
                    pass
                if "CREDITO" in u_text or "DEBITO" in u_text:
                    if "CREDITO" in u_text:
                        metodo_pago = "TARJETA_CREDITO"
                    elif "DEBITO" in u_text:
                        metodo_pago = "TARJETA_DEBITO"

                # Cliente: if preceding label is "CLIENTE"
                if "CLIENTE" in text.upper():
                    if idx + 1 < len(sorted_dets):
                        next_text = sorted_dets[idx+1][1]
                        if not any(k in next_text.upper() for k in ["RFC", "TEL", "DIRECCION", "TARJETA"]):
                            cliente = next_text

        # Si aún no detectó método de pago, buscar si hay voucher o efectivo
        all_text_concat = " ".join([d[1].upper() for d in sorted_dets])
        if "CREDITO" in all_text_concat and "MERCADO PAGO" in all_text_concat:
            metodo_pago = "TARJETA_CREDITO"
        elif "DEBITO" in all_text_concat and metodo_pago == "NO_ESPECIFICADO":
            metodo_pago = "TARJETA_DEBITO"
        elif "EFECTIVO" in all_text_concat and metodo_pago == "NO_ESPECIFICADO":
            metodo_pago = "EFECTIVO"

        # 3. Detectar Números de Cierre Financiero (TOTAL, ANTICIPO, RESTA)
        # Buscar en el tercio inferior
        footer_dets = [d for d in sorted_dets if ((d[0][0][1] + d[0][2][1]) / 2.0) > rh * 0.65]
        amounts = []
        for bbox, text, conf in footer_dets:
            # Match currency
            curr_match = re.findall(r'\$?\s?(\d{2,4}(?:\.\d{2})?)', text.replace(',', ''))
            for amt in curr_match:
                val = float(amt)
                if 50 <= val <= 10000:
                    amounts.append(val)

        if amounts:
            # Mayor valor suele ser el total o anticipo
            total = max(amounts)
            if len(amounts) >= 2:
                anticipo = min(amounts)
                resta = max(round(total - anticipo, 2), 0.0)
            else:
                anticipo = total
                resta = 0.0

        # 4. Tabla de Partidas:
        # EasyOCR en manuscrito detecta fragmentos dispersos
        table_dets = [d for d in sorted_dets if rh * 0.35 <= ((d[0][0][1] + d[0][2][1]) / 2.0) <= rh * 0.70]
        
        # Agrupar por líneas horizontales aproximadas (dentro de 35px)
        lines = []
        for det in table_dets:
            y_cen = (det[0][0][1] + det[0][2][1]) / 2.0
            placed = False
            for line in lines:
                if abs(line["y"] - y_cen) < 30:
                    line["items"].append(det)
                    placed = True
                    break
            if not placed:
                lines.append({"y": y_cen, "items": [det]})

        for l_idx, line in enumerate(lines):
            line_text = " ".join([d[1] for d in sorted(line["items"], key=lambda x: x[0][0][0])])
            if len(line_text) < 4:
                continue
            if any(k in line_text.upper() for k in ["CONCEPTO", "IMPORTE", "P.UNIT", "CANT"]):
                continue

            # Extraer posible importe
            imp_match = re.search(r'\$?(\d{2,4})', line_text)
            imp_val = float(imp_match.group(1)) if imp_match else 0.0

            # Prenda
            prenda = ""
            for p in ['Filipina', 'Pantalon', 'Bata', 'Quirurgico', 'Conjunto', 'Cofia', 'Falda']:
                if re.search(rf'\b{p}\b', line_text, re.IGNORECASE):
                    prenda = p
                    break

            items.append({
                "row_idx": l_idx,
                "ped_apa_ent": "P",
                "cant": 1,
                "concepto": line_text,
                "prenda": prenda,
                "corte": "",
                "genero": "Dama" if "dama" in line_text.lower() else "",
                "talla": "",
                "talla_filipina": "",
                "talla_pantalon": "",
                "notas": "",
                "p_unit": imp_val,
                "importe": imp_val
            })

        # Cuadre
        sum_importes = sum(it["importe"] for it in items)
        if total == 0.0 and sum_importes > 0.0:
            total = sum_importes
            anticipo = total
            resta = 0.0

        return {
            "motor": "OCR_TRADICIONAL_EASYOCR",
            "folio": folio,
            "fecha_emision": fecha_emision,
            "metodo_pago": metodo_pago,
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
