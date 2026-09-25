/*
  abbinamenti.js – collega i docenti dell'orario alle righe del foglio del conteggio ore.

  Nell'orario pubblicato i docenti sono codici (DOC01…): con «👁 Nomi» attivo Orario Facile passa il nome
  intero ("Anna Rossi", codice in .codice); vanno bene anche le iniziali ("F. A."). Nel foglio ci sono COGNOME e NOME.
  Un docente dell'orario è abbinato a una riga se il suo nome "combacia" con l'inizio
  del nome e del cognome della riga ("A. R." -> Anna ROSSI).
  Se le righe compatibili sono zero o più di una, l'abbinamento va scelto a mano.
*/
const Abbinamenti = (() => {
  // "Mi. Bo." -> ['mi', 'bo'];  "Anna Rossi" -> ['anna', 'rossi']
  const parole = testo => Foglio.semplifica(testo).replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean);
  const compatto = testo => parole(testo).join('');

  // Vero se il nome dell'orario può indicare la riga del foglio.
  // "alRovescio" prova l'ordine cognome-nome ("Rossi Anna").
  function combacia(nomeOrario, riga, alRovescio) {
    const p = parole(nomeOrario);
    const nome = compatto(riga.nome), cognome = compatto(riga.cognome);
    if (p.length < 2 || !nome || !cognome) return false;
    const [primo, secondo] = alRovescio ? [cognome, nome] : [nome, cognome];
    // Proviamo tutti i modi di dividere le parole in "nome" e "cognome"
    // (serve per nomi doppi e cognomi come "De Luca")
    for (let k = 1; k < p.length; k++) {
      if (primo.startsWith(p.slice(0, k).join('')) && secondo.startsWith(p.slice(k).join(''))) return true;
    }
    return false;
  }

  /*
    Calcola gli abbinamenti.
    - docentiOrario: [{ id, nome }]
    - righe: le righe del foglio [{ chiave, cognome, nome }]
    - manuali: { idDocente: chiave } scelti a mano ('' = "nessuna riga")
    Restituisce una Map: idDocente -> { chiave, come } dove come è 'manuale', 'automatico',
    'ambiguo' (più righe possibili) oppure 'mancante' (nessuna riga).
  */
  function calcola(docentiOrario, righe, manuali) {
    const esiste = new Set(righe.map(r => r.chiave));
    const esito = new Map();
    docentiOrario.forEach(t => {
      if (manuali && t.id in manuali && (manuali[t.id] === '' || esiste.has(manuali[t.id]))) {
        esito.set(t.id, { chiave: manuali[t.id] || null, come: 'manuale' });
        return;
      }
      let trovate = righe.filter(r => combacia(t.nome, r, false));
      if (!trovate.length) trovate = righe.filter(r => combacia(t.nome, r, true));
      if (trovate.length === 1) esito.set(t.id, { chiave: trovate[0].chiave, come: 'automatico' });
      else esito.set(t.id, { chiave: null, come: trovate.length ? 'ambiguo' : 'mancante' });
    });

    // Se due docenti dell'orario sono finiti automaticamente sulla stessa riga, nessuno dei due è sicuro
    const usi = {};
    esito.forEach(a => { if (a.chiave) usi[a.chiave] = (usi[a.chiave] || 0) + 1; });
    esito.forEach((a, id) => {
      if (a.come === 'automatico' && usi[a.chiave] > 1) esito.set(id, { chiave: null, come: 'ambiguo' });
    });
    return esito;
  }

  return { calcola };
})();
