# Piattaforma didattica C++ — versione 2

## Architettura
- **GitHub Pages** pubblica il sito statico usato dagli studenti.
- **Render** esegue il server Node.js.
- **Neon PostgreSQL** conserva account, stato dei giochi, completamenti e tempi.
- **Excel** serve all'insegnante per importare gli account e scaricare i risultati.

Il sito è mobile-first: gli studenti aprono un link dal browser del telefono, senza installare app.

## Contenuto
- `server.js`: API di login, verifica sessione, registrazione completamenti, import/export amministrativo.
- `db/schema.sql`: tabelle del database.
- `public/`: pagine web e Memory 4x4.
- `scripts/`: inizializzazione DB, modello Excel, import/export, copia per GitHub Pages.
- `.env.example`: modello delle variabili private.

## A. Neon
1. Crea un progetto con **PostgreSQL Database**; Object Storage non serve.
2. Scegli una regione europea se disponibile.
3. Apri **Connect** e copia la connection string PostgreSQL.
4. Non pubblicarla e non inserirla in `public/config.js`.

## B. Preparazione sul computer
Installa Node.js 20 o superiore. Estrai lo ZIP, apri il terminale nella cartella e lancia:
```bash
npm install
```
Copia `.env.example` in `.env`. Inserisci:
- `DATABASE_URL`: stringa di connessione Neon;
- `JWT_SECRET`: chiave casuale lunga;
- `ADMIN_KEY`: seconda chiave casuale lunga;
- `API_URL`: URL Render (dopo averlo creato);
- `SITE_ORIGIN`: origin GitHub Pages, ad esempio `https://utente.github.io`;
- `SITE_BASE_URL`: URL GitHub Pages completo, ad esempio `https://utente.github.io/nome-repo/`.

Per generare una chiave casuale esegui due volte:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Non caricare mai `.env` su GitHub.

## C. Inizializza Neon
Con `DATABASE_URL` compilato nel `.env`:
```bash
npm run db:init
```
Deve apparire `Database inizializzato.`

## D. Server Render
1. Crea un repository GitHub privato e carica il progetto, esclusi `.env`, `node_modules` e file Excel con dati personali.
2. Su Render scegli **New → Web Service** e collega il repository.
3. Build Command: `npm install`; Start Command: `npm start`.
4. In Render → Environment inserisci `DATABASE_URL`, `JWT_SECRET`, `ADMIN_KEY`, `SITE_ORIGIN`, `SITE_BASE_URL`, `NODE_ENV=production`.
5. Esegui il deploy e copia l'URL del servizio, per esempio `https://nome-app.onrender.com`.
6. Visita `https://nome-app.onrender.com/api/health`: deve rispondere `{"ok":true,"database":"connected"}`.

Il piano gratuito Render può sospendere il server dopo inattività: il primo accesso successivo può richiedere un'attesa per la riattivazione. Neon può mettere a riposo il calcolo quando non viene usato, ma i dati restano conservati.

## E. GitHub Pages
1. Modifica `public/config.js`: sostituisci l'indirizzo di esempio con l'URL Render reale, senza slash finale.
2. Esegui `npm run pages:build`: viene creata `docs/`, copia pubblicabile di `public/`.
3. Fai commit e push della cartella `docs/`.
4. In GitHub → Settings → Pages, scegli `Deploy from a branch`, branch `main`, cartella `/docs`, salva.
5. Il sito sarà raggiungibile da un indirizzo simile a `https://utente.github.io/nome-repo/`.
6. Controlla che `SITE_ORIGIN` in Render sia l'origine esatta del sito (senza il percorso `/nome-repo`).

Quando modifichi file in `public/`, ripeti `npm run pages:build` e pubblica nuovamente `docs/`.

## F. Excel: account e giochi
Crea il modello:
```bash
npm run excel:template
```
Modifica `excel/gestione_giochi.xlsx`.

Foglio `Accounts`:
- `full_name`: nome e cognome;
- `password`: password iniziale;
- `active`: TRUE/FALSE.

Foglio `Games`:
- `game_code`: codice da comunicare, per esempio `MEM01`;
- `title`: titolo;
- `game_path`: percorso relativo, per Memory `games/memory.html`;
- `active`: TRUE/FALSE.

Per un nuovo account la password è obbligatoria. Per un account esistente, lasciare vuota la password mantiene quella attuale; compilare la cella la cambia. Le password nel database sono salvate come hash.

Nel `.env` locale compila anche `API_URL` con l'URL Render e `ADMIN_KEY` con lo stesso valore impostato su Render. Poi esegui:
```bash
npm run excel:import -- excel/gestione_giochi.xlsx
```
L'Excel con nomi e password va conservato privatamente, mai in un repository pubblico.

## G. Scaricare i risultati
Quando vuoi esportare:
```bash
npm run excel:export
```
Il file viene salvato in `excel/risultati_YYYY-MM-DD.xlsx`, con:
- `Riepilogo`: per ogni alunno e gioco, iniziato, completamenti, miglior tempo, primo/ultimo avvio e ultimo completamento;
- `Tentativi completati`: una riga per ogni completamento e la sua durata.

Scarica i risultati alla fine della settimana e conserva una copia di backup. Non serve azzerare i dati: i completamenti si accumulano e il miglior tempo resta il più basso.

## H. Modifiche
- Account: modifica `Accounts` e reimporta. Password vuota = conserva la password già impostata.
- Giochi: aggiungi una riga in `Games` e crea il relativo file HTML sotto `public/`. Il percorso deve essere relativo, senza `/` iniziale e senza `..`.
- Domande Memory: modifica l'array `questions` in `public/games/memory.js`. Ogni domanda ha `text` e `answer` (`true` o `false`).
- Operatori: modifica `pool` in `memory.js`. Gli operatori `=` e `==` sono sempre inclusi.
- Dopo ogni modifica al sito: `npm run pages:build`, poi commit/push di `docs/`.

Per un nuovo gioco, leggi il token da `sessionStorage.getItem("studentGameToken")` e invia `POST /api/games/complete` con `Authorization: Bearer TOKEN` e JSON `{ "durationSeconds": numero }`.

## I. Collaudo
Prima della classe crea due account di prova, accedi da telefono, completa il gioco, esporta Excel e controlla completamenti e tempi. Verifica password errata e codice errato. Ripeti un completamento: il contatore deve aumentare.

## Sicurezza e limiti
- Non pubblicare `.env`, `DATABASE_URL`, `JWT_SECRET`, `ADMIN_KEY` o Excel con dati personali.
- Il repository del server deve essere privato.
- `public/config.js` contiene solo l'URL pubblico API.
- Raccogli solo dati necessari e segui le regole privacy della scuola, soprattutto perché gli utenti sono minorenni.
- Il tempo è comunicato dal browser: un utente esperto potrebbe alterare la richiesta. Questo prototipo è adatto a esercitazioni formative, non a prove certificative senza ulteriori controlli.
