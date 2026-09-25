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

## Campanella 🔔

Il tasto con la **campanella** nella barra in alto fa suonare il dispositivo agli orari della campanella. Quando è attiva il tasto è **acceso** (giallo, con un alone) e mentre suona oscilla.

- Si sceglie **quando suonare**: *al cambio d'ora*, *qualche minuto prima* (1, 2, 3, 5 o 10 minuti) oppure *entrambi*.
- Due suoni diversi: la **campanella** ("din-don") al cambio d'ora e tre **bip** leggeri per il preavviso. Sui telefoni Android vibra anche. I pulsanti *Prova* li fanno sentire subito.
- Il pannello mostra quando arriva il **prossimo suono**. Le scelte restano memorizzate sul dispositivo.
- **Limite dei siti web**: suona solo con l'app **aperta sullo schermo** e il volume alzato (su iPhone va tolto anche il silenzioso). Con il telefono bloccato o l'app chiusa il browser non permette di suonare. Per questo c'è l'opzione *Tieni acceso lo schermo* (consuma più batteria). Dopo aver riaperto l'app bisogna toccare lo schermo una volta per abilitare il suono.
- Funziona anche sui monitor di classe e sullo schermo all'ingresso.

Gli orari stanno in **`dati/campanella.json`** (nella radice del repo), separati dall'orario delle lezioni:

```json
{
  "giorni": ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì"],
  "suoni": [
    { "ora": "08:00", "nome": "Inizio 1ª ora" },
    { "ora": "10:50", "nome": "Inizio intervallo" },
    { "ora": "11:00", "nome": "Fine intervallo" }
  ]
}
```

Per cambiare un orario o aggiungere un intervallo basta modificare il file (orari in formato HH:MM, in ordine). Se il file manca, l'app usa gli orari di inizio delle ore dell'orario.

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

## Chi può modificare l'orario

Ci sono due tipi di utenti, tutti con l'account della scuola:

| Ruolo | Cosa può fare |
|---|---|
| **Fruitore** (tutti) | consultare l'orario nell'app Orario DADA |
| **Modificatore** | in più, usare **Orario Facile** (preparare l'orario, sostituzioni); nel menu dell'app vede "Modifica in Orario Facile" |

- Chi apre Orario Facile deve accedere con l'account della scuola (se è già entrato nell'app non lo richiede).
  Se non è un modificatore vede "Solo consultazione", il link all'orario e il suo **codice**.
- L'elenco dei modificatori è in `js/config.js`, campo **`editori`**: un codice di 16 caratteri per persona.
  Il repository è pubblico, quindi **non si scrivono le email**: il codice si ricava dall'email con un calcolo
  a senso unico (vedi `js/ruoli.js`) e non permette di risalire all'indirizzo.
- **Per abilitare una persona**: le si chiede di aprire Orario Facile; nella schermata "Solo consultazione" trova
  il codice (con il tasto *Copia*). Lo si aggiunge a `editori`, per esempio `editori: ['3f9a0c1d2e4b5a6f', '0b1c2d3e4f5a6b7c'],`.
  Per toglierla basta cancellare il suo codice.
- **Finché `editori` è vuoto, chiunque della scuola può modificare** (come prima).

> **Limite di GitHub Pages.** Il sito è fatto di file pubblici e il controllo avviene nel browser: separa i ruoli
> nell'uso normale, ma una persona esperta potrebbe aggirarlo *sul proprio computer*. Non potrebbe comunque
> cambiare l'orario di tutti: le modifiche di Orario Facile restano nel browser di chi le fa, e l'orario pubblicato
> (`dati/orario.json`) cambia solo con un caricamento su GitHub, che richiede di essere collaboratori del repository.

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

## Modifiche dell'ultimo minuto

Quando l'orario pubblicato cambia (per esempio un'aula spostata o una sostituzione), l'app lo segnala in modo ben visibile:

- l'app ricontrolla l'orario **ogni 5 minuti** (`minutiAggiornamentoDati` in `js/config.js`) e lo confronta con l'ultima
  versione vista su quel dispositivo;
- se sono cambiate lezioni **della giornata** (oggi, o il prossimo giorno di scuola se le lezioni di oggi sono finite)
  compare in alto un **riquadro giallo** "⚠️ Modifiche all'orario di oggi", con com'era **prima** (barrato) e com'è **adesso**,
  e le lezioni aggiunte o tolte;
- nella tabella le lezioni cambiate hanno il bordo evidenziato e l'etichetta **CAMBIATA** per tutta la giornata;
- al **docente** le modifiche che lo riguardano compaiono per prime, con "ti riguarda"; sul **monitor di un'aula** si vedono
  solo quelle di quell'aula; sullo schermo all'ingresso tutte;
- **Ho visto** nasconde il riquadro finché non arrivano altre modifiche;
- con **🔔 Avvisami anche con una notifica** (solo sui dispositivi personali) arriva anche la notifica del telefono o del PC.

Limiti: le notifiche arrivano solo mentre l'app è aperta (anche in secondo piano); per avvisare ad app chiusa servirebbe un
server, che su GitHub Pages non c'è. Chi apre l'app per la prima volta su un dispositivo non vede modifiche "vecchie":
il confronto parte da quel momento. Le prove nella bozza di Orario Facile non fanno scattare avvisi, solo l'orario pubblicato.

