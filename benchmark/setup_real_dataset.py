import os
import shutil
import json
from PIL import Image

SRC_DIR = r"C:\Users\Alex\Downloads\Photos-1-001 (1)"
DEST_BENCHMARK = r"C:\PROYECTOS ANTIGRAVITY\CAPTURISTA\benchmark\data_real"
DEST_PUBLIC = r"C:\PROYECTOS ANTIGRAVITY\CAPTURISTA\public\samples\real"

os.makedirs(DEST_BENCHMARK, exist_ok=True)
os.makedirs(DEST_PUBLIC, exist_ok=True)

test_cases = [
    {
        "id": "real_foto_7951",
        "file": "20260903_173856.jpg",
        "name": "Foto Real 1: Folio 7951 (Sobre Medida XL + Voucher Mercado Pago)",
        "folio": "7951",
        "date_d": "01",
        "date_m": "09",
        "date_y": "2026",
        "payment_method": "TARJETA_CREDITO",
        "cliente": "Monserrat Gómez Nava",
        "tel": "2292306838",
        "rfc": "",
        "direccion": "",
        "items": [
            {
                "ped_apa_ent": "P",
                "cant": 1,
                "concepto": "Conjunto Qx. Blanco dama CEPAV sobre medida ~ XL",
                "prenda": "Conjunto Quirúrgico",
                "corte": "CEPAV sobre medida",
                "genero": "Dama",
                "talla": "XL",
                "talla_filipina": "",
                "talla_pantalon": "",
                "notas": "CEPAV sobre medida ~ XL, Pagado",
                "p_unit": 865.0,
                "importe": 865.0
            }
        ],
        "fecha_entrega": "22/09/2026",
        "anticipo": 865.0,
        "resta": 0.0,
        "total": 865.0
    },
    {
        "id": "real_foto_7953",
        "file": "20260903_173915.jpg",
        "name": "Foto Real 2: Folio 7953 (Pantalón Mixto Marino Tiro Alto 36)",
        "folio": "7953",
        "date_d": "02",
        "date_m": "09",
        "date_y": "2026",
        "payment_method": "TARJETA_CREDITO",
        "cliente": "Sara Molina Prieto",
        "tel": "2294477760",
        "rfc": "",
        "direccion": "",
        "items": [
            {
                "ped_apa_ent": "P",
                "cant": 1,
                "concepto": "Pantalón mixto marino, tiro alto sobre medida ~ 36",
                "prenda": "Pantalón",
                "corte": "Tiro alto sobre medida",
                "genero": "Dama",
                "talla": "36",
                "talla_filipina": "",
                "talla_pantalon": "",
                "notas": "Marino, tiro alto sobre medida ~ 36",
                "p_unit": 425.0,
                "importe": 425.0
            }
        ],
        "fecha_entrega": "23/09/2026",
        "anticipo": 225.0,
        "resta": 200.0,
        "total": 425.0
    },
    {
        "id": "real_foto_7954",
        "file": "20260903_173925.jpg",
        "name": "Foto Real 3: Folio 7954 (Falda CVC T-14 + Tarjeta Débito)",
        "folio": "7954",
        "date_d": "02",
        "date_m": "09",
        "date_y": "2026",
        "payment_method": "TARJETA_DEBITO",
        "cliente": "Enid Quino",
        "tel": "2291091573",
        "rfc": "",
        "direccion": "",
        "items": [
            {
                "ped_apa_ent": "P",
                "cant": 1,
                "concepto": "Falda CVC T-14",
                "prenda": "Falda",
                "corte": "CVC",
                "genero": "Dama",
                "talla": "14",
                "talla_filipina": "",
                "talla_pantalon": "",
                "notas": "Pagado",
                "p_unit": 385.0,
                "importe": 385.0
            }
        ],
        "fecha_entrega": "23/09/2026",
        "anticipo": 385.0,
        "resta": 0.0,
        "total": 385.0
    },
    {
        "id": "real_foto_7901",
        "file": "20260903_173946.jpg",
        "name": "Foto Real 4: Folio 7901 (Multi-Partida 3 items + Tallas F/P + Cofia E)",
        "folio": "7901",
        "date_d": "06",
        "date_m": "07",
        "date_y": "2026",
        "payment_method": "EFECTIVO",
        "cliente": "Frida Farías Cabrera",
        "tel": "2295309979",
        "rfc": "",
        "direccion": "",
        "items": [
            {
                "ped_apa_ent": "P",
                "cant": 1,
                "concepto": "Conjunto Clínico CV Enfra dama F: ~36 P: ~36",
                "prenda": "Conjunto Clínico",
                "corte": "Cuello V",
                "genero": "Dama",
                "talla": "",
                "talla_filipina": "36",
                "talla_pantalon": "36",
                "notas": "Enfra dama",
                "p_unit": 775.0,
                "importe": 775.0
            },
            {
                "ped_apa_ent": "P",
                "cant": 1,
                "concepto": "Conjunto Qx. CV Enfra dama F: ~M P: ~M",
                "prenda": "Conjunto Quirúrgico",
                "corte": "Cuello V",
                "genero": "Dama",
                "talla": "",
                "talla_filipina": "M",
                "talla_pantalon": "M",
                "notas": "Enfra dama",
                "p_unit": 645.0,
                "importe": 645.0
            },
            {
                "ped_apa_ent": "E",
                "cant": 1,
                "concepto": "Cofia lisa M",
                "prenda": "Cofia",
                "corte": "Lisa",
                "genero": "Unisex",
                "talla": "M",
                "talla_filipina": "",
                "talla_pantalon": "",
                "notas": "Entregado",
                "p_unit": 180.0,
                "importe": 180.0
            }
        ],
        "fecha_entrega": "20/07/2026",
        "anticipo": 1600.0,
        "resta": 0.0,
        "total": 1600.0
    },
    {
        "id": "real_foto_7902",
        "file": "20260903_173951.jpg",
        "name": "Foto Real 5: Folio 7902 (2 items + Anticipo $600 Resta $355 Total $955)",
        "folio": "7902",
        "date_d": "07",
        "date_m": "07",
        "date_y": "2026",
        "payment_method": "EFECTIVO",
        "cliente": "Ana Cristina Ortega",
        "tel": "2295507808",
        "rfc": "",
        "direccion": "",
        "items": [
            {
                "ped_apa_ent": "P",
                "cant": 1,
                "concepto": "Conjunto Clínico CV Enfra dama F: ~34 P: ~34",
                "prenda": "Conjunto Clínico",
                "corte": "Cuello V",
                "genero": "Dama",
                "talla": "",
                "talla_filipina": "34",
                "talla_pantalon": "34",
                "notas": "Enfra dama",
                "p_unit": 775.0,
                "importe": 775.0
            },
            {
                "ped_apa_ent": "E",
                "cant": 1,
                "concepto": "Cofia lisa M",
                "prenda": "Cofia",
                "corte": "Lisa",
                "genero": "Unisex",
                "talla": "M",
                "talla_filipina": "",
                "talla_pantalon": "",
                "notas": "Entregado",
                "p_unit": 180.0,
                "importe": 180.0
            }
        ],
        "fecha_entrega": "15/07/2026",
        "anticipo": 600.0,
        "resta": 355.0,
        "total": 955.0
    }
]

print("Copiando y optimizando 5 casos reales...")
for idx, case in enumerate(test_cases):
    src_file = os.path.join(SRC_DIR, case["file"])
    dest_img_bench = os.path.join(DEST_BENCHMARK, f"caso_real_{idx+1}.jpg")
    dest_gt_bench = os.path.join(DEST_BENCHMARK, f"caso_real_{idx+1}_gt.json")
    
    dest_img_pub = os.path.join(DEST_PUBLIC, f"caso_real_{idx+1}.jpg")
    
    # 1. Copia original al benchmark
    shutil.copyfile(src_file, dest_img_bench)
    
    # 2. Guarda GT
    with open(dest_gt_bench, "w", encoding="utf-8") as f:
        json.dump(case, f, indent=2, ensure_ascii=False)
        
    # 3. Optimiza imagen para web (1600px max, web-ready)
    im = Image.open(src_file)
    im.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
    im.save(dest_img_pub, quality=85, optimize=True)
    
    print(f"[{idx+1}/5] Configurado {case['id']} -> {dest_img_bench}")

print("Dataset real listo con Ground Truth verificado.")
