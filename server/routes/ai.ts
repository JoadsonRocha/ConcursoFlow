import { Router } from 'express';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PLANS } from '../constants/plans';
import * as GeminiService from '../services/gemini';
import { DATABASE_ID } from '../constants/config';
import { YoutubeTranscript } from 'youtube-transcript';

const router = Router();

// Generic handler for AI usage to stay DRY
async function handleAiRequest(req: AuthRequest, res: any, usageField: string, limitField: string, action: Function) {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'ID do usuário não identificado.' });

    const getDb = () => {
      try {
        const currentDbId = DATABASE_ID || '';
        if (currentDbId && currentDbId !== '(default)' && currentDbId !== '') {
          return getFirestore(admin.app(), currentDbId);
        }
        return getFirestore();
      } catch (e) {
        console.warn("⚠️ AI Route: Falha ao obter Firestore, tentando fallback.", e);
        try {
          return getFirestore();
        } catch (inner) {
          console.error("⚠️ AI Route: Falha total ao iniciar Firestore.", inner);
          return null;
        }
      }
    };

    const db = getDb();
    if (db) {
      try {
        // 1. Check limits and increment usage atomically
        await db.runTransaction(async (transaction) => {
          const userRef = db.collection('users').doc(userId);
          const userDoc = await transaction.get(userRef);

          if (!userDoc.exists) return; // if user not found, just skip tracking

          const data = userDoc.data();
          let plan = data?.userPlan || 'free';
          
          // Hardcoded PRO for special users (case-insensitive)
          const userEmailLower = (data?.email || '').toLowerCase().trim();
          if (userEmailLower === 'onrocha08@gmail.com' || userEmailLower === 'joadsonrocharr@gmail.com' || userEmailLower === 'joadsonrochar@gmail.com') {
            plan = 'pro';
          }

          let usage = data?.[usageField] || 0;
          const limits = PLANS[plan] || PLANS.free;
          const limit = (limits as any)[limitField];

          const now = new Date();
          const lastReset = data?.lastUsageReset?.toDate ? data.lastUsageReset.toDate() : new Date(0);
          let needsReset = false;
          if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
            needsReset = true;
            usage = 0;
          }

          if (usage >= limit) {
            throw new Error(`Limite atingido para o seu plano. Faça upgrade para continuar.`);
          }

          const updateData: any = {
            [usageField]: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp()
          };

          if (needsReset) {
              updateData.summaryUsage = usageField === 'summaryUsage' ? 1 : 0;
              updateData.flashcardUsage = usageField === 'flashcardUsage' ? 1 : 0;
              updateData.mindmapUsage = usageField === 'mindmapUsage' ? 1 : 0;
              updateData.importUsage = usageField === 'importUsage' ? 1 : 0;
              updateData.quizUsage = usageField === 'quizUsage' ? 1 : 0;
              updateData.lastUsageReset = FieldValue.serverTimestamp();
          }

          transaction.update(userRef, updateData);
        });
      } catch (transactionErr: any) {
        if (transactionErr?.message?.includes('Limite atingido')) {
          throw transactionErr; // Re-throw limit errors
        }
        console.warn(`⚠️ [AI Route] Falha ao registrar uso no DB para ${userId}:`, transactionErr?.message || transactionErr);
      }
    } else {
      console.warn(`⚠️ [AI Route] Firestore não está disponível para registrar uso, continuando sem tracking de limites.`);
    }

    // 2. Perform AI action
    const result = await action();
    res.json(result);
  } catch (error: any) {
    const errorMsg = String(error?.message || error);
    const statusCode = typeof error?.status === 'number' && error.status >= 100 && error.status <= 599 ? error.status : 500;
    
    const normalizedError = errorMsg.toLowerCase();
    if (
      statusCode === 429 || 
      error?.code === 429 || 
      normalizedError.includes('429') || 
      normalizedError.includes('quota') || 
      normalizedError.includes('exhausted') || 
      normalizedError.includes('rate limit') || 
      normalizedError.includes('ratelimit') ||
      statusCode === 503 || 
      normalizedError.includes('503')
    ) {
      console.warn(`[AI] Quota/Rate Limit atingido para ${usageField}:`, errorMsg);
      return res.status(statusCode === 500 ? 429 : statusCode).json({ error: "Os limites da inteligência artificial do sistema foram atingidos temporariamente. Por favor, tente novamente daqui a pouco." });
    }

    console.error(`AI Route Error (${usageField}):`, error);

    try {
      res.status(statusCode === 500 ? 500 : statusCode).json({ error: errorMsg, rawError: String(error) });
    } catch (fallbackError) {
      console.error("Critical fallback route error", fallbackError);
      res.status(500).json({ error: "Internal server crash", details: String(fallbackError) });
    }
  }
}

