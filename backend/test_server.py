import io
import unittest
from PIL import Image
from server import PhotoService, MAX_BYTES


def png():
    buf = io.BytesIO()
    Image.new("RGB", (8, 10), "red").save(buf, "PNG")
    return buf.getvalue()


class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.calls = []
        def engine(photo):
            self.calls.append(photo.size)
            result = photo.convert("RGBA")
            result.putalpha(128)
            output = io.BytesIO()
            result.save(output, "PNG")
            return output.getvalue()
        self.service = PhotoService(engine=engine, origins=["https://subha760.github.io"])

    def request(self, data=None, **changes):
        data = png() if data is None else data
        env = {"REQUEST_METHOD": "POST", "PATH_INFO": "/v1/remove-background", "HTTP_ORIGIN": "https://subha760.github.io", "CONTENT_TYPE": "image/png", "CONTENT_LENGTH": str(len(data)), "wsgi.input": io.BytesIO(data)}
        env.update(changes)
        result = {}
        def start(status, headers):
            result.update(status=int(status.split()[0]), headers=dict(headers))
        result["body"] = b"".join(self.service(env, start))
        return result

    def test_returns_png_without_key(self):
        result = self.request()
        self.assertEqual(result["status"], 200)
        self.assertEqual(self.calls, [(8, 10)])
        self.assertEqual(result["headers"]["Cache-Control"], "no-store")
        self.assertEqual(Image.open(io.BytesIO(result["body"])).mode, "RGBA")

    def test_preflight(self):
        result = self.request(REQUEST_METHOD="OPTIONS")
        self.assertEqual(result["status"], 204)
        self.assertEqual(result["headers"]["Access-Control-Allow-Origin"], "https://subha760.github.io")

    def test_rejects_other_origin(self):
        self.assertEqual(self.request(HTTP_ORIGIN="https://other.example")["status"], 403)
        self.assertFalse(self.calls)

    def test_bad_image_never_runs_model(self):
        self.assertEqual(self.request(b"not an image")["status"], 400)
        self.assertFalse(self.calls)

    def test_oversized_body_rejected_before_read(self):
        self.assertEqual(self.request(CONTENT_LENGTH=str(MAX_BYTES + 1))["status"], 413)
        self.assertFalse(self.calls)

    def test_truncated_upload(self):
        self.assertEqual(self.request(b"x", CONTENT_LENGTH="20")["status"], 400)

    def test_disallows_url_payload(self):
        self.assertEqual(self.request(CONTENT_TYPE="application/json")["status"], 415)

    def test_service_busy(self):
        self.service.slot.acquire()
        try:
            self.assertEqual(self.request()["status"], 503)
        finally:
            self.service.slot.release()

    def test_rate_limit(self):
        self.service.limit = 1
        self.request()
        self.assertEqual(self.request()["status"], 429)

    def test_internal_error_is_not_exposed(self):
        def broken(photo):
            raise RuntimeError("private path and user input")
        self.service.engine = broken
        result = self.request()
        self.assertEqual(result["status"], 503)
        self.assertNotIn(b"private", result["body"])
        self.assertFalse(self.service.slot.locked())


if __name__ == "__main__":
    unittest.main()
