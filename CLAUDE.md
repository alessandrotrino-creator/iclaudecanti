# CLAUDE.md – iclaudecanti

## Il progetto
Sito web con l'**orario scolastico di una scuola DADA** (Didattiche per Ambienti Di Apprendimento):
nelle scuole DADA le aule sono assegnate alle materie/ai docenti e sono **gli studenti a spostarsi**.
Il sito deve quindi mostrare chiaramente, per ogni ora: classe, materia, docente e **aula**.

Viene pubblicato con **GitHub Pages** direttamente da `main` (la pagina iniziale è `index.html` nella radice).

## Il gruppo
- Gruppo **iclaudecanti**, studenti **principianti** in programmazione e git.
- Tutti lavorano su tutto, direttamente su `main`.
- **Parla sempre in italiano**: risposte, commenti nel codice, messaggi di commit, documentazione.
- Spiega passo passo e con parole semplici cosa stai facendo e perché; niente gergo senza spiegarlo.

## Tecnologie
- **Solo HTML, CSS e JavaScript puri.** Niente framework, niente Node.js, niente passaggi di build:
  il sito deve funzionare aprendo `index.html` nel browser e su GitHub Pages così com'è.
- Nessuna libreria esterna salvo necessità reale; in quel caso chiedi prima al gruppo.

## Struttura
```
index.html        pagina iniziale
css/              fogli di stile (un file per area, es. base.css, orario.css)
js/               script (un file per funzionalità, es. orario.js, filtri.js)
dati/             dati dell'orario in JSON (classi, docenti, aule, orario)
img/              immagini
```
- Tieni i **dati dell'orario separati dal codice** (file JSON in `dati/`), così si possono aggiornare senza toccare JS/HTML.
- Preferisci più file piccoli a un unico file enorme: riduce i conflitti tra chi lavora in parallelo.
- Con GitHub Pages usa **percorsi relativi** (`css/base.css`, non `/css/base.css`).
- Nota: `fetch()` dei JSON non funziona aprendo il file con doppio clic (`file://`); per provare in locale
  usa un server semplice (es. estensione Live Server o `python -m http.server`).

## Regole di codice (richieste dall'insegnante)
1. **Codice commentato**: commenti in italiano che spiegano *cosa* fa ogni blocco, pensati per principianti.
2. **Accessibilità**: HTML semantico (`header`, `nav`, `main`, `table` con `th`/`scope`, `caption`),
   `alt` su tutte le immagini, contrasto adeguato, uso completo da tastiera, `lang="it"`.
3. **Responsive**: deve funzionare bene su telefono (approccio mobile-first, `meta viewport`,
   tabelle dell'orario leggibili su schermi stretti).
- **Nomi in italiano** per classi CSS, id, variabili e funzioni, in minuscolo con trattini per il CSS
  (`.menu-principale`) e camelCase per JS (`mostraOrario`). Niente accenti nei nomi.
- Indentazione di 2 spazi.

## Git: come lavora Claude
Claude gestisce le versioni in autonomia:
1. **Prima di modificare qualsiasi cosa**: `git pull --rebase`.
2. Commit **piccoli e frequenti**, un argomento per commit, messaggio in italiano chiaro
   (es. "Aggiunge filtro per aula nell'orario").
3. Appena una modifica è completa: commit e **push su `main` senza chiedere** (si può usare `./sync.sh "messaggio"`).
4. Se il push viene rifiutato perché qualcuno ha pubblicato prima: `git pull --rebase` e riprova.
5. **Conflitti**: risolvili tu mantenendo le modifiche di entrambi quando possibile, poi spiega al gruppo
   in modo semplice cosa è stato unito e come. Se due modifiche sono davvero incompatibili, chiedi.
6. Mai `git push --force`, mai riscrivere la cronologia già pubblicata, mai commit di merge (usa sempre il rebase).
