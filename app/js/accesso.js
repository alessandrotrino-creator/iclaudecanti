/*
  accesso.js – accesso con l'account Google della scuola (@comprensivoalmese.it).

  - La password la gestisce solo Google: l'app non la vede e non la salva mai.
  - Con "Ricordami" l'app memorizza chi ha fatto l'accesso (nome ed email) per N giorni,
    così la volta dopo si entra subito. Senza "Ricordami" vale solo finché resta aperta.
  - Se in config.js manca l'ID client di Google, parte la modalità dimostrativa.
*/
const Accesso = (() => {
  const CHIAVE = 'orariodada.sessione';
  const dominio = CONFIG.dominio.toLowerCase();
  const $ = sel => document.querySelector(sel);
  let alAccesso = null;

  const emailDellaScuola = email => typeof email === 'string' && email.toLowerCase().endsWith('@' + dominio);

  // Legge l'accesso memorizzato (prima quello "ricordato", poi quello della sessione)
  function sessione() {
    for (const archivio of ['localStorage', 'sessionStorage']) {
      try {
        const s = JSON.parse(window[archivio].getItem(CHIAVE) || 'null');
        if (s && s.scadenza > Date.now() && emailDellaScuola(s.email)) return s;
      } catch (e) { /* archivio non disponibile (es. navigazione privata) */ }
    }
    return null;
  }

  function salva(s, ricorda) {
    s.scadenza = Date.now() + (ricorda ? CONFIG.giorniRicordami * 864e5 : 12 * 36e5);
    try { (ricorda ? localStorage : sessionStorage).setItem(CHIAVE, JSON.stringify(s)); } catch (e) { /* ignorato */ }
  }

  function mostraErrore(testo) { $('#erroreAccesso').textContent = testo; }

  function completa(s) {
    salva(s, $('#ricordami').checked);
    $('#schermataAccesso').hidden = true;
    alAccesso(s);
  }

  // Legge il contenuto del "token" che Google restituisce dopo l'accesso
  function leggiToken(token) {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const byte = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(byte));
  }

  function rispostaGoogle(risposta) {
    try {
      const t = leggiToken(risposta.credential);
      const valido = t.aud === CONFIG.googleClientId && t.exp * 1000 > Date.now() && t.email_verified !== false;
      if (!valido) throw new Error('token non valido');
      // hd = dominio Google Workspace dell'account: deve essere quello della scuola
      if (t.hd !== dominio || !emailDellaScuola(t.email)) {
        mostraErrore('L\'account ' + t.email + ' non è della scuola. Usa il tuo indirizzo @' + dominio + '.');
        google.accounts.id.disableAutoSelect();
        return;
      }
      completa({ email: t.email.toLowerCase(), nome: t.name || t.email, foto: t.picture || '', metodo: 'google' });
    } catch (e) {
      mostraErrore('Accesso non riuscito. Riprova.');
    }
  }

  function caricaScriptGoogle() {
    return new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true; s.onload = ok; s.onerror = ko;
      document.head.appendChild(s);
    });
  }

  async function mostraSchermata() {
    $('#schermataAccesso').hidden = false;
    $('#dominioAccesso').textContent = '@' + dominio;
    if (CONFIG.googleClientId) {
      try {
        await caricaScriptGoogle();
        google.accounts.id.initialize({
          client_id: CONFIG.googleClientId,
          callback: rispostaGoogle,
          auto_select: true,          // chi è già entrato su questo dispositivo rientra da solo
          hd: dominio,                // propone solo gli account della scuola
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: true
        });
        google.accounts.id.renderButton($('#pulsanteGoogle'), {
          theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'it', width: 280
        });
        google.accounts.id.prompt();
      } catch (e) {
        mostraErrore('Impossibile contattare Google. Controlla la connessione e ricarica la pagina.');
      }
    } else {
      // Modalità dimostrativa: nessuna verifica, serve solo per provare l'app
      $('#moduloDemo').hidden = false;
      $('#pulsanteGoogle').hidden = true;
      $('#emailDemo').placeholder = 'nome.cognome@' + dominio;
      $('#moduloDemo').addEventListener('submit', evento => {
        evento.preventDefault();
        const email = $('#emailDemo').value.trim().toLowerCase();
        if (!emailDellaScuola(email)) { mostraErrore('Inserisci un indirizzo che finisce con @' + dominio + '.'); return; }
        const nome = email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        completa({ email, nome, foto: '', metodo: 'demo' });
      });
    }
  }

  // Punto di partenza: se l'accesso è memorizzato entra subito, altrimenti mostra la schermata
  function avvia(callback) {
    alAccesso = callback;
    const s = sessione();
    if (s) callback(s); else mostraSchermata();
  }

  function esci() {
    for (const archivio of ['localStorage', 'sessionStorage']) {
      try { window[archivio].removeItem(CHIAVE); } catch (e) { /* ignorato */ }
    }
    if (window.google && google.accounts) google.accounts.id.disableAutoSelect();
    location.reload();
  }

  return { avvia, esci, sessione };
})();
