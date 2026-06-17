// 肉球トラベル専用 Service Worker
// 同じリポジトリに他のアプリが同居しているため、このアプリ自身のファイルだけを扱い、
// 他アプリのリクエストには一切干渉しない（= 他アプリの更新が止まらない）。
const C = "nikukyu-cache-v2";
const ASSETS = ["nikukyu-travel.html", "icon-nikukyu.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;                 // 外部(フォント/Wikipedia等)はネットそのまま
  const mine = ASSETS.some(a => u.pathname.endsWith("/" + a) || u.pathname.endsWith(a));
  if (!mine) return;                                        // 他アプリ・他ファイルには干渉しない
  // network-first：オンラインでは常に最新、オフライン時のみキャッシュを使う
  e.respondWith(
    fetch(r).then(resp => { const cp = resp.clone(); caches.open(C).then(c => c.put(r, cp)); return resp; })
            .catch(() => caches.match(r))
  );
});
