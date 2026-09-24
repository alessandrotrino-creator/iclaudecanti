/*
  sw.js – "service worker": permette di installare l'app e di aprirla anche senza connessione.
  Strategia: prima prova la rete (così si vedono subito le modifiche), se non c'è usa la copia salvata.
*/
const CACHE = 'orario-dada';
const FILE_APP = [
  './', 'index.html', 'css/app.css', 'css/brief.css', 'manifest.webmanifest',
  'js/config.js', 'js/tema.js', 'js/dati.js', 'js/accesso.js', 'js/viste.js', 'js/brief.js', 'js/installa.js', 'js/condividi.js', 'js/app.js',
  'icone/icona.svg', 'icone/icona-192.png', 'icone/apple-touch-icon.png', 'icone/qr-app.svg',
  '../dati/orario.json'
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
    fetch(richiesta)
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
