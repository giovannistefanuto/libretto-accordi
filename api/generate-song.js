import { GoogleGenerativeAI } from "@google/generative-ai";
import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, title: userTitle, testMode } = req.body;
  const logs = [];
  const addLog = (msg) => {
    logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    console.log(msg);
  };

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = process.env.GITHUB_REPO_OWNER;
  const REPO_NAME = process.env.GITHUB_REPO_NAME;

  try {
    addLog("--- AVVIO PROCESSO ---");
    
    if (testMode) {
      addLog("Test connessione riuscito (Modello confermato: gemini-2.5-flash)");
      return res.status(200).json({ success: true, logs, debug: "API OK" });
    }

    addLog(`Elaborazione canzone: ${userTitle}`);
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const base64Data = image.split(',')[1] || image;
    
    addLog("Inviando immagine a Gemini 2.5 Flash...");
    const prompt = `Agisci come un esperto trascrittore musicale specializzato nel formato ChordPro. 
    Analizza l'immagine e restituisci ESCLUSIVAMENTE il codice ChordPro.
    Regole: Accordi tra [] prima della sillaba, usa {start_of_verse}/{end_of_verse} e {start_of_chorus}/{end_of_chorus}.
    Il titolo della canzone è: ${userTitle}.
    IMPORTANTE: Restituisci SOLO il blocco di codice ChordPro, senza commenti o introduzioni.`;

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
      { text: prompt }
    ]);

    const chordProContent = result.response.text().replace(/```chordpro|```/g, '').trim();
    addLog("Trascrizione ChordPro completata con successo.");

    addLog("Connessione a GitHub per il salvataggio...");
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const fileName = userTitle
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') + '.chordpro';

    const path = `src/songs/${fileName}`;

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: path,
      message: `✨ Auto-upload: ${userTitle}`,
      content: Buffer.from(chordProContent).toString('base64'),
    });

    addLog(`FILE SALVATO: ${path}`);
    addLog("Il sito si aggiornerà tra circa 60 secondi.");
    
    return res.status(200).json({ success: true, fileName, logs });

  } catch (error) {
    addLog("ERRORE: " + error.message);
    return res.status(500).json({ error: error.message, logs });
  }
}