## LIM: dove andare dopo l'intervallo

Nelle scuole DADA dopo l'intervallo i ragazzi cambiano aula. Sulle LIM in modalità **monitor dell'aula**, agli orari
degli intervalli (**9:55–10:05 e 11:50–12:05**) l'app mostra per tutto l'intervallo, a tutto schermo e a caratteri grandi:

- per ogni classe che era in quell'aula prima dell'intervallo, **dove andare** nell'ora successiva (aula, materia, docente),
  oppure "Restate qui";
- quale classe **arriva** in quell'aula dopo l'intervallo.

Il tasto **Chiudi** la toglie fino all'intervallo successivo. Gli orari si cambiano in `js/config.js`, campo
`intervalliLim`, con inizio e fine di ogni intervallo: `{ inizio: '09:55', fine: '10:05' }`.

### Aprire l'app sulla LIM anche quando è chiusa

**Una pagina web non può aprirsi da sola**: è una regola di sicurezza di tutti i browser, e l'app (che vive su GitHub
Pages, senza server) non la può aggirare. Se l'app è già aperta sulla LIM la schermata compare da sola; per aprirla
quando è chiusa serve l'aiuto del sistema della LIM.

**LIM con Windows (PC OPS)** – nella cartella [`lim/`](lim/) ci sono gli script pronti:

1. Copiare sulla LIM i file della cartella `app/lim/` (o scaricarli dal sito:
   `.../app/lim/installa-apertura-intervallo.bat`, `apertura-intervallo.ps1`, `rimuovi-apertura-intervallo.bat`).
2. Sulla LIM aprire una volta l'app in Edge e fare l'accesso con **"Ricordami"** spuntato.
3. Doppio clic su **`installa-apertura-intervallo.bat`** e scrivere il nome dell'aula (es. `110ITA4`).
   Lo script crea nell'*Utilità di pianificazione* di Windows due attività, dal lunedì al venerdì alle 9:55 e alle 11:50,
   che aprono Edge sull'app, già sul monitor di quell'aula e a schermo intero.
4. Finito l'intervallo (alle 10:05 e alle 12:05, o premendo *Chiudi*) l'app chiude da sola la finestra che era stata aperta dallo script.
5. Per togliere tutto: doppio clic su **`rimuovi-apertura-intervallo.bat`**.

Se si cambia l'inizio degli intervalli, va cambiato sia in `js/config.js` sia nello script
(`-Orari "10:50","12:45"`) e lo script va rilanciato. Per vedere cosa farebbe senza cambiare niente:
`powershell -ExecutionPolicy Bypass -File apertura-intervallo.ps1 -Aula "110ITA4" -Prova`.

**LIM con Android** – da una pagina web non si può programmare l'apertura. Si può usare:
- la funzione di *programmazione / accensione pianificata* del pannello, se il modello ce l'ha, oppure la console di gestione
  (MDM) delle LIM della scuola;
- in alternativa un'app di automazione (per esempio *MacroDroid* o *Automate*) con un'azione a orario, dal lunedì al venerdì
  alle 9:55 e alle 11:50, che apre l'indirizzo `https://alessandrotrino-creator.github.io/iclaudecanti/app/?monitor=NOMEAULA&intervallo`
  (con Chrome, o l'app installata).

In ogni caso, se l'app resta sempre aperta sulla LIM (magari dietro ad altre finestre), la schermata compare comunque in
quella finestra: il browser però non può portarla davanti alle altre da solo.

## Schermo all'ingresso (proiezione a rotazione)

Per il televisore o il proiettore all'ingresso, dove nessuno tocca lo schermo: l'app mostra l'orario di oggi
e **cambia vista da sola** ogni tot secondi, nell'ordine **Classi → Docenti → Aule**.

1. Aprire l'indirizzo `https://alessandrotrino-creator.github.io/iclaudecanti/app/?ingresso`
   (ogni 20 secondi) oppure `.../app/?ingresso=30` per scegliere i secondi (da 5 a 600).
   In alternativa: menu in alto a destra → "Uso di questo dispositivo" → **📺 Schermo all'ingresso**.
2. **Ogni quanti secondi** lo decide l'utente: nel menu, sotto "Cambia vista ogni quanti secondi?", si scrive il numero
   (da 5 a 600, conferma con Invio) oppure lo si regola con **−** e **+** (di 5 in 5). Il cambio vale subito
   e resta memorizzato su quel dispositivo.
3. Accedere una volta con "Ricordami" spuntato; le scelte restano memorizzate su quel dispositivo.
4. Mettere a schermo intero (menu → *Schermo intero*, oppure F11).

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
  js/ruoli.js           chi può modificare l'orario (modificatori) e chi può solo consultarlo
  js/viste.js           disegno della tabella
  js/brief.js           vista "In breve" (la giornata a schede)
  js/campanella.js      tasto campanella: suoni agli orari di dati/campanella.json
  css/campanella.css    stile del tasto e del pannello della campanella
  js/ingresso.js        schermo all'ingresso: viste a rotazione
  js/intervallo.js      LIM: schermata dell'intervallo (dove vanno le classi nell'ora dopo)
  js/modifiche.js       avvisi delle modifiche dell'ultimo minuto all'orario della giornata
  lim/                  script per aprire l'app sulle LIM Windows agli intervalli
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
