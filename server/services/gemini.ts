import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const GEMINI_MODEL = "gemini-3.5-flash";

function parseJsonResponse(text: string, defaultValue: any = null) {
  if (!text) return defaultValue;
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    try {
      // Try to find the first JSON object or array in the text
      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) return JSON.parse(objectMatch[0]);
      
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) return JSON.parse(arrayMatch[0]);
    } catch (e2) {
      console.error("Failed to parse JSON response. Raw text:", text.substring(0, 500));
    }
    return defaultValue;
  }
}

export async function generateFlashcards(topic: string, count: number = 5) {
  const genAI = getAiClient();

  const prompt = `VOCÊ É UM PROFESSOR DE CONCURSOS ESPECIALISTA EM REVISÕES ATIVAS E MEMORIZAÇÃO DE ALTO DESEMPENHO.
  Gere ${count} flashcards de estudo "NÍVEL ESPECIALISTA" para concurso público sobre o tema: "${topic}". 

  DIRETRIZ DE FORMATO: Retorne um JSON com array de objetos contendo "front" e "back".`;

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,
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

  return parseJsonResponse(response.text || "[]", []);
}

export async function generateSummary(text: string) {
  const genAI = getAiClient();

  const prompt = `Resuma o texto abaixo em pontos-chave focados em memorização para concursos.
  Texto: "${text}"
  Retorne o resumo formatado em Markdown limpo.`;

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  return response.text;
}

export async function generateMindMap(subject: string) {
  const genAI = getAiClient();

  const prompt = `Crie a estrutura de um mapa mental sobre "${subject}". 
  JSON: nodes {id, data: {label}, position: {x,y}}, edges {id, source, target}`;

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,
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
  return parseJsonResponse(text, {});
}

export async function generateQuizQuestions(topic: string, subject: string) {
  const genAI = getAiClient();

  const prompt = `Gere 3 questões de múltipla escolha sobre "${topic}" (${subject}).
  Retorne JSON: [{question, options: [], correctAnswerIndex, explanation}]`;

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,
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
  return parseJsonResponse(text, []);
}

export async function parseEdital(rawText: string) {
  const genAI = getAiClient();

  const prompt = `VOCÊ É UM ANALISTA DE EDITAIS EXPERT COM FOCO NA REGRA DE PARETO (80/20).
  Analise o edital abaixo e extraia a estrutura completa de estudos. 
  
  MISSÃO CRÍTICA:
  1. Identifique todas as disciplinas e seus respectivos tópicos.
  2. Para cada DISCIPLINA, determine a 'incidence' (incidência histórica/peso) baseada na importância para cargo similar e relevância histórica.
  3. Para cada TÓPICO, determine a 'incidence' (Baixa, Média, Alta, Muito Alta) baseada na frequência que esse assunto costuma cair em provas de concursos similares.
  
  Edital: ${rawText}
  
  Retorne um JSON estruturado com name, role, examDate e subjects.
  Cada subject deve ter id, name, category ("Gerais" ou "Específicos"), incidence e topics.
  Cada tópico deve ter id, name, completed (false) e incidence.`;

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
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
                category: { type: Type.STRING, enum: ["Gerais", "Específicos"] },
                incidence: { type: Type.STRING, enum: ["Baixa", "Média", "Alta", "Muito Alta"] },
                topics: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      completed: { type: Type.BOOLEAN },
                      incidence: { type: Type.STRING, enum: ["Baixa", "Média", "Alta", "Muito Alta"] }
                    }
                  } 
                } 
              } 
            } 
          }
        }
      }
    }
  });

  const text = response.text || "{}";
  return parseJsonResponse(text, {});
}

export async function generateSchedule(subjectsSummary: string, days: number) {
  const genAI = getAiClient();

  const prompt = `VOCÊ É UM ESTRATEGISTA DE ESTUDOS EXPERT EM PARETO (80/20).
  Gere rigorosamente ${days} dias de cronograma de estudos baseados nos tópicos: ${subjectsSummary}.
  
  DIRETRIZES DE ESTRATÉGIA:
  1. Priorize os assuntos com "Incidência Alta" ou "Muito Alta" para aparecerem mais cedo e com maior frequência.
  2. Organize de forma progressiva e equilibrada (Básicas + Específicas por dia).
  3. Para cada dia, o 'dayNumber' deve ser a sequência do dia (1 até ${days}).
  4. Inclua 'specificTopic' (assunto principal), 'generalTopic' (revisão base), 'questionGoal' (número inteiro) e 'revisionTask' (ex: Flashcards).`;

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,
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
  return parseJsonResponse(text, []);
}

