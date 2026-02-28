#!/usr/bin/env python3
"""Local development server for School Quest Tracker.

Serves files from the repo root and falls back to index.html for unknown routes,
which prevents "Page not found" when opening direct paths.
"""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST = "0.0.0.0"
PORT = 8000
ROOT = Path(__file__).resolve().parent


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path in {"/", ""}:
            self.path = "/index.html"
            return super().do_GET()

        original_path = self.path
        super().do_GET()

        # If not found and no file extension was requested, serve index.html.
        if self.path.endswith(".html") or "." in Path(original_path).name:
            return

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            self.path = "/index.html"
            return super().do_GET()
        return super().send_error(code, message, explain)


if __name__ == "__main__":
    httpd = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"Serving School Quest Tracker at http://localhost:{PORT}")
    print("Press Ctrl+C to stop")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
