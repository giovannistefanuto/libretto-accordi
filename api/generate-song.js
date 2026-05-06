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

    // Preparazione dati multimediali per Gemini
    const mediaParts = imagesList.map(img => ({
      inlineData: {
        data: img.split(',')[1] || img,
        mimeType: "image/jpeg"
      }
    }));

    // --- LOGICA DI ROLLOUT E ROTAZIONE CHIAVI ---
    for (let k = 0; k < geminiKeys.length; k++) {
      const currentKey = geminiKeys[k];
      const keyLabel = `Chiave ${k + 1}`;
      let keyHasAuthError = false;
      
      for (const modelName of modelsPriority) {
        try {
          addLog(`${keyLabel} - Provando ${modelName}...`);
          
          const genAI = new GoogleGenerativeAI(currentKey);
          const model = genAI.getGenerativeModel({ model: modelName });

          const prompt = `Agisci come un esperto trascrittore musicale specializzato nel formato ChordPro. 
          Analizza le immagini fornite (possono essere più pagine della stessa canzone) e restituisci un UNICO codice ChordPro che le unisca in ordine.
          
          REGOLE MANDATORIE PER GLI ACCORDI:
          - Usa ESCLUSIVAMENTE la notazione internazionale: A, B, C, D, E, F, G.
          - NON USARE MAI la notazione italiana (Do, Re, Mi, Fa, Sol, La, Si).
          - Se nell'immagine trovi "Do", scrivi [C]. Se trovi "Re", scrivi [D], e così via.
          - Gli accordi devono essere tra parentesi quadre [] e posizionati ESATTAMENTE prima della sillaba su cui cambiano.

          STRUTTURA:
          - Usa {start_of_verse}/{end_of_verse} per le strofe.
          - Usa {start_of_chorus}/{end_of_chorus} per i ritornelli.
          - Il titolo della canzone è: ${userTitle}.

          IMPORTANTE: Restituisci SOLO il blocco di codice ChordPro, senza commenti, spiegazioni o introduzioni.`;

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
          addLog(`${modelName} KO: ${err.message.substring(0, 40)}...`);
          
          // Se la chiave è invalida o scaduta, passiamo subito alla chiave successiva
          if (errMsg.includes("api_key_invalid") || errMsg.includes("not found") || errMsg.includes("expired")) {
            keyHasAuthError = true;
            break; 
          }
          // Altrimenti prosegue con il prossimo modello nella gerarchia
        }
      }

      if (chordProContent || keyHasAuthError) {
        if (chordProContent) break;
        addLog(`Passaggio alla chiave successiva causa errore critico.`);
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