export async function generateSVGMap(title: string, prompt: string, quantity: number = 3) {
  const genAI = getAiClient();

  const enhancedPrompt = `Você é um especialista em design de informação e geração vetorial. Crie ${quantity} códigos SVG para mapas mentais incrivelmente didáticos sobre o tema "${title}". Foco: ${prompt}.
  
  DIRETRIZES ESTRITAS PARA O SVG:
  1. Tamanho e Canvas: Use SEMPRE viewBox="0 0 1200 800" (tamanho A4 otimizado para web), com width="100%" height="100%". O fundo deve ser agradável e claro.
  2. Layout e Arranjo: Espalhe extensivamente os nós ao longo da tela utilizando TODO o espaço (esquerda, direita, cima e baixo) para garantir que NUNCA haja sobreposições (textos ou balões colidindo). 
  3. Quebra de Linha de Texto: O texto NÃO PODE vazar das caixas! Mantenha os rótulos super concisos (máx 3-4 palavras) OU use <tspan x="..." dy="1.2em"> para separar as linhas no SVG e manter o texto contido nos shapes.
  4. Hierarquia: O nó central deve ficar ao meio, com setas ou linhas curvas bezier (<path d="M... C...">) conectando aos subtópicos principais. 
  5. Estética Minimalista: Cores pastéis modernas, fontes limpas (font-family="sans-serif", font-weight="bold").
  
  Retorne EXCLUSIVAMENTE um array de strings JSON, onde cada string é o código XML do SVG pronto para ser renderizado na web. Não adicione textos aleatórios.`;

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }]
  });
  
  return parseJsonResponse(response.text || "[]", []);
}

export async function analyzePareto(contestRole: string, banca: string, subjects: any[], isHighPerformance: boolean = false) {
  const genAI = getAiClient();

  const subjectsSummary = subjects.map(s => `ID: ${s.id}, Nome: ${s.name}\nTópicos: ${s.topics?.map((t: any) => `[ID: ${t.id}] ${t.name}`).join(', ')}`).join('\n\n');

  const performancePrompt = isHighPerformance 
    ? `VOCÊ É O MAIOR ESTRATEGISTA DE CONCURSOS DO BRASIL, ESPECIALISTA EM ENGENHARIA REVERSA DE BANCAS. Sua análise será usada por candidatos de altíssima performance (Elite).
       Realize uma análise CRÍTICA e PROFUNDA para o cargo de "${contestRole}" na banca "${banca.toUpperCase()}". 
       Use heurísticas avançadas de probabilidade baseadas no histórico real de provas dos últimos 5 anos.`
    : `VOCÊ É UM ESTRATEGISTA DE DADOS DE CONCURSOS PÚBLICOS E UM EXPERT EM ANÁLISE ESTATÍSTICA DE BANCAS ORGANIZADORAS.
       Sua missão é realizar uma Análise de Pareto (80/20) detalhada para o cargo de "${contestRole}" focada na banca "${banca.toUpperCase()}".`;

  const prompt = `${performancePrompt}
  
  CONTEXTO DO EDITAL (USE ESTES IDS EXATAMENTE):
  ${subjectsSummary}
  
  O QUE VOCÊ DEVE ENTREGAR:
  1. 'incidenceScore' (0-100): Probabilidade estatística do tópico aparecer na prova (frequência histórica).
  2. 'strategicInsight': Um insight de mestre (curto e direto) para cada matéria, focando no "estilo" da banca ${banca}.
  3. 'goldenPoint': O tópico "cereja do bolo" que é cobrado em quase todas as provas dessa banca para este nível de cargo.
  4. 'priorityLabel': Classificação entre "Baixa", "Média", "Alta" ou "Crítico".
  
  ⚠️ REQUISITO OBRIGATÓRIO: No JSON de retorno, use EXATAMENTE os mesmos "id" das disciplinas e "id" dos tópicos fornecidos no contexto acima. Não invente novos IDs.
  
  RETORNO (JSON):
  {
    "subjects": [
      {
        "id": "ID_ORIGINAL_DA_DISCIPLINA",
        "name": "NOME_DA_DISCIPLINA",
        "strategicInsight": "...",
        "goldenPoint": "...",
        "topics": [
          {
            "id": "ID_ORIGINAL_DO_TOPICO",
            "name": "NOME_DO_TOPICO",
            "incidenceScore": 95,
            "priorityLabel": "Crítico" 
          }
        ]
      }
    ]
  }`;

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: isHighPerformance ? 0.2 : 0.4,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subjects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                strategicInsight: { type: Type.STRING },
                goldenPoint: { type: Type.STRING },
                topics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      incidenceScore: { type: Type.NUMBER },
                      priorityLabel: { type: Type.STRING }
                    },
                    required: ["id", "name", "incidenceScore", "priorityLabel"]
                  }
                }
              },
              required: ["id", "name", "strategicInsight", "goldenPoint", "topics"]
            }
          }
        }
      }
    }
  });

  const text = response.text || "{}";
  return parseJsonResponse(text, {});
}

