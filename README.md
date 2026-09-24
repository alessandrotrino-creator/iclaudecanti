# iclaudecanti

Repo collaborativo del gruppo **iclaudecanti**.

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

- `index.html` – reindirizza all'app
- `orario-facile/` – l'app Orario Facile
- `css/` – stili
- `js/` – script
- `dati/` – dati dell'orario (JSON)
- `img/` – immagini
