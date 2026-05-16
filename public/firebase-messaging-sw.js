/**
 * Firebase Cloud Messaging Service Worker
 * Maneja notificaciones push cuando la app está en segundo plano o cerrada.
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyDH4TQbvRym1fkIIFwPpssU5qBENCM-GSk",
  authDomain:        "truekeamas.firebaseapp.com",
  projectId:         "truekeamas",
  storageBucket:     "truekeamas.firebasestorage.app",
  messagingSenderId: "873643507138",
  appId:             "1:873643507138:web:7eacc2a7972639b196aa5b",
});

const messaging = firebase.messaging();

// Notificaciones en segundo plano (app cerrada o minimizada)
messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title || 'Truekeamas', {
    body:  body  || '',
    icon:  icon  || '/icons/icon-192.png',
    badge:       '/icons/icon-192.png',
    tag:   data.tag || 'truekeamas-notif',
    data:  data,
    vibrate: [200, 100, 200],
    actions: data.url ? [{ action: 'open', title: 'Ver →' }] : [],
  });
});

// Al hacer clic en la notificación, abrir la app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(w => w.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else clients.openWindow(url);
    })
  );
});
