/* Service worker du tableau de bord BUNKAIO : affiche les notifications push.
   Le signal push est vide ; l'événement est lu ici avec le token admin (gardé dans IndexedDB sur cet appareil). */
const WORKER = 'https://bunkaio-quiz-stripe.bunkaio.workers.dev';

function readToken() {
  return new Promise((resolve) => {
    try {
      const open = indexedDB.open('bunkaio-admin', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('kv');
      open.onsuccess = () => {
        const get = open.result.transaction('kv').objectStore('kv').get('token');
        get.onsuccess = () => resolve(get.result || '');
        get.onerror = () => resolve('');
      };
      open.onerror = () => resolve('');
    } catch (e) { resolve(''); }
  });
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let ev = null;
    try {
      const token = await readToken();
      if (token) {
        const res = await fetch(WORKER + '/admin/push/last', { headers: { Authorization: 'Bearer ' + token } });
        if (res.ok) ev = (await res.json()).event;
      }
    } catch (e) { /* notification générique ci-dessous */ }
    await self.registration.showNotification(ev && ev.title ? ev.title : 'BUNKAIO ⊹', {
      body: ev && ev.body ? ev.body : 'Nouvelle activité sur votre tableau de bord.',
      icon: '../images/logo-bunkaio-512.png',
      badge: '../images/logo-bunkaio-512.png',
      tag: 'bunkaio-admin',
      renotify: true,
      data: { url: ev && ev.url ? ev.url : '/admin/' },
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/admin/', self.location.origin).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if (c.url.includes('/admin/')) { await c.focus(); c.postMessage({ goto: url }); return; }
    }
    await self.clients.openWindow(url);
  })());
});
