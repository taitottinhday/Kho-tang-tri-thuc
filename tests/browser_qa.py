"""Run the local spelling app in an isolated Chrome profile (standard library only)."""
import argparse
import html
import json
import os
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
import subprocess
import tempfile
from threading import Thread

ROOT = Path(__file__).resolve().parents[1]
RUNNER = (ROOT / "tests" / "browser_qa.js").read_text(encoding="utf-8")


class TestServer(ThreadingHTTPServer):
    # Both viewports load their scripts and styles in parallel.
    request_queue_size = 64


class TestSite(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?")[0] != "/qa":
            return super().do_GET()
        page = ('<!doctype html><meta charset=utf-8><title>Local browser test</title>'
                '<style>*{box-sizing:border-box}body{margin:0}iframe{display:block;border:0}</style>'
                '<pre id="report" hidden></pre><iframe title="Vườn Chữ"></iframe><script>'
                + RUNNER + '</script>').encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(page)))
        self.end_headers()
        self.wfile.write(page)

    def log_message(self, fmt, *args):
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browser", default=os.environ.get("CHROME_PATH") or
                        r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    parser.add_argument("--out", type=Path, help="Save screenshots and reports in this folder.")
    args = parser.parse_args()
    server = TestServer(("127.0.0.1", 0), partial(TestSite, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()

    def check(width, height, artifacts):
        with tempfile.TemporaryDirectory(prefix="vuon-chu-browser-", ignore_cleanup_errors=True) as profile:
            target = f"http://127.0.0.1:{server.server_port}/qa?w={width}&h={height}"
            shot = artifacts / f"home-{width}.png"
            command = [args.browser, "--headless", "--no-first-run", "--disable-extensions",
                       "--disable-background-networking", "--disable-sync",
                       f"--user-data-dir={profile}", f"--window-size={width},{height}",
                       "--hide-scrollbars", "--virtual-time-budget=75000",
                       f"--screenshot={shot}", "--dump-dom", target]
            proc = subprocess.run(command, capture_output=True, timeout=75)
            dom = proc.stdout.decode("utf-8", "replace")
            report = re.search(r'<pre id="report" hidden="">([^<]+)</pre>', dom)
            if not report:
                raise RuntimeError(f"Chrome did not return a test report ({proc.returncode}). "
                                   + proc.stderr.decode("utf-8", "replace")[-500:])
            result = json.loads(html.unescape(report[1]))
            (artifacts / f"result-{width}.json").write_text(
                json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"{width}x{height}: {len(result['passed'])} passed; failures: "
                  + json.dumps(result['failed'], ensure_ascii=True), flush=True)
            return bool(result["complete"] and not result["failed"])

    try:
        with tempfile.TemporaryDirectory(prefix="vuon-chu-results-") as temp:
            out = (args.out or Path(temp)).resolve()
            out.mkdir(parents=True, exist_ok=True)
            with ThreadPoolExecutor(max_workers=2) as workers:
                results = list(workers.map(lambda size: check(*size, out),
                                           [(1366, 900), (390, 844)]))
            return 0 if all(results) else 1
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    raise SystemExit(main())
