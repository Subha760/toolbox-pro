# Toolinger photo service

Status: implementation prepared; no host is connected and no real-model quality or latency test has been completed. Do not mark the service active until the smoke test below passes on the selected host.

The website sends image bytes to this owner-operated service. Visitors do not supply API keys. BiRefNet Portrait runs on the server through rembg; it is not a remove.bg service or a promise of identical output. The model card declares MIT licensing: https://huggingface.co/ZhengPeng7/BiRefNet-portrait . rembg: https://github.com/danielgatis/rembg . Keep upstream licenses when distributing model files.

## Deployment

Build from the repository root using `docker build -f backend/Dockerfile -t toolinger-photo .`. The Docker build downloads the weights; visitors never download a model. A model-download failure fails the build. Use a Docker-capable host with enough measured memory for this model, HTTPS, an upload limit of 10 MB, request/read timeouts and an edge rate limit. Do not assume a 512 MB free service can run it. No paid infrastructure is enabled by this repository.

Use one instance and one worker initially. The app accepts one inference at a time and returns 503 for competing requests, with a global limit of 20 attempts per minute. CORS restricts browser origins but is not authentication or an anti-bot boundary. Configure host-level rate limiting before a public launch; scaling requires a shared limiter. Threaded Gunicorn's worker timeout is not a hard per-inference deadline: a hung model requires worker replacement by the host. Do not retry uploads automatically.

Environment: `ALLOWED_ORIGINS=https://subha760.github.io` and the host-provided `PORT` (defaults to 7860). Warmup is done before the worker accepts requests. `/health` reports model readiness. Uploaded images are handled in memory, EXIF orientation is applied and metadata is stripped. No input/output photo is written by the application. Configure the host not to capture request bodies, and review host retention before launch.

## Activation gate

1. Deploy the container in an owner-approved account without enabling a paid plan unless separately approved.
2. Confirm `/health` returns `ready: true`. Test representative portraits for fine hair, glasses, dark clothing, light clothing and busy backgrounds. Verify PNG transparency and original dimensions, cold-start time, peak memory, and edge quality. This service does not retouch facial features or generate missing details.
3. Test invalid images, oversize images, concurrent uploads and failure recovery. Tests under `backend/test_server.py` cover the HTTP contract using a fake inference engine; they do not verify the AI model.
4. Set `backgroundRemovalUrl` in `public/ai-config.json` to the verified HTTPS endpoint ending in `/v1/remove-background`. Commit to `main`; Pages redeploys automatically. This URL is public configuration, not a credential. Until this is done, the UI explicitly shows that activation is pending and does not send photos anywhere.
5. Verify a real upload from the live website and check white, navy and red composites before announcing background removal as working.

Run contract tests with `python -m unittest discover -s backend -p 'test_*.py'` (Pillow required). Cropping/colour/contrast controls in the website remain ordinary image operations, not AI enhancement.
