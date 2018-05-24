importScripts("https://www.gstatic.com/firebasejs/4.4.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/4.4.0/firebase-messaging.js");

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  var obj = event.data.json();

  const title = obj.notification.title;
  const options = {
    body: obj.notification.body,
    data: obj.notification.click_action,
    icon: '/assets/icons/icon-32x32.png',
    badge: '/assets/icons/workfit-128x128.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  //console.log('[Service Worker] Notification click Received.');
  //console.log(event.notification);
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
