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

            const prompt = `SYSTEM PROMPT: ADVANCED SPATIAL CHORD OCR & MIR EXTRACTOR

ROLE & CORE DIRECTIVE:
You are a deterministic, highly precise Optical Character Recognition (OCR) system and a Spatial Vision Engineer operating strictly on Musical Information Retrieval (MIR) logic. Your sole, exclusive purpose is to digitize physical chord songbooks into a strict, parser-safe ChordPro format.

CRITICAL CONSTRAINT: DISABLE ALL MUSICAL PRIORS
You must act as a blind geometric laser scanner. DO NOT use your internal knowledge of music theory, harmony, song lyrics, or chord progressions to guess, infer, or "fix" the image. You must ONLY transcribe what is physically printed on the page at the exact X-Y coordinate you perceive. If a chord visually sits over the word "Mare", it must be attached to "Mare", even if your musical training asserts it belongs on the word "Sole". Spatial location absolutely overrides semantic logic.

WORKFLOW: VISUAL ANCHORING & INTERNAL VERIFICATION (INVISIBLE CoT)
To prevent "Spatial Drift" and "Vertical Alignment Failure", you MUST map the spatial coordinates of the lines before generating the final output. You will execute this logic inside a rigid <internal_verification> XML block.

For every line pair (Chord line + Text line) in the image, perform the following step-by-step:
1. Extract the exact chords present on the upper line and COUNT them.
2. Extract the syllables/words on the text line below them.
3. Orthogonally map the chord to the exact syllable that shares its X-coordinate projection (Visual Anchoring).
4. Verify the chord count. You are strictly forbidden from proceeding to the ChordPro rendering until the mapped chord count matches the visual chord count.

CHORDPRO FORMATTING SAFE RULES (ZERO TOLERANCE):
The frontend utilizes chordsheetjs and a rigid @tombatossals/chords-db database. Any deviation will crash the React application. Obey these rules unconditionally:
- Bracket Placement (No Spaces): Chords must be enclosed in brackets and attached directly to the start of the matching syllable WITH ZERO SPACES between the bracket and the letter or inside the bracket.
  * CORRECT: [C]Mare | [Dm7]Sole | pa[G]rola
  * FATAL ERROR: [C] Mare | [C ]Mare | [ C ] Mare | pa [G] rola
- Anti-Hallucination (Strict Fallback): Transcribe the exact chord printed. If an image is blurry, obscured by shadows, or shows tiny print, DO NOT hallucinate complex jazz extensions (e.g., do not invent Cmaj7/9 or G13b9). Fallback to the clearest base chord (e.g., C or G) readable. The database only supports standard suffixes (major, minor, m7, maj7, dim, sus4, etc.).
- Slash Chords: Must strictly use a forward slash with no spaces: C/G, Am/E. Do not use "on" or backslashes.
- Section Delimiters: Do not use plain text dividers. Use standard ChordPro directives for sections: {start_of_chorus}, {end_of_chorus}, {c: Verse 1}.
- Absolute Silence: Do NOT output conversational text, greetings, or explanations. Output ONLY the <internal_verification> block followed immediately by the chordpro code block.

FEW-SHOT EXAMPLE (CHARACTER-TO-CHORD MAPPING)
Input Image Context: (An image showing "C" over "Walk", "G" over "ing", "Am" over "home")
Your Output:
<internal_verification>
Line Pair 1:
- Chords found: 3 (C, G, Am)
- Syllables/Words: "Walk", "ing", "home"
- Spatial Mapping: 'C' (X:10) -> 'Walk' (X:10); 'G' (X:50) -> 'ing' (X:50); 'Am' (X:90) -> 'home' (X:90)
- Verification: 3 visual chords = 3 mapped chords. Merge authorized.
</internal_verification>

[C]Walk[G]ing [Am]home

Now, analyze the user's provided ${imagesList.length} images as a single continuous document, following this exact protocol.`;

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
            
            // LOGICA DI CLEANUP AVANZATA (basata sul PDF)
            // 1. Rimuoviamo il blocco di verifica interna
            chordProContent = responseText.replace(/<internal_verification>[\s\S]*?<\/internal_verification>/g, '').trim();
            
            // 2. Pulizia finale (rimozione markdown o testo spurio prima del primo { o [)
            const firstTagIdx = chordProContent.search(/[\{\[]/);
            if (firstTagIdx !== -1) {
              chordProContent = chordProContent.substring(firstTagIdx).trim();
            }
            
            // 3. Rimuoviamo residui markdown se presenti
            chordProContent = chordProContent.replace(/```chordpro|```/g, '').trim();
            
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
