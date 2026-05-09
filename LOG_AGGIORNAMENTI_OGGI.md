# 📓 Diario di Bordo: 6 Maggio 2026 (Sessione Pomeridiana)

## 🚀 1. Ottimizzazioni Motore OCR (Gemini)
*   **Qualità Lossless (PNG):** Sostituita la compressione JPEG con il formato **PNG** per l'invio delle foto all'AI. Questo elimina i pixel "sporchi" e rende gli accordi piccoli (es. Am6, B7) molto più nitidi per Gemini.
*   **Calcolo Dimensioni Fix:** Corretto il bug nella stima del peso del payload base64 (ora usa il fattore 0.75). Garantita la massima risoluzione (2500px) restando sempre sotto il limite di 4.5MB di Vercel.
*   **MimeType Dinamico:** L'API ora rileva automaticamente se l'immagine è PNG o JPEG, evitando errori di parsing lato Google.
*   **Retry Rate-Limit:** Implementata un'attesa intelligente di 5 secondi in caso di errore "429 Too Many Requests", migliorando la stabilità con i modelli Preview.
*   **Nuova Gerarchia Modelli:** Priorità impostata sui modelli **Pro** (3.1 Pro -> 2.5 Pro) per una precisione chirurgica nel posizionamento spaziale degli accordi, con i modelli Flash come fallback veloce.

## 🎸 2. Nuova Feature: Diagrammi Accordi al Click
*   **Interattività:** Gli accordi nel testo sono ora cliccabili e mostrano un diagramma a fumetto (tooltip).
*   **Motore SVG Nativo:** Implementato un componente SVG personalizzato per il disegno dei diagrammi. Zero dipendenze esterne fragili, 100% stabilità e caricamento istantaneo.
*   **Integrazione chords-db:** Collegato un database professionale di oltre 2000 posizioni per chitarra.
*   **Normalizzazione Intelligente:** Il sistema traduce automaticamente i nomi italiani (Do, Re, Mi...) e i simboli (-, Δ, #, b) per trovare sempre la posizione corretta.

## 🔧 3. Bug Fix & Stabilità
*   **Vite/Vercel Build Fix:** Risolto un errore critico di compilazione causato da una libreria CommonJS non compatibile con ESM.
*   **TypeScript Health:** Corretti errori di importazione (`import type`) richiesti dalle nuove policy rigorose di Vercel.
*   **UI Safety:** Aggiunto un `ErrorBoundary` e log di sicurezza per prevenire crash dell'intera pagina in caso di dati accordi mancanti.

---
*Sessione completata con successo. Sistema OCR potenziato e funzionalità didattica attiva.*