router.post('/flashcards', authenticate, (req, res) => {
  const { topic, count } = req.body;
  handleAiRequest(req, res, 'flashcardUsage', 'flashcardLimit', () => GeminiService.generateFlashcards(topic, count));
});

router.post('/summary', authenticate, (req, res) => {
  const { text } = req.body;
  handleAiRequest(req, res, 'summaryUsage', 'summaryLimit', () => GeminiService.generateSummary(text));
});

router.post('/mindmap', authenticate, (req, res) => {
  const { subject } = req.body;
  handleAiRequest(req, res, 'mindmapUsage', 'mindmapLimit', () => GeminiService.generateMindMap(subject));
});

router.post('/quiz', authenticate, (req, res) => {
  const { topic, subject, count } = req.body;
  handleAiRequest(req, res, 'quizUsage', 'quizLimit', () => GeminiService.generateQuizQuestions(topic, subject, count));
});

router.post('/parse-edital', authenticate, (req, res) => {
  const { rawText } = req.body;
  handleAiRequest(req, res, 'importUsage', 'importLimit', () => GeminiService.parseEdital(rawText));
});

router.post('/schedule', authenticate, (req, res) => {
  const { subjectsSummary, days } = req.body;
  // Use importUsage or a generic one if not specified
  handleAiRequest(req, res, 'importUsage', 'importLimit', () => GeminiService.generateSchedule(subjectsSummary, days));
});

router.post('/svg-map', authenticate, (req, res) => {
  const { title, prompt, quantity } = req.body;
  handleAiRequest(req, res, 'mindmapUsage', 'mindmapLimit', () => GeminiService.generateSVGMap(title, prompt, quantity));
});

router.post('/pareto', authenticate, (req, res) => {
  const { contestRole, banca, subjects, isHighPerformance } = req.body;
  handleAiRequest(req, res, 'importUsage', 'importLimit', () => GeminiService.analyzePareto(contestRole, banca, subjects, isHighPerformance));
});

router.post('/tutor', authenticate, (req, res) => {
  const { chatHistory, contextData } = req.body;
  // Using quizUsage or importUsage? Let's use 'quizUsage' as a proxy for tutor/chat interactions, or just default to importUsage. 
  // Let's use 'importUsage' or maybe 'summaryUsage' as it's a text chat. Let's use 'summaryUsage' for text.
  handleAiRequest(req, res, 'summaryUsage', 'summaryLimit', () => GeminiService.chatWithTutor(chatHistory, contextData));
});

function cleanHtml(html: string): string {
  // Strip script, style, and svg tags first
  let text = html.replace(/<(script|style|svg|noscript|header|footer|nav)[^>]*>([\s\S]*?)<\/\1>/gi, '');
  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  // Limit length to avoid massive inputs
  return text.substring(0, 45000); 
}

// Endpoint to scrape plain-text content from any web page url
router.post('/scrape-url', authenticate, async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL da página é obrigatória.' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(400).json({ error: `Impossível acessar a URL solicitada (Status: ${response.status}).` });
    }

    const html = await response.text();
    const cleanText = cleanHtml(html);

    // Get title from <title> tag
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Página da Web';

    res.json({
      title,
      content: cleanText
    });
  } catch (err: any) {
    console.error('Error scraping web page:', err);
    res.status(500).json({ error: `Erro no servidor ao ler a página: ${err.message || err}` });
  }
});

