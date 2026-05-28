import { fetchWithAuth } from "../lib/api";

export const generateStudySummary = async (subject: string, topic: string) => {
  try {
    const data = await fetchWithAuth("/api/ai/summary", {
      method: "POST",
      body: JSON.stringify({ text: `${subject}: ${topic}` }),
    });
    if (typeof data === "string") {
      return data;
    }
    if (data && typeof data.summary === "string") {
      return data.summary;
    }
    return data?.summary || "Não foi possível gerar o resumo.";
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
    const data = await fetchWithAuth("/api/ai/svg-map", {
      method: "POST",
      body: JSON.stringify({ title, prompt, quantity }),
    });
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.mapSvgs)) {
      return data.mapSvgs;
    }
    if (data && Array.isArray(data.svgs)) {
      return data.svgs;
    }
    return [];
  } catch (error: any) {
    console.error("Erro ao gerar mapas SVG:", error);
    throw error;
  }
};

export const generateQuizQuestions = async (subject: string, topic: string) => {
  try {
    const data = await fetchWithAuth("/api/ai/quiz", {
      method: "POST",
      body: JSON.stringify({ subject, topic }),
    });
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.questions)) {
      return data.questions;
    }
    if (data && Array.isArray(data.quiz)) {
      return data.quiz;
    }
    return [];
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
    
    const scheduleArray = Array.isArray(data) ? data : (data.schedule || data.days || []);
    // Add required ID for frontend logic
    return scheduleArray.map((day: any) => ({
      ...day,
      id: `day-${day.dayNumber}-${Date.now()}`,
      completed: false
    }));
  } catch (error: any) {
    console.error("Erro ao gerar cronograma:", error);
    throw error;
  }
};

export const generateParetoAnalysis = async (contestRole: string, banca: string, subjects: any[], isHighPerformance: boolean = false) => {
  try {
    const highPerf = isHighPerformance === true; // Ensure it's a strict boolean
    return await fetchWithAuth("/api/ai/pareto", {
      method: "POST",
      body: JSON.stringify({ contestRole, banca, subjects, isHighPerformance: highPerf }),
    });
  } catch (error: any) {
    console.error("Erro ao gerar análise de Pareto:", error);
    throw error;
  }
};

export const chatWithTutor = async (chatHistory: any[], contextData: any) => {
  try {
    const data = await fetchWithAuth("/api/ai/tutor", {
      method: "POST",
      body: JSON.stringify({ chatHistory, contextData }),
    });
    return data;
  } catch (error: any) {
    console.warn("Erro ao consultar o tutor AI:", error.message || error);
    return error.message || "Erro ao conectar com a IA. Tente novamente em alguns segundos.";
  }
};
