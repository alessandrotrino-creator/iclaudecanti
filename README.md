# iclaudecanti

Repo collaborativo del gruppo **iclaudecanti**.

## Ultimi aggiornamenti

**25/09/2026 – LIM: dove andare dopo l'intervallo** (Chiara)

- sulle LIM (monitor dell'aula), durante gli intervalli (**9:55–10:05 e 11:50–12:05**) l'app mostra a tutto schermo dove va ogni classe
  nell'ora successiva (aula, materia, docente) e chi arriva in quell'aula;
- una pagina web non può aprirsi da sola quando è chiusa: sulle **LIM Windows** ci pensa lo script
  `app/lim/installa-apertura-intervallo.bat` (doppio clic, si scrive il nome dell'aula), che programma l'apertura
  dell'app agli intervalli; finito l'intervallo (10:05, 12:05) la finestra si chiude da sola. Per le LIM Android ci sono le istruzioni;
- dettagli in [app/LEGGIMI.md](app/LEGGIMI.md#lim-dove-andare-dopo-lintervallo).

**25/09/2026 – Modificatori e fruitori** (Chiara)

Non tutti possono modificare l'orario: ora ci sono due ruoli.

- **Fruitori** (tutti gli account della scuola): consultano l'orario nell'app Orario DADA;
- **Modificatori**: possono usare Orario Facile (orario e sostituzioni). Chi apre Orario Facile deve accedere con
  l'account della scuola; se non è abilitato vede "Solo consultazione" e il suo codice da mandare a chi gestisce l'app;
- l'elenco è in `app/js/config.js` (`editori`), con **codici** al posto delle email (il repo è pubblico);
  finché è vuoto, possono modificare tutti. Istruzioni in [app/LEGGIMI.md](app/LEGGIMI.md#chi-può-modificare-lorario).

**25/09/2026 – Schermo all'ingresso con le viste a rotazione** (Chiara)

Nuova modalità dell'app Orario DADA per il televisore o il proiettore all'ingresso:
[.../app/?ingresso](https://alessandrotrino-creator.github.io/iclaudecanti/app/?ingresso) (o dal menu: "Uso di questo dispositivo").

- l'orario di oggi cambia vista da solo: **Classi → Docenti → Aule**;
- **ogni quanti secondi lo decide l'utente**: nel menu si scrive il numero (da 5 a 600) o lo si regola con − e +; anche dall'indirizzo, es. `?ingresso=30`;
- se le colonne non stanno nello schermo, vengono divise in pagine che ruotano anch'esse: niente da scorrere;
- un tocco mette in pausa la rotazione, che riparte da sola dopo 2 minuti senza tocchi;
- istruzioni in [app/LEGGIMI.md](app/LEGGIMI.md#schermo-allingresso-proiezione-a-rotazione).

**25/09/2026 – Sostituzioni docenti dentro Orario Facile** (Chiara)

Le sostituzioni sono ora la **scheda 9 «Sostituzioni»** di
[Orario Facile](https://alessandrotrino-creator.github.io/iclaudecanti/orario-facile/#sostituzioni)
([istruzioni](sostituzioni/LEGGIMI.md)); il vecchio indirizzo `sostituzioni/` porta lì.

- usa direttamente l'**orario di Orario Facile**: se lo modifichi, le proposte si aggiornano;
- si carica il **foglio del conteggio ore** (.ods, .xlsx o .csv): viene letto solo sul computer, **non viene pubblicato**;
- si segna il docente assente e, per ogni ora, la scheda propone i docenti liberi **a partire da chi ha più ore a debito**;
- tiene il conto delle ore di sostituzione da riportare nel foglio, stampa le sostituzioni del giorno ed esporta in CSV;
- il codice resta nella cartella `sostituzioni/` (in `orario-facile/index.html` ci sono solo poche righe di collegamento),
  così chi lavora sull'orario e chi lavora sulle sostituzioni non si pesta i piedi;
- per provarla: facsimili con nomi inventati in `sostituzioni/esempio/`.

**24/09/2026 – Aule e orario completo in Orario Facile** (Alessandro)

- caricato il backup 2026/27 aggiornato (cattedre di Mensa e Laboratorio comprese);
- create le **21 aule** dal documento "Occupazione aule", con nome = numero aula + prime tre lettere del nome + numero
  (es. `110ITA4`, `S19MUS1`, `C1PAL`), più l'aula **MENSA**; ogni docente ha le sue aule, e chi ha ore di Mensa anche MENSA;
- palestra e mensa possono ospitare più classi insieme, le altre aule una classe per volta;
- chi apre Orario Facile trova già l'**orario definitivo 2026/27** (importato dal foglio «Definitivo PUBBLICATO»):
  468 ore, nessun conflitto; chi aveva già aperto il programma preme «Dati scuola 2026/27» per caricarlo;
- il docente di Arte di 1C, 2C, 3C, 1D, 2D, 3D è DOC44;

Da completare: in 1C e 2C le cattedre di Laboratorio sommano 5 ore contro le 3 del quadro orario.

**24/09/2026 – Orario Facile già compilato con i dati 2026/27** (Alessandro)

Aprendo [Orario Facile](https://alessandrotrino-creator.github.io/iclaudecanti/orario-facile/)
si trova già la nostra scuola, ricavata dall'elenco "Docenti con materie e classi" 2026/27:

- 15 classi (1A–3E) e 43 docenti con 174 cattedre;
- i docenti sono **anonimi: DOC01, DOC02…** (codici in ordine casuale): il repository è pubblico, quindi
  nomi e iniziali non vanno messi qui; la corrispondenza con i nomi è in un file riservato su Google Drive;
- orario dal lunedì al venerdì, 6 ore al mattino; 1C, 2C e 3C anche martedì, mercoledì e giovedì pomeriggio (2 ore);
- Approfondimento a 0 ore; nuove discipline **Mensa** e **Laboratorio** (per ora a 0 ore);
- nuovo pulsante in alto **"Dati scuola 2026/27"**: chi aveva già aperto Orario Facile vede ancora i suoi dati salvati
  e con questo pulsante carica quelli nuovi;
- nella griglia dell'orario si vede il codice del docente (DOC01, DOC02…).

Da completare: ore e docenti di Mensa e Laboratorio per le classi C; Arte in 1C, 2C, 3C, 1D, 2D, 3D non ha ancora un docente.

## Come lavoriamo (tutti su `main`)

Per evitare conflitti:

1. **Prima di iniziare**: `git pull --rebase`
2. **Commit piccoli e frequenti**, ognuno su un argomento.
3. **Per consegnare**: `./sync.sh "cosa ho fatto"` (fa commit, pull --rebase e push).
4. **Commit piccoli e file piccoli**: meno righe tocchi, meno conflitti.

Configurazione consigliata (una volta sola):

```bash
git config pull.rebase true
git config rebase.autoStash true
```

## Il sito

Orario scolastico di una scuola DADA, in HTML/CSS/JS puro.

**Sito online:** https://alessandrotrino-creator.github.io/iclaudecanti/
Regole e convenzioni complete in [CLAUDE.md](CLAUDE.md).

## Struttura

- `index.html` – pagina iniziale
- `app/` – **Orario DADA**, per vedere l'orario da telefono, tablet e monitor di classe ([istruzioni](app/LEGGIMI.md))
- `orario-facile/` – l'app Orario Facile, per creare l'orario
- `sostituzioni/` – codice della scheda **Sostituzioni** di Orario Facile ([istruzioni](sostituzioni/LEGGIMI.md))
- `dati/orario.json` – l'orario mostrato dall'app
- `img/` – immagini
