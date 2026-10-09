#!/usr/bin/env python3
"""
Winsome modify worker — a tiny STATELESS generation service so the hosted
(Netlify) team gallery can run Modify-with-AI. It does the one thing Netlify
can't: gpt-image-1 EDIT + rembg cutout. No library, no disk — image in, image
out. The gallery browser calls this directly (long request is fine), then hands
the result to a Netlify function to store.

POST /modify  {image: dataURL|base64 (source), prompt, style, ref?: dataURL}
           ->  {ok, image: dataURL (transparent PNG), cropped}
GET  /        health check

Env: OPENAI_API_KEY (required), WORKER_TOKEN (shared secret), PORT (default 8080).
"""
import os, io, json, base64
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import make  # reuses gen_gptimage_edit + cutout_checked; reads OPENAI_API_KEY from env

TOKEN = os.environ.get("WORKER_TOKEN", "")
STYLE_NAME = {"watercolor": "Watercolor", "heritage-sketch": "Heritage Sketch",
              "modern-graphic": "Modern Graphic"}


def _b64(s):
    return base64.b64decode(s.split(",")[-1])


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type,authorization")
        self.send_header("Access-Control-Allow-Methods", "POST,GET,OPTIONS")

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code); self._cors()
        self.send_header("content-type", "application/json"); self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()

    def do_GET(self):
        self._json(200, {"ok": True, "service": "winsome-modify-worker"})

    def do_POST(self):
        if self.path == "/scene":
            return self._scene()
        if self.path != "/modify":
            return self._json(404, {"ok": False, "error": "not found"})
        if TOKEN and self.headers.get("Authorization") != f"Bearer {TOKEN}":
            return self._json(401, {"ok": False, "error": "unauthorized"})
        try:
            n = int(self.headers.get("Content-Length", "0"))
            data = json.loads(self.rfile.read(n) or b"{}")
            base_png = _b64(data["image"])
            prompt = (data.get("prompt") or "").strip()
            style = data.get("style", "watercolor")
            sname = STYLE_NAME.get(style, "Watercolor")
            refs = [_b64(data["ref"])] if data.get("ref") else None
            if refs:
                full = (f"Restyle the FIRST image to match the visual style, palette and treatment "
                        f"of the SECOND (reference) image, keeping the same subject. {prompt}. "
                        f"Keep the subject fully in frame, centered with generous margin, on a plain "
                        f"white background, no shadow, no text.")
            else:
                full = (f"Modify this {sname} illustration as follows: {prompt}. Keep the same {sname} "
                        f"art style, the subject fully in frame, centered with generous margin, on a "
                        f"plain white background, no shadow, no text.")
            _raw, norm, cropped = make.edit_with_retry(base_png, full, refs=refs)
            buf = io.BytesIO(); norm.save(buf, "PNG")
            self._json(200, {"ok": True, "cropped": cropped,
                             "image": "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()})
        except Exception as e:
            self._json(200, {"ok": False, "error": str(e)[:200]})


    def _scene(self):
        """Ad-creative scene: illustration in -> full styled product photograph
        out (NO cutout). Sizes: 1024x1024 | 1024x1536 | 1536x1024."""
        if TOKEN and self.headers.get("Authorization") != f"Bearer {TOKEN}":
            return self._json(401, {"ok": False, "error": "unauthorized"})
        try:
            n = int(self.headers.get("Content-Length", "0"))
            data = json.loads(self.rfile.read(n) or b"{}")
            base_png = _b64(data["image"])
            prompt = (data.get("prompt") or "").strip()
            size = data.get("size", "1024x1024")
            if size not in ("1024x1024", "1024x1536", "1536x1024"):
                size = "1024x1024"
            out = make.gen_gptimage_edit(base_png, prompt, size=size, quality="high")
            self._json(200, {"ok": True,
                             "image": "data:image/png;base64," + base64.b64encode(out).decode()})
        except Exception as e:
            self._json(200, {"ok": False, "error": str(e)[:200]})

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    print(f"winsome-modify-worker on :{port}")
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
