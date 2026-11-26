"""Run the browser suite at desktop and mobile sizes via Chromium DevTools."""
import argparse
import os
from pathlib import Path
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browser", default=os.environ.get("CHROME_PATH"))
    parser.add_argument("--out", type=Path, help="Save screenshots and reports in this folder.")
    args = parser.parse_args()
    env = os.environ.copy()
    if args.browser:
        env["CHROME_PATH"] = args.browser
    with tempfile.TemporaryDirectory(prefix="vuon-chu-results-") as directory:
        out = (args.out or Path(directory)).resolve()
        results = []
        for width, height in [(1366, 900), (390, 844)]:
            command = ["node", "tests/run_browser_qa.js", str(width), str(height), str(out)]
            results.append(subprocess.run(command, cwd=ROOT, env=env, timeout=85).returncode)
    return int(any(results))


if __name__ == "__main__":
    raise SystemExit(main())
