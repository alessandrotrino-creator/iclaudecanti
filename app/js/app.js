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
  const CHIAVE_BREVE = 'orariodada.breve';   // di chi si è scelto di vedere la giornata in "In breve"
  const CHIAVE_INGRESSO = 'orariodada.ingresso'; // schermo all'ingresso: secondi della rotazione ('' = no)
  const USO_INGRESSO = '__ingresso';         // valore della voce "Schermo all'ingresso" nel menu
  const NOMI_GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

  let D = null;             // dati dell'orario
  let utente = null;        // chi ha fatto l'accesso
  let mioDocente = null;    // il docente corrispondente all'utente (se c'è)
  let aulaMonitor = '';     // id dell'aula se questo dispositivo è un monitor di classe
  let secondiIngresso = 0;  // > 0 se questo dispositivo è lo schermo all'ingresso (viste a rotazione)
  let avvisoGiorno = null;  // { giorno, testo } es. "le lezioni di oggi sono finite"
  let ultimoMinuto = -1;
  let timerInattivita = null;
  let breveAperta = false;  // true quando si vede la vista "In breve" al posto della tabella
  // pagina: solo per lo schermo all'ingresso, quali colonne mostrare (null = tutte)
  const stato = { colonne: 'classe', giorno: '', filtri: { classe: '', docente: '', aula: '' }, pagina: null };

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
    apriBreve(false);
    const gi = giornoIniziale();
    stato.giorno = gi.giorno;
    avvisoGiorno = gi.testo ? gi : null;
    stato.filtri = { classe: '', docente: '', aula: '' };
    stato.pagina = null;
    // Schermo all'ingresso: parte la rotazione delle viste (ridisegna lei la pagina)
    if (secondiIngresso) { avviaRotazione(); return; }
    Ingresso.ferma();
    document.body.classList.remove('ingresso-in-pausa');
    if (aulaMonitor) { stato.colonne = 'aula'; stato.filtri.aula = aulaMonitor; }
    else if (mioDocente) { stato.colonne = 'docente'; stato.filtri.docente = mioDocente.id; }
    else stato.colonne = 'classe';
    aggiorna();
    mostraOraCorrente();
  }

  /* ---------- schermo all'ingresso: viste a rotazione (vedi ingresso.js) ---------- */
  function avviaRotazione() {
    document.body.classList.remove('ingresso-in-pausa');
    Ingresso.avvia({
      secondi: secondiIngresso,
      calcolaPassi: () => {
        // A ogni giro ricontrolla il giorno (es. finite le lezioni si passa a domani)
        const gi = giornoIniziale();
        stato.giorno = gi.giorno;
        avvisoGiorno = gi.testo ? gi : null;
        return Ingresso.passi(D, stato.giorno, $('#contenuto').clientWidth - 32);
      },
      mostra: (passo, indice, quanti) => {
        stato.colonne = passo.colonne;
        stato.pagina = passo.pagina;
        aggiorna();
        Ingresso.indicatore($('#indicatoreIngresso'), passo, indice, quanti, secondiIngresso);
      }
    });
  }

  // Qualcuno tocca lo schermo: la rotazione si ferma e si può usare l'app normalmente;
  // dopo qualche minuto senza tocchi riparte da sola (vedi tocco)
  function pausaRotazione() {
    Ingresso.ferma();
    stato.pagina = null;
    document.body.classList.add('ingresso-in-pausa');
    aggiorna();
  }

  // Secondi della rotazione validi (da 5 a 600), altrimenti quelli di config.js
  function secondiValidi(valore) {
    const n = parseInt(valore, 10);
    return n >= 5 && n <= 600 ? n : (CONFIG.secondiRotazioneIngresso || 20);
  }

  // L'utente sceglie ogni quanti secondi cambiano le viste: se il numero va bene lo salva
  // e fa ripartire la rotazione, altrimenti spiega cosa scrivere e rimette il valore di prima
  function impostaSecondi(valore) {
    const n = Number(String(valore).replace(',', '.'));
    const esito = $('#esitoSecondi');
    if (!Number.isInteger(n) || n < 5 || n > 600) {
      esito.textContent = 'Scrivi un numero intero di secondi, da 5 a 600.';
      esito.classList.add('errore-secondi');
      $('#sceltaSecondi').value = String(secondiIngresso);
      return;
    }
    secondiIngresso = n;
    scrivi(CHIAVE_INGRESSO, String(n));
    $('#sceltaSecondi').value = String(n);
    esito.classList.remove('errore-secondi');
    esito.textContent = `Fatto: la vista cambia ogni ${n} secondi.`;
    schermataIniziale();
  }

  // Valore della tendina "Uso di questo dispositivo"
  const valoreUso = () => secondiIngresso ? USO_INGRESSO : aulaMonitor;

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
    // Uso del dispositivo: personale, schermo all'ingresso o monitor di un'aula
    $('#sceltaMonitor').innerHTML = `<option value="">Dispositivo personale</option>` +
      `<option value="${USO_INGRESSO}">📺 Schermo all'ingresso (viste a rotazione)</option>` +
      `<optgroup label="Monitor dell'aula">` +
      D.aula.map(a => `<option value="${Viste.esc(a.id)}">${Viste.esc(a.nome)}</option>`).join('') + '</optgroup>';
    // Ogni quanti secondi cambia vista lo schermo all'ingresso
    $('#sceltaSecondi').value = String(secondiIngresso || secondiValidi(CONFIG.secondiRotazioneIngresso));
    $('#gruppoRotazione').hidden = !secondiIngresso;
    // Intestazione
    $('#infoScuola').textContent = [D.scuola, D.anno].filter(Boolean).join(' · ');
    $('#nomeUtente').textContent = utente.nome;
    $('#emailUtente').textContent = utente.email;
    $('#btnUtente').textContent = utente.nome.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
    $('#btnUtente').setAttribute('aria-label', 'Menu di ' + utente.nome);
    $('#btnMioOrario').hidden = !mioDocente;
    // "Modifica in Orario Facile" solo per chi può modificare l'orario (vedi ruoli.js)
    $('#linkOrarioFacile').hidden = true;
    Ruoli.puoModificare(utente.email).then(puo => { $('#linkOrarioFacile').hidden = !puo; });
    $('#btnSchermoIntero').hidden = !document.fullscreenEnabled;
    // Tema: la voce "secondo l'ora" mostra gli orari impostati in config.js
    $('#sceltaTema').value = Tema.scelta();
    $('#opzioneTemaOra').textContent = `Secondo l'ora (scuro dalle ${CONFIG.oraInizioScuro} alle ${CONFIG.oraFineScuro})`;
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
    document.body.classList.toggle('modalita-ingresso', !!secondiIngresso);
    $('#titoloMonitor').textContent = aulaMonitor ? Dati.nome('aula', aulaMonitor) : secondiIngresso ? 'Orario delle lezioni' : '';
    $('#indicatoreIngresso').hidden = !(secondiIngresso && Ingresso.attiva());

    // Messaggi
    const avvisi = [];
    if (secondiIngresso && !Ingresso.attiva()) {
      avvisi.push(`Rotazione delle viste in pausa: riparte da sola dopo ${CONFIG.minutiRitornoMonitor} minuti senza tocchi.`);
    }
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
    if (breveAperta) disegnaBreve();
    aggiornaIntervallo();
  }

  /* ---------- LIM: schermata dell'intervallo (vedi intervallo.js) ---------- */
  let intervalloChiuso = '';          // l'intervallo di oggi che qualcuno ha chiuso con il tasto "Chiudi"
  let apertaPerIntervallo = false;    // true se l'app è stata aperta dallo script della LIM (?intervallo)

  // Chiude la finestra se l'aveva aperta lo script della LIM (se il browser non lo permette, resta aperta)
  function chiudiFinestraIntervallo() {
    if (apertaPerIntervallo) window.close();
  }

  // Sulle LIM (monitor d'aula), durante l'intervallo mostra dove vanno le classi nell'ora dopo
  function aggiornaIntervallo() {
    const box = $('#schermataIntervallo');
    const a = adesso();
    const inizio = aulaMonitor && a.giorno
      ? Intervallo.inCorso(new Date(), CONFIG.intervalliLim, CONFIG.minutiSchermataIntervallo || 10)
      : null;
    const mostra = inizio && intervalloChiuso !== a.giorno + inizio &&
      Intervallo.disegna(box, D, a.giorno, aulaMonitor, inizio, Dati.nome);
    if (mostra) {
      box.hidden = false;
      document.body.classList.add('intervallo-aperto');
    } else if (!box.hidden) {
      box.hidden = true;
      document.body.classList.remove('intervallo-aperto');
      if (!inizio) chiudiFinestraIntervallo();   // intervallo finito
    }
  }

  /* ---------- vista "In breve" ---------- */
  // Di chi mostrare la giornata: la scelta salvata, altrimenti il docente che ha fatto
  // l'accesso, altrimenti il filtro attivo nella tabella (null = va scelto)
  function soggettoBreve() {
    const valido = s => s && D.mappa[s.tipo] && D.mappa[s.tipo].has(s.id) ? s : null;
    const salvato = leggi(CHIAVE_BREVE), i = salvato.indexOf('|');
    return valido(i > 0 ? { tipo: salvato.slice(0, i), id: salvato.slice(i + 1) } : null) ||
      (mioDocente ? { tipo: 'docente', id: mioDocente.id } : null) ||
      valido(['docente', 'classe', 'aula'].filter(k => stato.filtri[k]).map(k => ({ tipo: k, id: stato.filtri[k] }))[0]);
  }

  function disegnaBreve() {
    const gi = giornoIniziale(), s = soggettoBreve();
    Breve.disegna($('#vistaBreve'), {
      D, adesso: adesso(), giorno: gi.giorno, avviso: gi.testo, soggetto: s, nomeUtente: utente.nome,
      eIo: !!(s && mioDocente && s.tipo === 'docente' && s.id === mioDocente.id)
    });
  }

  // Apre (true) o chiude (false) la vista "In breve"; sui monitor di classe non si apre
  function apriBreve(apri) {
    breveAperta = apri && !aulaMonitor;
    document.body.classList.toggle('breve-aperta', breveAperta);
    $('#vistaBreve').hidden = !breveAperta;
    $('#btnBreve').setAttribute('aria-pressed', String(breveAperta));
    if (breveAperta) { disegnaBreve(); window.scrollTo(0, 0); $('#vistaBreve').focus({ preventScroll: true }); }
  }

  function aggiornaOrologio() {
    const d = new Date();
    $('#orologio').textContent = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' +
      d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  /* ---------- modalità monitor ---------- */
  // id = aula del monitor, USO_INGRESSO = schermo all'ingresso, '' = dispositivo personale
  function impostaMonitor(id) {
    secondiIngresso = id === USO_INGRESSO ? secondiValidi(leggi(CHIAVE_INGRESSO)) : 0;
    scrivi(CHIAVE_INGRESSO, secondiIngresso ? String(secondiIngresso) : '');
    aulaMonitor = id && D.mappa.aula.has(id) ? id : '';
    scrivi(CHIAVE_MONITOR, aulaMonitor);
    $('#sceltaMonitor').value = valoreUso();
    $('#gruppoRotazione').hidden = !secondiIngresso;
    $('#sceltaSecondi').value = String(secondiIngresso || secondiValidi(CONFIG.secondiRotazioneIngresso));
    $('#esitoSecondi').textContent = '';
    schermataIniziale();
  }

  // Sul monitor, dopo qualche minuto senza tocchi, si torna all'orario dell'aula.
  // Sullo schermo all'ingresso un tocco mette in pausa la rotazione, che riparte dopo
  // qualche minuto senza tocchi. (evento manca quando la chiama l'app all'avvio)
  function tocco(evento) {
    clearTimeout(timerInattivita);
    if (!aulaMonitor && !secondiIngresso) return;
    if (secondiIngresso) {
      if (!evento) return;                         // nessun tocco vero: la rotazione continua
      if (Ingresso.attiva()) pausaRotazione();
    }
    timerInattivita = setTimeout(() => { chiudiMenu(); schermataIniziale(); }, CONFIG.minutiRitornoMonitor * 60000);
  }

  /* ---------- menu utente ---------- */
  // All'apertura il focus va sul riquadro del menu e non sulla prima tendina:
  // sui telefoni una tendina che riceve il focus si aprirebbe da sola coprendo il menu.
  // Con la tastiera si passa alle voci con il tasto Tab.
  function apriMenu() { $('#menu').hidden = false; $('#btnUtente').setAttribute('aria-expanded', 'true'); $('#menu').focus(); }
  function chiudiMenu() { $('#menu').hidden = true; $('#btnUtente').setAttribute('aria-expanded', 'false'); }

  function collegaEventi() {
    $$('[data-colonne]').forEach(b => b.addEventListener('click', () => { stato.colonne = b.dataset.colonne; aggiorna(); }));
    Viste.FILTRI.forEach(k => $('#filtro-' + k).addEventListener('change', e => { stato.filtri[k] = e.target.value; aggiorna(); }));
    $('#btnAzzera').addEventListener('click', () => { stato.filtri = { classe: '', docente: '', aula: '' }; aggiorna(); });
    $('#giorni').addEventListener('click', e => {
      const b = e.target.closest('[data-giorno]');
      if (b) { stato.giorno = b.dataset.giorno; aggiorna(); }
    });
    // "In breve": il tasto apre e chiude; dentro la vista, "Tabella" chiude e la tendina sceglie di chi è la giornata
    $('#btnBreve').addEventListener('click', () => apriBreve(!breveAperta));
    $('#vistaBreve').addEventListener('click', e => {
      if (e.target.closest('#btnChiudiBreve')) { apriBreve(false); $('#btnBreve').focus(); }
    });
    $('#vistaBreve').addEventListener('change', e => {
      if (e.target.id !== 'sceltaBreve') return;
      scrivi(CHIAVE_BREVE, e.target.value);
      disegnaBreve();
      $('#sceltaBreve').focus();
    });
    $('#btnOggi').addEventListener('click', () => { apriBreve(false); const gi = giornoIniziale(); stato.giorno = gi.giorno; if (stato.colonne === 'giorno') stato.colonne = 'classe'; aggiorna(); mostraOraCorrente(); });
    $('#btnMioOrario').addEventListener('click', () => {
      apriBreve(false);
      stato.colonne = 'docente'; stato.filtri = { classe: '', docente: mioDocente.id, aula: '' };
      stato.giorno = giornoIniziale().giorno; aggiorna(); mostraOraCorrente();
    });
    $('#btnHome').addEventListener('click', schermataIniziale);

    $('#btnUtente').addEventListener('click', () => $('#menu').hidden ? apriMenu() : chiudiMenu());    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#menu').hidden) { chiudiMenu(); $('#btnUtente').focus(); } });
    document.addEventListener('click', e => { if (!$('#menu').hidden && !e.target.closest('#menu, #btnUtente')) chiudiMenu(); });
    $('#sceltaMonitor').addEventListener('change', e => { impostaMonitor(e.target.value); chiudiMenu(); });
    // Secondi della rotazione: si scrivono nel campo (conferma con Invio o uscendo dal campo)
    // oppure si regolano con − e + (di 5 in 5). Il menu resta aperto per altre prove.
    $('#sceltaSecondi').addEventListener('change', e => impostaSecondi(e.target.value));
    $('#menoSecondi').addEventListener('click', () => impostaSecondi(Math.max(5, (Math.ceil(secondiIngresso / 5) - 1) * 5)));
    $('#piuSecondi').addEventListener('click', () => impostaSecondi(Math.min(600, (Math.floor(secondiIngresso / 5) + 1) * 5)));
    $('#btnSchermoIntero').addEventListener('click', () => {
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});
      chiudiMenu();
    });
    $('#btnRicarica').addEventListener('click', async () => { chiudiMenu(); await ricaricaDati(true); });
    $('#sceltaTema').addEventListener('change', e => Tema.imposta(e.target.value));
    $('#sceltaFonte').addEventListener('change', e => { Dati.impostaFonte(e.target.value); chiudiMenu(); ricaricaDati(true); });
    // Quando Orario Facile (aperto in un'altra scheda) salva, l'app si aggiorna subito
    window.addEventListener('storage', e => { if (e.key === Dati.CHIAVE_BOZZA) ricaricaDati(false); });
    $('#btnEsci').addEventListener('click', () => Accesso.esci());
    // "Chiudi" nella schermata dell'intervallo: non ricompare fino al prossimo intervallo
    $('#schermataIntervallo').addEventListener('click', e => {
      if (!e.target.closest('#chiudiIntervallo')) return;
      const box = $('#schermataIntervallo');
      intervalloChiuso = adesso().giorno + box.dataset.intervallo;
      box.hidden = true;
      document.body.classList.remove('intervallo-aperto');
      chiudiFinestraIntervallo();
    });

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
      $('#sceltaMonitor').value = valoreUso();
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
    const parametri = new URLSearchParams(location.search);
    const param = parametri.get('monitor');
    let scelta = leggi(CHIAVE_MONITOR);
    if (param !== null) {
      const a = D.aula.find(x => x.id === param || semplifica(x.nome) === semplifica(param));
      scelta = a ? a.id : '';
      scrivi(CHIAVE_MONITOR, scelta);
      scrivi(CHIAVE_INGRESSO, '');
    }
    // Schermo all'ingresso: si attiva con ?ingresso (o ?ingresso=30 per 30 secondi), oppure dal menu
    const paramIngresso = parametri.get('ingresso');
    if (paramIngresso !== null) {
      scrivi(CHIAVE_INGRESSO, String(secondiValidi(paramIngresso)));
      scrivi(CHIAVE_MONITOR, '');
      scelta = '';
    }
    aulaMonitor = scelta && D.mappa.aula.has(scelta) ? scelta : '';
    secondiIngresso = !aulaMonitor && leggi(CHIAVE_INGRESSO) ? secondiValidi(leggi(CHIAVE_INGRESSO)) : 0;
    // LIM: lo script di Windows apre l'app all'intervallo con ?intervallo (vedi app/lim/)
    apertaPerIntervallo = parametri.has('intervallo');

    preparaControlli();
    $('#sceltaMonitor').value = valoreUso();
    collegaEventi();
    Campanella.avvia(() => D);   // tasto campanella (vedi campanella.js)
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
