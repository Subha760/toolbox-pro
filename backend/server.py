"""Toolinger portrait service. Run behind a TLS reverse proxy with gunicorn.

Raw image uploads only; no visitor keys, remote image URLs, or photo persistence.
"""
import io
import json
import os
import threading
import time
from collections import deque
from http import HTTPStatus

from PIL import Image, ImageOps, UnidentifiedImageError

MAX_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 16_000_000
Image.MAX_IMAGE_PIXELS = MAX_PIXELS
MODEL = "birefnet-portrait"


class PhotoError(Exception):
    def __init__(self, code, message):
        self.code, self.message = code, message


def decode_photo(data):
    try:
        with Image.open(io.BytesIO(data)) as original:
            if original.format not in {"JPEG", "PNG", "WEBP"}:
                raise PhotoError(415, "Use JPG, PNG or WebP.")
            if original.width * original.height > MAX_PIXELS:
                raise PhotoError(413, "Maximum size is 16 megapixels.")
            if getattr(original, "n_frames", 1) != 1:
                raise PhotoError(415, "Use a still photo.")
            original.load()
            photo = ImageOps.exif_transpose(original).convert("RGB")
            photo.info.clear()
            return photo
    except (Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise PhotoError(413, "Maximum size is 16 megapixels.") from None
    except (UnidentifiedImageError, OSError, ValueError):
        raise PhotoError(400, "Unreadable image.") from None


class PortraitEngine:
    def __init__(self):
        self.session = None

    def warmup(self):
        from rembg import new_session
        # Explicit model avoids third-party cloud backends or gated defaults.
        self.session = new_session(MODEL, providers=["CPUExecutionProvider"])

    def __call__(self, photo):
        from rembg import remove
        if self.session is None:
            self.warmup()
        result = remove(photo, session=self.session, post_process_mask=False)
        result = result.convert("RGBA")
        alpha = result.getchannel("A")
        low, high = alpha.getextrema()
        if high < 8 or low > 247:
            raise PhotoError(422, "No usable foreground mask. Try another portrait.")
        result.info.clear()
        buffer = io.BytesIO()
        result.save(buffer, format="PNG")
        return buffer.getvalue()


class PhotoService:
    def __init__(self, engine=None, origins=None, limit=20):
        self.engine = engine if engine is not None else PortraitEngine()
        self.origins = set(origins or os.getenv("ALLOWED_ORIGINS", "https://subha760.github.io").split(","))
        self.slot = threading.Lock()
        self.rate_lock = threading.Lock()
        self.requests = deque()
        self.limit = limit

    def __call__(self, env, start_response):
        origin = env.get("HTTP_ORIGIN", "")
        headers = [("Cache-Control", "no-store"), ("X-Content-Type-Options", "nosniff"), ("Vary", "Origin")]
        if origin in self.origins:
            headers += [("Access-Control-Allow-Origin", origin), ("Access-Control-Allow-Methods", "POST, GET, OPTIONS"), ("Access-Control-Allow-Headers", "Content-Type")]

        def respond(code, data, mime="application/json"):
            body = data if isinstance(data, bytes) else json.dumps(data).encode()
            extra = [("Retry-After", "60")] if code in {429, 503} else []
            start_response(f"{code} {HTTPStatus(code).phrase}", headers + extra + [("Content-Type", mime), ("Content-Length", str(len(body)))])
            return [body]

        method, path = env.get("REQUEST_METHOD"), env.get("PATH_INFO")
        if method == "GET" and path == "/health":
            return respond(200, {"status": "ok", "model": MODEL, "ready": getattr(self.engine, "session", None) is not None})
        if path != "/v1/remove-background":
            return respond(404, {"error": "Not found"})
        if origin not in self.origins:
            return respond(403, {"error": "Origin not allowed"})
        if method == "OPTIONS":
            return respond(204, b"")
        if method != "POST":
            return respond(405, {"error": "POST required"})
        if env.get("CONTENT_TYPE", "").split(";")[0] not in {"image/png", "image/jpeg", "image/webp"}:
            return respond(415, {"error": "Upload JPG, PNG or WebP bytes"})
        try:
            size = int(env.get("CONTENT_LENGTH", ""))
        except (ValueError, TypeError):
            return respond(411, {"error": "Content length required"})
        if size <= 0 or size > MAX_BYTES:
            return respond(413, {"error": "Maximum file size is 10 MB"})
        with self.rate_lock:
            now = time.monotonic()
            while self.requests and now - self.requests[0] >= 60:
                self.requests.popleft()
            if len(self.requests) >= self.limit:
                return respond(429, {"error": "Please try again later"})
            self.requests.append(now)
        if not self.slot.acquire(blocking=False):
            return respond(503, {"error": "Processing another image"})
        try:
            data = env["wsgi.input"].read(size)
            if len(data) != size:
                raise PhotoError(400, "Incomplete image upload")
            photo = decode_photo(data)
            try:
                png = self.engine(photo)
            finally:
                photo.close()
            return respond(200, png, "image/png")
        except PhotoError as error:
            return respond(error.code, {"error": error.message})
        except Exception:
            # Never echo model paths, tracebacks, request data or file metadata.
            return respond(503, {"error": "Photo service unavailable"})
        finally:
            self.slot.release()


app = PhotoService()
