/*
  brief.js – vista "In breve": la giornata di una classe, di un docente o di un'aula a schede.

  Si apre con il tasto "In breve" nella barra in alto (on demand: la tabella resta com'è).
  Mostra, in quest'ordine:
  1. Adesso: la lezione in corso, con l'AULA in grande e quanto manca alla fine dell'ora.
  2. Dopo:   la lezione successiva e, se l'aula cambia, "spostati da ... a ..."
             (in una scuola DADA sono gli studenti a cambiare aula).
  3. Il resto della giornata, come schede piccole da scorrere.
  I colori della testata cambiano con il momento della giornata (mattina, pomeriggio, sera).
*/
const Breve = (() => {
  const esc = s => Viste.esc(s);
  const NOMI_GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const minuti = hhmm => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };
  // Icona della puntina per l'aula (disegnata in SVG, non viene letta dai lettori di schermo)
  const ICONA_AULA = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';

  // Momento della giornata in base ai minuti dalla mezzanotte
  const momento = m => m < 13 * 60 ? 'mattina' : m < 18 * 60 ? 'pomeriggio' : 'sera';
  const SALUTI = { mattina: 'Buongiorno', pomeriggio: 'Buon pomeriggio', sera: 'Buonasera' };

  // Data del giorno mostrato, es. "oggi, giovedì 24 settembre" o "domani, venerdì 25 settembre"
  function data(giorno) {
    const d = new Date();
    for (let i = 0; i < 7; i++) {
      if (NOMI_GIORNI[d.getDay()] === giorno) {
        const testo = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
        return (i === 0 ? 'Oggi, ' : i === 1 ? 'Domani, ' : '') + testo;
      }
      d.setDate(d.getDate() + 1);
    }
    return giorno;
  }

  // Menu a tendina per scegliere di chi vedere la giornata (classi, docenti, aule)
  function scelta(D, soggetto) {
    const valore = soggetto ? soggetto.tipo + '|' + soggetto.id : '';
    const gruppo = (tipo, titolo) => `<optgroup label="${titolo}">` +
      D[tipo].map(e => { const v = tipo + '|' + e.id; return `<option value="${esc(v)}"${v === valore ? ' selected' : ''}>${esc(e.nome)}</option>`; }).join('') +
      '</optgroup>';
    return `<label class="scelta-breve" for="sceltaBreve"><span>Giornata di</span>
      <select id="sceltaBreve">${soggetto ? '' : '<option value="" selected>Scegli…</option>'}${gruppo('classe', 'Classi')}${gruppo('docente', 'Docenti')}${gruppo('aula', 'Aule')}</select></label>`;
  }

  // Descrizione di una lezione: le informazioni che non sono già nel "soggetto"
  function dettagli(l, tipo) {
    const parti = [];
    if (tipo !== 'classe' && l.classe) parti.push('classe ' + Dati.nome('classe', l.classe));
    if (tipo !== 'docente' && l.docente) parti.push(Dati.nome('docente', l.docente));
    return parti.join(' · ');
  }

  // Scheda grande (Adesso / Dopo) con una o più lezioni della stessa ora (compresenze)
  function scheda(classe, etichetta, orario, lezioni, tipo, extra) {
    const righe = lezioni.map(l => `
      <div class="riga-breve"><span class="materia-breve">${esc(l.materia || '—')}</span><span class="dettagli-breve">${esc(dettagli(l, tipo))}</span></div>
      ${tipo !== 'aula' && l.aula ? `<span class="aula-breve">${ICONA_AULA}<span class="solo-lettori">Aula: </span>${esc(Dati.nome('aula', l.aula))}</span>` : ''}`).join('');
    return `<article class="scheda-breve ${classe}">
      <div class="riga-breve"><span class="pill-breve">${etichetta}</span><span class="dettagli-breve">${esc(orario)}</span></div>
      ${righe}${extra || ''}</article>`;
  }

  /*
    Disegna la vista nell'elemento indicato.
    c = { D, adesso: { giorno, ora, minuto }, giorno, avviso, soggetto: { tipo, id } | null, nomeUtente, eIo }
  */
  function disegna(el, c) {
    const { D, adesso, giorno, soggetto } = c;
    const mom = momento(adesso.minuto);
    const oggi = adesso.giorno === giorno;
    const nomeOra = o => `${o.n}ª ora · ${o.inizio}–${o.fine}`;
    const oraDi = n => D.ore.find(o => o.n === n);

    // Testata con saluto e data
    const nome = c.eIo ? ', ' + String(c.nomeUtente).split(/\s+/)[0] : '';
    let html = `<div class="testata-breve" data-momento="${mom}">
      <div class="riga-testata"><span class="marchio-breve">In breve</span>
        <button type="button" id="btnChiudiBreve" class="pulsante pulsante-tabella">Tabella</button></div>
      <h2 id="titoloBreve">${SALUTI[mom]}${esc(nome)}</h2>
      <p class="data-breve">${esc(data(giorno))}</p>
      ${c.avviso ? `<p class="avviso-breve">${esc(c.avviso)}</p>` : ''}
      ${scelta(D, soggetto)}
    </div><div class="schede-breve">`;

    if (!soggetto) {
      html += '<article class="scheda-breve"><p class="vuoto-breve">Scegli qui sopra una classe, un docente o un’aula per vedere la sua giornata.</p></article></div>';
      el.innerHTML = html;
      return;
    }

    // Lezioni del giorno per questo soggetto, raggruppate per ora
    const perOra = new Map();
    D.lezioni.filter(l => l.giorno === giorno && l[soggetto.tipo] === soggetto.id).forEach(l => {
      if (!perOra.has(l.ora)) perOra.set(l.ora, []);
      perOra.get(l.ora).push(l);
    });
    const numeri = [...perOra.keys()].sort((a, b) => a - b);
    const nomeSoggetto = Dati.nome(soggetto.tipo, soggetto.id);

    if (!numeri.length) {
      html += `<article class="scheda-breve"><p class="vuoto-breve">Nessuna lezione per ${esc(nomeSoggetto)} in questo giorno.</p></article></div>`;
      el.innerHTML = html;
      return;
    }

    // 1. Adesso
    if (oggi && adesso.ora) {
      const o = oraDi(adesso.ora);
      const inizio = minuti(o.inizio), fine = minuti(o.fine);
      const mancano = Math.max(0, fine - adesso.minuto);
      const percento = Math.min(100, Math.max(0, Math.round((adesso.minuto - inizio) / (fine - inizio) * 100)));
      const tempo = `<div class="tempo-breve"><div class="barra-tempo" role="progressbar" aria-label="Ora in corso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percento}"><i style="width:${percento}%"></i></div>
        <span class="dettagli-breve">mancano ${mancano} min</span></div>`;
      const inCorso = perOra.get(adesso.ora);
      if (inCorso) html += scheda('scheda-adesso', 'Adesso', nomeOra(o), inCorso, soggetto.tipo, tempo);
      else if (adesso.ora > numeri[0] && adesso.ora < numeri[numeri.length - 1]) {
        html += `<article class="scheda-breve scheda-adesso"><div class="riga-breve"><span class="pill-breve">Adesso</span><span class="dettagli-breve">${esc(nomeOra(o))}</span></div>
          <span class="materia-breve">Ora libera</span>${tempo}</article>`;
      }
    }

    // 2. Dopo: la prima ora con lezioni che non è ancora cominciata
    const future = numeri.filter(n => !oggi || minuti(oraDi(n).inizio) > adesso.minuto);
    if (future.length) {
      const n = future[0], o = oraDi(n), prossime = perOra.get(n);
      let etichetta = 'Prima lezione';
      if (oggi && adesso.ora) etichetta = 'Dopo';
      else if (oggi) etichetta = 'Tra ' + (minuti(o.inizio) - adesso.minuto) + ' min';
      // In DADA si cambia aula: confronto con l'aula dell'ultima lezione prima di questa
      let sposta = '';
      const prima = oggi ? numeri.filter(x => x < n && minuti(oraDi(x).inizio) <= adesso.minuto).pop() : null;
      if (soggetto.tipo !== 'aula' && prima) {
        const da = perOra.get(prima)[0].aula, a = prossime[0].aula;
        // La freccia non viene letta: al suo posto i lettori di schermo dicono "verso"
        if (da && a && da !== a) sposta = `<p class="spostati-breve">Al cambio dell’ora si cambia aula: <b>${esc(Dati.nome('aula', da))}</b> <span aria-hidden="true">→</span><span class="solo-lettori">verso</span> <b>${esc(Dati.nome('aula', a))}</b></p>`;
      }
      html += scheda('scheda-dopo', etichetta, nomeOra(o), prossime, soggetto.tipo, sposta);
    } else if (oggi) {
      html += '<article class="scheda-breve"><p class="vuoto-breve">Lezioni di oggi finite. Buon riposo!</p></article>';
    }
    html += '</div>';

    // 3. Il resto della giornata: dalla prima all'ultima ora con lezioni (le ore vuote sono "libere")
    const ore = D.ore.filter(o => o.n >= numeri[0] && o.n <= numeri[numeri.length - 1]);
    html += `<h3 class="titoletto-breve">${oggi ? 'Il resto della giornata' : 'La giornata'}</h3><ol class="giornata-breve">` + ore.map(o => {
      const lez = perOra.get(o.n) || [];
      const fatta = oggi && minuti(o.fine) <= adesso.minuto;
      const ora = oggi && adesso.ora === o.n;
      const stato = [lez.length ? '' : 'libera', fatta ? 'fatta' : '', ora ? 'in-corso' : ''].filter(Boolean).join(' ');
      const testo = lez.length
        ? lez.map(l => `<b>${esc(l.materia || '—')}</b><span>${esc(soggetto.tipo === 'aula' ? Dati.nome('classe', l.classe) : Dati.nome('aula', l.aula))}</span>`).join('')
        : '<b>Libera</b>';
      return `<li class="mini-breve ${stato}"><span class="n-breve">${o.n}ª · ${esc(o.inizio)}</span>${testo}${ora ? '<span class="solo-lettori"> (in corso)</span>' : ''}</li>`;
    }).join('') + '</ol>';

    el.innerHTML = html;
  }

  return { disegna };
})();
