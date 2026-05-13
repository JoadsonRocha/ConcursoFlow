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
      contents: `VOCÊ É UM PROFESSOR DE CONCURSOS ESPECIALISTA EM REVISÕES ATIVAS E MEMORIZAÇÃO DE ALTO DESEMPENHO.
      Gere ${count} flashcards de estudo "NÍVEL ESPECIALISTA" para concurso público sobre o tema: "${topic}". 

      DIRETRIZES DE DESIGN TÁTICO:
      1. PERSONA: Responda como um mentor de elite que conhece as "pegadinhas" das principais bancas (FGV, FCC, CEBRASPE).
      2. ESTRUTURA: Pergunta (frente) instigante e Resposta (verso) densa, técnica e completa.
      3. CONTEÚDO: Foque em prazos, quóruns, exceções, distinções doutrinárias e o "pulo do gato" que separa o aprovado do amador.
      4. QUALIDADE: Use linguagem jurídica/técnica precisa. Evite obviedades.

      Os cards devem ser no formato Pergunta (frente) e Resposta (verso).`,
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
