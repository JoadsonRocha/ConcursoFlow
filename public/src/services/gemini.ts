import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "") || "" });

export const generateStudySummary = async (subject: string, topic: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `VOCÊ É O ESTRATEGISTA-CHEFE DE UMA MENTORIA DE ELITE PARA CONCURSOS.
      Crie um "BRIEFING OPERACIONAL" sobre "${topic}" dentro da disciplina de ${subject}.
      
      ESTRUTURA OBRIGATÓRIA:
      1. NÚCLEO ESSENCIAL: Definição técnica e seca (estilo letra da lei ou doutrina majoritária).
      2. INCIDÊNCIA TÁTICA: 3 pontos de altíssima relevância que as bancas (Ex: FCC, FGV, Cebraspe) adoram cobrar.
      3. ARMADILHAS: Identifique 1 "pegadinha" comum que costuma eliminar candidatos.
      4. MEMORIZAÇÃO ACELERADA: Forneça um mnemônico, tabela mental simples ou gatilho visual.
      
      Responda em Português com Markdown elegante e profissional.`,
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

export const generateMindMap = async (subject: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Crie uma estrutura técnica de mapa mental sobre "${subject}" com foco em concursos.
      DIRETRIZES:
      - Nó central deve ser "${subject}" (id: "1").
      - Crie ramos principais para as divisões doutrinárias ou legais mais importantes.
      - Adicione sub-ramos para detalhes que costumam ser "pegadinhas" (exceções, prazos, quóruns).
      - Use etiquetas curtas e diretas (máximo 5 palavras).
      
      Retorne um JSON com:
      - nodes: { id: string, data: { label: string }, position: { x: number, y: number } }
      - edges: { id: string, source: string, target: string }`,
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
                  data: {
                    type: Type.OBJECT,
                    properties: { label: { type: Type.STRING } },
                    required: ["label"]
                  },
                  position: {
                    type: Type.OBJECT,
                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } },
                    required: ["x", "y"]
                  }
                },
                required: ["id", "data", "position"]
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  source: { type: Type.STRING },
                  target: { type: Type.STRING }
                },
                required: ["id", "source", "target"]
              }
            }
          },
          required: ["nodes", "edges"]
        }
      }
    });

    if (!response.text) throw new Error("Não foi possível gerar o mapa mental.");
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Erro ao gerar mapa mental:", error);
    throw error;
  }
};

export const generateSVGMap = async (prompt: string, quantity: number = 3) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `VOCÊ É UM PROFESSOR DE CONCURSOS ESTRATEGISTA, ESPECIALISTA EM REVISÕES POR MAPAS MENTAIS DE ALTO IMPACTO.
      Seu objetivo é criar uma "ESQUEMATIZAÇÃO TÁTICA PROFISSIONAL" (Mapa Mental de Elite) sobre o tema: "${prompt}".
      
      DIRETRIZ DE ENGENHARIA DE REVISÃO: Pensamento de Professor Especialista.
      
      DIRETRIZES DE DESIGN TÁTICO:
      1. PERSONA: Mentor de elite para concursos de alto nível (Auditor, Juiz, Promotor, Analista).
      2. PROFUNDIDADE: Detalhado, técnico e exaustivo nos pontos de incidência (Doutrina, Lei e Jurisprudência).
      3. ESTRUTURA DO MAPA:
         - TEMA CENTRAL: Destaque visual impactante.
         - RAMIFICAÇÕES DE 1º NÍVEL: Grandes blocos, classificações e regimes.
         - RAMIFICAÇÕES DE 2º NÍVEL: Exceções, Prazos, Quóruns, e as "Entrelinhas" das bancas (FGV, FCC, CEBRASPE).
         - MNEMÔNICOS: Inclua gatilhos de memorização visual e mnemônicos operacionais.
      
      REQUISITOS VISUAIS E TÉCNICOS (SVG):
      - MARCA D'ÁGUA OBRIGATÓRIA: Adicione o texto "STRATIS PLANNER" no fundo do SVG, com opacidade baixíssima (fill="rgba(0,0,0,0.05)" ou opacity="0.08"), servindo como fundo protetor.
      - Design limpo, proporção A4 vertical (viewBox="0 0 800 1131").
      - Use cores contrastantes e hierarquia visual clara (temas principais com fontes maiores/negrito).
      - Todo texto deve estar dentro de tags <text> com fontes perfeitamente legíveis.
      - Use linhas e setas dinâmicas para guiar o fluxo de raciocínio.
      - O SVG deve ser profissional, elegante e funcional.
      
      SAÍDA:
      Divida o conteúdo em exatamente ${quantity} SVG(s) independentes e lógicos. Retorne um array JSON com exatamente ${quantity} strings de código SVG.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    if (!response.text) throw new Error("Não foi possível gerar mapas SVG.");
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Erro ao gerar mapas SVG:", error);
    throw error;
  }
};

export const generateQuizQuestions = async (subject: string, topic: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere 3 questões de múltipla escolha inéditas no nível de "Analista/Auditor" sobre o tema "${topic}" (${subject}).
      ESTILO: Simulando bancas de alto nível (FCC/FGV).
      CARACTERÍSTICAS:
      - Enunciados complexos com situações-problema ou casos práticos.
      - Alternativas com distinções sutis (evite respostas óbvias).
      - A explicação deve ser EXAUSTIVA, citando o fundamento legal ou doutrinário se possível.
      
      Retorne um array JSON: { question, options: string[], correctAnswerIndex: number, explanation }.`,
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
