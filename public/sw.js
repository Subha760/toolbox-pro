const CACHE = "toolinger-v7";
const SHELL = ["./", "./manifest.webmanifest", "./toolinger-logo.svg"];
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("toolinger-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      ),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    ["/api/", "/admin", "/cdn-cgi/", "/models/", "/portrait-runtime/"].some(
      (path) => url.pathname.includes(path),
    ) ||
    ["/ai-config.json", "/ad-config.json"].some((path) =>
      url.pathname.endsWith(path),
    )
  )
    return;
  const network = () =>
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(event.request, copy))
            .catch(() => {});
        }
        return response;
      })
      .catch(
        async () =>
          (await caches.match(event.request)) ||
          (event.request.mode === "navigate"
            ? await caches.match("./")
            : Response.error()),
      );
  event.respondWith(
    url.pathname.includes("/assets/")
      ? caches.match(event.request).then((hit) => hit || network())
      : network(),
  );
});
