/*
  config.js – impostazioni dell'app (l'unico file da modificare per configurarla)
*/
window.CONFIG = {
  // Solo gli account di questo dominio possono entrare
  dominio: 'comprensivoalmese.it',

  // ID client OAuth di Google (lo crea l'amministratore Google Workspace della scuola,
  // vedi app/LEGGIMI.md). Finché è vuoto l'app funziona in "modalità dimostrativa":
  // chiede solo l'indirizzo email, SENZA verificarlo.
  googleClientId: '',

  // Dove si trova il file con l'orario (formato dell'app oppure backup di Orario Facile)
  urlDati: '../dati/orario.json',

  // Per quanti giorni l'accesso resta memorizzato se si spunta "Ricordami"
  giorniRicordami: 30,

  // Monitor di classe: dopo quanti minuti senza tocchi si torna alla schermata iniziale
  minutiRitornoMonitor: 2,

  // Ogni quanti minuti si ricontrolla se l'orario è stato aggiornato
  minutiAggiornamentoDati: 15
};
