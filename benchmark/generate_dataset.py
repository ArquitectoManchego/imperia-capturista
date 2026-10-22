import os
import json
import random
from PIL import Image, ImageDraw, ImageFont

TEMPLATE_PATH = 'C:/Users/Alex/.gemini/antigravity/brain/385a4601-3d4b-44eb-adc4-e296fb96a429/.user_uploaded/media_1792692601355_5e33ce00.png'
OUTPUT_DIR = 'C:/PROYECTOS ANTIGRAVITY/CAPTURISTA/benchmark/data'

# Fonts
FONT_INK = 'C:/Windows/Fonts/Inkfree.ttf'
FONT_HAND = 'C:/Windows/Fonts/LHANDW.TTF'
FONT_FALLBACK = 'C:/Windows/Fonts/arial.ttf'

def get_font(size, font_path=FONT_INK):
    try:
        return ImageFont.truetype(font_path, size)
    except:
        return ImageFont.truetype(FONT_FALLBACK, size)

DATASETS = [
    {
        "id": 1,
        "name": "nota_7903_clinica",
        "ink_color": (22, 59, 112, 235), # Blue ballpoint
        "folio": "7903",
        "date_d": "22",
        "date_m": "10",
        "date_y": "2026",
        "payment_method": "EFECTIVO",
        "cliente": "Dra. Claudia Mendoza Morales",
        "tel": "2291456789",
        "rfc": "MEMC850412",
        "direccion": "Av. Colon 1204, Reforma",
        "items": [
            {
                "row_idx": 0,
                "ped_apa_ent": "P",
                "cant": 2,
                "clave": "",
                "concepto": "Filipina Quirurgica Cuello V Dama Azul Marino T-34 c/bordado logo IMSS",
                "prenda": "Filipina",
                "corte": "Cuello V",
                "genero": "Dama",
                "talla": "34",
                "notas": "c/bordado logo IMSS",
                "p_unit": 350.0,
                "importe": 700.0
            },
            {
                "row_idx": 1,
                "ped_apa_ent": "P",
                "cant": 2,
                "clave": "",
                "concepto": "Pantalon Quirurgico Dama Azul Marino T-34",
                "prenda": "Pantalon",
                "corte": "Quirurgico",
                "genero": "Dama",
                "talla": "34",
                "notas": "",
                "p_unit": 280.0,
                "importe": 560.0
            },
            {
                "row_idx": 2,
                "ped_apa_ent": "B",
                "cant": 2,
                "clave": "",
                "concepto": "Bordado Nombre Dra. Claudia Mendoza",
                "prenda": "Bordado",
                "corte": "",
                "genero": "",
                "talla": "",
                "notas": "Dra. Claudia Mendoza",
                "p_unit": 50.0,
                "importe": 100.0
            }
        ],
        "fecha_entrega": "29/10/2026",
        "anticipo": 800.0,
        "resta": 560.0,
        "total": 1360.0
    },
    {
        "id": 2,
        "name": "nota_7904_recorrido_columna",
        "ink_color": (28, 28, 30, 240), # Black gel
        "folio": "7904",
        "date_d": "22",
        "date_m": "10",
        "date_y": "2026",
        "payment_method": "TRANSFERENCIA",
        "cliente": "Dr. Roberto Alcocer",
        "tel": "2299012345",
        "rfc": "AOSR800101",
        "direccion": "Hospital Beneficencia Espanola",
        "items": [
            {
                "row_idx": 0,
                "ped_apa_ent": "P",
                "cant": 3,
                "clave": "3", # Written in CLAVE column!
                "concepto": "Bata Medica Manga Larga Caballero Blanca T-40",
                "prenda": "Bata",
                "corte": "Manga Larga",
                "genero": "Caballero",
                "talla": "40",
                "notas": "",
                "p_unit": 420.0,
                "importe": 1260.0
            },
            {
                "row_idx": 1,
                "ped_apa_ent": "B",
                "cant": 3,
                "clave": "3", # Written in CLAVE column!
                "concepto": "Bordado escudo Hospital y nombre Dr. Alcocer",
                "prenda": "Bordado",
                "corte": "",
                "genero": "",
                "talla": "",
                "notas": "escudo Hospital y nombre Dr. Alcocer",
                "p_unit": 60.0,
                "importe": 180.0
            }
        ],
        "fecha_entrega": "30/10/2026",
        "anticipo": 1000.0,
        "resta": 440.0,
        "total": 1440.0
    },
    {
        "id": 3,
        "name": "nota_7905_talla_diferenciada",
        "ink_color": (15, 38, 75, 230), # Deep blue ink
        "folio": "7905",
        "date_d": "23",
        "date_m": "10",
        "date_y": "2026",
        "payment_method": "TARJETA_DEBITO",
        "cliente": "Lic. Sofia Valenzuela",
        "tel": "2293334455",
        "rfc": "VASS920718",
        "direccion": "Privada Jacarandas 12 Boca del Rio",
        "items": [
            {
                "row_idx": 0,
                "ped_apa_ent": "P",
                "cant": 1,
                "clave": "",
                "concepto": "Conjunto Quirurgico Dama F-M P-G Verde Quirurgico",
                "prenda": "Quirurgico",
                "corte": "Conjunto",
                "genero": "Dama",
                "talla_filipina": "M",
                "talla_pantalon": "G",
                "notas": "Verde Quirurgico",
                "p_unit": 650.0, # blank in handwritten note, infered from importe
                "importe": 650.0,
                "handwritten_punit_blank": True
            },
            {
                "row_idx": 1,
                "ped_apa_ent": "A",
                "cant": 1,
                "clave": "",
                "concepto": "Filipina Medica Estampada Pediatria T-M",
                "prenda": "Filipina",
                "corte": "Estampada Pediatria",
                "genero": "Dama",
                "talla": "M",
                "notas": "",
                "p_unit": 380.0,
                "importe": 380.0,
                "handwritten_punit_blank": False
            }
        ],
        "fecha_entrega": "26/10/2026",
        "anticipo": 500.0,
        "resta": 530.0,
        "total": 1030.0
    },
    {
        "id": 4,
        "name": "nota_7906_prenda_cliente",
        "ink_color": (25, 25, 25, 240), # Dark ink
        "folio": "7906",
        "date_d": "23",
        "date_m": "10",
        "date_y": "2026",
        "payment_method": "EFECTIVO",
        "cliente": "Clinica Dental Sonrisas (Dra. Arantza)",
        "tel": "2297788990",
        "rfc": "",
        "direccion": "Paseo Jardin 45",
        "items": [
            {
                "row_idx": 0,
                "ped_apa_ent": "B",
                "cant": 4,
                "clave": "",
                "concepto": "Prenda de cliente - dejo 4 filipinas bordar logo pecho izq",
                "prenda": "Bordado",
                "corte": "",
                "genero": "",
                "talla": "",
                "notas": "Prenda de cliente - dejo 4 filipinas bordar logo pecho izq",
                "p_unit": 65.0,
                "importe": 260.0
            }
        ],
        "fecha_entrega": "25/10/2026 5:00 pm",
        "anticipo": 260.0,
        "resta": 0.0,
        "total": 260.0
    },
    {
        "id": 5,
        "name": "nota_7907_institucional_completa",
        "ink_color": (18, 50, 95, 235), # Navy ballpoint
        "folio": "7907",
        "date_d": "24",
        "date_m": "10",
        "date_y": "2026",
        "payment_method": "TRANSFERENCIA",
        "cliente": "Instituto Cardiovascular Veracruzano",
        "tel": "2299887766",
        "rfc": "ICV150320AB1",
        "direccion": "Zaragoza 890, Centro",
        "items": [
            {
                "row_idx": 0,
                "ped_apa_ent": "P",
                "cant": 5,
                "clave": "",
                "concepto": "Filipina Quirurgica Unisex Cuello V Azul Real T-L",
                "prenda": "Filipina",
                "corte": "Cuello V",
                "genero": "Unisex",
                "talla": "L",
                "notas": "Azul Real",
                "p_unit": 320.0,
                "importe": 1600.0
            },
            {
                "row_idx": 1,
                "ped_apa_ent": "P",
                "cant": 5,
                "clave": "",
                "concepto": "Pantalon Quirurgico Unisex Azul Real T-L",
                "prenda": "Pantalon",
                "corte": "Quirurgico",
                "genero": "Unisex",
                "talla": "L",
                "notas": "Azul Real",
                "p_unit": 260.0,
                "importe": 1300.0
            },
            {
                "row_idx": 2,
                "ped_apa_ent": "P",
                "cant": 3,
                "clave": "",
                "concepto": "Bata Laboratorio Unisex Blanca T-G",
                "prenda": "Bata",
                "corte": "Laboratorio",
                "genero": "Unisex",
                "talla": "G",
                "notas": "Blanca",
                "p_unit": 390.0,
                "importe": 1170.0
            },
            {
                "row_idx": 3,
                "ped_apa_ent": "B",
                "cant": 13,
                "clave": "",
                "concepto": "Ponchado y bordado logo institucional",
                "prenda": "Bordado",
                "corte": "Ponchado",
                "genero": "",
                "talla": "",
                "notas": "Ponchado y bordado logo institucional",
                "p_unit": 45.0,
                "importe": 585.0
            }
        ],
        "fecha_entrega": "04/11/2026",
        "anticipo": 2500.0,
        "resta": 2155.0,
        "total": 4655.0
    }
]

