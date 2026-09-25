# Orario DADA – app di visualizzazione

App per consultare l'orario da **smartphone, tablet (iPhone/iPad e Android)** e **monitor interattivi di classe** (Android di bordo oppure PC OPS con Windows 10/11).
È una *web app installabile* (PWA): si apre dal browser, si può aggiungere alla schermata Home come un'app vera e funziona anche senza connessione, con l'ultimo orario scaricato.

Indirizzo: **https://alessandrotrino-creator.github.io/iclaudecanti/app/**

## Schermata iniziale

All'apertura l'app sceglie da sola cosa mostrare:

| Chi apre l'app | Cosa vede |
|---|---|
| **Monitor di classe** | l'orario di oggi della **sua aula**, a caratteri grandi, con "Adesso / Dopo" |
| **Schermo all'ingresso** | l'orario di oggi con le viste **Classi → Docenti → Aule** che cambiano da sole ogni tot secondi |
| **Docente** (riconosciuto dall'email) | il **suo orario di oggi**, con "Adesso / Dopo" |
| **Tutti gli altri** | l'**orario di oggi**: ore in riga (1ª 8–9 … 8ª 15–16), **classi in colonna** |

- L'ora in corso è evidenziata in giallo.
- Nel weekend, o quando le lezioni del giorno sono finite, compare il giorno di scuola successivo (con un avviso).
- Il logo in alto a sinistra riporta sempre alla schermata iniziale.

## In breve: la giornata a schede

Il tasto **In breve** nella barra in alto apre la giornata a schede, comoda sul telefono. Il tasto **Tabella** (o di nuovo *In breve*) riporta alla tabella.

- **Adesso**: la lezione in corso con l'**aula in grande** e quanto manca alla fine dell'ora.
- **Dopo**: la lezione successiva; se l'aula cambia compare *"si cambia aula: Aula 1 → Aula 4"*.
- **Il resto della giornata**: una scheda grande per ogni ora, una sotto l'altra (due per riga sul tablet); l'ora in corso è gialla, le ore già fatte più chiare, le ore libere tratteggiate.
- **Giornata di**: si sceglie la classe, il docente o l'aula. Il docente che ha fatto l'accesso vede subito la sua giornata; la scelta resta memorizzata sul dispositivo.
- I colori della testata cambiano con il momento della giornata (mattina, pomeriggio, sera) e seguono il tema chiaro/scuro.
- Sui monitor di classe il tasto non c'è: lì resta la tabella a caratteri grandi.

## Cambiare visualizzazione

- **In colonna**: Classi, Docenti, Aule oppure **Settimana** (i giorni in colonna).
- **Filtri** Classe, Docente e Aula, combinabili tra loro. Esempi:
  - Docenti in colonna + classe 2B → tutti i docenti che entrano in 2B quel giorno
  - Settimana + docente Rossi → la settimana della prof.ssa Rossi
  - Classi in colonna + aula Palestra → quali classi vanno in palestra e quando
  - Settimana + classe 1A + docente Costa → le ore di Costa nella 1A
- I pulsanti dei giorni cambiano giorno; "Oggi" torna al giorno corrente.

## Installare l'app e scegliere il tema

Dal menu (tondo con le iniziali, in alto a destra):

- **📲 Installa l'app su questo dispositivo** (ultima voce): su Chrome ed Edge (Android, Windows, monitor) parte l'installazione; su iPhone/iPad e negli altri browser compaiono le istruzioni passo passo. Se l'app è già installata la voce non c'è.
- **🔗 Condividi l'app con i colleghi**: mostra un QR code grande da far inquadrare (anche dal monitor di classe, a tutta la sala docenti), con i pulsanti *Condividi…* (WhatsApp, email… sui telefoni) e *Copia link*.
- **Tema**: *Come il dispositivo*, *Chiaro*, *Scuro* oppure *Secondo l'ora* (scuro dalle 19 alle 7; gli orari si cambiano in `js/config.js`). La scelta resta memorizzata su quel dispositivo.

## Accesso con l'account della scuola

Si entra con **"Accedi con Google"**: sono accettati solo gli account **@comprensivoalmese.it** (la scuola usa Google Workspace).
La password la vede solo Google. Con **"Ricordami su questo dispositivo"** l'accesso resta memorizzato per 30 giorni (lo si cambia in `js/config.js`).

### Configurazione (già fatta il 24/09/2026)

L'ID client di Google è già inserito in `js/config.js`, quindi l'accesso con Google è attivo.
Se il campo `googleClientId` viene svuotato, l'app torna in **modalità dimostrativa**: chiede solo l'email e **non la verifica**.
Per rifare la configurazione da zero (per esempio con un nuovo progetto Google), l'amministratore Google Workspace della scuola segue questi passaggi:

1. Aprire https://console.cloud.google.com/ con un account della scuola e creare un progetto (es. "Orario DADA").
2. *API e servizi → Schermata consenso OAuth*: tipo **Interno** (così possono entrare solo gli utenti della scuola), nome app "Orario DADA".
3. *API e servizi → Credenziali → Crea credenziali → ID client OAuth*:
   - Tipo: **Applicazione web**
   - Origini JavaScript autorizzate: `https://alessandrotrino-creator.github.io` (e, per le prove, `http://localhost:8765`)
4. Copiare l'**ID client** (finisce con `.apps.googleusercontent.com`) in `js/config.js`, nel campo `googleClientId`.

> **Attenzione – limite di GitHub Pages.** L'accesso impedisce di usare l'app a chi non è della scuola, ma il file `dati/orario.json` resta scaricabile da chi conosce l'indirizzo esatto, perché GitHub Pages pubblica tutto. Un orario scolastico di solito non contiene dati riservati. Se però si vuole proteggerlo davvero, bisogna servire i dati da un servizio con controllo di accesso (per esempio un Google Apps Script limitato al dominio della scuola) e indicarne l'indirizzo in `urlDati`.

## Monitor interattivi di classe

1. Sul monitor aprire l'indirizzo dell'app con il nome dell'aula, per esempio
   `https://alessandrotrino-creator.github.io/iclaudecanti/app/?monitor=Aula%203`
   (oppure: menu in alto a destra → "Uso di questo dispositivo" → l'aula, sotto "Monitor dell'aula").
2. Accedere una volta con "Ricordami" spuntato.
3. Installare l'app:
   - **Android di bordo** (Chrome): menu ⋮ → *Installa app* / *Aggiungi a schermata Home*
   - **OPS Windows 10/11** (Edge): icona "Installa" nella barra degli indirizzi, oppure menu … → *App → Installa questo sito come app*. Per aprirla all'avvio: *edge://apps* → clic destro sull'app → *Avvia all'accesso*.
4. Il monitor torna da solo all'orario dell'aula dopo 2 minuti senza tocchi e si aggiorna ogni 15 minuti.

Su **iPhone/iPad** l'app si installa da Safari: *Condividi → Aggiungi alla schermata Home*.

## Schermo all'ingresso (proiezione a rotazione)

Per il televisore o il proiettore all'ingresso, dove nessuno tocca lo schermo: l'app mostra l'orario di oggi
e **cambia vista da sola** ogni tot secondi, nell'ordine **Classi → Docenti → Aule**.

1. Aprire l'indirizzo `https://alessandrotrino-creator.github.io/iclaudecanti/app/?ingresso`
   (ogni 20 secondi) oppure `.../app/?ingresso=30` per scegliere i secondi (da 5 a 600).
   In alternativa: menu in alto a destra → "Uso di questo dispositivo" → **📺 Schermo all'ingresso**,
   e sotto "Cambia vista ogni" si scelgono i secondi.
2. Accedere una volta con "Ricordami" spuntato; la scelta resta memorizzata su quel dispositivo.
3. Mettere a schermo intero (menu → *Schermo intero*, oppure F11).

Come funziona:

- si vedono solo le classi, i docenti e le aule che **quel giorno hanno lezione**;
- se le colonne non stanno nello schermo vengono divise in **pagine** (es. "Docenti · 2 di 3"), che ruotano anch'esse:
  su uno schermo Full HD sono circa 9 colonne per pagina;
- in alto si vede quale vista è in onda, un pallino per ogni passo e una barretta che si riempie fino al cambio;
- l'ora in corso resta evidenziata in giallo; finite le lezioni si passa all'orario del giorno dopo;
- se qualcuno **tocca lo schermo** la rotazione va in pausa e ricompaiono i comandi; riparte da sola dopo
  2 minuti senza tocchi (lo stesso tempo del monitor di classe, `minutiRitornoMonitor` in `js/config.js`);
- i secondi predefiniti si cambiano in `js/config.js` (`secondiRotazioneIngresso`).

## Collegamento con Orario Facile

Le due app stanno sullo stesso sito, quindi **sullo stesso dispositivo condividono i dati**:

- **Anteprima in tempo reale**: sul computer dove si prepara l'orario con Orario Facile, l'app Orario DADA mostra direttamente quell'orario (la "bozza") e **si aggiorna da sola** mentre lo si modifica in un'altra scheda. In Orario Facile il pulsante **📱 Vedi nell'app** apre l'app; nell'app il menu → **Modifica in Orario Facile** fa il percorso inverso.
- Dal menu dell'app, **"Orario da mostrare"** permette di passare dalla bozza all'orario pubblicato e viceversa.
- **Pubblicare per tutti** (telefoni dei docenti, monitor di classe):
  1. Orario Facile → scheda **Esporta** → **Scarica orario.json**
  2. aprire la [cartella dati su GitHub](https://github.com/alessandrotrino-creator/iclaudecanti/upload/main/dati), trascinare il file (sostituisce quello vecchio) e premere **Commit changes**
  3. dopo un paio di minuti tutti i dispositivi vedono il nuovo orario (si aggiornano da soli ogni 15 minuti)

## Aggiornare l'orario

L'app legge **`dati/orario.json`** (nella radice del repo). Va bene:

- il file **orario.json di Orario Facile** (vedi sopra) oppure il suo backup JSON;
- oppure il formato dell'app, facile da scrivere anche a mano:

```json
{
  "scuola": "IC Almese", "anno": "2026/2027", "aggiornato": "2026-09-24",
  "giorni": ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì"],
  "ore": [{ "n": 1, "inizio": "08:00", "fine": "09:00" }],
  "classi": ["1A", "1B"],
  "docenti": [{ "id": "rossi-anna", "nome": "Anna Rossi", "email": "anna.rossi@comprensivoalmese.it" }],
  "aule": [{ "id": "aula-1", "nome": "Aula 1" }],
  "lezioni": [
    { "giorno": "Lunedì", "ora": 1, "classe": "1A", "materia": "Italiano", "docente": "rossi-anna", "aula": "aula-1" }
  ]
}
```

Il docente viene riconosciuto dal campo `email`. Se manca, l'app prova con *nome.cognome@comprensivoalmese.it* ricavato dal nome.
L'orario di esempio attuale è **inventato**.

## File

```
app/
  index.html            struttura della pagina
  css/app.css           stile (telefono, tablet, monitor, tema scuro)
  css/brief.css         stile della vista "In breve"
  js/config.js          impostazioni (dominio, ID client Google, durata "Ricordami", orari del tema...)
  js/tema.js            tema chiaro / scuro / secondo l'ora
  js/installa.js        pulsante "Installa l'app"
  js/condividi.js       finestra "Condividi l'app" con QR code
  icone/qr-app.svg      QR code con l'indirizzo dell'app
  js/dati.js            lettura dell'orario (anche dal backup di Orario Facile)
  js/accesso.js         accesso con Google
  js/viste.js           disegno della tabella
  js/brief.js           vista "In breve" (la giornata a schede)
  js/ingresso.js        schermo all'ingresso: viste a rotazione
  js/app.js             schermata iniziale, pulsanti, monitor, aggiornamenti
  sw.js                 funzionamento senza connessione
  manifest.webmanifest  installazione come app
  icone/                icone dell'app
```

Se l'indirizzo dell'app dovesse cambiare, aggiornare `indirizzoApp` in `js/config.js` e rigenerare il QR (serve Python con il pacchetto `qrcode`):

```bash
py -c "import qrcode, qrcode.image.svg; qrcode.make('NUOVO_INDIRIZZO', image_factory=qrcode.image.svg.SvgPathFillImage, border=3).save('app/icone/qr-app.svg')"
```

Per provarla sul PC serve un piccolo server (dalla cartella del repo): `py -m http.server 8765`, poi aprire http://localhost:8765/app/
