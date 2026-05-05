import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID canzone mancante' });

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = process.env.GITHUB_REPO_OWNER;
  const REPO_NAME = process.env.GITHUB_REPO_NAME;

  try {
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const path = `src/songs/${id}.chordpro`;

    // Per eliminare un file su GitHub, dobbiamo prima ottenere il suo SHA
    const { data: fileData } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: path,
    });

    await octokit.repos.deleteFile({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: path,
      message: `🗑️ Auto-delete: ${id}`,
      sha: Array.isArray(fileData) ? fileData[0].sha : fileData.sha,
    });

    return res.status(200).json({ success: true, message: `Canzone ${id} eliminata.` });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
