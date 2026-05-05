# Report di Progetto: Libretto Accordi Digitale

Questo documento riassume tutte le funzionalità e l'architettura implementate per il tuo canzoniere digitale.

## 1. Obiettivo del Progetto
Trasformare un libretto fisico di canzoni in una web app moderna, modulare, con supporto alla trasposizione musicale istantanea e una pipeline di inserimento semplificata tramite IA (Gemini).

## 2. Architettura Tecnica
*   **Framework:** React + TypeScript (viti-powered).
*   **Gestione Accordi:** `chordsheetjs` per il parsing del formato ChordPro e la logica di trasposizione.
*   **Navigazione:** `react-router-dom` per la gestione di Home (Indice) e SongPage (Vista brano).
*   **Styling:** CSS Moderno con supporto nativo alla **Dark Mode** e design responsivo (mobile-first).

## 3. Funzionalità Implementate

### 🎵 Motore Musicale
*   **Supporto ChordPro:** Formato standard per mantenere accordi e testo perfettamente allineati.
*   **Trasposizione Dinamica:** Pulsanti `+` e `-` per cambiare tonalità in tempo reale.
*   **Logica Ottava (Modulo 12):** Il contatore si resetta a `0` quando raggiunge `+12` o `-12`, evitando valori ridondanti.
*   **Robustezza:** Sistema di protezione contro accordi non riconosciuti (evita il crash dell'app).

### 🔍 Navigazione e Ricerca
*   **Indice Automatico:** Le canzoni vengono caricate automaticamente dalla cartella `src/songs/` senza bisogno di aggiornare manualmente il codice.
*   **Ordine Alfabetico:** Elenco ordinato automaticamente per titolo.
*   **Barra di Ricerca:** Filtraggio istantaneo per **Titolo** o **Artista**.

### 🎸 Esperienza "Live" (UX)
*   **Screen Wake Lock:** Lo schermo rimane acceso finché una canzone è aperta (addio standby mentre suoni!).
*   **Zoom Testo:** Pulsanti dedicati per regolare la dimensione del font e degli accordi.
*   **Back to Index:** Navigazione rapida tra il repertorio.

## 4. Pipeline di Inserimento (Gemini)
Abbiamo definito un flusso di lavoro ottimizzato:
1.  **Foto:** Scatti una foto al libretto fisico.
2.  **Prompt:** Usi il file `GEMINI_PROMPT.md` creato nel progetto.
3.  **Output:** Gemini restituisce il codice ChordPro perfetto (notazione internazionale A, B, C...).
4.  **Upload:** Incolli il codice in un nuovo file `.chordpro` in `src/songs/`.

## 5. Stato Attuale e File Chiave
*   `src/songs/`: La cartella dove "buttare" le tue canzoni.
*   `GEMINI_PROMPT.md`: Il tuo assistente per la conversione.
*   `src/pages/Home.tsx` & `SongPage.tsx`: Il cuore dell'applicazione.

---
*Progetto realizzato con Gemini CLI - Maggio 2026*
