import { GoogleGenerativeAI } from "@google/generative-ai";
import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { images, image, title: userTitle, testMode } = req.body;
  // Supporto sia per 'image' (vecchio) che 'images' (nuovo)
  const imagesList = images || (image ? [image] : []);
  
  const logs = [];
  const addLog = (msg) => {
    logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    console.log(msg);
  };

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = process.env.GITHUB_REPO_OWNER;
  const REPO_NAME = process.env.GITHUB_REPO_NAME;

  // Caricamento chiavi Gemini (fino a 5)
  const geminiKeys = [
    process.env.GEMINI_API_KEY, // Chiave principale
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5
  ].filter(key => !!key); // Rimuove quelle non definite

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    addLog("--- AVVIO PROCESSO ---");
    
    if (testMode) {
      addLog(`Test connessione: ${geminiKeys.length} chiavi configurate.`);
      return res.status(200).json({ success: true, logs, debug: "API OK" });
    }

    addLog(`Elaborazione canzone: ${userTitle} (${imagesList.length} immagini)`);
    let chordProContent = null;

    // Gerarchia Modelli Ottimizzata (Qualità Pro -> Velocità Flash)
    const modelsPriority = [
      "gemini-3.1-pro-preview",     // Il top per ragionamento spaziale e OCR
      "gemini-2.5-pro",             // Estremamente stabile e preciso
      "gemini-3.1-flash-preview",   // Veloce, ottimo compromesso
      "gemini-2.5-flash"            // La rete di sicurezza (affidabile e veloce)
    ];

    // Preparazione dati multimediali per Gemini con rilevamento dinamico del mimeType
    // Esplicitiamo l'ordine delle immagini nel prompt per aiutare il modello
    const mediaParts = imagesList.map((img, index) => {
      const match = img.match(/^data:(image\/\w+);base64,/);
      const mimeType = match ? match[1] : "image/jpeg";
      return {
        inlineData: {
          data: img.split(',')[1] || img,
          mimeType
        }
      };
    });

    // --- LOGICA DI ROLLOUT E ROTAZIONE CHIAVI ---
    for (let k = 0; k < geminiKeys.length; k++) {
      const currentKey = geminiKeys[k];
      const keyLabel = `Chiave ${k + 1}`;
      let keyHasAuthError = false;
      
      for (const modelName of modelsPriority) {
        let attempts = 0;
        const maxRetries = 1; // Un retry per modello se becchiamo un rate limit

        while (attempts <= maxRetries) {
          try {
            addLog(`${keyLabel} - Provando ${modelName}${attempts > 0 ? ' (Retry)' : ''}...`);
            
            const genAI = new GoogleGenerativeAI(currentKey);
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = `Agisci come un trascrittore musicale infallibile. Il tuo compito è convertire le immagini di uno spartito/testo in formato ChordPro con precisione chirurgica.

            REGOLE DI FEDELTÀ ASSOLUTA:
            1. NON USARE LA TUA MEMORIA: Non completare o correggere la canzone in base a come la conosci. Trascrivi SOLO ciò che vedi nelle immagini. Se un accordo manca, NON aggiungerlo.
            2. MAPPATURA SPAZIALE: Gli accordi sono posizionati SOPRA il testo. In ChordPro, inserisci l'accordo [X] ESATTAMENTE prima della sillaba che si trova verticalmente sotto l'accordo.
            3. NOTAZIONE: Usa solo la notazione internazionale (A, B, C, D, E, F, G). Converti Do, Re, Mi, Fa, Sol, La, Si in C, D, E, F, G, A, B.
            4. ORDINE SEQUENZIALE: Ti ho fornito ${imagesList.length} immagini in ordine consecutivo (Pagina 1, Pagina 2, ecc.). Uniscile in un unico flusso coerente, rispettando rigorosamente l'ordine in cui te le ho inviate. Non saltare testo tra una pagina e l'altra.
            5. PROCEDURA RIGA PER RIGA: Elabora il documento riga per riga dall'alto verso il basso. Assicurati che il numero di accordi corrisponda esattamente a quelli visibili.

            TAG OBBLIGATORI:
            - {title: ${userTitle}}
            - {capo: N} (solo se esplicitamente scritto)
            - {start_of_verse}/{end_of_verse} e {start_of_chorus}/{end_of_chorus} per le sezioni.

            RISPOSTA: Restituisci SOLO il codice ChordPro puro.`;

            // Creiamo un array di parti che include descrizioni testuali per ogni immagine
            const promptParts = [];
            mediaParts.forEach((part, index) => {
              promptParts.push({ text: `--- INIZIO PAGINA ${index + 1} ---` });
              promptParts.push(part);
              promptParts.push({ text: `--- FINE PAGINA ${index + 1} ---` });
            });
            promptParts.push({ text: prompt });

            const result = await model.generateContent(promptParts);

            const responseText = result.response.text();
            chordProContent = responseText.replace(/```chordpro|```/g, '').trim();
            
            if (chordProContent) {
              addLog(`Trascrizione completata con ${modelName}.`);
              break; 
            }
          } catch (err) {
            const errMsg = err.message.toLowerCase();
            addLog(`${modelName} KO: ${err.message.substring(0, 50)}...`);
            
            // Se è un errore di Rate Limit o Quota, proviamo ad aspettare un po'
            if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("rate limit")) {
              if (attempts < maxRetries) {
                addLog(`Rate limit su ${modelName}, attendo 5 secondi prima del retry...`);
                await sleep(5000);
                attempts++;
                continue;
              }
            }

            // Se la chiave è invalida o scaduta, passiamo subito alla chiave successiva
            // Evitiamo "not found" perché spesso si riferisce al MODELLO e non alla chiave
            if (errMsg.includes("api_key_invalid") || errMsg.includes("expired") || errMsg.includes("unauthorized") || errMsg.includes("key not found")) {
              keyHasAuthError = true;
              addLog(`Errore critico di autenticazione con la chiave corrente.`);
            } else {
              addLog(`${modelName} non disponibile, provo il prossimo modello...`);
            }
            break; 
          }
        }
        if (chordProContent || keyHasAuthError) break;
      }

      if (chordProContent) break;
      if (keyHasAuthError) {
        addLog(`Passaggio alla chiave successiva causa errore di autenticazione.`);
      }
    }

    if (!chordProContent) {
      throw new Error("Tutte le chiavi API hanno fallito dopo i tentativi previsti.");
    }

    addLog("Connessione a GitHub per il salvataggio...");
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const fileName = userTitle
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') + '.chordpro';

    const path = `src/songs/${fileName}`;
    
    // --- GESTIONE SHA PER SOVRASCRITTURA ---
    let currentSha = null;
    try {
      const { data: existingFile } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: path,
      });
      if (existingFile && !Array.isArray(existingFile)) {
        currentSha = existingFile.sha;
        addLog("File esistente trovato, aggiornamento in corso...");
      }
    } catch (e) {
      addLog("Nuovo file, creazione in corso...");
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: path,
      message: `✨ Auto-upload: ${userTitle}`,
      content: Buffer.from(chordProContent).toString('base64'),
      sha: currentSha || undefined // Necessario per sovrascrivere
    });

    addLog(`FILE SALVATO: ${path}`);

    // --- SALVATAGGIO IMMAGINI DI DEBUG ---
    try {
      addLog("Salvataggio immagini di debug...");
      for (let i = 0; i < imagesList.length; i++) {
        const debugPath = `public/debug_images/${fileName.replace('.chordpro', '')}-page${i + 1}.jpg`;
        const base64Data = imagesList[i].split(',')[1] || imagesList[i];
        
        let debugSha = null;
        try {
          const { data: existingDebug } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: debugPath,
          });
          if (existingDebug && !Array.isArray(existingDebug)) debugSha = existingDebug.sha;
        } catch (e) {}

        await octokit.repos.createOrUpdateFileContents({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: debugPath,
          message: `📸 Debug image: ${userTitle} (Page ${i + 1})`,
          content: base64Data,
          sha: debugSha || undefined
        });
      }
      addLog("Immagini di debug salvate.");
    } catch (debugErr) {
      addLog(`Avviso: Impossibile salvare immagini debug: ${debugErr.message}`);
    }

    addLog("Il sito si aggiornerà tra circa 60 secondi.");
    
    return res.status(200).json({ success: true, fileName, logs });

  } catch (error) {
    addLog("ERRORE: " + error.message);
    return res.status(500).json({ error: error.message, logs });
  }
}
