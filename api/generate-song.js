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

    // Gerarchia Modelli (Rollout richiesto)
    const modelsPriority = [
      "gemini-3.1-pro-preview",
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite-preview",
      "gemini-2.5-flash"
    ];

    // Preparazione dati multimediali per Gemini con rilevamento dinamico del mimeType
    const mediaParts = imagesList.map(img => {
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

            const prompt = `Agisci come un trascrittore musicale infallibile. Il tuo compito è convertire l'immagine di uno spartito/testo in formato ChordPro con precisione chirurgica.

            REGOLE DI FEDELTÀ ASSOLUTA:
            1. NON USARE LA TUA MEMORIA: Non completare o correggere la canzone in base a come la conosci. Trascrivi SOLO ciò che vedi nell'immagine. Se un accordo manca nell'immagine, NON aggiungerlo.
            2. MAPPATURA SPAZIALE: Gli accordi nell'immagine sono posizionati SOPRA il testo. In ChordPro, devi inserire l'accordo tra parentesi quadre [X] ESATTAMENTE prima del carattere o della sillaba che si trova verticalmente sotto l'accordo nell'immagine. Se un accordo è a metà parola, mettilo a metà parola.
            3. NOTAZIONE: Usa solo la notazione internazionale (A, B, C, D, E, F, G). Se l'immagine usa Do, Re, Mi, Fa, Sol, La, Si, convertili rispettivamente in C, D, E, F, G, A, B.
            4. ORDINE: Se ci sono più immagini, sono pagine consecutive. Uniscile in un unico flusso coerente.
            5. PROCEDURA RIGA PER RIGA: Elabora il documento rigorosamente una riga alla volta dall'alto verso il basso. Per ogni riga di testo, verifica il numero esatto di accordi presenti sopra di essa nell'immagine. Assicurati che il numero di accordi nel tuo output ChordPro corrisponda esattamente al numero di accordi visibili su quella riga, senza omissioni.

            TAG OBBLIGATORI:
            - {title: ${userTitle}}
            - {capo: N} (solo se esplicitamente scritto nell'immagine)
            - {start_of_verse}/{end_of_verse} e {start_of_chorus}/{end_of_chorus} per dividere le sezioni.

            ERRORE DA EVITARE: Non inventare accordi. Se un rigo non ha accordi, non metterli. Se l'immagine è sfocata, scrivi ciò che riesci a leggere senza indovinare.

            RISPOSTA: Restituisci SOLO il codice ChordPro puro.`;

            const result = await model.generateContent([
              ...mediaParts,
              { text: prompt }
            ]);

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
                addLog("Rate limit rilevato, attendo 5 secondi prima del retry...");
                await sleep(5000);
                attempts++;
                continue;
              }
            }

            // Se la chiave è invalida o scaduta, passiamo subito alla chiave successiva
            if (errMsg.includes("api_key_invalid") || errMsg.includes("not found") || errMsg.includes("expired") || errMsg.includes("unauthorized")) {
              keyHasAuthError = true;
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
    addLog("Il sito si aggiornerà tra circa 60 secondi.");
    
    return res.status(200).json({ success: true, fileName, logs });

  } catch (error) {
    addLog("ERRORE: " + error.message);
    return res.status(500).json({ error: error.message, logs });
  }
}
