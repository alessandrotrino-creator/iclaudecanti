# Sostituzioni docenti

Scheda **«Sostituzioni»** (la n. 9) di **Orario Facile**, per organizzare la **sostituzione dei docenti assenti**
usando il foglio del conteggio ore (chi è a **debito** e chi è a **credito** di ore).

Indirizzo diretto: **https://alessandrotrino-creator.github.io/iclaudecanti/orario-facile/#sostituzioni**
(il vecchio indirizzo `.../sostituzioni/` porta lì).

## Privacy: il foglio non viene pubblicato

Il foglio del conteggio ore contiene i nomi completi dei docenti, quindi **non va mai caricato su GitHub**
(il repository è pubblico).

- Si carica dalla scheda con **"Carica il foglio"**: viene letto **solo nel browser** di quel computer,
  senza essere inviato a nessuno.
- Assenze, sostituzioni e foglio restano salvati **solo su quel dispositivo** (memoria del browser).
  Il pulsante "Cancella i dati delle sostituzioni da questo dispositivo" li toglie.
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

Per ogni ora scoperta la scheda cerca i docenti **senza lezione in quell'ora**, **non assenti** e **non già
impegnati** in un'altra sostituzione alla stessa ora, e li mette in quest'ordine:

1. prima chi è **a scuola quel giorno** (ha almeno una lezione); gli altri si vedono con "Mostra tutti";
2. poi chi ha **più ore a debito** (saldo più basso);
3. a parità: chi ha un'**ora buca** (è già a scuola), poi chi ha lezione **subito prima o dopo**;
4. poi chi **conosce già la classe**.

Il saldo usato è: **TOTALE del foglio + sostituzioni fatte e non ancora riportate nel foglio**.
Se in classe c'è già un altro docente (compresenza), la scheda lo segnala.

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

La scheda usa **l'orario aperto in Orario Facile**, quindi se lo modifichi le proposte si aggiornano appena torni
sulla scheda. L'orario viene trasformato con `Dati.normalizza()` di `app/js/dati.js`, lo stesso usato dall'app
Orario DADA.

## File

Il codice sta in file separati (non dentro `orario-facile/index.html`, che è già molto lungo): così chi lavora
su Orario Facile e chi lavora sulle sostituzioni tocca file diversi e ci sono meno conflitti.

```
sostituzioni/
  index.html              rimanda alla scheda di Orario Facile (per chi ha il vecchio indirizzo)
  css/sostituzioni.css    stile della scheda (usa i colori di Orario Facile, tema scuro, stampa)
  js/foglio.js            lettura del foglio .ods / .xlsx / .csv (senza librerie esterne)
  js/archivio.js          salvataggio nella memoria del browser (chiavi "sostituzioni.")
  js/abbinamenti.js       collegamento tra docenti dell'orario e righe del foglio
  js/sostituzioni.js      la scheda: assenze, proposte, saldi, esportazioni (Sostituzioni.monta)
  esempio/                facsimili del foglio con nomi inventati
```

In `orario-facile/index.html` le righe che la collegano sono poche: il foglio di stile nell'`<head>`, la sezione
`p-sostituzioni`, i `<script>` prima dello script principale, la voce in `TABS` e la funzione `renderSostituzioni()`.

Per provarla sul PC serve un piccolo server (dalla cartella del repo): `py -m http.server 8765`,
poi aprire http://localhost:8765/orario-facile/#sostituzioni

## Idee per il futuro

- scrivere direttamente il foglio aggiornato invece di copiare le ore a mano;
- condividere assenze e sostituzioni tra più computer (ora ogni computer ha i suoi dati);
- valutare se mostrare la scheda solo a chi organizza le sostituzioni (vicepresidenza).
