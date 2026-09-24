/*
  app.js – avvio dell'app, schermata iniziale, pulsanti, modalità monitor e aggiornamenti.

  SCHERMATA INIZIALE (scelta in base a chi apre l'app):
  1. Monitor di classe  -> l'orario di oggi della sua AULA (in DADA le aule sono fisse,
                           sono gli studenti a spostarsi), a caratteri grandi.
  2. Docente riconosciuto dall'email -> il SUO orario di oggi, con "adesso / dopo".
  3. Tutti gli altri    -> l'orario di oggi: ore in riga, classi in colonna.
  Nel weekend o a lezioni finite si mostra il giorno di scuola successivo.
*/
(() => {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const CHIAVE_MONITOR = 'orariodada.monitor';
  const NOMI_GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

  let D = null;             // dati dell'orario
  let utente = null;        // chi ha fatto l'accesso
  let mioDocente = null;    // il docente corrispondente all'utente (se c'è)
  let aulaMonitor = '';     // id dell'aula se questo dispositivo è un monitor di classe
  let avvisoGiorno = null;  // { giorno, testo } es. "le lezioni di oggi sono finite"
  let ultimoMinuto = -1;
  let timerInattivita = null;
  const stato = { colonne: 'classe', giorno: '', filtri: { classe: '', docente: '', aula: '' } };

  const leggi = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
  const scrivi = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) { /* ignorato */ } };
  const minuti = hhmm => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };
  const semplifica = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Giorno e ora di scuola in questo momento (null se non è giorno/ora di lezione)
  function adesso() {
    const d = new Date(), giorno = NOMI_GIORNI[d.getDay()], m = d.getHours() * 60 + d.getMinutes();
    if (!D.giorni.includes(giorno)) return { giorno: null, ora: null, minuto: m };
    const ora = D.ore.find(o => minuti(o.inizio) <= m && m < minuti(o.fine));
    return { giorno, ora: ora ? ora.n : null, minuto: m };
  }

  // Oggi, oppure il prossimo giorno di scuola se oggi non c'è lezione o le lezioni sono finite
  function giornoIniziale() {
    const a = adesso(), oggi = new Date().getDay();
    if (a.giorno) {
      const ultima = Math.max(0, ...D.lezioni.filter(l => l.giorno === a.giorno).map(l => l.ora));
      const o = D.ore.find(x => x.n === ultima);
      if (o && a.minuto < minuti(o.fine)) return { giorno: a.giorno, testo: '' };
    }
    for (let i = 1; i <= 7; i++) {
      const g = NOMI_GIORNI[(oggi + i) % 7];
      if (D.giorni.includes(g)) {
        const quando = (i === 1 ? 'domani, ' : '') + g.toLowerCase();
        return { giorno: g, testo: a.giorno ? `Le lezioni di oggi sono finite: ecco l'orario di ${quando}.` : `Oggi non c'è scuola: ecco l'orario di ${quando}.` };
      }
    }
    return { giorno: D.giorni[0], testo: '' };
  }

  function schermataIniziale() {
    const gi = giornoIniziale();
    stato.giorno = gi.giorno;
    avvisoGiorno = gi.testo ? gi : null;
    stato.filtri = { classe: '', docente: '', aula: '' };
    if (aulaMonitor) { stato.colonne = 'aula'; stato.filtri.aula = aulaMonitor; }
    else if (mioDocente) { stato.colonne = 'docente'; stato.filtri.docente = mioDocente.id; }
    else stato.colonne = 'classe';
    aggiorna();
    mostraOraCorrente();
  }

  // Porta in vista la riga dell'ora in corso (utile sui telefoni)
  function mostraOraCorrente() {
    const riga = $('#tabella .ora-corrente') || $('#tabella .cella-corrente');
    const box = $('#contenitoreTabella');
    if (riga && box) box.scrollTop = Math.max(0, riga.offsetTop - box.clientHeight / 3);
  }

  /* ---------- costruzione dei controlli ---------- */
  function preparaControlli() {
    // Menu a tendina dei filtri
    Viste.FILTRI.forEach(k => {
      const sel = $('#filtro-' + k);
      sel.innerHTML = `<option value="">Tutti</option>` +
        D[k].map(e => `<option value="${Viste.esc(e.id)}">${Viste.esc(e.nome)}</option>`).join('');
    });
    $('#filtro-classe').options[0].textContent = 'Tutte';
    $('#filtro-aula').options[0].textContent = 'Tutte';
    // Pulsanti dei giorni (abbreviati sui telefoni)
    $('#giorni').innerHTML = D.giorni.map(g =>
      `<button type="button" data-giorno="${Viste.esc(g)}"><span class="giorno-lungo">${Viste.esc(g)}</span><span class="giorno-corto" aria-hidden="true">${Viste.esc(g.slice(0, 3))}</span></button>`).join('');
    // Scelta dell'aula per la modalità monitor
    $('#sceltaMonitor').innerHTML = `<option value="">No, dispositivo personale</option>` +
      D.aula.map(a => `<option value="${Viste.esc(a.id)}">${Viste.esc(a.nome)}</option>`).join('');
    // Intestazione
    $('#infoScuola').textContent = [D.scuola, D.anno].filter(Boolean).join(' · ');
    $('#nomeUtente').textContent = utente.nome;
    $('#emailUtente').textContent = utente.email;
    $('#btnUtente').textContent = utente.nome.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
    $('#btnUtente').setAttribute('aria-label', 'Menu di ' + utente.nome);
    $('#btnMioOrario').hidden = !mioDocente;
    $('#btnSchermoIntero').hidden = !document.fullscreenEnabled;
    // Scelta tra la bozza di Orario Facile e l'orario pubblicato
    $('#gruppoFonte').hidden = !D.bozzaDisponibile;
    $('#sceltaFonte').value = D.fonte;
  }

  /* ---------- disegno della pagina ---------- */
  function aggiorna() {
    const a = adesso();
    ultimoMinuto = a.minuto;
    // Stato dei pulsanti
    $$('[data-colonne]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.colonne === stato.colonne)));
    Viste.FILTRI.forEach(k => { $('#filtro-' + k).value = stato.filtri[k]; });
    $('#btnAzzera').disabled = !Viste.FILTRI.some(k => stato.filtri[k]);
    $('#giorni').hidden = stato.colonne === 'giorno';
    $$('[data-giorno]').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.giorno === stato.giorno));
      b.classList.toggle('e-oggi', b.dataset.giorno === a.giorno);
    });
    document.body.classList.toggle('modalita-monitor', !!aulaMonitor);
    $('#titoloMonitor').textContent = aulaMonitor ? Dati.nome('aula', aulaMonitor) : '';

    // Messaggi
    const avvisi = [];
    const settimanaSenzaFiltro = stato.colonne === 'giorno' && !Viste.FILTRI.some(k => stato.filtri[k]);
    if (settimanaSenzaFiltro) avvisi.push('Per vedere la settimana scegli una classe, un docente o un\'aula.');
    else if (avvisoGiorno && stato.colonne !== 'giorno' && stato.giorno === avvisoGiorno.giorno) avvisi.push(avvisoGiorno.testo);

    const adessoTabella = { giorno: a.giorno, ora: a.ora };
    let n = 0;
    if (!settimanaSenzaFiltro) n = Viste.disegna($('#tabella'), D, stato, adessoTabella);
    if (!settimanaSenzaFiltro && n === 0) avvisi.push('Nessuna lezione per questa scelta. Prova a cambiare giorno o filtri.');
    $('#contenitoreTabella').hidden = settimanaSenzaFiltro || n === 0;
    $('#avviso').hidden = !avvisi.length;
    $('#avviso').textContent = avvisi.join(' ');

    const riquadro = Viste.riquadroAdesso(D, stato, a);
    $('#adesso').innerHTML = riquadro;
    $('#adesso').hidden = !riquadro;

    aggiornaOrologio();
    $('#piede').innerHTML = [
      D.aggiornato ? 'Orario aggiornato al ' + Viste.esc(new Date(D.aggiornato).toLocaleDateString('it-IT')) : '',
      D.offline ? '<strong>Senza connessione: stai vedendo l\'ultima copia salvata.</strong>' : '',
      utente.metodo === 'demo' ? '<strong>Modalità dimostrativa: accesso non verificato.</strong>' : '',
      D.fonte === 'bozza' ? 'Stai vedendo l’orario di <a href="../orario-facile/" target="orariofacile">Orario Facile</a> salvato su questo dispositivo: si aggiorna da solo mentre lo modifichi.' : ''
    ].filter(Boolean).join(' · ');
  }

  function aggiornaOrologio() {
    const d = new Date();
    $('#orologio').textContent = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' +
      d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  /* ---------- modalità monitor ---------- */
  function impostaMonitor(id) {
    aulaMonitor = id && D.mappa.aula.has(id) ? id : '';
    scrivi(CHIAVE_MONITOR, aulaMonitor);
    $('#sceltaMonitor').value = aulaMonitor;
    schermataIniziale();
  }

  // Sul monitor, dopo qualche minuto senza tocchi, si torna all'orario dell'aula
  function tocco() {
    clearTimeout(timerInattivita);
    if (!aulaMonitor) return;
    timerInattivita = setTimeout(() => { chiudiMenu(); schermataIniziale(); }, CONFIG.minutiRitornoMonitor * 60000);
  }

  /* ---------- menu utente ---------- */
  function apriMenu() { $('#menu').hidden = false; $('#btnUtente').setAttribute('aria-expanded', 'true'); $('#menu button, #menu select').focus(); }
  function chiudiMenu() { $('#menu').hidden = true; $('#btnUtente').setAttribute('aria-expanded', 'false'); }

  function collegaEventi() {
    $$('[data-colonne]').forEach(b => b.addEventListener('click', () => { stato.colonne = b.dataset.colonne; aggiorna(); }));
    Viste.FILTRI.forEach(k => $('#filtro-' + k).addEventListener('change', e => { stato.filtri[k] = e.target.value; aggiorna(); }));
    $('#btnAzzera').addEventListener('click', () => { stato.filtri = { classe: '', docente: '', aula: '' }; aggiorna(); });
    $('#giorni').addEventListener('click', e => {
      const b = e.target.closest('[data-giorno]');
      if (b) { stato.giorno = b.dataset.giorno; aggiorna(); }
    });
    $('#btnOggi').addEventListener('click', () => { const gi = giornoIniziale(); stato.giorno = gi.giorno; if (stato.colonne === 'giorno') stato.colonne = 'classe'; aggiorna(); mostraOraCorrente(); });
    $('#btnMioOrario').addEventListener('click', () => {
      stato.colonne = 'docente'; stato.filtri = { classe: '', docente: mioDocente.id, aula: '' };
      stato.giorno = giornoIniziale().giorno; aggiorna(); mostraOraCorrente();
    });
    $('#btnHome').addEventListener('click', schermataIniziale);

    $('#btnUtente').addEventListener('click', () => $('#menu').hidden ? apriMenu() : chiudiMenu());
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#menu').hidden) { chiudiMenu(); $('#btnUtente').focus(); } });
    document.addEventListener('click', e => { if (!$('#menu').hidden && !e.target.closest('#menu, #btnUtente')) chiudiMenu(); });
    $('#sceltaMonitor').addEventListener('change', e => { impostaMonitor(e.target.value); chiudiMenu(); });
    $('#btnSchermoIntero').addEventListener('click', () => {
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});
      chiudiMenu();
    });
    $('#btnRicarica').addEventListener('click', async () => { chiudiMenu(); await ricaricaDati(true); });
    $('#sceltaFonte').addEventListener('change', e => { Dati.impostaFonte(e.target.value); chiudiMenu(); ricaricaDati(true); });
    // Quando Orario Facile (aperto in un'altra scheda) salva, l'app si aggiorna subito
    window.addEventListener('storage', e => { if (e.key === Dati.CHIAVE_BOZZA) ricaricaDati(false); });
    $('#btnEsci').addEventListener('click', () => Accesso.esci());

    ['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, tocco, { passive: true }));
  }

  /* ---------- aggiornamenti automatici ---------- */
  async function ricaricaDati(manuale) {
    try {
      const fontePrima = D.fonte, filtri = Object.assign({}, stato.filtri);
      D = await Dati.carica();
      mioDocente = Dati.docentePerEmail(utente.email);
      preparaControlli();
      if (aulaMonitor && !D.mappa.aula.has(aulaMonitor)) aulaMonitor = '';
      $('#sceltaMonitor').value = aulaMonitor;
      // Cambiata la fonte (bozza <-> pubblicato): classi, docenti e aule sono diversi, si riparte
      if (D.fonte !== fontePrima) { schermataIniziale(); return; }
      // Stessa fonte aggiornata: tengo la vista, ma solo i filtri che esistono ancora
      Viste.FILTRI.forEach(k => { stato.filtri[k] = D.mappa[k].has(filtri[k]) ? filtri[k] : ''; });
      if (!D.giorni.includes(stato.giorno)) stato.giorno = giornoIniziale().giorno;
      aggiorna();
    } catch (e) {
      if (manuale) { $('#avviso').hidden = false; $('#avviso').textContent = 'Non è stato possibile aggiornare l’orario.'; }
    }
  }

  function avviaTimer() {
    // Ogni 20 secondi: se è cambiato il minuto ridisegno (per spostare l'evidenziazione dell'ora)
    setInterval(() => { if (adesso().minuto !== ultimoMinuto) aggiorna(); }, 20000);
    setInterval(() => ricaricaDati(false), CONFIG.minutiAggiornamentoDati * 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) aggiorna(); });
  }

  /* ---------- avvio ---------- */
  function mostraErroreAvvio(testo) {
    $('#caricamento').innerHTML = `<p>${Viste.esc(testo)}</p><button type="button" class="pulsante" onclick="location.reload()">Riprova</button>`;
  }

  async function dopoAccesso(s) {
    utente = s;
    $('#caricamento').hidden = false;
    try {
      D = await Dati.carica();
    } catch (e) {
      mostraErroreAvvio('Impossibile caricare l\'orario. Controlla la connessione.');
      return;
    }
    mioDocente = Dati.docentePerEmail(utente.email);

    // Monitor: si attiva con ?monitor=NomeAula nell'indirizzo, oppure dal menu
    const param = new URLSearchParams(location.search).get('monitor');
    let scelta = leggi(CHIAVE_MONITOR);
    if (param !== null) {
      const a = D.aula.find(x => x.id === param || semplifica(x.nome) === semplifica(param));
      scelta = a ? a.id : '';
      scrivi(CHIAVE_MONITOR, scelta);
    }
    aulaMonitor = scelta && D.mappa.aula.has(scelta) ? scelta : '';

    preparaControlli();
    $('#sceltaMonitor').value = aulaMonitor;
    collegaEventi();
    $('#caricamento').hidden = true;
    $('#app').hidden = false;
    schermataIniziale();
    avviaTimer();
    tocco();
  }

  // Service worker: permette di installare l'app e di usarla senza connessione
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* l'app funziona anche senza */ });
  }

  $('#caricamento').hidden = true;
  Accesso.avvia(dopoAccesso);
})();
