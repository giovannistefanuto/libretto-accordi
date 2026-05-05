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
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY mancante");
    if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN mancante");
    addLog("Variabili d'ambiente verificate.");

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    const callGemini = async (modelName, apiVer) => {
      addLog(`Tentativo con modello: ${modelName} (${apiVer})...`);
      const model = genAI.getGenerativeModel(
        { model: modelName },
        { apiVersion: apiVer }
      );

      if (testMode) {
        const result = await model.generateContent("Rispondi solo 'OK'");
        return result;
      } else {
        const base64Data = image.split(',')[1] || image;
        const prompt = `Agisci come un esperto trascrittore musicale specializzato nel formato ChordPro. 
        Analizza l'immagine e restituisci ESCLUSIVAMENTE il codice ChordPro.
        Titolo: ${userTitle}.
        Restituisci SOLO il blocco di codice ChordPro, senza commenti.`;

        const result = await model.generateContent([
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
          { text: prompt }
        ]);
        return result;
      }
    };

    let result;
    try {
      result = await callGemini("gemini-2.5-flash", "v1beta");
    } catch (err) {
      addLog(`Errore con 2.5-flash: ${err.message}`);
      addLog("Provo fallback su 1.5-flash (v1)...");
      result = await callGemini("gemini-1.5-flash", "v1");
    }

    const responseText = result.response.text();
    if (testMode) {
      addLog("Risposta ricevuta: " + responseText);
      return res.status(200).json({ success: true, logs, debug: responseText });
    }

    const chordProContent = responseText.replace(/```chordpro|```/g, '').trim();
    addLog("Contenuto ChordPro generato.");

    addLog("Connessione a GitHub...");
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const fileName = (userTitle || 'nuova-canzone')
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') + '.chordpro';

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `src/songs/${fileName}`,
      message: `Aggiunta automatica: ${userTitle}`,
      content: Buffer.from(chordProContent).toString('base64'),
    });

    addLog("File salvato su GitHub!");
    return res.status(200).json({ success: true, fileName, logs });

  } catch (error) {
    addLog("ERRORE: " + error.message);
    return res.status(500).json({ error: error.message, logs });
  }
}
