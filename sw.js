// Network first, cached copy when offline. Only used by booth staff mode.
var CACHE = "forms-v2";

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll([
      "./", "forms.config.js", "vendor/jsQR.js", "manifest.json",
      "icons/icon-192.png", "icons/icon-512.png",
    ]);
  }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      })
      .catch(function () { return caches.match(req, { ignoreSearch: true }); })
  );
});
