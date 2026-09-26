/*
  cambi-aula.js – modulo «Cambi d'aula»: spostare una classe in un'altra aula SOLO IN UN GIORNO
  (aula inagibile, verifica comune, laboratorio occupato…). L'orario base non cambia.

  - Si sceglie la classe e le ore; vengono proposte solo le aule LIBERE in tutte quelle ore,
    tenendo conto delle lezioni e degli altri cambi dello stesso giorno (un'aula lasciata libera
    da una classe spostata diventa disponibile).
  - Lo possono usare solo gli autorizzati del foglio «Autorizzazioni» (lo stesso controllo delle sostituzioni).
  - I cambi restano nella memoria del browser (chiave "sostituzioni.cambiAula", condivisa tra Orario Facile
    e l'app) e vengono scritti anche nel foglio «Cambi aula» del Foglio Google delle sostituzioni
    (se non c'è, l'app lo crea), con il nome vero del docente. Annullando, la riga viene cancellata.

  Si usa dentro la scheda Sostituzioni di Orario Facile e nella pagina «Sostituzioni smart» dell'app:
    CambiAula.disegna(elemento, "2026-09-28", 'scheda' | 'smart')
  Le regole e l'autorizzazione arrivano dal motore delle sostituzioni (Sostituzioni.motore()).
*/
const CambiAula = (() => {
  let cambi = Archivio.leggi('cambiAula', []);   // [{ id, data, ora, classe, da, a, materia, docente, motivo, nelRegistro }]
  const inCorso = new Set();                     // cambi con un'operazione in corso sul foglio (niente doppi tocchi)
  const viste = new Map();                       // elemento -> { iso, stile } (per ridisegnarle)
  // Modulo: restano scelti anche quando la pagina si ridisegna
  const scelta = { classe: '', ore: null, aula: '', motivo: '' };

  const m = () => Sostituzioni.motore();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nuovoId = () => 'ca' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const salva = () => { if (!Archivio.scrivi('cambiAula', cambi)) m().avvisa('Attenzione: non riesco a salvare i cambi d\'aula su questo dispositivo.'); };

  // ---------- Regole ----------
  const cambiDel = iso => cambi.filter(c => c.data === iso).sort((a, b) => a.ora - b.ora || String(a.classe).localeCompare(String(b.classe), 'it', { numeric: true }));

  // Le lezioni di una classe in un giorno (una per ora; con i gruppi possono essere più di una)
  function lezioniClasse(giorno, classe) {
    const D = m().orario();
    return D.lezioni.filter(l => l.giorno === giorno && l.classe === classe).sort((a, b) => a.ora - b.ora);
  }

  // Il cambio (se c'è) di quella lezione in quel giorno
  const cambioDi = (iso, l) => cambi.find(c => c.data === iso && c.ora === l.ora && c.classe === l.classe && c.da === l.aula);

  // Vero se l'aula è occupata a quell'ora di quel giorno: da una lezione che resta lì o da un altro cambio.
  // "tranne" = la classe che stiamo spostando (le sue lezioni non contano)
  function occupata(iso, giorno, ora, aula, tranne) {
    const D = m().orario();
    const quelGiorno = cambi.filter(c => c.data === iso && c.ora === ora);
    const lezione = D.lezioni.some(l => l.giorno === giorno && l.ora === ora && l.aula === aula && l.classe !== tranne &&
      !quelGiorno.some(c => c.classe === l.classe && c.da === l.aula));   // se quella classe è stata spostata, l'aula è libera
    const altroCambio = quelGiorno.some(c => c.a === aula && c.classe !== tranne);
    return lezione || altroCambio;
  }

  // Le aule libere in tutte le ore scelte (esclusa l'aula dove la classe è già)
  function auleLibere(iso, giorno, classe, lezioni) {
    const D = m().orario();
    const gia = new Set(lezioni.map(l => l.aula));
    return D.aula.filter(a => !gia.has(a.id) && lezioni.every(l => !occupata(iso, giorno, l.ora, a.id, classe)));
  }

  // ---------- Azioni ----------
  function permesso() {
    if (m().stato().puoFare) return true;
    m().avvisa('Solo chi è nel foglio «Autorizzazioni» può fare i cambi d\'aula: prima verifica la tua autorizzazione.');
    return false;
  }

  async function scriviNelRegistro(c) {
    if (typeof RegistroDrive === 'undefined' || !RegistroDrive.configurato()) return false;
    const mo = m();
    try {
      await mo.preparaNomiVeri();
      const giorno = mo.giornoOrario(c.data) || '';
      await RegistroDrive.aggiungi({
        'Data': c.data.split('-').reverse().join('/'), 'Giorno': giorno, 'Ora': mo.testoOra(c.ora),
        'Classe': mo.nome('classe', c.classe), 'Materia': c.materia || '', 'Docente': c.docente ? mo.nomeVero(c.docente) : '',
        'Aula prevista': mo.nome('aula', c.da), 'Nuova aula': mo.nome('aula', c.a), 'Motivo': c.motivo || '',
        'Inserito da': mo.stato().abilitazione.nome || mo.email(), 'Inserito il': new Date().toLocaleString('it-IT'), 'ID': c.id
      }, mo.email(), 'cambi');
      return true;
    } catch (errore) {
      console.error(errore);
      mo.avvisa('Il cambio d\'aula è registrato, ma non ho potuto scriverlo nel foglio «Cambi aula»: ' + errore.message + '.');
      return false;
    }
  }

  async function togliDalRegistro(c) {
    if (!c.nelRegistro || typeof RegistroDrive === 'undefined' || !RegistroDrive.configurato()) return true;
    try { await RegistroDrive.togli(c.id, m().email(), 'cambi'); return true; }
    catch (errore) { console.error(errore); m().avvisa('Non ho potuto togliere il cambio dal foglio «Cambi aula»: ' + errore.message + '. Correggi il foglio a mano.'); return false; }
  }

  // Registra il cambio per le lezioni scelte (una riga per ora)
  async function registra(iso, lezioni, aula, motivo) {
    if (!permesso()) return false;
    const mo = m();
    const nuovi = [];
    for (const l of lezioni) {
      const vecchio = cambioDi(iso, l);
      if (vecchio) { await togliDalRegistro(vecchio); cambi = cambi.filter(x => x !== vecchio); }   // si sostituisce il cambio vecchio
      const c = { id: nuovoId(), data: iso, ora: l.ora, classe: l.classe, da: l.aula, a: aula, materia: l.materia || '', docente: l.docente || '', motivo: motivo || '', nelRegistro: false };
      cambi.push(c);
      nuovi.push(c);
      inCorso.add(c.id);
    }
    salva();
    const testo = `Cambio d'aula: ${mo.nome('classe', lezioni[0].classe)} in ${mo.nome('aula', aula)} (${lezioni.map(l => l.ora + 'ª').join(', ')} ora).`;
    mo.avvisa(testo);
    ridisegna();
    let scritti = 0;
    try {
      for (const c of nuovi) if (await scriviNelRegistro(c)) { c.nelRegistro = true; scritti++; }
      salva();
      if (scritti) mo.avvisa(testo + ' Scritto nel foglio «Cambi aula».');
    } finally {
      nuovi.forEach(c => inCorso.delete(c.id));
      ridisegna();
    }
    return true;
  }

  async function annulla(c) {
    if (!permesso() || inCorso.has(c.id)) return;
    inCorso.add(c.id);
    ridisegna();
    try {
      if (!(await togliDalRegistro(c)) && !confirm('Non riesco a togliere il cambio dal foglio «Cambi aula». Annullarlo comunque? Poi correggi il foglio a mano.')) return;
      cambi = cambi.filter(x => x.id !== c.id);
      salva();
      m().avvisa(`Cambio d'aula annullato: ${m().nome('classe', c.classe)} torna in ${m().nome('aula', c.da)} (${c.ora}ª ora).`);
    } finally {
      inCorso.delete(c.id);
      ridisegna();
    }
  }

  // ---------- Disegno ----------
  // Classi dei pulsanti e dei campi: la scheda di Orario Facile e la pagina smart hanno stili diversi
  const CLASSI = {
    scheda: { btn: 'btn ghost sm', primario: 'btn', campo: '', ora: 'ca-ora', scheda: 'ca-blocco' },
    smart: { btn: 'pulsante', primario: 'pulsante primario', campo: 'campo-smart', ora: 'ca-ora ora-smart', scheda: 'scheda-breve ca-blocco' }
  };

  function disegna(box, iso, stile) {
    if (!box || typeof Sostituzioni === 'undefined') return;
    viste.set(box, { iso, stile });
    if (!box.dataset.caCollegato) { box.dataset.caCollegato = '1'; box.addEventListener('click', clic); box.addEventListener('change', cambio); }
    const mo = m(), D = mo.orario();
    if (!D) { box.innerHTML = ''; return; }
    const k = CLASSI[stile] || CLASSI.scheda;
    const giorno = mo.giornoOrario(iso);
    if (!giorno) { box.innerHTML = `<p class="vuoto-breve hint">In questo giorno non ci sono lezioni.</p>`; return; }
    const classi = D.classe;
    if (scelta.classe && !D.mappa.classe.has(scelta.classe)) scelta.classe = '';
    const opzioniClassi = '<option value="">— scegli la classe da spostare —</option>' +
      classi.map(c => `<option value="${esc(c.id)}"${c.id === scelta.classe ? ' selected' : ''}>${esc(c.nome)}</option>`).join('');

    let moduloOre = '';
    if (scelta.classe) {
      const lezioni = lezioniClasse(giorno, scelta.classe);
      if (!lezioni.length) moduloOre = '<p class="vuoto-breve hint">Questa classe non ha lezioni in questo giorno.</p>';
      else {
        // chiave di ogni lezione: ora|aula (con i gruppi la stessa ora può avere più aule)
        const chiave = l => l.ora + '|' + l.aula;
        if (!scelta.ore) scelta.ore = new Set();
        const scelte = lezioni.filter(l => scelta.ore.has(chiave(l)));
        const libere = scelte.length ? auleLibere(iso, giorno, scelta.classe, scelte) : [];
        if (scelta.aula && !libere.some(a => a.id === scelta.aula)) scelta.aula = '';
        moduloOre = `<fieldset class="ca-ore"><legend>Ore da spostare</legend>` + lezioni.map(l => {
            const c = cambioDi(iso, l);
            return `<label class="${k.ora}"><input type="checkbox" data-ca-ora="${esc(chiave(l))}"${scelta.ore.has(chiave(l)) ? ' checked' : ''}>
              <span><b>${l.ora}ª</b> ${esc(l.materia || '')} · ${esc(mo.nome('aula', c ? c.a : l.aula))}${c ? ' (spostata)' : ''}</span></label>`;
          }).join('') + '</fieldset>' +
          (scelte.length
            ? (libere.length
              ? `<label class="ca-etichetta" for="caAula">Nuova aula (libera in tutte le ore scelte)</label>
                 <select id="caAula" class="${k.campo}"><option value="">— scegli l'aula —</option>` +
                 libere.map(a => `<option value="${esc(a.id)}"${a.id === scelta.aula ? ' selected' : ''}>${esc(a.nome)}</option>`).join('') + `</select>
                 <label class="ca-etichetta" for="caMotivo">Motivo (facoltativo)</label>
                 <input type="text" id="caMotivo" class="${k.campo}" maxlength="120" placeholder="es. aula inagibile, verifica comune" value="${esc(scelta.motivo)}">
                 <button type="button" class="${k.primario}" data-ca="registra">Registra il cambio d'aula</button>`
              : '<p class="vuoto-breve hint">⚠️ Nessuna aula libera in tutte le ore scelte: prova a scegliere meno ore.</p>')
            : '<p class="vuoto-breve hint">Tocca le ore da spostare.</p>');
      }
    }

    const elenco = cambiDel(iso);
    const lista = elenco.length
      ? '<ul class="ca-elenco">' + elenco.map(c => {
          const occupato = inCorso.has(c.id);
          return `<li><span><b>${c.ora}ª · ${esc(mo.nome('classe', c.classe))}</b> ${esc(mo.nome('aula', c.da))} → <b>${esc(mo.nome('aula', c.a))}</b>${c.motivo ? ' · ' + esc(c.motivo) : ''}</span>
            <button type="button" class="${k.btn}" data-ca="annulla" data-id="${esc(c.id)}"${occupato ? ' disabled' : ''}>${occupato ? 'Aggiorno il foglio…' : 'Annulla'}</button></li>`;
        }).join('') + '</ul>'
      : '<p class="vuoto-breve hint">Nessun cambio d\'aula in questo giorno.</p>';

    // Ricordo il campo che aveva il focus, per rimetterlo dopo il nuovo disegno
    const focus = document.activeElement && box.contains(document.activeElement) ? document.activeElement.id : '';
    box.innerHTML = `<div class="${k.scheda}">
      ${stile === 'smart' ? '<div class="riga-breve"><span class="pill-breve">Cambi d\'aula</span></div>' : ''}
      <label class="ca-etichetta" for="caClasse">Classe</label>
      <select id="caClasse" class="${k.campo}">${opzioniClassi}</select>
      ${moduloOre}
      ${lista}
    </div>`;
    if (focus && document.getElementById(focus)) document.getElementById(focus).focus();
  }

  function ridisegna() {
    viste.forEach((v, box) => { if (box.isConnected) disegna(box, v.iso, v.stile); else viste.delete(box); });
    // la stampa del giorno della scheda contiene anche i cambi: ridisegniamo tutto il motore
    if (typeof Sostituzioni !== 'undefined') m().ridisegna();
  }

  function clic(e) {
    const b = e.target.closest('[data-ca]');
    if (!b) return;
    const box = e.currentTarget, v = viste.get(box);
    if (!v) return;
    if (b.dataset.ca === 'registra') {
      const giorno = m().giornoOrario(v.iso);
      const lezioni = lezioniClasse(giorno, scelta.classe).filter(l => scelta.ore && scelta.ore.has(l.ora + '|' + l.aula));
      const aula = box.querySelector('#caAula') && box.querySelector('#caAula').value;
      if (!lezioni.length) { m().avvisa('Tocca almeno un\'ora da spostare.'); return; }
      if (!aula) { m().avvisa('Scegli la nuova aula.'); return; }
      const motivo = (box.querySelector('#caMotivo') || {}).value || '';
      b.disabled = true;
      registra(v.iso, lezioni, aula, motivo.trim()).then(ok => { if (ok) { scelta.classe = ''; scelta.ore = null; scelta.aula = ''; scelta.motivo = ''; ridisegna(); } });
    } else if (b.dataset.ca === 'annulla') {
      const c = cambi.find(x => x.id === b.dataset.id);
      if (c) annulla(c);
    }
  }

  function cambio(e) {
    const t = e.target, box = e.currentTarget, v = viste.get(box);
    if (!v) return;
    if (t.id === 'caClasse') { scelta.classe = t.value; scelta.ore = null; scelta.aula = ''; disegna(box, v.iso, v.stile); }
    else if (t.dataset.caOra) {
      if (!scelta.ore) scelta.ore = new Set();
      t.checked ? scelta.ore.add(t.dataset.caOra) : scelta.ore.delete(t.dataset.caOra);
      disegna(box, v.iso, v.stile);   // le aule libere dipendono dalle ore scelte
    } else if (t.id === 'caAula') scelta.aula = t.value;
    else if (t.id === 'caMotivo') scelta.motivo = t.value;
  }

  // Tabella dei cambi del giorno, per la stampa ('' se non ce ne sono)
  function tabellaStampa(iso) {
    const elenco = cambiDel(iso);
    if (!elenco.length || typeof Sostituzioni === 'undefined') return '';
    const mo = m();
    return `<table class="sost-tabella"><caption>Cambi d'aula</caption><thead><tr><th scope="col">Ora</th><th scope="col">Classe</th>
      <th scope="col">Materia</th><th scope="col">Aula prevista</th><th scope="col">Nuova aula</th><th scope="col">Motivo</th></tr></thead><tbody>` +
      elenco.map(c => `<tr><th scope="row">${esc(mo.testoOra(c.ora))}</th><td>${esc(mo.nome('classe', c.classe))}</td><td>${esc(c.materia)}</td>
        <td>${esc(mo.nome('aula', c.da))}</td><td><b>${esc(mo.nome('aula', c.a))}</b></td><td>${esc(c.motivo)}</td></tr>`).join('') + '</tbody></table>';
  }

  // Se i cambi cambiano in un'altra scheda del browser (Orario Facile o l'app), ci aggiorniamo
  window.addEventListener('storage', e => {
    if (!Archivio.eNostra(e.key) || !/cambiAula$/.test(e.key)) return;
    cambi = Archivio.leggi('cambiAula', []);
    ridisegna();
  });

  return { disegna, cambiDel, tabellaStampa };
})();
