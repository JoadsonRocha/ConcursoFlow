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
        },
      },
    });
  }
  return aiClient;
}

export async function generateFlashcards(topic: string, count: number = 5) {
  const genAI = getAiClient();

  const prompt = `VOCÊ É UM PROFESSOR DE CONCURSOS ESPECIALISTA EM REVISÕES ATIVAS E MEMORIZAÇÃO DE ALTO DESEMPENHO.
  Gere ${count} flashcards de estudo "NÍVEL ESPECIALISTA" para concurso público sobre o tema: "${topic}". 

  DIRETRIZ DE FORMATO: Retorne um JSON com array de objetos contendo "front" e "back".`;

  const response = await genAI.models.generateContent({
    model: "gemini-3.5-flash",
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
    model: "gemini-3.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  return response.text;
}

export async function generateMindMap(subject: string) {
  const genAI = getAiClient();

  const prompt = `Crie a estrutura de um mapa mental sobre "${subject}". 
  JSON: nodes {id, data: {label}, position: {x,y}}, edges {id, source, target}`;

  const response = await genAI.models.generateContent({
    model: "gemini-3.5-flash",
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
    model: "gemini-3.5-flash",
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
    model: "gemini-3.5-flash",
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
    model: "gemini-3.5-flash",
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

  const enhancedPrompt = `Você é um especialista em design de informação e geração vetorial. Crie ${quantity} códigos SVG para mapas mentais incrivelmente didáticos sobre o tema "${title}". Foco: ${prompt}.
  
  DIRETRIZES ESTRITAS PARA O SVG:
  1. Tamanho e Canvas: Use SEMPRE viewBox="0 0 1200 800" (tamanho A4 otimizado para web), com width="100%" height="100%". O fundo deve ser agradável e claro.
  2. Layout e Arranjo: Espalhe extensivamente os nós ao longo da tela utilizando TODO o espaço (esquerda, direita, cima e baixo) para garantir que NUNCA haja sobreposições (textos ou balões colidindo). 
  3. Quebra de Linha de Texto: O texto NÃO PODE vazar das caixas! Mantenha os rótulos super concisos (máx 3-4 palavras) OU use <tspan x="..." dy="1.2em"> para separar as linhas no SVG e manter o texto contido nos shapes.
  4. Hierarquia: O nó central deve ficar ao meio, com setas ou linhas curvas bezier (<path d="M... C...">) conectando aos subtópicos principais. 
  5. Estética Minimalista: Cores pastéis modernas, fontes limpas (font-family="sans-serif", font-weight="bold").
  
  Retorne EXCLUSIVAMENTE um array de strings JSON, onde cada string é o código XML do SVG pronto para ser renderizado na web. Não adicione textos aleatórios.`;

  const response = await genAI.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }]
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

