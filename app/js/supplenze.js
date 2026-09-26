/*
  supplenze.js – mostra nella tabella dell'orario le assenze e le sostituzioni della settimana.

  Le assenze e le sostituzioni si registrano nella scheda Sostituzioni di Orario Facile o nella pagina
  «Sostituzioni smart» e restano nella memoria di questo dispositivo (chiavi "sostituzioni.assenze" e
  "sostituzioni.registro", vedi sostituzioni/js/archivio.js). Qui le rileggiamo e prepariamo:
  - segnate: le lezioni dei docenti assenti, con il nome di chi le sostituisce (o "da coprire");
  - extra:   le stesse lezioni "copiate" al docente che sostituisce, così compaiono anche nel suo orario.
  La settimana considerata è quella in corso (di sabato e domenica si guarda già la prossima).
*/
const Supplenze = (() => {
  const NOMI_GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

  const leggi = k => { try { return JSON.parse(localStorage.getItem(k) || '[]') || []; } catch (e) { return []; } };
  // "Lunedì" -> "lunedi": per confrontare i nomi dei giorni senza badare ad accenti e maiuscole
  const semplice = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const isoLocale = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Il lunedì della settimana da mostrare: questa settimana, oppure la prossima se oggi è sabato o domenica
  function lunedi() {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    if (d.getDay() === 6) d.setDate(d.getDate() + 2);
    else if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    else d.setDate(d.getDate() - (d.getDay() - 1));
    return d;
  }

  // Le date dei giorni di scuola della settimana: Map "Lunedì" -> "2026-09-28"
  function dateSettimana(D) {
    const date = new Map();
    const d = lunedi();
    for (let i = 0; i < 7; i++) {
      const giorno = D.giorni.find(g => semplice(g) === semplice(NOMI_GIORNI[d.getDay()]));
      if (giorno) date.set(giorno, isoLocale(d));
      d.setDate(d.getDate() + 1);
    }
    return date;
  }

  // La "casella" di una lezione: giorno, ora, classe e docente
  const chiave = (giorno, ora, classe, docente) => [giorno, ora, classe, docente].join('|');

  /*
    Assenze e sostituzioni della settimana per l'orario D.
    Restituisce { segnate: Map chiave -> { assente, sostituto }, extra: [lezioni del sostituto], date }.
  */
  function settimana(D) {
    const date = dateSettimana(D);
    const giornoDi = new Map([...date].map(([g, iso]) => [iso, g]));   // "2026-09-28" -> "Lunedì"
    const segnate = new Map();
    const extra = [];

    // 1. le lezioni dei docenti assenti (per ora senza sostituto: "da coprire")
    leggi('sostituzioni.assenze').forEach(a => {
      const giorno = giornoDi.get(a.data);
      if (!giorno || !Array.isArray(a.ore)) return;
      D.lezioni.filter(l => l.giorno === giorno && l.docente === a.docente && a.ore.includes(l.ora))
        .forEach(l => segnate.set(chiave(giorno, l.ora, l.classe, l.docente), { assente: l.docente, sostituto: '' }));
    });

    // 2. le sostituzioni assegnate: chi sostituisce, e la lezione in più nel suo orario
    leggi('sostituzioni.registro').forEach(s => {
      const giorno = giornoDi.get(s.data);
      if (!giorno || !D.mappa.docente.has(s.sostituto)) return;
      const l = D.lezioni.find(x => x.giorno === giorno && x.ora === s.ora && x.classe === s.classe && x.docente === s.assente);
      if (!l) return;   // l'orario è cambiato e quella lezione non c'è più
      segnate.set(chiave(giorno, l.ora, l.classe, l.docente), { assente: s.assente, sostituto: s.sostituto });
      extra.push(Object.assign({}, l, { docente: s.sostituto, sostituzione: true, assente: s.assente }));
    });

    return { segnate, extra, date };
  }

  // Le informazioni di una lezione della tabella (o null se è una lezione normale)
  function di(sost, l) {
    if (!sost) return null;
    if (l.sostituzione) return { assente: l.assente, sostituto: l.docente, copia: true };
    return sost.segnate.get(chiave(l.giorno, l.ora, l.classe, l.docente)) || null;
  }

  return { settimana, di, CHIAVI: ['sostituzioni.assenze', 'sostituzioni.registro'] };
})();
