import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "") || "" });

export const generateStudySummary = async (subject: string, topic: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Como um mentor de concursos especializado em ${subject}, crie um resumo profissional e conciso sobre "${topic}". 
      Inclua:
      1. Definição rápida.
      2. 3 pontos principais que a banca FCC costuma cobrar.
      3. Uma dica de memorização (mnemônico se possível).
      Responda em Português com formatação Markdown limpa.`,
    });
    
    return response.text || "Não foi possível gerar o resumo.";
  } catch (error: any) {
    console.error("Erro ao gerar resumo:", error);
    if (error?.message?.includes('503') || error?.message?.includes('high demand') || error?.status === 503 || error?.status === 'UNAVAILABLE') {
      return "⚠️ **Ocorreu um limite de cotas ou alta demanda na IA.** Por favor, tente novamente em alguns instantes.";
    }
    return "Erro ao gerar resumo. Tente novamente.";
  }
};

export const generateQuizQuestions = async (subject: string, topic: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere 3 questões de múltipla escolha sobre "${topic}" no contexto de ${subject} no estilo da banca FCC.
      Retorne um array JSON de objetos com: { question, options: string[], correctAnswerIndex: number, explanation }.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswerIndex: { type: Type.NUMBER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    if (!response.text) return [];
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Erro ao gerar questões:", error);
    if (error?.message?.includes('503') || error?.message?.includes('high demand') || error?.status === 503 || error?.status === 'UNAVAILABLE') {
      throw new Error("O servidor da IA está com alta demanda no momento (limite de cotas). Por favor, aguarde alguns instantes e tente novamente.");
    }
    throw error;
  }
};

export const parseEdital = async (rawText: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise o seguinte texto de edital ou plano de estudos e extraia as informações estruturadas. 
      Identifique o nome do concurso, o cargo e uma lista de matérias EXTREMAMENTE detalhadas.
      
      DIRETRIZ CRÍTICA: Não extraia apenas nomes genéricos de matérias. Para cada matéria, você DEVE extrair todos os sub-tópicos, leis, decretos e assuntos específicos listados.
      
      Para cada matéria:
      1. Classifique como 'Gerais' ou 'Específicos'.
      2. Estime a incidência (Muito Alta, Alta, Média, Baixa) baseada no cargo.
      3. Crie um resumo (briefing) da matéria focado no que a banca costuma cobrar.
      4. Extraia CADA TÓPICO ESPECÍFICO como um item separado no array 'topics'. 
      5. 'totalTopics' DEVE ser exatamente o número de itens em 'topics'.
      6. 'completedTopics' deve ser 0.
      
      Exemplo de Granularidade: Se o texto diz "Matemática: Conjuntos, Frações, Porcentagem", você deve gerar 3 tópicos separados em vez de um único "Matemática".

      IMPORTANTE: Se o texto for longo, certifique-se de extrair o máximo de tópicos possível. Se não houver data de prova clara, use "2026-12-31".
      
      Texto do edital:
      """
      ${rawText}
      """`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            role: { type: Type.STRING },
            examDate: { type: Type.STRING },
            subjects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ['Gerais', 'Específicos'] },
                  incidence: { type: Type.STRING, enum: ['Muito Alta', 'Alta', 'Média', 'Baixa'] },
                  briefing: { type: Type.STRING },
                  totalTopics: { type: Type.NUMBER },
                  completedTopics: { type: Type.NUMBER },
                  topics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        completed: { type: Type.BOOLEAN },
                        revision: { type: Type.BOOLEAN },
                        questions: { type: Type.BOOLEAN }
                      },
                      required: ["id", "name", "completed", "revision", "questions"]
                    }
                  }
                },
                required: ["id", "name", "category", "incidence", "totalTopics", "completedTopics", "topics", "briefing"]
              }
            }
          },
          required: ["name", "role", "examDate", "subjects"]
        }
      }
    });

    if (!response.text) throw new Error("Não foi possível processar o edital.");
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Erro ao analisar edital:", error);
    if (error?.message?.includes('503') || error?.message?.includes('high demand') || error?.status === 503 || error?.status === 'UNAVAILABLE') {
      throw new Error("Alta demanda na IA (limite de cotas). Por favor, tente enviar o edital novamente em instantes.");
    }
    throw error;
  }
};

export const generateSchedule = async (subjectsSummary: string, days: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Com base nas matérias e tópicos abaixo, crie um cronograma de estudos estratégico para ${days} dias. 
      Distribua os tópicos de forma equilibrada, priorizando matérias de maior incidência.
      Cada dia DEVE ter um bloco de 'Específicos' e um de 'Gerais'.
      Siga o estilo da banca FCC (objetivo e técnico).
      
      DIRETRIZ DE FORMATO OBRIGATÓRIA:
      1. No campo 'specificTopic', você DEVE usar o formato "NOME DA MATÉRIA: NOME DO TÓPICO" (ex: "Direito Constitucional: Artigo 5º").
      2. No campo 'generalTopic', use o mesmo formato (ex: "Português: Crase").
      3. NUNCA deixe esses campos em branco. Se não houver tópicos suficientes, repita tópicos de alta incidência para revisão.
      4. Garanta que o cronograma cubra o máximo possível de tópicos diferentes.
      
      Matérias/Tópicos disponíveis:
      ${subjectsSummary}
      
      Retorne um array JSON de objetos: 
      { 
        "dayNumber": number, 
        "specificTopic": string (Matéria: Tópico), 
        "generalTopic": string (Matéria: Tópico), 
        "questionGoal": number, 
        "revisionTask": string 
      }`,
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

    if (!response.text) throw new Error("Não foi possível gerar o cronograma.");
    const data = JSON.parse(response.text);
    
    // Add required ID for frontend logic
    return data.map((day: any) => ({
      ...day,
      id: `day-${day.dayNumber}-${Date.now()}`,
      completed: false
    }));
  } catch (error: any) {
    console.error("Erro ao gerar cronograma:", error);
    if (error?.message?.includes('503') || error?.message?.includes('high demand') || error?.status === 503 || error?.status === 'UNAVAILABLE') {
      throw new Error("Alta demanda na geradora de cronogramas. O sistema está com limites de cotas excedido. Aguarde alguns minutos e tente novamente.");
    }
    throw error;
  }
};
