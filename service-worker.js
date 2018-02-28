    //importScripts('/cache-polyfill.js');

    if ('serviceWorker' in navigator) {
        console.log("Will the service worker register?");
        navigator.serviceWorker.register('service-worker.js')
            .then(function(reg) {
                console.log("Yes, it did.");
                self.addEventListener('install', function(e) {
                    e.waitUntil(
                        caches.open('workfit').then(function(cache) {
                                return cache.addAll([
                                        'index.htm'
                                    ]);
                            }));
                });
            }).
        catch (function(err) {
            console.log("No it didn't. This happened: ", err)
        });
    }

    self.addEventListener('activate', function(event) {
        event.waitUntil(self.clients.claim());
    });

    self.addEventListener('fetch', function(event) {
        //console.log(event.request.url);
        event.respondWith(
            caches.match(event.request).then(function(response) {
                    return response || fetch(event.request);
                }));
    });

    /*
    self.addEventListener('fetch', function(event) {
        event.respondWith(
            caches.match(event.request, {
                    ignoreSearch: true
                }).then(response = > {
                    return response || fetch(event.request);
                }));
    });
    */
