var CACHE_NAME = 'color-name';
const CACHE_VERSION = 'v1';
var urlsToCache = [
  'index.html',
  '404.html',
  'account/index.html',
  'control/index.html',
  'equips/index.html',
  'money/index.html',
  'procedure/index.html'
];

// インストール処理
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

//古いキャッシュの削除
self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return cacheNames.filter((cacheName) => {
          // このスコープに所属していて且つCACHE_NAMEではないキャッシュを探す
          return cacheName.startsWith(`${registration.scope}!`) &&
                 cacheName !== CACHE_NAME;
        });
      }).then((cachesToDelete) => {
        return Promise.all(cachesToDelete.map((cacheName) => {
          // いらないキャッシュを削除する
          return caches.delete(cacheName);
        }));
      })
    );
  });

//キャッシュの読込
self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request)
      .then((response) => {
        // キャッシュ内に該当レスポンスがあれば、それを返す
        if (response) {
          return response;
        }
  
        // 重要：リクエストを clone する。リクエストは Stream なので
        // 一度しか処理できない。ここではキャッシュ用、fetch 用と2回
        // 必要なので、リクエストは clone しないといけない
        let fetchRequest = event.request.clone();
  
        return fetch(fetchRequest)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              // キャッシュする必要のないタイプのレスポンスならそのまま返す
              return response;
            }
  
            // 重要：レスポンスを clone する。レスポンスは Stream で
            // ブラウザ用とキャッシュ用の2回必要。なので clone して
            // 2つの Stream があるようにする
            let responseToCache = response.clone();
  
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
  
            return response;
          });
      })
    );
  });