// Endpoint to fetch basic video details and description for any YouTube Watch link
router.post('/scrape-youtube', authenticate, async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL do YouTube é obrigatória.' });
  }

  try {
    let videoId: string | null = null;
    try {
      // 1. Try a robust regex that handles shorts, live, watch, embed, v, and youtu.be links
      const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]{11})/;
      const match = url.match(regExp);
      if (match && match[1]) {
        videoId = match[1];
      } else {
        // 2. Strict fallback using URL API in case query parameters are in a different order
        const parsedUrl = new URL(url);
        if (parsedUrl.hostname.includes('youtube.com')) {
          videoId = parsedUrl.searchParams.get('v');
        } else if (parsedUrl.hostname.includes('youtu.be')) {
          const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
          if (pathParts.length > 0) {
            videoId = pathParts[0];
          }
        }
      }
    } catch (e) {
      console.warn('URL parsing fallback error:', e);
    }

    if (!videoId) {
      return res.status(400).json({ error: 'ID do vídeo não identificado. Certifique-se de usar um link válido do YouTube.' });
    }

    let title = 'Vídeo do YouTube';
    let description = '';
    let authorName = '';

    // Step 1: Try YouTube oEmbed API. This is extremely reliable, officially supported and does not catch 403 blocks.
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const oembedRes = await fetch(oembedUrl);
      if (oembedRes.ok) {
        const oembedData: any = await oembedRes.json();
        title = oembedData.title || title;
        authorName = oembedData.author_name || '';
      }
    } catch (oembedErr) {
      console.warn('⚠️ oEmbed fetch failed, falling back to raw scraping:', oembedErr);
    }

    // Step 2: Try scraping watch page only if title is still default, or description is empty
    if (title === 'Vídeo do YouTube' || !description) {
      try {
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
          }
        });
        if (response.ok) {
          const html = await response.text();
          if (title === 'Vídeo do YouTube') {
            const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
            if (titleMatch) {
              title = titleMatch[1].replace('- YouTube', '').trim();
            }
          }
          const descMatch = html.match(/<meta\s+name="description"\s+content="([\s\S]*?)"/i) || html.match(/<meta\s+property="og:description"\s+content="([\s\S]*?)"/i);
          if (descMatch) {
            description = descMatch[1].trim();
          }
        }
      } catch (scrapeErr) {
        console.warn('⚠️ Raw scraping failed:', scrapeErr);
      }
    }

    // Step 2.5: Try to retrieve the video transcript/subtitles using youtube-transcript package
    let transcriptText = '';
    let hasTranscript = false;
    try {
      console.log(`[YouTube Scraper] Fetching transcript for videoId: ${videoId}`);
      // Try Portuguese first, then fallback to default (any) language
      let transcriptList;
      try {
        transcriptList = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' });
      } catch (ptErr) {
        console.warn('⚠️ PT transcript not found, trying default transcript fetch:', ptErr);
        transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
      }

      if (transcriptList && transcriptList.length > 0) {
        transcriptText = transcriptList.map((t: any) => t.text).join(' ');
        hasTranscript = true;
        console.log(`[YouTube Scraper] Successfully fetched transcript of ${transcriptText.length} characters.`);
      }
    } catch (transcriptErr: any) {
      console.warn('⚠️ Could not obtain automatic transcript from YouTube:', transcriptErr?.message || transcriptErr);
    }

    // Step 3: If we have a transcript, ALWAYS generate a highly detailed educational summary based on the spoken content!
    // Otherwise, generate an educational study summary based on the title!
    let aiSummaryGenerated = false;
    try {
      if (hasTranscript) {
        console.log(`[YouTube Scraper] Generating AI educational summary with TRANSCRIPT for: ${title}`);
        const aiSummary = await GeminiService.generateVideoDescription(title, authorName, transcriptText);
        if (aiSummary) {
          description = aiSummary;
          aiSummaryGenerated = true;
        }
      } else if (!description || description.length < 50) {
        console.log(`[YouTube Scraper] Generating AI educational summary based only on title: ${title}`);
        const aiSummary = await GeminiService.generateVideoDescription(title, authorName);
        if (aiSummary) {
          description = aiSummary;
          aiSummaryGenerated = true;
        }
      }
    } catch (aiErr) {
      console.error('⚠️ Failed to generate AI description:', aiErr);
    }

    let footerNote = `\n\n[Nota: Conteúdo de vídeo importado para o Notebook Stratis. Use seu tutor de IA para aprofundar ou gerar mapas e flashcards deste assunto.]`;
    let content = `Título do Vídeo: ${title}\nCanal: ${authorName || 'Especialista em Concursos'}\nURL: ${url}\nID do Vídeo: ${videoId}\n\n`;

    if (hasTranscript) {
      content += `Resumo e Conteúdo Didático Analisado por IA (Baseado no Áudio/Legenda):\n${description || 'Nenhuma descrição detalhada disponível.'}\n\n`;
      content += `Transcrição Completa do Vídeo:\n${transcriptText}\n\n`;
    } else {
      content += `Resumo e Conteúdo Didático:\n${description || 'Nenhuma descrição detalhada disponível.'}\n\n`;
    }

    content += footerNote;

    res.json({
      title,
      description,
      content
    });
  } catch (err: any) {
    console.error('Error fetching YouTube details:', err);
    res.status(500).json({ error: `Erro no servidor ao ler vídeo do YouTube: ${err.message || err}` });
  }
});

// Endpoint to chat with a study source
router.post('/chat-document', authenticate, (req, res) => {
  const { message, chatHistory, sourceContent, sourceTitle } = req.body;
  if (!message || !sourceContent || !sourceTitle) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes para o chat com documento.' });
  }
  handleAiRequest(req, res, 'summaryUsage', 'summaryLimit', () => 
    GeminiService.chatWithDocument(message, chatHistory || [], sourceContent, sourceTitle)
  );
});

export default router;
