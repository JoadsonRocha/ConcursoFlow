import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function generateFlashcards(topic: string, count: number = 5) {
  const genAI = getAiClient();

  const prompt = `VOCÊ É UM PROFESSOR DE CONCURSOS ESPECIALISTA EM REVISÕES ATIVAS E MEMORIZAÇÃO DE ALTO DESEMPENHO.
  Gere ${count} flashcards de estudo "NÍVEL ESPECIALISTA" para concurso público sobre o tema: "${topic}". 

  DIRETRIZ DE FORMATO: Retorne um JSON com array de objetos contendo "front" e "back".`;

  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING },
          },
          required: ["front", "back"],
        },
      },
    },
  });

  const text = response.text || "[]";
  return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
}

export async function generateSummary(text: string) {
  const genAI = getAiClient();

  const prompt = `Resuma o texto abaixo em pontos-chave focados em memorização para concursos.
  Texto: "${text}"
  Retorne o resumo formatado em Markdown limpo.`;

  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  return response.text;
}

export async function generateMindMap(subject: string) {
  const genAI = getAiClient();

  const prompt = `Crie a estrutura de um mapa mental sobre "${subject}". 
  JSON: nodes {id, data: {label}, position: {x,y}}, edges {id, source, target}`;

  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                data: { type: Type.OBJECT, properties: { label: { type: Type.STRING } } },
                position: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } }
              },
            }
          },
          edges: {
            type: Type.ARRAY,
            items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, source: { type: Type.STRING }, target: { type: Type.STRING } } }
          }
        },
      }
    }
  });

  const text = response.text || "{}";
  return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
}

export async function generateQuizQuestions(topic: string, subject: string) {
  const genAI = getAiClient();

  const prompt = `Gere 3 questões de múltipla escolha sobre "${topic}" (${subject}).
  Retorne JSON: [{question, options: [], correctAnswerIndex, explanation}]`;

  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.NUMBER },
            explanation: { type: Type.STRING }
          },
        }
      }
    }
  });

  const text = response.text || "[]";
  return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
}

export async function parseEdital(rawText: string) {
  const genAI = getAiClient();

  const prompt = `Analise o edital: ${rawText}
  Retorne JSON com name, role, examDate e subjects [ {id, name, topics: [] } ]`;

  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          role: { type: Type.STRING },
          examDate: { type: Type.STRING },
          subjects: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, topics: { type: Type.ARRAY, items: { type: Type.OBJECT } } } } }
        }
      }
    }
  });

  const text = response.text || "{}";
  return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
}

export async function generateSchedule(subjectsSummary: string, days: number) {
  const genAI = getAiClient();

  const prompt = `Gere rigorosamente ${days} dias de cronograma de estudos baseados nos tópicos: ${subjectsSummary}.
  Organize de forma progressiva e equilibrada. 
  Para cada dia, o 'dayNumber' deve ser a sequência do dia (1 até ${days}).
  Inclua 'specificTopic' (assunto principal do dia), 'generalTopic' (revisão de base ou lei seca),
  'questionGoal' (meta de questões sugerida, número inteiro) e 'revisionTask' (tarefa de revisão, ex: Flashcards, Mapa Mental).`;

  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { 
          type: Type.OBJECT, 
          properties: { 
            dayNumber: { type: Type.NUMBER }, 
            specificTopic: { type: Type.STRING }, 
            generalTopic: { type: Type.STRING },
            questionGoal: { type: Type.NUMBER },
            revisionTask: { type: Type.STRING }
          },
          required: ["dayNumber", "specificTopic", "generalTopic", "questionGoal", "revisionTask"]
        }
      }
    }
  });

  const text = response.text || "[]";
  return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
}

export async function generateSVGMap(title: string, prompt: string, quantity: number = 3) {
  const genAI = getAiClient();

  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: `Crie ${quantity} códigos SVG para mapas mentais sobre "${title}". Foco: ${prompt}. Retorne como array JSON de strings.` }] }]
  });
  
  const text = response.text || "[]";
  try {
    return JSON.parse(text);
  } catch (e) {
    const matches = text.match(/\[[\s\S]*\]/);
    if (matches) return JSON.parse(matches[0]);
    throw e;
  }
}
