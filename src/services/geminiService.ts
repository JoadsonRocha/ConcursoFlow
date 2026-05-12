import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    // Attempt to get API key from environment variables (client-side VITE_ or server-side fallback)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set or accessible.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

export async function generateFlashcards(topic: string, count: number = 5): Promise<GeneratedFlashcard[]> {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere ${count} flashcards de estudo para concurso público sobre o tema: "${topic}". 
      Os cards devem ser no formato Pergunta (frente) e Resposta (verso).
      As respostas devem ser concisas mas completas, focando em pontos que costumam cair em provas.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: {
                type: Type.STRING,
                description: "A pergunta ou termo do flashcard.",
              },
              back: {
                type: Type.STRING,
                description: "A resposta ou definição detalhada do flashcard.",
              },
            },
            required: ["front", "back"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text.trim());
  } catch (error: any) {
    console.error("Erro na geração de flashcards por IA:", error);
    if (error?.message?.includes('503') || error?.message?.includes('high demand') || error?.status === 503) {
      throw new Error("Ocorreu um limite de cotas ou alta demanda na inteligência artificial. Por favor, tente novamente em alguns instantes.");
    }
    throw error;
  }
}
