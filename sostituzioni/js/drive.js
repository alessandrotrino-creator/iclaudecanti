/*
  drive.js – il foglio del conteggio ore direttamente su Google Drive (ID in config.js, campo "fileConteggioOre").

  - Lettura: si scarica il foglio con il permesso dell'utente e lo si interpreta come un file caricato
    (Foglio.interpreta). Funziona anche se su Drive c'è un file Excel.
  - Scrittura: quando si assegna una sostituzione si aggiunge +1 nella cella del docente che sostituisce,
    nella colonna della settimana (e -1 se la si annulla). Google permette di scrivere solo nei veri
    Fogli Google: un file Excel va prima convertito (in Fogli: File > Salva come Fogli Google).
  - Una cella che contiene una formula non viene mai toccata: quell'ora va riportata a mano.

  Usa i permessi di Google di app/js/nomi.js (NomiDocenti.gettone), che restano solo in memoria.
*/
const FoglioDrive = (() => {
  const PERMESSO_FOGLI = 'https://www.googleapis.com/auth/spreadsheets';
  const API = 'https://sheets.googleapis.com/v4/spreadsheets/';
  const permessi = () => [NomiDocenti.PERMESSO_DRIVE, PERMESSO_FOGLI];

  const id = () => (typeof CONFIG !== 'undefined' && CONFIG.fileConteggioOre) || '';
  const configurato = () => !!id() && typeof NomiDocenti !== 'undefined';
  // Vero se c'è già il permesso di Google in memoria (si può lavorare senza aprire finestre)
  const pronto = () => configurato() && !!NomiDocenti.gettoneDisponibile(permessi());

  function spiega(stato, testo) {
    if (/has not been used|is disabled|accessNotConfigured|SERVICE_DISABLED/i.test(testo))
      return /sheets/i.test(testo) ? 'nel progetto Google Cloud va attivata la "Google Sheets API"'
        : 'nel progetto Google Cloud va attivata la "Google Drive API"';
    if (/not supported for this document/i.test(testo))
      return 'il foglio su Drive è un file Excel: aprilo in Fogli e usa File > Salva come Fogli Google';
    if (stato === 404) return 'foglio del conteggio non trovato, oppure il tuo account non può aprirlo';
    if (stato === 403) return 'il tuo account non ha il permesso di modificare il foglio del conteggio';
    if (stato === 401) return 'il permesso di Google è scaduto: riprova';
    return 'errore ' + stato + ' da Google';
  }

  async function chiama(url, opzioni) {
    const t = await NomiDocenti.gettone(permessi(), opzioni && opzioni.email);
    const r = await fetch(url, {
      method: (opzioni && opzioni.metodo) || 'GET',
      headers: Object.assign({ Authorization: 'Bearer ' + t }, opzioni && opzioni.corpo ? { 'Content-Type': 'application/json' } : {}),
      body: opzioni && opzioni.corpo ? JSON.stringify(opzioni.corpo) : undefined
    });
    const testo = await r.text();
    if (!r.ok) { const e = new Error(spiega(r.status, testo)); e.stato = r.status; e.dettaglio = testo; throw e; }
    return testo ? JSON.parse(testo) : {};
  }

  // Un file Excel su Drive: lo scarichiamo e lo leggiamo come se fosse stato scelto dal computer
  async function leggiExcel(email) {
    const base = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id());
    const t = await NomiDocenti.gettone(permessi(), email);
    const info = await fetch(base + '?fields=name&supportsAllDrives=true', { headers: { Authorization: 'Bearer ' + t } });
    if (!info.ok) throw new Error(spiega(info.status, await info.text()));
    const { name } = await info.json();
    const r = await fetch(base + '?alt=media&supportsAllDrives=true', { headers: { Authorization: 'Bearer ' + t } });
    if (!r.ok) throw new Error(spiega(r.status, await r.text()));
    const nomeFile = /\.(xlsx|ods|csv)$/i.test(name) ? name : name + '.xlsx';
    const f = await Foglio.leggiFile(new File([await r.arrayBuffer()], nomeFile));
    return Object.assign(f, { driveId: id(), soloLettura: true });
  }

  // Legge il foglio del conteggio: restituisce lo stesso oggetto di Foglio.leggiFile, più driveId
  async function leggi(email) {
    let info;
    try {
      info = await chiama(API + encodeURIComponent(id()) + '?fields=properties.title,sheets.properties.title', { email });
    } catch (e) {
      if (/file Excel/.test(e.message) || e.stato === 400) return leggiExcel(email);
      throw e;
    }
    const titoli = info.sheets.map(s => s.properties.title);
    const q = titoli.map(t => 'ranges=' + encodeURIComponent(`'${t.replace(/'/g, "''")}'`)).join('&');
    const valori = await chiama(API + encodeURIComponent(id()) + '/values:batchGet?valueRenderOption=UNFORMATTED_VALUE&' + q, { email });
    const fogli = valori.valueRanges.map((v, k) => ({ nome: titoli[k], righe: v.values || [] }));
    return Object.assign(Foglio.interpreta(fogli, info.properties.title), { driveId: id(), soloLettura: false });
  }

  // "D5" a partire da riga e colonna (0 = prima riga / colonna A)
  function cella(riga, colonna) {
    let lettere = '', n = colonna + 1;
    while (n > 0) { const m = (n - 1) % 26; lettere = String.fromCharCode(65 + m) + lettere; n = Math.floor((n - 1) / 26); }
    return lettere + (riga + 1);
  }

  /*
    Aggiunge "quante" (+1 o -1) alla cella di un docente in una settimana.
    Restituisce il nuovo valore; lancia un errore (con .formula = true se la cella contiene una formula)
  */
  async function aggiungi(foglio, rigaDocente, settimana, quante, email) {
    if (foglio.soloLettura) throw new Error('il foglio su Drive è un file Excel: aprilo in Fogli e usa File > Salva come Fogli Google');
    const colonna = foglio.colonne && foglio.colonne[settimana];
    if (colonna === undefined) throw new Error(`nel foglio non c'è la colonna della settimana ${settimana}`);
    const intervallo = `'${foglio.foglio.replace(/'/g, "''")}'!${cella(rigaDocente.riga, colonna)}`;
    const base = API + encodeURIComponent(foglio.driveId) + '/values/' + encodeURIComponent(intervallo);
    // prima si legge la cella com'è scritta: se è una formula non la tocchiamo
    const attuale = await chiama(base + '?valueRenderOption=FORMULA', { email });
    const v = ((attuale.values || [])[0] || [])[0];
    if (typeof v === 'string' && v.trim().startsWith('=')) {
      const e = new Error(`la cella ${cella(rigaDocente.riga, colonna)} contiene una formula: riporta l'ora a mano`);
      e.formula = true;
      throw e;
    }
    const numero = typeof v === 'number' ? v : Number(String(v === undefined ? '' : v).replace(',', '.').replace('−', '-')) || 0;
    const nuovo = numero + quante;
    await chiama(base + '?valueInputOption=RAW', { metodo: 'PUT', corpo: { range: intervallo, values: [[nuovo]] }, email });
    return nuovo;
  }

  // Indirizzo della cella di un docente in una settimana, es. "G14" (vuoto se la settimana non c'è nel foglio):
  // serve per dire all'utente dove è stata scritta l'ora
  function indirizzo(foglio, rigaDocente, settimana) {
    const colonna = foglio && foglio.colonne && foglio.colonne[settimana];
    return colonna === undefined ? '' : cella(rigaDocente.riga, colonna);
  }

  return { configurato, pronto, leggi, aggiungi, permessi, indirizzo };
})();
