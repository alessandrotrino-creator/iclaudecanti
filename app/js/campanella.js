/*
  campanella.js – tasto con la campanella: il telefono suona agli orari della campanella.

  - Gli orari si leggono da dati/campanella.json (indirizzo in config.js, campo urlCampanella).
    Se il file manca si usano gli orari di inizio delle ore dell'orario.
  - L'utente sceglie se suonare AL CAMBIO D'ORA, QUALCHE MINUTO PRIMA oppure ENTRAMBI.
  - Il suono è creato dal browser (Web Audio): non serve nessun file audio.
  - Limite dei siti web: si sente solo finché l'app è aperta sullo schermo.
    Con il telefono bloccato o l'app chiusa il browser non permette di suonare.
  - Le scelte restano memorizzate su questo dispositivo (localStorage, chiave "orariodada.campanella").
*/
const Campanella = (() => {
  const $ = sel => document.querySelector(sel);
  const CHIAVE = 'orariodada.campanella';
  const CHIAVE_COPIA = 'orariodada.copiaCampanella';
  const NOMI_GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const minuti = hhmm => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };
  const hhmm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

  let scelte = { attiva: false, modo: 'cambio', minuti: 2, schermo: false };
  let orari = null;          // { giorni: [...], suoni: [{ ora, nome }] }
  let datiOrario = null;     // funzione che restituisce l'orario (serve se manca campanella.json)
  let audio = null;          // AudioContext, si crea al primo tocco (i browser lo chiedono)
  let giaSuonati = new Set();
  let blocco = null;         // "wake lock": tiene acceso lo schermo

  /* ---------- scelte memorizzate ---------- */
  function leggiScelte() {
    try { Object.assign(scelte, JSON.parse(localStorage.getItem(CHIAVE) || '{}')); } catch (e) { /* ignorato */ }
  }
  function salvaScelte() {
    try { localStorage.setItem(CHIAVE, JSON.stringify(scelte)); } catch (e) { /* ignorato */ }
  }

  /* ---------- orari della campanella ---------- */
  function daOrario() {
    const D = datiOrario && datiOrario();
    if (!D) return { giorni: [], suoni: [] };
    const suoni = D.ore.map(o => ({ ora: o.inizio, nome: `Inizio ${o.n}ª ora` }));
    const ultima = D.ore[D.ore.length - 1];
    if (ultima) suoni.push({ ora: ultima.fine, nome: 'Fine delle lezioni' });
    return { giorni: D.giorni, suoni };
  }

  function controllaFile(json) {
    if (!json || !Array.isArray(json.suoni)) throw new Error('formato non valido');
    return {
      giorni: Array.isArray(json.giorni) && json.giorni.length ? json.giorni : null,
      suoni: json.suoni.filter(s => /^\d{1,2}:\d{2}$/.test(s.ora)).map(s => ({ ora: s.ora.padStart(5, '0'), nome: s.nome || 'Campanella' }))
    };
  }

  // Scarica gli orari; senza rete usa l'ultima copia salvata; senza file usa le ore dell'orario
  async function caricaOrari() {
    try {
      const r = await fetch(CONFIG.urlCampanella, { cache: 'no-cache' });
      if (!r.ok) throw new Error('Errore ' + r.status);
      const testo = await r.text();
      orari = controllaFile(JSON.parse(testo));
      try { localStorage.setItem(CHIAVE_COPIA, testo); } catch (e) { /* ignorato */ }
    } catch (e) {
      try { orari = controllaFile(JSON.parse(localStorage.getItem(CHIAVE_COPIA))); } catch (e2) { orari = null; }
    }
    if (!orari || !orari.suoni.length) orari = daOrario();
    if (!orari.giorni) orari.giorni = daOrario().giorni;
    aggiornaPannello();
  }

  // Tutti i suoni di oggi, in ordine: { minuto, tipo: 'cambio' | 'preavviso', nome }
  function suoniDiOggi() {
    if (!orari || !orari.giorni.includes(NOMI_GIORNI[new Date().getDay()])) return [];
    const elenco = [];
    orari.suoni.forEach(s => {
      const m = minuti(s.ora);
      if (scelte.modo !== 'prima') elenco.push({ minuto: m, tipo: 'cambio', nome: s.nome });
      if (scelte.modo !== 'cambio' && m - scelte.minuti >= 0) {
        elenco.push({ minuto: m - scelte.minuti, tipo: 'preavviso', nome: `Tra ${scelte.minuti} min: ${s.nome.charAt(0).toLowerCase() + s.nome.slice(1)}` });
      }
    });
    return elenco.sort((a, b) => a.minuto - b.minuto);
  }

  /* ---------- suoni (creati dal browser, nessun file audio) ---------- */
  // Il browser permette di suonare solo dopo un tocco dell'utente: qui "sblocchiamo" l'audio
  function sblocca() {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
    } catch (e) { audio = null; }
    aggiornaPannello();
  }

  // Una nota che si spegne piano, come un colpo di campana (più frequenze sommate)
  function colpo(freq, inizio, durata, volume) {
    [[1, 1], [2.76, .35], [5.4, .12]].forEach(([molt, peso]) => {
      const osc = audio.createOscillator(), g = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * molt;
      g.gain.setValueAtTime(0.0001, inizio);
      g.gain.exponentialRampToValueAtTime(volume * peso, inizio + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, inizio + durata);
      osc.connect(g).connect(audio.destination);
      osc.start(inizio);
      osc.stop(inizio + durata + 0.05);
    });
  }

  function suona(tipo) {
    sblocca();
    if (audio) {
      const t = audio.currentTime + 0.05;
      if (tipo === 'cambio') {        // campanella: "din-don" ripetuto due volte
        [0, 1.4].forEach(d => { colpo(880, t + d, 1.6, 0.5); colpo(660, t + d + 0.6, 1.8, 0.5); });
      } else {                        // preavviso: tre "bip" brevi e leggeri
        [0, 0.25, 0.5].forEach(d => colpo(1320, t + d, 0.18, 0.3));
      }
    }
    // Sui telefoni Android vibra anche (gli iPhone non lo permettono ai siti)
    if (navigator.vibrate) navigator.vibrate(tipo === 'cambio' ? [400, 150, 400] : [120, 80, 120]);
    // Il tasto "squilla" per qualche secondo
    const tasto = $('#btnCampanella');
    tasto.classList.remove('squilla');
    void tasto.offsetWidth;          // fa ripartire l'animazione
    tasto.classList.add('squilla');
    setTimeout(() => tasto.classList.remove('squilla'), 4000);
  }

  /* ---------- controllo dell'ora (ogni 5 secondi) ---------- */
  function controlla() {
    if (!scelte.attiva) return;
    const d = new Date();
    const secondi = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    const oggi = d.toDateString();
    suoniDiOggi().forEach(s => {
      const chiave = oggi + '|' + s.minuto + '|' + s.tipo;
      // Suona nel primo minuto dopo l'orario (il browser a volte ritarda il controllo di qualche secondo)
      if (secondi >= s.minuto * 60 && secondi < s.minuto * 60 + 60 && !giaSuonati.has(chiave)) {
        giaSuonati.add(chiave);
        suona(s.tipo);
        const stato = $('#statoCampanella');
        if (stato) stato.textContent = `🔔 ${s.nome} (${hhmm(s.tipo === 'cambio' ? s.minuto : s.minuto + scelte.minuti)})`;
      }
    });
    aggiornaProssimo();
  }

  /* ---------- schermo sempre acceso (se l'utente lo sceglie) ---------- */
  async function aggiornaSchermo() {
    const serve = scelte.attiva && scelte.schermo && !document.hidden;
    try {
      if (serve && !blocco && navigator.wakeLock) {
        blocco = await navigator.wakeLock.request('screen');
        blocco.addEventListener('release', () => { blocco = null; });
      } else if (!serve && blocco) {
        await blocco.release();
        blocco = null;
      }
    } catch (e) { blocco = null; /* non disponibile o negato: pazienza */ }
  }

  /* ---------- pannello delle scelte ---------- */
  function aggiornaProssimo() {
    const el = $('#prossimoCampanella');
    if (!el) return;
    if (!scelte.attiva) { el.textContent = 'Campanella spenta.'; return; }
    // Il prossimo è il primo suono di oggi che non è ancora suonato e non è già passato
    const d = new Date(), ora = d.getHours() * 60 + d.getMinutes();
    const prossimo = suoniDiOggi().find(s => s.minuto >= ora && !giaSuonati.has(d.toDateString() + '|' + s.minuto + '|' + s.tipo));
    el.textContent = prossimo
      ? `Prossimo suono alle ${hhmm(prossimo.minuto)}: ${prossimo.nome}${prossimo.tipo === 'preavviso' ? ' (preavviso)' : ''}.`
      : 'Oggi non ci sono altri suoni.';
  }

  function aggiornaPannello() {
    const tasto = $('#btnCampanella');
    if (!tasto) return;
    tasto.classList.toggle('accesa', scelte.attiva);
    tasto.setAttribute('aria-label', scelte.attiva ? 'Campanella attiva: cambia le impostazioni' : 'Campanella spenta: attivala');
    $('#campanellaAttiva').checked = scelte.attiva;
    document.querySelectorAll('input[name="modoCampanella"]').forEach(r => { r.checked = r.value === scelte.modo; });
    $('#minutiCampanella').value = String(scelte.minuti);
    $('#minutiCampanella').disabled = scelte.modo === 'cambio';
    $('#schermoCampanella').checked = scelte.schermo;
    $('#gruppoSchermoCampanella').hidden = !navigator.wakeLock;
    // Avviso se il suono non è ancora stato sbloccato da un tocco
    $('#avvisoAudioCampanella').hidden = !(scelte.attiva && (!audio || audio.state !== 'running'));
    aggiornaProssimo();
  }

  function apri() {
    $('#pannelloCampanella').hidden = false;
    $('#btnCampanella').setAttribute('aria-expanded', 'true');
    sblocca();
    $('#pannelloCampanella').focus();
  }
  function chiudi() {
    $('#pannelloCampanella').hidden = true;
    $('#btnCampanella').setAttribute('aria-expanded', 'false');
  }

  function cambia() {
    scelte.attiva = $('#campanellaAttiva').checked;
    const modo = document.querySelector('input[name="modoCampanella"]:checked');
    scelte.modo = modo ? modo.value : 'cambio';
    scelte.minuti = Number($('#minutiCampanella').value) || 2;
    scelte.schermo = $('#schermoCampanella').checked;
    salvaScelte();
    // I suoni già passati oggi non devono ripartire subito dopo una modifica
    const d = new Date(), adesso = d.getHours() * 60 + d.getMinutes();
    suoniDiOggi().filter(s => s.minuto < adesso).forEach(s => giaSuonati.add(d.toDateString() + '|' + s.minuto + '|' + s.tipo));
    aggiornaPannello();
    aggiornaSchermo();
  }

  /* ---------- avvio ---------- */
  // leggiOrario = funzione che restituisce l'orario caricato (serve se manca campanella.json)
  function avvia(leggiOrario) {
    datiOrario = leggiOrario;
    leggiScelte();
    // Al primo avvio non suonano le campanelle già passate
    const d = new Date(), adesso = d.getHours() * 60 + d.getMinutes();

    $('#btnCampanella').addEventListener('click', () => $('#pannelloCampanella').hidden ? apri() : chiudi());
    $('#pannelloCampanella').addEventListener('change', cambia);
    $('#provaCampanella').addEventListener('click', () => suona('cambio'));
    $('#provaPreavviso').addEventListener('click', () => suona('preavviso'));
    $('#chiudiCampanella').addEventListener('click', () => { chiudi(); $('#btnCampanella').focus(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#pannelloCampanella').hidden) { chiudi(); $('#btnCampanella').focus(); } });
    document.addEventListener('click', e => { if (!$('#pannelloCampanella').hidden && !e.target.closest('#pannelloCampanella, #btnCampanella')) chiudi(); });
    // Qualsiasi tocco sblocca l'audio (serve dopo aver riaperto l'app)
    document.addEventListener('pointerdown', sblocca, { passive: true });
    document.addEventListener('visibilitychange', () => { aggiornaSchermo(); if (!document.hidden) controlla(); });

    caricaOrari().then(() => {
      suoniDiOggi().filter(s => s.minuto < adesso).forEach(s => giaSuonati.add(d.toDateString() + '|' + s.minuto + '|' + s.tipo));
      aggiornaPannello();
      aggiornaSchermo();
    });
    setInterval(controlla, 5000);
    // Ogni ora ricontrollo il file degli orari (potrebbe essere stato aggiornato)
    setInterval(caricaOrari, 60 * 60000);
  }

  return { avvia, suona };
})();
