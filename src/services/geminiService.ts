import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

export async function generateFlashcards(topic: string, count: number = 5): Promise<GeneratedFlashcard[]> {
  try {
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
  } catch (error) {
    console.error("Erro na geração de flashcards por IA:", error);
    throw error;
  }
}
