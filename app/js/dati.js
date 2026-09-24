/*
  dati.js – carica il file dell'orario e lo trasforma in un formato unico,
  comodo per le viste: un elenco di "lezioni" { giorno, ora, classe, materia, docente, aula }.
*/
const Dati = (() => {
  const CHIAVE_COPIA = 'orariodada.copiaDati';
  // Orario Facile salva il suo lavoro qui. Le due app stanno sullo stesso sito,
  // quindi condividono la memoria del browser e possiamo leggerlo direttamente.
  const CHIAVE_BOZZA = 'orariofacile.v2';
  // Quale orario mostrare: '' = automatico (la bozza se c'è), 'bozza' o 'pubblicato'
  const CHIAVE_FONTE = 'orariodada.fonte';

  // Toglie accenti e simboli: "Nicolò D'Amico" -> "nicolo damico"
  function semplifica(testo) {
    return String(testo || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  }

  // Indirizzo presunto di un docente a partire dal nome: "Anna Rossi" -> "anna.rossi"
  function emailDaNome(nome) {
    return semplifica(nome).split(/\s+/).filter(Boolean).join('.');
  }

  // Ordina "1A, 1B, 2A, 10A" in modo naturale
  const confronta = (a, b) => a.nome.localeCompare(b.nome, 'it', { numeric: true });
  // Cognome = ultima parola del nome (serve solo per ordinare i docenti)
  const cognome = nome => String(nome).trim().split(/\s+/).pop();

  function hhmm(minuti) {
    return String(Math.floor(minuti / 60) % 24).padStart(2, '0') + ':' + String(minuti % 60).padStart(2, '0');
  }

  // Converte il backup JSON esportato da Orario Facile nel formato dell'app
  function daOrarioFacile(S) {
    const oreM = S.oreM || 0, totale = oreM + (S.oreP || 0);
    const durata = (S.meta && S.meta.durata) || 60;
    const [h, m] = ((S.meta && S.meta.inizio) || '08:00').split(':').map(Number);
    const ore = [];
    for (let i = 0; i < totale; i++) {
      // Orario Facile mette un'ora di pausa pranzo prima delle ore pomeridiane
      const inizio = h * 60 + m + i * durata + (i >= oreM ? 60 : 0);
      ore.push({ n: i + 1, inizio: hhmm(inizio), fine: hhmm(inizio + durata) });
    }
    const lezioni = [];
    (S.classi || []).forEach(c => (S.giorni || []).forEach(g => {
      const riga = ((S.orario || {})[c.id] || {})[g] || [];
      riga.forEach((v, s) => {
        if (!v || !v.doc) return;
        // Salta le celle fuori dall'orario della classe (stessa regola di Orario Facile)
        const cfg = c.g && c.g[g];
        if (cfg && !(s >= oreM ? (s - oreM) < (cfg.p || 0) : s < (cfg.m || 0))) return;
        const d = (S.discipline || []).find(x => x.id === v.dis);
        lezioni.push({ giorno: g, ora: s + 1, classe: c.id, materia: d ? d.nome : '', docente: v.doc, aula: v.aula || '' });
      });
    }));
    return {
      scuola: S.meta && S.meta.nome, anno: S.meta && S.meta.anno, aggiornato: S.pubblicato || '',
      giorni: S.giorni, ore,
      classi: (S.classi || []).map(c => ({ id: c.id, nome: c.nome })),
      docenti: (S.docenti || []).map(t => ({ id: t.id, nome: t.nome, email: t.email || '' })),
      aule: (S.aule || []).map(a => ({ id: a.id, nome: a.nome })),
      lezioni
    };
  }

  // Controlla il file e prepara gli indici per cercare velocemente classi, docenti e aule
  function normalizza(json) {
    let o;
    if (json && Array.isArray(json.lezioni)) o = json;
    else if (json && json.orario && json.classi) o = daOrarioFacile(json);
    else throw new Error('Il file dell\'orario non ha un formato riconosciuto.');

    const elenco = (lista, conEmail) => (lista || []).map(x => {
      const e = typeof x === 'string' ? { id: x, nome: x } : Object.assign({}, x);
      e.id = String(e.id || e.nome); e.nome = String(e.nome || e.id);
      if (conEmail) e.email = String(e.email || '').toLowerCase();
      return e;
    });
    const D = {
      scuola: o.scuola || '', anno: o.anno || '', aggiornato: o.aggiornato || '',
      giorni: o.giorni && o.giorni.length ? o.giorni : ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'],
      ore: (o.ore || []).map((x, i) => ({ n: Number(x.n || i + 1), inizio: x.inizio || '', fine: x.fine || '' })),
      classe: elenco(o.classi).sort(confronta),
      docente: elenco(o.docenti, true).sort((a, b) => cognome(a.nome).localeCompare(cognome(b.nome), 'it') || confronta(a, b)),
      aula: elenco(o.aule).sort(confronta),
      lezioni: o.lezioni.map(l => ({
        giorno: l.giorno, ora: Number(l.ora), materia: l.materia || '',
        classe: String(l.classe || ''), docente: String(l.docente || ''), aula: String(l.aula || '')
      }))
    };
    // Se nel file mancano le ore, le ricava dalle lezioni (1ª dalle 8, un'ora ciascuna)
    if (!D.ore.length) {
      const max = Math.max(0, ...D.lezioni.map(l => l.ora));
      for (let n = 1; n <= max; n++) D.ore.push({ n, inizio: hhmm((7 + n) * 60), fine: hhmm((8 + n) * 60) });
    }
    // Mappe id -> oggetto, per trovare subito i nomi
    D.mappa = {};
    ['classe', 'docente', 'aula'].forEach(k => {
      D.mappa[k] = new Map(D[k].map(e => [e.id, e]));
      // Voci citate nelle lezioni ma non elencate: le aggiungiamo per non perderle
      D.lezioni.forEach(l => {
        if (l[k] && !D.mappa[k].has(l[k])) { const e = { id: l[k], nome: l[k], email: '' }; D[k].push(e); D.mappa[k].set(l[k], e); }
      });
    });
    return D;
  }

  let D = null;

  const leggi = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
  const fonte = () => leggi(CHIAVE_FONTE);
  function impostaFonte(valore) {
    try { valore ? localStorage.setItem(CHIAVE_FONTE, valore) : localStorage.removeItem(CHIAVE_FONTE); } catch (e) { /* ignorato */ }
  }

  // La bozza di Orario Facile su questo dispositivo (null se non c'è o non ha ancora lezioni)
  function leggiBozza() {
    try {
      const testo = leggi(CHIAVE_BOZZA);
      if (!testo) return null;
      const B = normalizza(JSON.parse(testo));
      return B.lezioni.length ? B : null;
    } catch (e) { return null; }
  }

  // Scarica l'orario pubblicato (dati/orario.json); se non c'è rete usa l'ultima copia salvata
  async function caricaPubblicato() {
    let P;
    try {
      const r = await fetch(CONFIG.urlDati, { cache: 'no-cache' });
      if (!r.ok) throw new Error('Errore ' + r.status);
      const testo = await r.text();
      P = normalizza(JSON.parse(testo));
      P.offline = false;
      try { localStorage.setItem(CHIAVE_COPIA, testo); } catch (e) { /* spazio pieno o bloccato: pazienza */ }
    } catch (errore) {
      const copia = leggi(CHIAVE_COPIA);
      if (!copia) throw errore;
      P = normalizza(JSON.parse(copia));
      P.offline = true;
    }
    return P;
  }

  // Sceglie l'orario da mostrare: la bozza di Orario Facile (se c'è e non si è scelto
  // "pubblicato") oppure il file pubblicato
  async function carica() {
    const bozza = leggiBozza();
    if (bozza && fonte() !== 'pubblicato') {
      D = bozza;
      D.fonte = 'bozza';
    } else {
      try {
        D = await caricaPubblicato();
      } catch (errore) {
        if (!bozza) throw errore;
        D = bozza;                 // niente rete e niente copia: meglio la bozza che niente
      }
      D.fonte = D === bozza ? 'bozza' : 'pubblicato';
    }
    D.bozzaDisponibile = !!bozza;
    return D;
  }

  // Trova il docente che corrisponde all'email di chi ha fatto l'accesso
  function docentePerEmail(email) {
    if (!D || !email) return null;
    email = email.toLowerCase();
    const locale = email.split('@')[0];
    return D.docente.find(t => t.email === email) ||
      D.docente.find(t => {
        const parti = emailDaNome(t.nome).split('.');
        // accetta sia nome.cognome sia cognome.nome
        return parti.join('.') === locale || parti.slice().reverse().join('.') === locale;
      }) || null;
  }

  const nome = (tipo, id) => { const e = D && D.mappa[tipo].get(id); return e ? e.nome : id; };

  return { carica, get: () => D, docentePerEmail, nome, emailDaNome, normalizza, fonte, impostaFonte, CHIAVE_BOZZA };
})();
