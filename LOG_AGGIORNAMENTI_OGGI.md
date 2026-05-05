# 🎸 Diario di Bordo: Aggiornamenti 5 Maggio 2026

Questo file contiene il riepilogo delle modifiche e delle nuove funzionalità implementate nella sessione odierna.

## 1. 🤖 Potenziamento del Motore AI (Gemini 2.5 Flash)
*   **Rotazione Multi-Chiave:** Implementato il supporto per **5 chiavi API** (`GEMINI_API_KEY_1..5`). Il sistema passa automaticamente alla successiva se una fallisce o esaurisce la quota.
*   **Retry & Timeout:** Aggiunto un sistema di **2 tentativi rapidi** per ogni chiave con attesa di 1 secondo, ottimizzato per rientrare nel limite di 10 secondi di Vercel Hobby.
*   **Prompt Internazionale:** Forzata la notazione internazionale (**A, B, C...**) nel prompt di sistema, con istruzioni esplicite per convertire gli accordi italiani ("Do", "Re"...) durante la trascrizione.

## 2. 📸 Nuova Gestione Immagini & Mobile
*   **Supporto Multi-Pagina:** Aggiornata l'interfaccia di upload per permettere il caricamento di **fino a 2 foto** contemporaneamente. Gemini analizza entrambe le pagine e genera un unico file ChordPro coerente.
*   **Compressione Adattiva "Smart":** 
    *   Sotto i 3MB totali: Mantiene altissima qualità (**2000px, 90% quality**) per una precisione OCR impeccabile.
    *   Sopra i 3MB: Riduce a **1600px, 70% quality** per garantire l'upload anche su reti mobili lente e rispettare i limiti di Vercel (4.5MB payload).
*   **Anteprima Dinamica:** Aggiunta griglia di anteprima con possibilità di rimuovere singole foto cliccando sulla "×".

## 3. 🗑️ Gestione Libreria & Sicurezza
*   **Gesto Long-Press:** Implementata l'eliminazione delle canzoni tramite **pressione prolungata** (1 secondo) sull'elemento della lista.
*   **Protezione con Password:** L'eliminazione richiede l'inserimento della password **"gio"**. Il pulsante di conferma rimane disabilitato e grigio finché la password non è corretta.
*   **Feedback Tattile:** Aggiunta una leggera vibrazione (sui dispositivi supportati) al rilevamento della pressione prolungata.

## 4. 🛠️ Correzioni Tecniche & Bug Fix (Sotto il cofano)
*   **Fix Errore SHA:** Risolto il bug `"sha" wasn't supplied` che impediva di sovrascrivere canzoni già esistenti. Ora il sistema recupera automaticamente la versione precedente prima di aggiornare.
*   **TypeScript Health:** Corretti errori di compilazione in `UploadPage.tsx` dovuti alla migrazione dallo stato `image` singolo all'array `images`.
*   **Git Revert:** Gestito con successo il ripristino di una versione precedente dell'API su richiesta, mantenendo però i miglioramenti al prompt e alla stabilità.
*   **Error Logging:** Potenziato il terminale di log nell'app per mostrare errori critici in rosso e messaggi di successo in verde.

---
*Log generato il 5 Maggio 2026*
