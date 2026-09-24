# iclaudecanti

Repo collaborativo del gruppo **iclaudecanti**.

## Come lavoriamo (tutti su `main`)

Per evitare conflitti:

1. **Prima di iniziare**: `git pull --rebase`
2. **Commit piccoli e frequenti**, ognuno su un argomento.
3. **Per consegnare**: `./sync.sh "cosa ho fatto"` (fa commit, pull --rebase e push).
4. **Ognuno lavora preferibilmente nella propria cartella** (es. `membri/<nome>/`) o su file diversi; i file condivisi si modificano avvisando il gruppo.

Configurazione consigliata (una volta sola):

```bash
git config pull.rebase true
git config rebase.autoStash true
```

## Struttura

- `membri/` – una cartella per ciascun membro del gruppo
- `condiviso/` – materiale comune
