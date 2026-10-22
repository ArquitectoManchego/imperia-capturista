import cv2
import numpy as np
from PIL import Image

# Read image
img_path = 'C:/Users/Alex/.gemini/antigravity/brain/385a4601-3d4b-44eb-adc4-e296fb96a429/.user_uploaded/media_1792692601355_5e33ce00.png'
img = cv2.imread(img_path)
h, w, _ = img.shape
print(f"Image shape: {w}x{h}")

# Let's inspect regions:
# Top right Folio: x: 800-950, y: 100-140
# Date boxes: x: 710-985, y: 150-200
# Payment methods: y: 220-250
# Cliente, Tel: y: 270-310
# RFC, Direccion: y: 315-350
# Table header: y: 355-395
# Table rows: y: 395-555
# Footer: y: 555-595
