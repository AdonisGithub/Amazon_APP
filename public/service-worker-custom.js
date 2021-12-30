/**
 * Service Worker
 */

const cacheName = 'help-center';
const cacheList = [

];

//Life cycle: INSTALL
self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(cacheList);
    })
  );
});

// Life cycle: ACTIVATE
self.addEventListener('activate', event => {

  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {

        if (key !== cacheName) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// Functional: FETCH
self.addEventListener('fetch', event => {


  // return updated cache
  if (event.request.url.indexOf('onlyCache') !== -1) {
    let url = event.request.url.replace('&onlyCache', '');
    event.respondWith(
      caches.match(url).then(function (response) {
        return response;
      })
    );
  }


  if ( (event.request.url.indexOf("Helps") !== -1 && event.request.url.indexOf('onlyCache') === -1) || event.request.url.indexOf('.png') !== -1 ) {
    console.log(event.request);
    // return old cache
    event.respondWith(
      caches.match(event.request).then(function (response) {
        return response || update(event.request)
      })
    );
    // after return cache, update and refresh cache
    event.waitUntil(
      update(event.request)
        .then(refresh)
    );
  }
});

function update(request) {

  return caches.open(cacheName).then(function (cache) {
    return fetch(request).then(function (response) {
      return cache.put(request, response.clone()).then(function () {
        return response;
      });
    });
  });
}

function refresh(response) {
  if( !response.url) {
    return;
  }
  if(response.url.indexOf('.png') !== -1){
    return;
  }

  return self.clients.matchAll().then(function (clients) {
    clients.forEach(function (client) {
      var message = {
        type: 'refresh',
        url: response.url,
        eTag: response.headers.get('ETag')
      };
      client.postMessage(JSON.stringify(message));
    });
  });
}