// sw.js
const appPrefix = 'mws-hacker-news';
const staticCacheName = appPrefix + '-v6';
const contentImgsCache = appPrefix + '-content-imgs';
const allCaches = [staticCacheName, contentImgsCache];
let debug = false;

self.addEventListener('install', function (event) {
    if (debug) console.log('sw-install()');

    // The promise that skipWaiting() returns can be safely ignored.
    self.skipWaiting();

    event.waitUntil(caches.open(staticCacheName).then(function (cache) {
        return cache.addAll(['/', 'images/icons/icon.png', 'images/icons/icon.svg', 'images/icons/icon192.png', 'images/icons/icon512.png', 'images/ic_close_24px.svg', 'images/loader.png', 'images/placeholder.png', 'scripts/app.min.js', 'scripts/sw-reg.min.js', 'styles/app.min.css', 'third_party/handlebars-intl.min.js', 'third_party/handlebars-v3.0.0.js', '404.html', 'index.html', 'manifest.json', 'sw.js', 'robots.txt', 'https://fonts.googleapis.com/css?family=Roboto:400,500,700', 'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2']);
    }).catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed install. Returned status of ${error.message}`;
        throw error;
    }));
});

self.addEventListener('activate', function (event) {
    if (debug) console.log('sw-activate()');
    event.waitUntil(cleanCache().catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed activate. Returned status of ${error.message}`;
        return false;
    }));
});

self.addEventListener('fetch', function (event) {
    if (debug) console.log('sw-fetch()');

    const requestUrl = new URL(event.request.url);
    if (debug) console.log('fetch requestUrl=' + requestUrl);

    if (debug) console.log('requestUrl.port=' + requestUrl.port);
    if (debug) console.log('requestUrl.origin=' + requestUrl.origin);
    if (debug) console.log('location.origin=' + location.origin);

    if (requestUrl.origin === location.origin) {
        if (debug) console.log('requestUrl.pathname=' + requestUrl.pathname);
        if (requestUrl.pathname === '' || requestUrl.pathname === '/') {
            event.respondWith(caches.match('/index.html'));
            return;
        }
        if (requestUrl.pathname.startsWith('images/') || requestUrl.pathname.startsWith('/img/')) {
            event.respondWith(servePhoto(event.request));
            return;
        }
    }
    if (debug) console.log('other');

    event.respondWith(serveRequest(event.request));
});

function servePhoto(request) {
    if (debug) console.log('sw-servePhoto()');

    let storageUrl = request.url.replace(/^(\d+-?)+\d+$\.jpg$/, '');

    return caches.open(contentImgsCache).then(function (cache) {
        return cache.match(storageUrl).then(function (response) {
            if (debug) console.log('cache match check');
            if (response) return response;

            if (debug) console.log('fetch request.url=' + request.url);
            return fetch(request).then(function (networkResponse) {
                if (debug) console.log('response cache');
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            }).catch(error => {
                // Oops!. Got an error from server.
                error.message = `Request failed serve request. Returned status of ${error.message}`;
                if (debug) console.log('404 return placeholder.png');
                return caches.match('/images/placeholder.png');
            });
        });
    }).catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed serve photo. Returned status of ${error.message}`;
        throw error;
    });
}

function serveRequest(request) {
    if (debug) console.log('sw-serveRequest()');

    let storageUrl = request.url;

    return caches.open(staticCacheName).then(function (cache) {

        return cache.match(storageUrl).then(function (response) {
            if (debug) console.log('cache match check');
            if (response) return response;

            if (debug) console.log('fetch request.url=' + request.url);
            return fetch(request).then(function (networkResponse) {
                if (debug) console.log('response cache');
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            }).catch(error => {
                // Oops!. Got an error from server.
                error.message = `Request failed serve request. Returned status of ${error.message}`;
                if (debug) console.log('404 return index.html');
                return caches.match('/404.html');
            });
        });
    }).catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed serve request. Returned status of ${error.message}`;
        throw error;
    });
}

function cleanCache() {
    if (debug) console.log('sw-cleanCache()');
    return caches.keys().then(function (cacheNames) {
        return Promise.all(cacheNames.filter(function (cacheName) {
            return cacheName.startsWith(appPrefix) && !allCaches.includes(cacheName);
        }).map(function (cacheName) {
            return caches.delete(cacheName);
        }));
    }).catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed clean cache. Returned status of ${error.message}`;
        throw error;
    });
}