#!/usr/bin/env bash
# Sincronizza il lavoro locale con main: pull --rebase + push, con retry.
# Uso: ./sync.sh "messaggio del commit"
set -e
msg="${1:-Aggiornamento}"
git add -A
git diff --cached --quiet || git commit -m "$msg"
for i in 1 2 3; do
  git pull --rebase --autostash origin main && git push origin main && { echo "Sincronizzato."; exit 0; }
  echo "Tentativo $i fallito, riprovo..."
  sleep 2
done
echo "Sync non riuscito: probabile conflitto da risolvere a mano (git status)."
exit 1
