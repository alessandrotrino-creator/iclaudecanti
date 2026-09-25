/*
  intervallo.js – schermata dell'intervallo sulle LIM delle aule (modalità monitor).

  In una scuola DADA dopo l'intervallo i ragazzi cambiano aula. Agli orari degli intervalli
  (config.js, campo intervalliLim) la LIM mostra a tutto schermo, per qualche minuto:
  - per ogni classe che era in quest'aula prima dell'intervallo, DOVE ANDARE nell'ora successiva
    (aula, materia, docente);
  - quale classe ARRIVA in quest'aula dopo l'intervallo.

  Una pagina web non può aprirsi da sola se è chiusa: per aprire l'app all'intervallo anche quando
  è chiusa, sulle LIM con Windows si usa lo script in app/lim/ (vedi LEGGIMI.md).
*/
const Intervallo = (() => {
  const minuti = hhmm => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Se adesso siamo dentro un intervallo restituisce il suo orario d'inizio (es. "09:55"), altrimenti null
  function inCorso(data, intervalli, durata) {
    const m = data.getHours() * 60 + data.getMinutes();
    return (intervalli || []).find(i => minuti(i) <= m && m < minuti(i) + durata) || null;
  }

  /*
    Disegna la schermata nell'elemento box. Restituisce false se non c'è niente da mostrare
    (per esempio dopo l'intervallo non ci sono più lezioni).
    - D: l'orario; giorno: "Lunedì"…; aula: id dell'aula della LIM; inizio: "09:55"
    - nome(tipo, id): il nome da mostrare per classe, aula o docente
  */
  function disegna(box, D, giorno, aula, inizio, nome) {
    const m = minuti(inizio);
    const orePrima = D.ore.filter(o => minuti(o.inizio) < m);
    const oraPrima = orePrima[orePrima.length - 1];
    const oraDopo = D.ore.find(o => minuti(o.inizio) >= m);
    if (!oraDopo) return false;

    const delGiorno = D.lezioni.filter(l => l.giorno === giorno);
    // Le classi che erano in quest'aula nell'ora prima dell'intervallo
    const classiQui = oraPrima
      ? [...new Set(delGiorno.filter(l => l.aula === aula && l.ora === oraPrima.n).map(l => l.classe))]
      : [];
    // Chi arriva in quest'aula dopo l'intervallo
    const arrivano = delGiorno.filter(l => l.aula === aula && l.ora === oraDopo.n);
    if (!classiQui.length && !arrivano.length) return false;

    const righe = classiQui.map(c => {
      const prossime = delGiorno.filter(l => l.classe === c && l.ora === oraDopo.n);
      let destinazione;
      if (!prossime.length) {
        destinazione = '<span class="intervallo-aula">Nessuna lezione</span>';
      } else {
        destinazione = prossime.map(l => {
          const resta = l.aula === aula;
          return `<span class="intervallo-aula${resta ? ' resta' : ''}">${resta ? 'Restate qui' : '📍 ' + esc(nome('aula', l.aula) || '?')}</span>` +
            `<span class="intervallo-materia">${esc(l.materia)}${l.docente ? ' · ' + esc(nome('docente', l.docente)) : ''}</span>`;
        }).join('');
      }
      return `<li><span class="intervallo-classe">${esc(nome('classe', c))}</span>` +
        `<span class="intervallo-freccia" aria-hidden="true">→</span>` +
        `<span class="intervallo-dove"><span class="solo-lettori">va in </span>${destinazione}</span></li>`;
    }).join('');

    const testoArrivo = arrivano.length
      ? `In quest'aula arriva${arrivano.length > 1 ? 'no' : ''}: ` +
        arrivano.map(l => `<strong>${esc(nome('classe', l.classe))}</strong> (${esc(l.materia)})`).join(', ')
      : 'Dopo l\'intervallo quest\'aula resta libera.';

    box.innerHTML = `
      <div class="intervallo-scheda">
        <p class="intervallo-etichetta">☕ Intervallo · si riprende alle ${esc(oraDopo.inizio)} (${oraDopo.n}ª ora)</p>
        <h2 id="titoloIntervallo">${classiQui.length ? 'Dopo l\'intervallo andate in:' : 'Dopo l\'intervallo'}</h2>
        ${righe ? `<ul class="intervallo-classi">${righe}</ul>` : ''}
        <p class="intervallo-arrivo">${testoArrivo}</p>
        <button type="button" id="chiudiIntervallo" class="pulsante">Chiudi</button>
      </div>`;
    box.dataset.intervallo = inizio;
    return true;
  }

  return { inCorso, disegna };
})();
