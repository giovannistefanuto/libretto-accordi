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

  addLog("--- DIAGNOSTICA AVVIATA ---");
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY mancante");
    addLog("Chiave API trovata (lunghezza: " + GEMINI_API_KEY.length + ")");

    // TEST DI CONNESSIONE DIRETTA (Senza libreria se possibile, o con fetch)
    addLog("Verifica validità chiave tramite fetch diretto...");
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    const testRes = await fetch(testUrl);
    const testData = await testRes.json();

    if (!testRes.ok) {
      addLog(`ERRORE DIRETTO GOOGLE: ${testRes.status} - ${JSON.stringify(testData.error)}`);
      throw new Error(`Google ha rifiutato la chiave: ${testData.error?.message || 'Errore sconosciuto'}`);
    }

    const availableModels = testData.models?.map(m => m.name.replace('models/', '')) || [];
    addLog(`CHIAVE VALIDA! Modelli disponibili per te: ${availableModels.slice(0, 5).join(', ')}...`);

    if (testMode) {
      return res.status(200).json({ success: true, logs, models: availableModels });
    }

    // Se arriviamo qui, proviamo a usare il primo modello disponibile che supporta la visione
    const targetModel = availableModels.find(m => m.includes('flash')) || "gemini-1.5-flash";
    addLog(`Scelto modello consigliato: ${targetModel}`);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: targetModel });

    const base64Data = image.split(',')[1] || image;
    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
      { text: `Trascrivi in ChordPro. Titolo: ${userTitle}` }
    ]);

    const chordProContent = result.response.text().replace(/```chordpro|```/g, '').trim();
    addLog("Trascrizione completata.");

    // GitHub
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const fileName = (userTitle || 'canzone').toLowerCase().replace(/\s+/g, '-') + '.chordpro';

    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: `src/songs/${fileName}`,
      message: `Aggiunta: ${userTitle}`,
      content: Buffer.from(chordProContent).toString('base64'),
    });

    addLog("Salvato su GitHub!");
    return res.status(200).json({ success: true, logs });

  } catch (error) {
    addLog("FALLIMENTO: " + error.message);
    return res.status(500).json({ error: error.message, logs });
  }
}
