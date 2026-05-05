import { GoogleGenerativeAI } from "@google/generative-ai";
import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, title: userTitle, testMode } = req.body;
  const logs = [];
  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    logs.push(`[${timestamp}] ${msg}`);
    console.log(msg);
  };

  addLog("Inizio processo richiesta...");

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = process.env.GITHUB_REPO_OWNER;
  const REPO_NAME = process.env.GITHUB_REPO_NAME;

  try {
    // Check ENV
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY mancante nelle variabili d'ambiente di Vercel");
    if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN mancante");
    addLog("Variabili d'ambiente verificate correttamente.");

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.5-flash" },
      { apiVersion: 'v1beta' }
    );

    if (testMode) {
      addLog("Modalità TEST attiva: invio 'Ciao' a Gemini...");
      const result = await model.generateContent("Rispondi solo con la parola 'FUNZIONA' se ricevi questo messaggio.");
      addLog("Risposta ricevuta da Gemini: " + result.response.text());
      return res.status(200).json({ success: true, logs, debug: result.response.text() });
    }

    if (!image) throw new Error("Immagine mancante nella richiesta.");
    addLog("Immagine ricevuta, dimensione: " + Math.round(image.length / 1024) + " KB");

    // 1. Gemini
    addLog("Chiamata a Gemini 2.5 Flash in corso...");
    const base64Data = image.split(',')[1] || image;
    
    const prompt = `Agisci come un esperto trascrittore musicale specializzato nel formato ChordPro. 
    Analizza l'immagine e restituisci ESCLUSIVAMENTE il codice ChordPro.
    Titolo: ${userTitle}.
    Restituisci SOLO il blocco di codice ChordPro, senza commenti.`;

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
      { text: prompt }
    ]);
    
    const chordProContent = result.response.text().replace(/```chordpro|```/g, '').trim();
    addLog("Gemini ha generato il contenuto ChordPro con successo.");

    // 2. GitHub
    addLog("Connessione a GitHub in corso...");
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const fileName = (userTitle || 'nuova-canzone')
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') + '.chordpro';

    addLog(`Tentativo di creazione file: src/songs/${fileName}`);

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `src/songs/${fileName}`,
      message: `Aggiunta automatica: ${userTitle}`,
      content: Buffer.from(chordProContent).toString('base64'),
    });

    addLog("File salvato correttamente nel repository GitHub.");
    return res.status(200).json({ success: true, fileName, logs });

  } catch (error) {
    addLog("ERRORE CRITICO: " + error.message);
    return res.status(500).json({ error: error.message, logs });
  }
}
