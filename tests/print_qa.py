"""Verify the real Chromium print layout with a 20-word worksheet (needs pypdf)."""
import argparse
import json
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import subprocess
import tempfile
from threading import Thread

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
WORDS = [
    "sân trường", "sạch sẽ", "xanh xao", "xinh xắn", "quyển vở", "cặp sách",
    "sẻ chia", "chăm chỉ", "kể chuyện", "con kiến", "nghỉ ngơi", "ghé thăm",
    "cây bàng", "sẵn sàng", "trân trọng", "dịu dàng", "vườn rau", "viết bài",
    "tiếng hát", "Hà Nội",
]


class PrintSite(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/print-test":
            return super().do_GET()
        code = """
        go('teacher');
        const values = document.querySelector('.gate-q').textContent.match(/\\d+/g);
        document.querySelector('#gateInput').value = Number(values[0]) * Number(values[1]);
        document.querySelector('#gateOk').click();
        document.querySelector('#newWordSet').click();
        document.querySelector('#setTitle').value = 'Sổ tay chính tả';
        document.querySelector('#setWords').value = WORDS.join('\\n');
        document.querySelector('#setForm').requestSubmit();
        document.querySelector('[data-sheet]').click();
        """.replace("WORDS", json.dumps(WORDS, ensure_ascii=False))
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        data = html.replace("</body>", "<script>" + code + "</script></body>").encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *_):
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browser", default=os.environ.get("CHROME_PATH") or
                        r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(PrintSite, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with tempfile.TemporaryDirectory(prefix="vuon-chu-print-", ignore_cleanup_errors=True) as temp:
            folder = Path(temp)
            pdf = folder / "sheet.pdf"
            subprocess.run([
                args.browser, "--headless", "--disable-extensions", "--no-first-run",
                "--disable-background-networking", "--virtual-time-budget=2000",
                "--no-pdf-header-footer", f"--user-data-dir={folder / 'profile'}",
                f"--print-to-pdf={pdf}", f"http://127.0.0.1:{server.server_port}/print-test",
            ], check=True, capture_output=True, timeout=40)
            pages = PdfReader(pdf).pages
            assert len(pages) == 3, f"Expected 3 worksheet pages, got {len(pages)}"
            for i, page in enumerate(pages):
                # PDF glyph positioning can add spaces inside Vietnamese syllables.
                text = "".join(page.extract_text().split())
                assert "Theodõitiếnđộhọc" not in text and "Inphiếu" not in text
                assert f"Trang{i + 1}/3" in text, ascii(text)
                assert all(word.replace(" ", "") in text for word in WORDS[i * 8:(i + 1) * 8]), ascii(text)
                assert abs(float(page.mediabox.width) - 595) < 2
                assert abs(float(page.mediabox.height) - 842) < 2
            print("Verified three A4 pages, all 20 words, page numbers and worksheet-only output.")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
