# 📓 Diario di Bordo: 9 Maggio 2026

## 🚀 1. Risoluzione Errori Critici API Gemini
*   **Fix Logica di Fallback:** Identificato un bug che causava il salto prematuro delle chiavi API. Il sistema interpretava erroneamente l'assenza di un modello come una chiave non valida. Ora il sistema distingue correttamente tra errori di autenticazione e modelli non trovati, provando tutti i modelli disponibili sulla stessa chiave prima di passare alla successiva.
*   **Pulizia Modelli Legacy:** Rimossi i modelli **Gemini 1.5 Pro/Flash** dalla gerarchia di priorità. Su richiesta dell'utente, il sistema ora accetta solo risultati di alta qualità dai modelli **3.1** e **2.5**, preferendo il fallimento a una trascrizione imprecisa.
*   **Nuova Gerarchia Priorità:**
    1. `gemini-3.1-pro-preview` (Massima precisione spaziale)
    2. `gemini-2.5-pro` (Stabilità e qualità)
    3. `gemini-3.1-flash-preview` (Velocità e intelligenza)
    4. `gemini-2.5-flash` (Efficienza e affidabilità)

## 📱 Ottimizzazioni per il Mobile (HTTP 413)
*   **Fix Payload Limit (Vercel):** Risolto l'errore "413 Payload Too Large" che bloccava gli upload da smartphone.
*   **Compressione JPEG Adattiva:** Sostituito il formato PNG (troppo pesante) con JPEG a qualità 70%.
*   **Ridimensionamento Intelligente:**
    *   Singola foto: max 2200px.
    *   Doppia foto: max 1600px per immagine.
    Questo garantisce che il payload base64 resti sempre sotto il limite di 4.5MB di Vercel, mantenendo però la nitidezza necessaria per l'OCR.

## 🔍 Debug e UX (Sotto il cofano)
*   **Salvataggio Immagini Debug:** Implementata una nuova funzione che salva automaticamente le immagini compresse (quelle effettivamente inviate all'IA) nella cartella `public/debug_images/` su GitHub. Questo permette di verificare dal PC la qualità della foto in caso di errori di trascrizione.
*   **Miglioramento Prompt Sequenziale:** Aggiornato il prompt per Gemini con etichette esplicite per le pagine (`--- INIZIO PAGINA 1 ---`). Ora il modello sa esattamente quante foto sta analizzando e in quale ordine, riducendo i salti di testo tra le pagine.
*   **Redirect Timer:** Esteso il tempo di permanenza sulla pagina di log da 5 a **30 secondi** dopo un successo, permettendo all'utente di leggere con calma tutti i dettagli tecnici dell'operazione.

## 🔧 Manutenzione e Build
*   **Fix TypeScript:** Risolti errori TS6133 (variabili inutilizzate) che bloccavano il build su Vercel dopo il refactoring della logica di compressione.
*   **Normalizzazione Accordi:** Migliorata la mappatura dei diesis/bemolle e dei suffissi nel componente `ChordBox.tsx` per una visualizzazione dei diagrammi più precisa.

---
*Sessione conclusa con successo. Sistema più stabile, trasparente e ottimizzato per l'uso live da smartphone.*
