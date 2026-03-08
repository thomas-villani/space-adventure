"""Launch Space Adventure in your browser."""

import http.server
import webbrowser
import threading
import sys

HOST = "127.0.0.1"
PORT = 8000


def main():
    handler = http.server.SimpleHTTPRequestHandler
    handler.extensions_map.update({".js": "text/javascript"})

    server = http.server.HTTPServer((HOST, PORT), handler)
    url = f"http://{HOST}:{PORT}"

    print(f"Space Adventure running at {url}")
    print("Press Ctrl+C to stop")

    threading.Timer(0.5, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()
        sys.exit(0)


if __name__ == "__main__":
    main()
