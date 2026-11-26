# Nén ảnh quà tặng PNG gốc (assets/qua-tang/*.png) thành webp nhẹ cho web: python tests/nen_anh_qua.py
# - Ảnh cùng nhóm (hai tư thế của một nhân vật) cắt chung một khung để ghép chuyển động không bị lệch.
# - Ảnh gốc PNG được chuyển sang assets/qua-tang/_goc/ (không đưa lên git).
import os, shutil
from PIL import Image

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'qua-tang')
RAW = os.path.join(D, '_goc')
BACKGROUNDS = {'bien-hoang-hon', 'troi-cau-vong', 'thanh-pho-dem'}
GROUPS = [['su-tu-dung', 'su-tu-gam'], ['ruong-dong', 'ruong-mo']]
SIZE = {'su-tu-dung': 900, 'su-tu-gam': 900, 'phuong-hoang': 900, 'ki-lan': 900, 'ruong-dong': 760, 'ruong-mo': 760,
        'vuong-mien': 460, 'cup-vang': 640, 'ten-lua': 520, 'ca-heo': 640, 'cau-thu-nhi': 560, 'ngoi-sao-vang': 400, 'dong-vang': 128}

os.makedirs(RAW, exist_ok=True)
for f in os.listdir(D):
    if f.endswith('.png'):
        shutil.move(os.path.join(D, f), os.path.join(RAW, f))
names = sorted(f[:-4] for f in os.listdir(RAW) if f.endswith('.png'))

def load(n):
    return Image.open(os.path.join(RAW, n + '.png')).convert('RGBA')

def bbox(im):
    return im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()

boxes = {}
for group in GROUPS:
    have = [n for n in group if n in names]
    if len(have) == 2:
        a, b = (load(n) for n in have)
        if a.size != b.size:
            b = b.resize(a.size, Image.LANCZOS)
        x, y = bbox(a), bbox(b)
        union = (min(x[0], y[0]), min(x[1], y[1]), max(x[2], y[2]), max(x[3], y[3]))
        for n in have:
            boxes[n] = (union, a.size)

for n in names:
    if n in BACKGROUNDS:
        im = Image.open(os.path.join(RAW, n + '.png')).convert('RGB')
        k = min(1, 1600 / im.width)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        im.save(os.path.join(D, n + '.webp'), 'WEBP', quality=80, method=6)
    else:
        im = load(n)
        if n in boxes:
            box, size = boxes[n]
            if im.size != size:
                im = im.resize(size, Image.LANCZOS)
        else:
            box = bbox(im)
        im = im.crop(box)
        k = min(1, SIZE.get(n, 700) / max(im.size))
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        im.save(os.path.join(D, n + '.webp'), 'WEBP', quality=86, method=6)
    print(n, im.size, os.path.getsize(os.path.join(D, n + '.webp')) // 1024, 'KB', 'NỀN ĐẶC!' if n not in BACKGROUNDS and im.getchannel('A').getextrema()[0] == 255 else '')
