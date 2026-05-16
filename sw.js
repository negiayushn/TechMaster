var CACHE = "techmaster-v1";
var URLS = [
  "/",
  "/index.html",
  "/styles/main.css",
  "/js/config.js",
  "/js/docs-data.js",
  "/js/docs-engine.js",
  "/js/interview-generator.js",
  "/js/projects-data.js",
  "/js/roadmap-data.js",
  "/js/theme.js",
  "/js/notes.js",
  "/js/app.js",
  "/assets/icon.svg",
  "/manifest.json"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(URLS);
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    })
  );
});

self.addEventListener("fetch", function (e) {
  e.respondWith(
    caches.match(e.request).then(function (r) {
      return r || fetch(e.request).then(function (res) {
        return caches.open(CACHE).then(function (c) {
          c.put(e.request, res.clone());
          return res;
        });
      });
    }).catch(function () {
      return caches.match("/index.html");
    })
  );
});