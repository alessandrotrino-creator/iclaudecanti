/*
  nomi.js – i nomi veri dei docenti, letti da un file riservato su Google Drive.

  Il repository è pubblico, quindi nell'orario i docenti sono solo codici (DOC01, DOC02…).
  La corrispondenza codice → nome è in un file su Drive condiviso solo con il personale autorizzato
  (ID in config.js, campo "fileNomiDocenti"). Chi ha il permesso di aprirlo può vedere i nomi:
  la pagina chiede a Google di leggere Drive a nome dell'utente e scarica il file.
  Se l'account non ha accesso al file, Google rifiuta e restano i codici.

  I nomi restano SOLO IN MEMORIA: mai in localStorage, mai nei backup o nei file pubblicati.
  Il file può essere un CSV (Codice;Cognome;Nome) o un Foglio Google con le stesse colonne.
*/
const NomiDocenti = (() => {
  const PERMESSO = 'https://www.googleapis.com/auth/drive.readonly';
  let libreria = null;

  // La libreria di Google per i permessi (la stessa dell'accesso, se è già caricata non la ricarica)
  function caricaLibreria() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    if (!libreria) {
      libreria = new Promise((ok, ko) => {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.onload = ok;
        s.onerror = () => { libreria = null; ko(new Error('non riesco a contattare Google (sei in rete?)')); };
        document.head.append(s);
      });
    }
    return libreria;
  }

  // Chiede a Google un "gettone" per leggere Drive (la prima volta compare la richiesta di consenso)
  function gettone(email) {
    return new Promise((ok, ko) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.googleClientId,
        scope: PERMESSO,
        hd: CONFIG.dominio,
        login_hint: email || '',
        callback: r => r.error ? ko(new Error(r.error_description || r.error)) : ok(r.access_token),
        error_callback: e => ko(new Error(e && e.type === 'popup_closed' ? 'la finestra di Google è stata chiusa'
          : e && e.type === 'popup_failed_to_open' ? 'il browser ha bloccato la finestra di Google: consenti i popup'
          : 'Google non ha dato il permesso'))
      });
      client.requestAccessToken({ prompt: '' });
    });
  }

  function spiega(stato, testo) {
    if (stato === 404) return 'file non trovato, oppure il tuo account non ha il permesso di aprirlo';
    if (stato === 403 && /has not been used|is disabled|accessNotConfigured/i.test(testo))
      return 'nel progetto Google Cloud va attivata la "Google Drive API"';
    if (stato === 403) return 'il tuo account non ha il permesso di leggere il file dei nomi';
    if (stato === 401) return 'il permesso di Google è scaduto: riprova';
    return 'errore ' + stato + ' da Google Drive';
  }

  async function scarica(t) {
    const base = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(CONFIG.fileNomiDocenti);
    const intestazioni = { Authorization: 'Bearer ' + t };
    const info = await fetch(base + '?fields=mimeType&supportsAllDrives=true', { headers: intestazioni });
    if (!info.ok) throw new Error(spiega(info.status, await info.text()));
    const { mimeType } = await info.json();
    // un Foglio Google si "esporta" in CSV; un file caricato (CSV) si scarica così com'è
    const url = mimeType === 'application/vnd.google-apps.spreadsheet'
      ? base + '/export?mimeType=text/csv'
      : base + '?alt=media&supportsAllDrives=true';
    const r = await fetch(url, { headers: intestazioni });
    if (!r.ok) throw new Error(spiega(r.status, await r.text()));
    const byte = new Uint8Array(await r.arrayBuffer());
    let testo = new TextDecoder('utf-8').decode(byte);
    if (testo.includes('�')) testo = new TextDecoder('windows-1252').decode(byte);   // salvato da Excel
    return testo.replace(/^﻿/, '');
  }

  // "ROMBOLA'" → "Rombolà", "D'ALESSANDRO" → "D'Alessandro", "DI STEFANO" → "Di Stefano"
  function bello(s) {
    const accento = { a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù' };
    return String(s || '').trim().toLowerCase()
      .replace(/([aeiou])['’](?=\s|$)/g, (m, v) => accento[v])
      .replace(/(^|[\s'’-])(\p{L})/gu, (m, prima, lettera) => prima + lettera.toUpperCase());
  }

  // Map "DOC01" → { cognome, nome }
  function interpreta(testo) {
    const righe = testo.split(/\r?\n/).filter(r => r.trim());
    if (!righe.length) throw new Error('il file dei nomi è vuoto');
    const sep = [';', '\t', ','].sort((a, b) => righe[0].split(b).length - righe[0].split(a).length)[0];
    const celle = r => r.split(sep).map(x => x.trim().replace(/^"|"$/g, ''));
    const int = celle(righe[0]).map(x => x.toLowerCase());
    const cC = int.indexOf('codice'), cCo = int.indexOf('cognome'), cN = int.indexOf('nome');
    if (cC < 0 || cCo < 0) throw new Error('nel file dei nomi servono le colonne Codice e Cognome (e Nome)');
    const mappa = new Map();
    righe.slice(1).forEach(r => {
      const c = celle(r), codice = (c[cC] || '').toUpperCase();
      if (codice && c[cCo]) mappa.set(codice, { cognome: bello(c[cCo]), nome: cN >= 0 ? bello(c[cN]) : '' });
    });
    if (!mappa.size) throw new Error('nel file dei nomi non ci sono docenti');
    return mappa;
  }

  // Restituisce la mappa dei nomi, oppure lancia un errore con una spiegazione in italiano
  async function carica(email) {
    if (typeof CONFIG === 'undefined' || !CONFIG.fileNomiDocenti) throw new Error('in config.js manca l\'ID del file dei nomi');
    if (!CONFIG.googleClientId) throw new Error('in config.js manca l\'ID client di Google');
    await caricaLibreria();
    return interpreta(await scarica(await gettone(email)));
  }

  return { carica, interpreta, bello };
})();
