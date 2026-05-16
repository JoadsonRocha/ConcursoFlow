import { fetchWithAuth } from "../lib/api";

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

export async function generateFlashcards(topic: string, count: number = 5): Promise<GeneratedFlashcard[]> {
  try {
    const data = await fetchWithAuth("/api/ai/flashcards", {
      method: "POST",
      body: JSON.stringify({ topic, count }),
    });
    return data.flashcards;
  } catch (error: any) {
    console.error("Erro na geração de flashcards por IA:", error);
    throw error;
  }
}
