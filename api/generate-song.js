import { GoogleGenerativeAI } from "@google/generative-ai";
import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, title: userTitle } = req.body;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = process.env.GITHUB_REPO_OWNER; // Es: "tuo-username"
  const REPO_NAME = process.env.GITHUB_REPO_NAME;   // Es: "libretto-accordi"

  if (!image) return res.status(400).json({ error: 'Image is required' });

  try {
    // 1. Inizializza Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Agisci come un esperto trascrittore musicale specializzato nel formato ChordPro. 
    Analizza l'immagine e restituisci ESCLUSIVAMENTE il codice ChordPro.
    Regole: Accordi tra [] prima della sillaba, usa {start_of_verse}/{end_of_verse} e {start_of_chorus}/{end_of_chorus}.
    Il titolo della canzone è: ${userTitle || 'Sconosciuto'}.
    Restituisci solo il codice, senza testo introduttivo.`;

    // Rimuovi l'intestazione data:image/... se presente
    const base64Data = image.split(',')[1] || image;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const chordProContent = result.response.text().replace(/```chordpro|```/g, '').trim();

    // 2. Salva su GitHub
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    // Genera un nome file pulito
    const fileName = (userTitle || 'nuova-canzone')
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Rimuove accenti
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') + '.chordpro';

    const path = `src/songs/${fileName}`;

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: path,
      message: `Aggiunta canzone automatica: ${userTitle}`,
      content: Buffer.from(chordProContent).toString('base64'),
    });

    return res.status(200).json({ success: true, fileName });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