def render_note(data):
    base = Image.open(TEMPLATE_PATH).convert('RGBA')
    overlay = Image.new('RGBA', base.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    
    ink = data["ink_color"]
    red_ink = (210, 25, 25, 245)
    font_med = get_font(18)
    font_sm = get_font(15)
    font_lg = get_font(26)

    # 1. Folio in red ink (x: 830-925, y: 70-105)
    draw.rectangle([830, 68, 930, 104], fill=(255, 255, 255, 255))
    draw.text((838, 68), data["folio"], font=font_lg, fill=red_ink)

    # 2. Date in 3 boxes (y: 106 to 138)
    # Día: 710-808 (center ~ 745)
    # Mes: 808-906 (center ~ 845)
    # Año: 906-1005 (center ~ 935)
    draw.text((740, 110), data["date_d"], font=font_med, fill=ink)
    draw.text((840, 110), data["date_m"], font=font_med, fill=ink)
    draw.text((930, 110), data["date_y"], font=font_med, fill=ink)

    # 3. Payment Method Checkmarks (y ~ 152)
    pm = data["payment_method"]
    if pm == "TRANSFERENCIA":
        draw.text((395, 149), "X", font=font_med, fill=ink)
    elif pm == "EFECTIVO":
        draw.text((591, 149), "X", font=font_med, fill=ink)
    elif pm == "TARJETA_DEBITO":
        draw.text((910, 149), "X", font=font_med, fill=ink)
    elif pm == "TARJETA_CREDITO":
        draw.text((990, 149), "X", font=font_med, fill=ink)

    # 4. Customer Info
    # CLIENTE: line x: 88 to 490, y: 195
    # TEL: line x: 550 to 835, y: 195
    # RFC: line x: 55 to 250, y: 227
    # DIRECCION: line x: 340 to 835, y: 227
    draw.text((90, 182), data["cliente"], font=font_med, fill=ink)
    draw.text((555, 182), data["tel"], font=font_med, fill=ink)
    if data["rfc"]:
        draw.text((55, 214), data["rfc"], font=font_med, fill=ink)
    draw.text((345, 214), data["direccion"], font=font_med, fill=ink)

    # 5. Table rows
    # Row centers: 275, 307, 339, 371, 403, 435, 467, 499, 531
    row_y_starts = [272, 304, 336, 368, 400, 432, 464, 496, 528]

    for item in data["items"]:
        idx = item["row_idx"]
        y = row_y_starts[idx]
        
        # Col 0: PED/APA/ENT (x: 10-28)
        draw.text((12, y), item["ped_apa_ent"], font=font_med, fill=ink)

        # Col 1: CANT (x: 36-60)
        # Col 2: CLAVE (x: 70-115)
        if item.get("clave"):
            # Recorrido de columna case: number written in CLAVE column!
            draw.text((80, y), str(item["clave"]), font=font_med, fill=ink)
        else:
            draw.text((42, y), str(item["cant"]), font=font_med, fill=ink)

        # Col 3: CONCEPTO (x: 125-565)
        draw.text((125, y+2), item["concepto"], font=font_sm, fill=ink)

        # Col 5: P.UNIT (x: 730-845)
        if not item.get("handwritten_punit_blank", False):
            draw.text((750, y), f"{item['p_unit']:.2f}", font=font_sm, fill=ink)

        # Col 6: IMPORTE (x: 875-995)
        draw.text((890, y), f"{item['importe']:.2f}", font=font_sm, fill=ink)

    # 6. Footer (Y ~ 562)
    # ENTREGA: x: 115-245
    # ANTICIPO: x: 360-480
    # RESTA: x: 580-720
    # TOTAL: x: 875-995
    y_footer = 562
    draw.text((115, y_footer), data["fecha_entrega"], font=font_sm, fill=ink)
    draw.text((360, y_footer), f"${data['anticipo']:.2f}", font=font_med, fill=ink)
    draw.text((580, y_footer), f"${data['resta']:.2f}", font=font_med, fill=ink)
    draw.text((875, y_footer), f"${data['total']:.2f}", font=font_med, fill=ink)

    # Composite
    final_img = Image.alpha_composite(base, overlay).convert('RGB')
    
    # Save Image and Ground Truth
    img_filename = f"{data['name']}.png"
    img_path = os.path.join(OUTPUT_DIR, img_filename)
    final_img.save(img_path, quality=95)

    gt_filename = f"{data['name']}_gt.json"
    gt_path = os.path.join(OUTPUT_DIR, gt_filename)
    with open(gt_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Generated {img_filename} and {gt_filename}")

if __name__ == '__main__':
    for d in DATASETS:
        render_note(d)
    print("Dataset generation complete!")
