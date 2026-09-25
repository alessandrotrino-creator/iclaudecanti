/*
  ingresso.js – "Schermo all'ingresso": l'orario di oggi con le viste che cambiano da sole.

  Sullo schermo all'ingresso nessuno scorre la tabella, quindi l'app mostra a turno,
  ogni tot secondi: le CLASSI in colonna, poi i DOCENTI, poi le AULE.
  Se le colonne non stanno nello schermo, vengono divise in pagine (es. "Docenti 1 di 4")
  che ruotano anch'esse. Si mostrano solo classi, docenti e aule che hanno lezione quel giorno.

  Si attiva con l'indirizzo .../app/?ingresso (ogni 20 secondi) oppure .../app/?ingresso=30
  (ogni 30 secondi), o dal menu: "Uso di questo dispositivo" -> "Schermo all'ingresso".
*/
const Ingresso = (() => {
  const VISTE = ['classe', 'docente', 'aula'];       // l'ordine della rotazione
  const LARGHEZZA_COLONNA = 170;                      // spazio minimo per una colonna (pixel)
  const LARGHEZZA_ORE = 110;                          // la colonna con le ore

  let timer = null;

  /*
    Prepara i "passi" della rotazione per un giorno e una larghezza di schermo.
    Ogni passo è { colonne: 'classe', pagina: { numero, totale, ids } }.
  */
  function passi(D, giorno, larghezza) {
    const perPagina = Math.max(1, Math.floor((larghezza - LARGHEZZA_ORE) / LARGHEZZA_COLONNA));
    const delGiorno = D.lezioni.filter(l => l.giorno === giorno);
    const elenco = [];
    VISTE.forEach(k => {
      // solo le voci che quel giorno hanno almeno una lezione, nell'ordine dell'app
      const conLezioni = new Set(delGiorno.map(l => l[k]));
      const voci = D[k].filter(e => conLezioni.has(e.id)).map(e => e.id);
      if (!voci.length) return;
      const totale = Math.ceil(voci.length / perPagina);
      // Pagine equilibrate: 15 classi su 2 pagine diventano 8 + 7 (non 13 + 2)
      const quante = Math.ceil(voci.length / totale);
      for (let p = 0; p < totale; p++) {
        elenco.push({ colonne: k, pagina: { numero: p + 1, totale, ids: voci.slice(p * quante, (p + 1) * quante) } });
      }
    });
    return elenco;
  }

  /*
    Fa partire la rotazione.
    - secondi: ogni quanto cambiare vista
    - calcolaPassi(): restituisce i passi (viene richiamata a ogni giro completo,
      così si adatta se cambiano il giorno, l'orario o la dimensione dello schermo)
    - mostra(passo, indice, quanti): disegna un passo
  */
  function avvia({ secondi, calcolaPassi, mostra }) {
    ferma();
    let lista = calcolaPassi();
    let i = 0;
    function prossimo() {
      if (i >= lista.length) { lista = calcolaPassi(); i = 0; }
      if (!lista.length) return;
      mostra(lista[i], i, lista.length);
      i++;
    }
    prossimo();
    timer = setInterval(prossimo, secondi * 1000);
  }

  function ferma() {
    clearInterval(timer);
    timer = null;
  }

  const attiva = () => timer !== null;

  // Striscia sopra la tabella: nome della vista, pagina, un pallino per passo
  // e una barretta che si riempie mentre scorrono i secondi
  function indicatore(el, passo, indice, quanti, secondi) {
    const nomi = { classe: 'Classi', docente: 'Docenti', aula: 'Aule' };
    const pagina = passo.pagina.totale > 1 ? ` · ${passo.pagina.numero} di ${passo.pagina.totale}` : '';
    let punti = '';
    for (let k = 0; k < quanti; k++) punti += `<span${k === indice ? ' class="attivo"' : ''}></span>`;
    el.innerHTML = `<span class="ingresso-vista">${nomi[passo.colonne]}${pagina}</span>` +
      `<span class="ingresso-punti">${punti}</span>` +
      `<span class="ingresso-barra" style="animation-duration:${secondi}s"></span>`;
  }

  return { passi, avvia, ferma, attiva, indicatore };
})();
