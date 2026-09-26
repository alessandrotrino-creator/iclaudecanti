/*
  sw.js – "service worker": permette di installare l'app e di aprirla anche senza connessione.
  Strategia: prima prova la rete (così si vedono subito le modifiche), se non c'è usa la copia salvata.
*/
const CACHE = 'orario-dada';
const FILE_APP = [
  './', 'index.html', 'css/app.css', 'css/brief.css', 'css/campanella.css', 'css/barra.css', 'css/smart.css', 'css/menu.css','manifest.webmanifest',
  'js/config.js', 'js/tema.js', 'js/dati.js', 'js/accesso.js', 'js/ruoli.js', 'js/nomi.js', 'js/supplenze.js', 'js/viste.js', 'js/brief.js', 'js/smart.js', 'js/ingresso.js', 'js/intervallo.js', 'js/modifiche.js', 'js/storie.js', 'js/campanella.js', 'js/installa.js', 'js/condividi.js', 'js/app.js',
  'icone/icona.svg', 'icone/icona-192.png', 'icone/apple-touch-icon.png', 'icone/qr-app.svg',
  '../dati/orario.json', '../dati/campanella.json'
];

// Alla prima installazione salva i file dell'app
self.addEventListener('install', evento => {
  evento.waitUntil(caches.open(CACHE).then(c => c.addAll(FILE_APP)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', evento => evento.waitUntil(self.clients.claim()));

self.addEventListener('fetch', evento => {
  const richiesta = evento.request;
  // Solo file del nostro sito (non Google, non altri siti)
  if (richiesta.method !== 'GET' || new URL(richiesta.url).origin !== location.origin) return;
  evento.respondWith(
    // cache: 'no-cache' = chiede sempre al sito se il file è cambiato, invece di usare
    // la copia che il browser tiene per 10 minuti (così le modifiche si vedono subito)
    fetch(richiesta, { cache: 'no-cache' })
      .then(risposta => {
        if (risposta.ok) {
          const copia = risposta.clone();
          caches.open(CACHE).then(c => c.put(richiesta, copia));
        }
        return risposta;
      })
      .catch(() => caches.match(richiesta, { ignoreSearch: true }))
  );
});

// Tocco sulla notifica "Orario cambiato" (vedi modifiche.js): porta in primo piano l'app, o la apre
self.addEventListener('notificationclick', evento => {
  evento.notification.close();
  evento.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(finestre => {
    const app = finestre.find(f => f.url.includes('/app/'));
    // l'app aperta mostra subito le modifiche in stile storie (vedi storie.js)
    if (app) return app.focus().then(f => (f || app).postMessage({ tipo: 'apriStorie' }));
    return self.clients.openWindow('./?storie');
  }));
});
