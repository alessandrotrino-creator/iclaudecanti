/*
  storie.js – le modifiche dell'orario "in stile storie", come su Instagram.

  - Storie.fila(storie): l'HTML della fila di cerchi (colorati = da vedere, grigi = già visti)
  - Storie.apri(storie, indice, opzioni): apre il visualizzatore a tutto schermo
      * ogni storia dura qualche secondo (barrette in alto), poi passa da sola alla successiva
      * tocco a destra = avanti, a sinistra = indietro; ⏸ ferma e riprende; ✕ o Esc chiude
      * da tastiera: frecce destra/sinistra, spazio = pausa, Esc = chiudi
      * opzioni.quandoVista(id) viene chiamata quando una storia viene mostrata,
        opzioni.quandoChiusa() quando si chiude

  Ogni storia è { id, cerchio: '1ª', sotto: '1A', titolo: '1ª ora · 1A', corpo: '<html>', vista, tua }.
  Il "corpo" è già HTML pronto (e già protetto) preparato da app.js.
*/
const Storie = (() => {
  const SECONDI = 6;          // quanto dura ogni storia
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Chi ha chiesto meno animazioni: le storie non scorrono da sole (si va avanti col tocco)
  const menoMovimento = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let elenco = [], i = 0, opzioni = {};
  let timer = null, inizio = 0, restante = 0, inPausa = false;
  let visore = null, focusPrima = null;

  // La fila di cerchi da mettere sopra l'orario
  function fila(storie) {
    return '<ul class="storie-fila">' + storie.map((s, k) =>
      `<li><button type="button" class="storia-cerchio${s.vista ? ' vista' : ''}${s.tua ? ' tua' : ''}" data-storia="${k}"` +
      ` aria-label="${esc(s.titolo)}${s.vista ? ', già vista' : ', da vedere'}">` +
      `<span class="storia-anello"><span class="storia-interno">${esc(s.cerchio)}</span></span>` +
      `<span class="storia-nome">${esc(s.sotto)}</span></button></li>`).join('') + '</ul>';
  }

  // Il visualizzatore viene creato una volta sola e poi riusato
  function prepara() {
    if (visore) return;
    visore = document.createElement('div');
    visore.id = 'visoreStorie';
    visore.className = 'visore-storie';
    visore.setAttribute('role', 'dialog');
    visore.setAttribute('aria-modal', 'true');
    visore.setAttribute('aria-label', 'Modifiche all\'orario');
    visore.hidden = true;
    visore.innerHTML = `
      <div class="storie-barre" aria-hidden="true"></div>
      <div class="storie-testa">
        <span class="storie-conteggio"></span>
        <button type="button" class="storie-pulsante" data-azione="pausa" aria-label="Metti in pausa">⏸</button>
        <button type="button" class="storie-pulsante" data-azione="chiudi" aria-label="Chiudi">✕</button>
      </div>
      <div class="storia-contenuto" aria-live="polite"></div>
      <button type="button" class="storie-zona indietro" data-azione="indietro" aria-label="Storia precedente"></button>
      <button type="button" class="storie-zona avanti" data-azione="avanti" aria-label="Storia successiva"></button>`;
    document.body.append(visore);
    visore.addEventListener('click', e => {
      const b = e.target.closest('[data-azione]');
      if (!b) return;
      ({ pausa: pausaRiprendi, chiudi, indietro, avanti })[b.dataset.azione]();
    });
    visore.addEventListener('keydown', e => {
      if (e.key === 'Escape') chiudi();
      else if (e.key === 'ArrowRight') avanti();
      else if (e.key === 'ArrowLeft') indietro();
      else if (e.key === ' ' && !e.target.closest('button')) { e.preventDefault(); pausaRiprendi(); }
      else return;
      e.preventDefault();
    });
  }

  function mostra(k) {
    clearTimeout(timer);
    i = k;
    const s = elenco[i];
    // Barrette: quelle prima sono piene, quella attuale si riempie in SECONDI secondi
    visore.querySelector('.storie-barre').innerHTML = elenco.map((_, j) =>
      `<span class="storie-barra${j < i ? ' piena' : ''}">${j === i ? `<span class="storie-riempimento" style="animation-duration:${SECONDI}s"></span>` : ''}</span>`).join('');
    visore.querySelector('.storie-conteggio').textContent = `${s.titolo} · ${i + 1} di ${elenco.length}`;
    visore.querySelector('.storia-contenuto').innerHTML = s.corpo;
    visore.classList.toggle('storia-tua', !!s.tua);
    if (opzioni.quandoVista) opzioni.quandoVista(s.id);
    restante = SECONDI * 1000;
    if (!inPausa) avviaTimer();
    aggiornaPausa();
  }

  function avviaTimer() {
    inizio = Date.now();
    timer = setTimeout(avanti, restante);
  }

  function pausaRiprendi() {
    if (inPausa) { inPausa = false; avviaTimer(); }
    else { inPausa = true; clearTimeout(timer); restante -= Date.now() - inizio; }
    aggiornaPausa();
  }

  function aggiornaPausa() {
    visore.classList.toggle('in-pausa', inPausa);
    const b = visore.querySelector('[data-azione="pausa"]');
    b.textContent = inPausa ? '▶' : '⏸';
    b.setAttribute('aria-label', inPausa ? 'Riprendi' : 'Metti in pausa');
  }

  function avanti() { if (i < elenco.length - 1) mostra(i + 1); else chiudi(); }
  function indietro() { mostra(Math.max(0, i - 1)); }

  function apri(storie, indice, opz) {
    if (!storie.length) return;
    prepara();
    elenco = storie;
    opzioni = opz || {};
    inPausa = menoMovimento();
    focusPrima = document.activeElement;
    visore.hidden = false;
    document.body.classList.add('storie-aperte');
    mostra(Math.min(Math.max(0, indice || 0), storie.length - 1));
    visore.querySelector('[data-azione="chiudi"]').focus();
  }

  function chiudi() {
    if (!visore || visore.hidden) return;
    clearTimeout(timer);
    visore.hidden = true;
    document.body.classList.remove('storie-aperte');
    if (opzioni.quandoChiusa) opzioni.quandoChiusa();
    if (focusPrima && document.contains(focusPrima)) focusPrima.focus();
  }

  return { fila, apri, chiudi };
})();
