/*
  tema.js – tema chiaro o scuro.
  Viene caricato nell'<head>, prima della pagina, così non si vede un "lampo" di colore sbagliato.

  Scelte possibili (si cambiano dal menu):
  - dispositivo: segue l'impostazione del telefono/computer
  - chiaro / scuro: sempre quello
  - ora: scuro di sera e di notte (orari in config.js), chiaro di giorno
*/
const Tema = (() => {
  const CHIAVE = 'orariodada.tema';
  const SCELTE = ['dispositivo', 'chiaro', 'scuro', 'ora'];
  const scuroSistema = window.matchMedia('(prefers-color-scheme: dark)');

  function scelta() {
    try {
      const v = localStorage.getItem(CHIAVE);
      return SCELTE.includes(v) ? v : 'dispositivo';
    } catch (e) { return 'dispositivo'; }
  }

  // Vero se adesso è nella fascia "scura" (es. dalle 19 alle 7, anche a cavallo della mezzanotte)
  function scuroPerOra() {
    const h = new Date().getHours(), da = CONFIG.oraInizioScuro, a = CONFIG.oraFineScuro;
    return da > a ? (h >= da || h < a) : (h >= da && h < a);
  }

  // Scrive data-tema="chiaro|scuro" sull'elemento <html>: il CSS sceglie i colori di conseguenza
  function applica() {
    const s = scelta(), radice = document.documentElement;
    if (s === 'dispositivo') radice.removeAttribute('data-tema');
    else radice.setAttribute('data-tema', s === 'ora' ? (scuroPerOra() ? 'scuro' : 'chiaro') : s);
    // Colora anche la barra del browser o del telefono
    const scuro = radice.dataset.tema ? radice.dataset.tema === 'scuro' : scuroSistema.matches;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = scuro ? '#1a2029' : '#1c56b8';
  }

  function imposta(valore) {
    try { localStorage.setItem(CHIAVE, valore); } catch (e) { /* ignorato */ }
    applica();
  }

  applica();
  setInterval(applica, 60000);                          // per la scelta "secondo l'ora"
  if (scuroSistema.addEventListener) scuroSistema.addEventListener('change', applica);

  return { scelta, imposta };
})();
