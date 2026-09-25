/*
  config.js – impostazioni dell'app (l'unico file da modificare per configurarla)
*/
window.CONFIG = {
  // Indirizzo pubblico dell'app, usato per condividerla con i colleghi.
  // Se cambia, va rigenerato anche il QR code in icone/qr-app.svg (vedi LEGGIMI.md).
  indirizzoApp: 'https://alessandrotrino-creator.github.io/iclaudecanti/app/',

  // Solo gli account di questo dominio possono entrare
  dominio: 'comprensivoalmese.it',

  // Chi può MODIFICARE l'orario (Orario Facile, sostituzioni): gli altri possono solo consultarlo.
  // Un codice per persona, ricavato dalla sua email (vedi js/ruoli.js): chi non è abilitato
  // lo vede nella schermata di Orario Facile. Esempio: editori: ['3f9a0c1d2e4b5a6f', '0b1c2d3e4f5a6b7c'],
  // Lista vuota = per ora chiunque della scuola può modificare.
  editori: [],

  // ID client OAuth di Google (lo crea l'amministratore Google Workspace della scuola,
  // vedi app/LEGGIMI.md). Non è un dato segreto: può stare nel repository pubblico.
  // Se si svuota ('') l'app torna in "modalità dimostrativa": chiede solo l'email, SENZA verificarla.
  googleClientId: '709643540266-2kcc07obqusacsm3qlu8trkc2gb4cjh1.apps.googleusercontent.com',

  // File riservato su Google Drive con la corrispondenza codice → nome dei docenti (Codice;Cognome;Nome).
  // Nel repository i docenti sono solo codici (DOC01, DOC02…): i nomi li vede solo chi ha accesso al file.
  // L'ID è la parte del link tra /d/ e /view. Non è segreto: senza il permesso su Drive il file non si apre.
  fileNomiDocenti: '1ow18da2cOdM8uiVxi8p5F9JEguAZRrso',

  // Dove si trova il file con l'orario (formato dell'app oppure backup di Orario Facile)
  urlDati: '../dati/orario.json',

  // Orari della campanella (tasto con la campanella). Se il file manca, si usano gli orari delle ore
  urlCampanella: '../dati/campanella.json',

  // Per quanti giorni l'accesso resta memorizzato se si spunta "Ricordami"
  giorniRicordami: 30,

  // Monitor di classe: dopo quanti minuti senza tocchi si torna alla schermata iniziale
  minutiRitornoMonitor: 2,

  // LIM delle aule (monitor): durante gli intervalli compare a tutto schermo dove vanno
  // le classi nell'ora successiva, dall'inizio alla fine dell'intervallo (vedi js/intervallo.js).
  // Se si cambiano gli inizi, aggiornare anche lo script app/lim/ che apre l'app sulle LIM Windows.
  intervalliLim: [
    { inizio: '09:55', fine: '10:05' },
    { inizio: '11:50', fine: '12:05' }
  ],

  // Schermo all'ingresso: ogni quanti secondi cambia vista (classi, docenti, aule).
  // Si può cambiare anche dal menu o con l'indirizzo .../app/?ingresso=30
  secondiRotazioneIngresso: 20,

  // Ogni quanti minuti si ricontrolla se l'orario è stato aggiornato
  // (basso, così le modifiche dell'ultimo minuto arrivano presto: il file è piccolo)
  minutiAggiornamentoDati: 5,

  // Tema "secondo l'ora": scuro da oraInizioScuro fino a oraFineScuro (ore intere, 0-23)
  oraInizioScuro: 19,
  oraFineScuro: 7
};
