# Nén khung phim PNG (assets/phim/*.png) thành webp 832x1248 cho web; ảnh gốc chuyển vào assets/phim/_goc/ (không đưa lên git).
import os, shutil
from PIL import Image

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'phim')
RAW = os.path.join(D, '_goc')
os.makedirs(RAW, exist_ok=True)
for f in os.listdir(D):
    if f.endswith('.png'):
        shutil.move(os.path.join(D, f), os.path.join(RAW, f))
total = 0
for f in sorted(os.listdir(RAW)):
    if not f.endswith('.png'):
        continue
    im = Image.open(os.path.join(RAW, f)).convert('RGB')
    k = min(1, 832 / im.width)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    out = os.path.join(D, f[:-4] + '.webp')
    im.save(out, 'WEBP', quality=80, method=4)
    total += os.path.getsize(out)
    print(f[:-4], im.size, os.path.getsize(out) // 1024, 'KB')
print('tổng', total // 1024, 'KB')
