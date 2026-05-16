import { fetchWithAuth } from "../lib/api";

export const generateStudySummary = async (subject: string, topic: string) => {
  try {
    const data = await fetchWithAuth("/api/ai/summary", {
      method: "POST",
      body: JSON.stringify({ text: `${subject}: ${topic}` }),
    });
    return data.summary || "Não foi possível gerar o resumo.";
  } catch (error: any) {
    console.error("Erro ao gerar resumo:", error);
    return error.message || "Erro ao gerar resumo. Tente novamente.";
  }
};

export const generateMindMap = async (subject: string) => {
  try {
    return await fetchWithAuth("/api/ai/mindmap", {
      method: "POST",
      body: JSON.stringify({ subject }),
    });
  } catch (error: any) {
    console.error("Erro ao gerar mapa mental:", error);
    throw error;
  }
};

export const generateSVGMap = async (title: string, prompt: string, quantity: number = 3) => {
  try {
    return await fetchWithAuth("/api/ai/svg-map", {
      method: "POST",
      body: JSON.stringify({ title, prompt, quantity }),
    });
  } catch (error: any) {
    console.error("Erro ao gerar mapas SVG:", error);
    throw error;
  }
};

export const generateQuizQuestions = async (subject: string, topic: string) => {
  try {
    return await fetchWithAuth("/api/ai/quiz", {
      method: "POST",
      body: JSON.stringify({ subject, topic }),
    });
  } catch (error: any) {
    console.error("Erro ao gerar questões:", error);
    throw error;
  }
};

export const parseEdital = async (rawText: string) => {
  try {
    return await fetchWithAuth("/api/ai/parse-edital", {
      method: "POST",
      body: JSON.stringify({ rawText }),
    });
  } catch (error: any) {
    console.error("Erro ao analisar edital:", error);
    throw error;
  }
};

export const generateSchedule = async (subjectsSummary: string, days: number) => {
  try {
    const data = await fetchWithAuth("/api/ai/schedule", {
      method: "POST",
      body: JSON.stringify({ subjectsSummary, days }),
    });
    
    // Add required ID for frontend logic
    return data.map((day: any) => ({
      ...day,
      id: `day-${day.dayNumber}-${Date.now()}`,
      completed: false
    }));
  } catch (error: any) {
    console.error("Erro ao gerar cronograma:", error);
    throw error;
  }
};
