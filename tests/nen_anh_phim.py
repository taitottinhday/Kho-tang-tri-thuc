# Nén khung phim PNG thành webp cho web: assets/phim (dọc, rộng 832) và assets/phim/goi (ngang, rộng 1440).
# Ảnh gốc chuyển vào thư mục _goc/ tương ứng (không đưa lên git).
import os, shutil
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'phim')
for D, width in ((ROOT, 832), (os.path.join(ROOT, 'goi'), 1440)):
    if not os.path.isdir(D):
        continue
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
        k = min(1, width / im.width)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        out = os.path.join(D, f[:-4] + '.webp')
        im.save(out, 'WEBP', quality=80, method=4)
        total += os.path.getsize(out)
        print(f[:-4], im.size, os.path.getsize(out) // 1024, 'KB')
    print(D.split('assets')[-1], 'tổng', total // 1024, 'KB')
