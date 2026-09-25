/*
  registro-drive.js – il Foglio Google delle sostituzioni (ID in app/js/config.js, campo "fileSostituzioni").

  Il foglio ha due fogli (schede in basso):
  - "Autorizzazioni" (va bene anche "Abilitazioni"): nomi ed email di chi può fare le sostituzioni.
    L'email si cerca in qualsiasi cella; nome e cognome si prendono dalle colonne con quei titoli.
  - "Sostituzioni": qui l'app scrive una riga per ogni sostituzione assegnata
    (e la cancella se la sostituzione viene annullata). Se il foglio è vuoto, l'app scrive
    prima la riga di intestazione; se c'è già, riempie le colonne con lo stesso nome.

  La vera protezione la fa Google: chi non ha il permesso di aprire il file non può leggerlo,
  e chi non ha il permesso di modificarlo non può scriverci.
  Usa i permessi di Google di app/js/nomi.js (NomiDocenti.gettone), che restano solo in memoria.
*/
const RegistroDrive = (() => {
  const API = 'https://sheets.googleapis.com/v4/spreadsheets/';
  const PERMESSO_FOGLI = 'https://www.googleapis.com/auth/spreadsheets';
  // Nomi accettati per i due fogli (senza badare a maiuscole, spazi e accenti)
  const FOGLIO_AUTORIZZAZIONI = ['autorizzazioni', 'abilitazioni', 'autorizzati', 'abilitati'];
  const FOGLIO_SOSTITUZIONI = ['sostituzioni', 'registro', 'registrosostituzioni'];
  // Colonne che l'app scrive nel foglio "Sostituzioni" (se il foglio è vuoto, questa è l'intestazione)
  const COLONNE = ['Data', 'Giorno', 'Ora', 'Classe', 'Aula', 'Materia', 'Docente assente', 'Docente sostituto', 'Inserita da', 'Inserita il', 'ID'];

  const permessi = () => [NomiDocenti.PERMESSO_DRIVE, PERMESSO_FOGLI];
  const id = () => (typeof CONFIG !== 'undefined' && CONFIG.fileSostituzioni) || '';
  const configurato = () => !!id() && typeof NomiDocenti !== 'undefined';
  // Vero se c'è già il permesso di Google in memoria (si può controllare senza aprire finestre)
  const pronto = () => configurato() && !!NomiDocenti.gettoneDisponibile(permessi());
  // "Docente assente" -> "docenteassente": per confrontare le intestazioni senza badare a spazi e maiuscole
  const semplice = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9@.]/g, '');
  const tra = nome => `'${nome.replace(/'/g, "''")}'`;

  function spiega(stato, testo) {
    if (/has not been used|is disabled|accessNotConfigured|SERVICE_DISABLED/i.test(testo))
      return 'nel progetto Google Cloud va attivata la "Google Sheets API"';
    if (stato === 404) return 'foglio delle sostituzioni non trovato, oppure il tuo account non può aprirlo';
    if (stato === 403) return 'il tuo account non ha il permesso su questo foglio delle sostituzioni';
    if (stato === 401) return 'il permesso di Google è scaduto: riprova';
    return 'errore ' + stato + ' da Google';
  }

  async function chiama(percorso, opzioni) {
    const o = opzioni || {};
    const t = await NomiDocenti.gettone(permessi(), o.email);
    const r = await fetch(API + encodeURIComponent(id()) + percorso, {
      method: o.metodo || 'GET',
      headers: Object.assign({ Authorization: 'Bearer ' + t }, o.corpo ? { 'Content-Type': 'application/json' } : {}),
      body: o.corpo ? JSON.stringify(o.corpo) : undefined
    });
    const testo = await r.text();
    if (!r.ok) { const e = new Error(spiega(r.status, testo)); e.stato = r.status; throw e; }
    return testo ? JSON.parse(testo) : {};
  }

  // I fogli (schede) del file: [{ titolo, idFoglio }]
  let fogliRicordati = null;
  async function fogli(email) {
    if (!fogliRicordati) {
      const info = await chiama('?fields=sheets.properties(title,sheetId)', { email });
      fogliRicordati = info.sheets.map(s => ({ titolo: s.properties.title, idFoglio: s.properties.sheetId }));
    }
    return fogliRicordati;
  }
  // Trova il foglio con uno dei nomi accettati; se non c'è, l'errore elenca i fogli che ci sono davvero
  async function trova(nomi, email) {
    const tutti = await fogli(email);
    const f = tutti.find(x => nomi.includes(semplice(x.titolo)));
    if (!f) {
      const primo = nomi[0].charAt(0).toUpperCase() + nomi[0].slice(1);
      throw new Error(`nel file delle sostituzioni manca il foglio "${primo}" (ci sono: ${tutti.map(x => '«' + x.titolo + '»').join(', ')})`);
    }
    return f;
  }

  /*
    Controlla se l'email è nel foglio "Autorizzazioni".
    Restituisce { abilitato: true/false, nome } oppure lancia un errore con la spiegazione.
    Se l'account non può aprire il file (403/404), vuol dire che non è abilitato.
  */
  async function abilitazione(email) {
    const mia = semplice(email);
    if (!mia) return { abilitato: false, nome: '' };
    let righe;
    try {
      const f = await trova(FOGLIO_AUTORIZZAZIONI, email);
      righe = (await chiama('/values/' + encodeURIComponent(tra(f.titolo)), { email })).values || [];
    } catch (e) {
      if (e.stato === 403 || e.stato === 404) return { abilitato: false, nome: '', motivo: 'il tuo account non può aprire il foglio delle autorizzazioni' };
      throw e;
    }
    // L'email si cerca in QUALSIASI cella (così va bene anche se la colonna ha un altro titolo
    // o se sopra l'intestazione c'è una riga con un titolo)
    // (una cella può contenere anche altro testo, es. "Mario Rossi <mario.rossi@…>": si guardano le email dentro)
    const emailDentro = c => (String(c || '').toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g) || []).map(semplice);
    const riga = righe.find(r => r.some(c => emailDentro(c).includes(mia)));
    if (!riga) return { abilitato: false, nome: '' };
    // Per il nome: la riga di intestazione è la prima che contiene "mail", altrimenti la prima riga
    const intestazione = (righe.find(r => r.some(c => semplice(c).includes('mail'))) || righe[0] || []).map(semplice);
    // (attenzione: "cognome" contiene la parola "nome", quindi lo escludiamo)
    const cNome = intestazione.findIndex(x => (x.includes('nome') && !x.includes('cognome')) || x.includes('docente'));
    const cCognome = intestazione.findIndex(x => x.includes('cognome'));
    const nome = [cNome >= 0 ? riga[cNome] : '', cCognome >= 0 ? riga[cCognome] : '']
      .filter(Boolean).join(' ').trim();
    return { abilitato: true, nome };
  }

  // Intestazione del foglio "Sostituzioni": se è vuota scrive quella dell'app. Restituisce l'elenco delle colonne
  async function intestazione(f, email) {
    const r = await chiama('/values/' + encodeURIComponent(tra(f.titolo) + '!1:1'), { email });
    const esistente = ((r.values || [])[0] || []).map(x => String(x || '').trim());
    if (esistente.some(Boolean)) return esistente;
    await chiama('/values/' + encodeURIComponent(tra(f.titolo) + '!A1') + '?valueInputOption=RAW',
      { metodo: 'PUT', corpo: { values: [COLONNE] }, email });
    return COLONNE.slice();
  }

  /*
    Aggiunge una riga al foglio "Sostituzioni".
    dati = { Data, Giorno, Ora, Classe, Aula, Materia, 'Docente assente', 'Docente sostituto', 'Inserita da', 'Inserita il', ID }
    Ogni valore va nella colonna con lo stesso nome (senza badare a maiuscole e spazi).
  */
  async function aggiungi(dati, email) {
    const f = await trova(FOGLIO_SOSTITUZIONI, email);
    const colonne = await intestazione(f, email);
    const perNome = new Map(Object.entries(dati).map(([k, v]) => [semplice(k), v]));
    const riga = colonne.map(c => { const v = perNome.get(semplice(c)); return v === undefined ? '' : String(v); });
    // Se qualche dato non ha una colonna con lo stesso nome, lo mettiamo in fondo (così non si perde)
    Object.entries(dati).forEach(([k, v]) => { if (!colonne.some(c => semplice(c) === semplice(k))) riga.push(k + ': ' + v); });
    await chiama('/values/' + encodeURIComponent(tra(f.titolo) + '!A1') + ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS',
      { metodo: 'POST', corpo: { values: [riga] }, email });
  }

  // Cancella dal foglio "Sostituzioni" la riga con questo ID (colonna "ID"). Restituisce true se l'ha trovata
  async function togli(idSostituzione, email) {
    const f = await trova(FOGLIO_SOSTITUZIONI, email);
    const righe = (await chiama('/values/' + encodeURIComponent(tra(f.titolo)), { email })).values || [];
    const cId = (righe[0] || []).findIndex(x => semplice(x) === 'id');
    if (cId < 0) return false;
    const n = righe.findIndex((r, i) => i > 0 && String(r[cId] || '') === String(idSostituzione));
    if (n < 0) return false;
    await chiama(':batchUpdate', {
      metodo: 'POST', email,
      corpo: { requests: [{ deleteDimension: { range: { sheetId: f.idFoglio, dimension: 'ROWS', startIndex: n, endIndex: n + 1 } } }] }
    });
    return true;
  }

  return { configurato, pronto, abilitazione, aggiungi, togli, permessi };
})();
