//importScripts('/cache-polyfill.js');

if ('serviceWorker' in navigator) {
  //console.log("Will the service worker register?");
  navigator.serviceWorker.register('service-worker.js')
  .then(function(reg) {
    //console.log("Yes, it did.");
    self.addEventListener('install', function(e) {
      e.waitUntil(
        caches.open('workfit').then(function(cache) {
          return cache.addAll([
            "workfit.js",
            "service-worker.js",
            "services/allownotifications.js",
            "services/responseoptions.js",
            "services/nulwekelijksresults.js",
            "services/gebieden.js",
            "services/solutionexamples.js",
            "services/variousfunctions.js",
            "services/angular-oncrazyload.js",
            "services/angular-inview.js",
            "services/angularjs-dropdown-multiselect.min.js",
            "services/angular-youtube-embed.js",
            "controllers/admin.js",
            "controllers/adminusers.js",
            "controllers/nulmeting.js",
            "controllers/profile.js",
            "controllers/weekly.js",
            "controllers/tests.js",
            "controllers/results.js",
            "controllers/personalitytest.js",
            "controllers/personalityresults.js",
            "controllers/advice.js",
            "controllers/improvement.js",
            "controllers/improvement-results.js",
            "controllers/faq.js",
            "controllers/functioneringstest.js",
            "controllers/functioneringsresults.js",
            "controllers/functioneringsafspraken.js",
            "controllers/functioneringsarchief.js",
            "controllers/pagina.js",
            "controllers/rapportage.js",
            "partials/admin.htm",
            "partials/adminusers.htm",
            "partials/nulmeting.htm",
            "partials/profile.htm",
            "partials/weekly.htm",
            "partials/tests.htm",
            "partials/results.htm",
            "partials/personalitytest.htm",
            "partials/personalityresults.htm",
            "partials/advice.htm",
            "partials/improvement.htm",
            "partials/improvement-results.htm",
            "partials/faq.htm",
            "partials/functioneringstest.htm",
            "partials/functioneringsresults.htm",
            "partials/functioneringsafspraken.htm",
            "partials/functioneringsarchief.htm",
            "partials/losse-pagina.htm",
            "partials/login.htm",
            "partials/rapportage.htm",
            "partials/menu.htm"
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
