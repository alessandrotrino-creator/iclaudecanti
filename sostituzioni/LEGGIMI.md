# Sostituzioni docenti – versione di prova

Pagina per organizzare la **sostituzione dei docenti assenti** usando il foglio del conteggio ore
(chi è a **debito** e chi è a **credito** di ore).

È **separata** dalle altre app del sito e non le modifica: se il gruppo la approva, verrà unita all'Orario DADA.

Indirizzo: **https://alessandrotrino-creator.github.io/iclaudecanti/sostituzioni/**

## Privacy: il foglio non viene pubblicato

Il foglio del conteggio ore contiene i nomi completi dei docenti, quindi **non va mai caricato su GitHub**
(il repository è pubblico).

- Si carica dalla pagina con **"Carica il foglio"**: viene letto **solo nel browser** di quel computer,
  senza essere inviato a nessuno.
- Assenze, sostituzioni e foglio restano salvati **solo su quel dispositivo** (memoria del browser).
  Il pulsante "Cancella tutti i dati da questo dispositivo" li toglie.
- Nel repo ci sono solo i **facsimili** con nomi inventati: `esempio/conteggio-ore-esempio.ods` e `.xlsx`.
- Se tenete una copia del foglio vero dentro la cartella del repo, mettetela in `privato/`:
  quella cartella è esclusa da git (vedi `.gitignore`).

## Come si usa

1. **Carica il foglio** del conteggio ore (.ods, .xlsx oppure .csv, anche scaricato da Fogli Google).
2. Controlla gli **abbinamenti**: ogni docente dell'orario (con le iniziali, es. "F. A.") viene collegato
   in automatico alla sua riga del foglio. Se un abbinamento manca o è dubbio, sceglilo dall'elenco.
3. Scegli il **giorno** e registra il **docente assente** spuntando le ore di assenza.
4. In **"Ore da coprire"**, per ogni ora compare l'elenco dei docenti liberi: premi **Assegna**.
5. A fine settimana copia nel foglio le ore della tabella **"Da aggiungere nel foglio"** (+1 per ogni ora
   di sostituzione, nella colonna della settimana), poi premi **"Segna come già riportate"** e ricarica il foglio.

Si possono anche stampare le sostituzioni del giorno e scaricare il registro in CSV.

## Come vengono scelti i docenti proposti

Per ogni ora scoperta la pagina cerca i docenti **senza lezione in quell'ora**, **non assenti** e **non già
impegnati** in un'altra sostituzione alla stessa ora, e li mette in quest'ordine:

1. prima chi è **a scuola quel giorno** (ha almeno una lezione); gli altri si vedono con "Mostra tutti";
2. poi chi ha **più ore a debito** (saldo più basso);
3. a parità: chi ha un'**ora buca** (è già a scuola), poi chi ha lezione **subito prima o dopo**;
4. poi chi **conosce già la classe**.

Il saldo usato è: **TOTALE del foglio + sostituzioni fatte e non ancora riportate nel foglio**.
Se in classe c'è già un altro docente (compresenza), la pagina lo segnala.

## Il foglio: che forma deve avere

Come il foglio "Prospetto" della scuola:

| (n.) | COGNOME | NOME | 1 | 2 | 3 | … | 39 | TOTALE |
|---|---|---|---|---|---|---|---|---|
| 1 | ROSSI | Anna | -4 | -1 | | | | -5 |

- una riga di intestazione con **COGNOME** e **NOME**, poi le **settimane numerate** e **TOTALE**;
- numeri **negativi = ore a debito**, **positivi = ore a credito**;
- la nota "Settimana 1 dal 9 all'11 settembre 2026" (in qualsiasi cella) serve a calcolare la settimana
  di ogni data; se manca si usa lunedì 7 settembre 2026.

## L'orario

La pagina usa **lo stesso orario dell'app Orario DADA**: il file `dati/orario.json` pubblicato oppure, sullo
stesso computer, la bozza di Orario Facile. Per farlo riusa, **senza modificarli**, `app/js/config.js` e
`app/js/dati.js`.

## File

```
sostituzioni/
  index.html              struttura della pagina
  css/sostituzioni.css    stile (telefono, computer, tema scuro, stampa)
  js/foglio.js            lettura del foglio .ods / .xlsx / .csv (senza librerie esterne)
  js/archivio.js          salvataggio nella memoria del browser (chiavi "sostituzioni.")
  js/abbinamenti.js       collegamento tra docenti dell'orario e righe del foglio
  js/sostituzioni.js      la pagina: assenze, proposte, saldi, esportazioni
  esempio/                facsimili del foglio con nomi inventati
```

Per provarla sul PC serve un piccolo server (dalla cartella del repo): `py -m http.server 8765`,
poi aprire http://localhost:8765/sostituzioni/

## Per unirla all'app (quando il gruppo approva)

- aggiungere il link nella pagina iniziale del sito (`index.html`) e/o nel menu dell'app;
- valutare se mostrarla solo a chi organizza le sostituzioni (vicepresidenza);
- in futuro: scrivere direttamente il foglio aggiornato invece di copiare le ore a mano.
