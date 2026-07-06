import { GoogleGenAI, Type } from "@google/genai";
import { getCachedResponse, setCachedResponse } from "./cache";
import crypto from 'crypto';

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

async function generateWithRetryAndFallback(payload: any, initialModel: string = GEMINI_MODEL, maxRetries = 3) {
  let delay = 300; // ms
  let currentModel = initialModel;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const genAI = getAiClient();
      const response = await genAI.models.generateContent({
        model: currentModel,
        ...payload
      });
      return response;
    } catch (error: any) {
      const errorMsg = String(error?.message || error).toLowerCase();
      const code = error?.code || error?.status;
      const isRetryable = 
        code === 429 || 
        code === 503 ||
        errorMsg.includes("429") || 
        errorMsg.includes("503") || 
        errorMsg.includes("quota") || 
        errorMsg.includes("limit") || 
        errorMsg.includes("unavailable") ||
        errorMsg.includes("demand") ||
        errorMsg.includes("temporary");
      
      if (isRetryable && attempt < maxRetries) {
        if (currentModel === "gemini-3.5-flash") {
          currentModel = "gemini-3.1-flash-lite"; // Fallback model
          console.warn(`[Gemini Retry] Attempt ${attempt} failed with ${error?.message || error}. Falling back to ${currentModel} and retrying...`);
        } else {
          console.warn(`[Gemini Retry] Attempt ${attempt} failed with ${error?.message || error}. Retrying in ${delay}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      } else {
        throw error;
      }
    }
  }
  throw new Error("Resiliência limite atingida no modelo de inteligência artificial.");
}

async function generateContentWithCache(serviceName: string, params: any, prompt: string, model: string = GEMINI_MODEL, config: any = {}) {
  const promptHash = crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 12);
  const cacheParams = { ...params, _promptHash: promptHash };
  const cached = await getCachedResponse(serviceName, cacheParams);
  if (cached) return cached;

  const response = await generateWithRetryAndFallback({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    ...config
  }, model);

  const result = response.text;
  if (result) {
    await setCachedResponse(serviceName, cacheParams, result);
  }
  return result;
}

export async function generateFlashcards(topic: string, count: number = 10) {
  const params = { topic, count };
  const prompt = `VOCÊ É UM PROFESSOR DE CONCURSOS ESPECIALISTA EM REVISÕES ATIVAS E MEMORIZAÇÃO DE ALTO DESEMPENHO.
  Gere ${count} flashcards de estudo "NÍVEL ESPECIALISTA" para concurso público sobre o tema: "${topic}". 
  
  DIRETRIZES DE CONTEÚDO CRÍTICAS:
  1. As PERGUNTAS (campo "front") devem ser EXTREMAMENTE SUCINTAS, DIRETAS E OBJETIVAS. Use no máximo uma frase curta, sem rodeios ou contextualização desnecessária (ex: "Qual o prazo de prescrição de X?", "Qual princípio rege Y?", "De quem é a competência exclusiva para Z?").
  2. As RESPOSTAS (campo "back") devem ser igualmente cirúrgicas, claras e direto ao ponto tático de memorização.

  DIRETRIZ DE FORMATO: Retorne um JSON com array de objetos contendo "front" e "back".`;

  const text = await generateContentWithCache("generateFlashcards", params, prompt, GEMINI_MODEL, {
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
    }
  });

  return parseJsonResponse(text || "[]", []);
}

export async function generateSummary(text: string) {
  const params = { text };
  const prompt = `Resuma o texto abaixo em pontos-chave focados em memorização para concursos.
  Texto: "${text}"
  Retorne o resumo formatado em Markdown limpo.`;

  const result = await generateContentWithCache("generateSummary", params, prompt);
  return result;
}

export async function generateMindMap(subject: string) {
  const params = { subject };
  const prompt = `Crie a estrutura de um mapa mental sobre "${subject}". 
  JSON: nodes {id, data: {label}, position: {x,y}}, edges {id, source, target}`;

  const text = await generateContentWithCache("generateMindMap", params, prompt, GEMINI_MODEL, {
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

  return parseJsonResponse(text || "{}", {});
}

export async function generateQuizQuestions(topic: string, subject: string, count: number = 10) {
  const params = { topic, subject, count };
  const prompt = `Gere exatamente ${count} questões de múltipla escolha sobre o tópico/matéria "${topic}" (${subject}). Use o material fornecido se houver.
  Cada questão deve conter exatamente 4 ou 5 opções de resposta (no campo "options").
  Retorne EXATAMENTE no formato JSON com as chaves: [{ "question": "texto da pergunta", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0, "explanation": "explicacao" }]`;

  const text = await generateContentWithCache("generateQuizQuestions", params, prompt, GEMINI_MODEL, {
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
          required: ["question", "options", "correctAnswerIndex", "explanation"]
        }
      }
    }
  });

  return parseJsonResponse(text || "[]", []);
}

export async function generateVideoDescription(videoTitle: string, channelName: string = "", transcriptText: string = ""): Promise<string> {
  const params = { videoTitle, channelName, hasTranscript: !!transcriptText, transcriptLength: transcriptText.length };
  const prompt = `Aja como um professor especialista em concursos públicos e preparação de alto rendimento.
${transcriptText ? `Com base no vídeo do YouTube e sua transcrição (legenda) abaixo:
Título: "${videoTitle}"
${channelName ? `Canal: "${channelName}"` : ""}

Informações e Transcrição Falada do Vídeo:
"""
${transcriptText.substring(0, 30000)}
"""` : `Com base no título do vídeo do YouTube abaixo:
Título: "${videoTitle}"
${channelName ? `Canal: "${channelName}"` : ""}`}

Gere uma descrição pedagógica detalhada baseada no conteúdo, sumário estruturado e uma lista de tópicos chaves didáticos e táticos sobre o assunto deste vídeo para o aluno estudar para o seu edital. Use português formal, adote um tom animador, claro e extremamente didático. Use markdown clássico para estruturar os tópicos e sub-tópicos de estudo.`;

  try {
    const result = await generateContentWithCache("generateVideoDescription", params, prompt, GEMINI_MODEL);
    return result || "";
  } catch (err) {
    console.error("Erro ao gerar descrição do vídeo via Gemini:", err);
    return "";
  }
}

export async function generateSuggestedQuestions(content: string, title?: string): Promise<string[]> {
  const prompt = `Aja como um professor especialista em concursos públicos e preparação de alto rendimento.
Baseado no seguinte conteúdo da fonte de estudo${title ? ` intitulada "${title}"` : ""}, sugira as 3 perguntas mais relevantes, intrigantes e de alto nível que um aluno poderia te fazer para dominar os pontos críticos e a aplicação deste assunto.

O aluno clicará nestas perguntas para iniciar um debate de alto rendimento com você (o professor).

Retorne EXATAMENTE um array JSON contendo 3 strings (as perguntas sugeridas). Não retorne nada além do array.

Conteúdo da fonte:
"""
${content.substring(0, 15000)}
"""`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    let text = response.text || "[]";
    const questions = JSON.parse(text);
    return Array.isArray(questions) ? questions.slice(0, 3) : [];
  } catch (err) {
    console.error("Erro ao gerar sugestões de perguntas via Gemini:", err);
    return [];
  }
}

export async function parseEdital(rawText: string) {
  const params = { rawText: rawText.substring(0, 1000) }; // Hash short version to avoid massive hashes
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

  const text = await generateContentWithCache("parseEdital", params, prompt, GEMINI_MODEL, {
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

  return parseJsonResponse(text || "{}", {});
}

export async function generateSchedule(subjectsSummary: string, days: number) {
  const params = { subjectsSummary, days };
  const prompt = `VOCÊ É UM ESTRATEGISTA DE ESTUDOS ALTAMENTE QUALIFICADO E ESPECIALISTA EM PREPARAÇÃO PARA CONCURSOS PÚBLICOS DE ALTO DESEMPENHO (MÉTODO PARETO 80/20).
  
  Gere rigorosamente um cronograma de estudos estruturado para ${days} dias com base nos seguintes tópicos e disciplinas do edital:
  ${subjectsSummary}
  
  DIRETRIZES DE ESTRATÉGIA DE CONCURSO (ANÁLISE DE ESPECIALISTA):
  1. **Análise de Pareto (Foco de Alto Rendimento)**: Priorize os assuntos de alta relevância, incidência ou complexidade para aparecerem de forma estratégica e progressiva.
  2. **Organização Equilibrada**: Distribua o cronograma alternando de forma saudável disciplinas de Conhecimentos Específicos e Conhecimentos Básicos/Gerais por dia.
  3. **Identificação Precisa de Assuntos (NÃO DEIXE CAMPOS VAZIOS OU GENÉRICOS)**:
     - **specificTopic**: Deve conter o tópico específico detalhado com subassuntos ou frentes de estudo (ex: "Ato administrativo: requisitos, atributos, classificação e extinção", "Tutelas constitucionais: remédios constitucionais (habeas corpus, MS, etc.)").
     - **generalTopic**: Deve obrigatoriamente especificar a Matéria Geral juntamente com o seu respectivo tópico de estudo específico para aquele dia, sempre estruturado no formato "[Nome da Matéria Geral]: [Tópico/Assunto Geral Específico de Estudo]" (ex: "Noções de Direito Constitucional: Princípios Fundamentais e Direitos Individuais", "Raciocínio Lógico-Matemático: Diagramas Lógicos e Operações de Conjuntos", "Física: Teorema trabalho-energia e potência"). NUNCA insira apenas o nome genérico ou isolado da matéria como "Física" ou "Noções de Direito Constitucional". O usuário precisa saber exatamente qual tópico de estudo/revisão daquela matéria geral ele deve cobrir no dia.
  4. **DayNumber**: Deve seguir a sequência linear estrita do dia (1 até ${days}).
  5. **QuestionGoal**: Um número inteiro estimando a meta de questões (ex: 15, 20, 25).
  6. **RevisionTask**: Tarefa de fixação ou revisão ativa recomendada pelo estrategista de forma personalizada e contextualizada ao assunto (ex: "Flashcards sobre CO-FI-FO-M-OB e atributos PATI", "Quadro comparativo de gratuidade e legitimidade ativa de cada remédio constitucional"). Use a criatividade e a precisão pedagógica para recomendar técnicas ricas de memorização/revisão baseadas no assunto estudado no dia.`;

  const text = await generateContentWithCache("generateSchedule", params, prompt, GEMINI_MODEL, {
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

  return parseJsonResponse(text || "[]", []);
}

export async function generateSVGMap(title: string, prompt: string, quantity: number = 3) {
  const params = { title, prompt, quantity };
  const enhancedPrompt = `Você é um especialista em design de informação e geração vetorial. Crie ${quantity} códigos SVG para mapas mentais incrivelmente didáticos sobre o tema "${title}". Foco: ${prompt}.
  
  DIRETRIZES ESTRITAS PARA O SVG:
  1. Tamanho e Canvas: Use SEMPRE viewBox="0 0 1200 800" (tamanho A4 otimizado para web), com width="100%" height="100%". O fundo deve ser agradável e claro.
  2. Layout e Arranjo: Espalhe extensivamente os nós ao longo da tela utilizando TODO o espaço (esquerda, direita, cima e baixo) para garantir que NUNCA haja sobreposições (textos ou balões colidindo). 
  3. Quebra de Linha de Texto: O texto NÃO PODE vazar das caixas! Mantenha os rótulos super concisos (máx 3-4 palavras) OU use <tspan x="..." dy="1.2em"> para separar as linhas no SVG e manter o texto contido nos shapes.
  4. Hierarquia: O nó central deve ficar ao meio, com setas ou linhas curvas bezier (<path d="M... C...">) conectando aos subtópicos principais. 
  5. Estética Minimalista: Cores pastéis modernas, fontes limpas (font-family="sans-serif", font-weight="bold").
  
  Retorne EXCLUSIVAMENTE um array de strings JSON, onde cada string é o código XML do SVG pronto para ser renderizado na web. Não adicione textos aleatórios.`;

  const text = await generateContentWithCache("generateSVGMap", params, enhancedPrompt, GEMINI_MODEL, {
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING
        }
      }
    }
  });
  return parseJsonResponse(text || "[]", []);
}

export async function chatWithTutor(chatHistory: any[], contextData: any) {
  // Pareto context if available
  let paretoSection = '';
  if (contextData?.paretoMetrics?.paretoAnalyzed) {
    const pm = contextData.paretoMetrics;
    paretoSection = `
  - MÉTRICAS DE PARETO (Foco no Top 20% de tópicos que garantem 80% dos acertos):
    * Cobertura de Teoria no Pareto: ${pm.stats?.teoriaPercent ?? 0}%
    * Cobertura de Revisão no Pareto: ${pm.stats?.revisaoPercent ?? 0}%
    * Cobertura de Questões no Pareto: ${pm.stats?.questoesPercent ?? 0}%
    * Pontos de Ouro Concluídos: ${pm.stats?.goldenCompleted ?? 0} de ${pm.stats?.goldenTotal ?? 0} (${pm.stats?.goldenPercent ?? 0}%)
    * Principais Assuntos de Alta Incidência PENDENTES (Sua maior prioridade de estudo!):
      ${JSON.stringify(pm.pendingTopTopics || [])}
  `;
  } else {
    paretoSection = `
  - MÉTRICAS DE PARETO: O aluno ainda não gerou a análise de Pareto para a banca ${contextData?.banca || 'escolhida'}. Lembre-o com frequência de acessar a aba "Estatísticas -> Pareto & Foco" para mapear os assuntos mais recorrentes da banca e focar no que realmente cai.
  `;
  }

  const prompt = `Você é a inteligência estratégica e parceira de jornada dentro da plataforma "StratisPlanner".
  Esqueça o jargão inicial de "sou um especialista". Sua postura é a de um mentor direto ao ponto, pragmático, focado em maximizar a inteligência de prova e o desempenho com base em dados reais.
  
  CONTEXTO DO ALUNO:
  - Alvo: ${contextData?.role || 'Não definido'}
  - Banca organizadora: ${contextData?.banca || 'Não definida'}
  - Histórico das últimas sessões (dias recentes): ${JSON.stringify(contextData?.recentHistory || [])}
  - Progresso atual das matérias: ${JSON.stringify(contextData?.subjectsProgress || {})}
  - Ofensiva ativa (sequência): ${contextData?.streak ?? 0} dias seguidos
  - Total de dias estudados: ${contextData?.totalStudiedDays ?? 0} dias
  - Total acumulado de horas de estudo: ${contextData?.totalHours ?? 0}h
  - Total de questões respondidas: ${contextData?.totalQuestions ?? 0}
  - Dia da semana mais produtivo: ${contextData?.mostProductiveDay ?? 'Sem dados'}
  - Previsão de conclusão do edital: ${contextData?.projectedCompletionDate ?? 'Sem dados'}
  - Dias restantes projetados para concluir: ${contextData?.daysRemainingForCompletion ?? 'Sem dados'}
  - Média de horas estudadas por semana: ${contextData?.weeklyAverageHours ?? 0}h
  - Média de questões resolvidas por semana: ${contextData?.weeklyAverageQuestions ?? 0}
  - Taxa de aderência à meta diária de estudos: ${contextData?.goalComplianceRate ?? 0}%
  - Taxa de compliance/aderência ao Método MEPP (Revisões, Questões e Teoria): ${contextData?.meppComplianceRate ?? 0}%
  ${paretoSection}

  DIRETRIZES DE COMUNICAÇÃO E COMPORTAMENTO:
  1. RESPONDA DE FORMA EXTREMAMENTE DIRETAS E CURTAS (MÁXIMO 3 PARÁGRAFOS CURTOS OU UMA LISTA CURTA DE BULLET POINTS). NUNCA envie textos longos ou prolixos. Vá direto à cereja do bolo.
  2. Seja humano, preciso, ultra pragmático e estratégico. Use o contexto para guiar a ação agora mesmo.
  3. Entregue um texto super agradável e cirúrgico (use formatação Markdown limpa, listas pontuadas firmes, evite parágrafos de mais de 3 linhas). NUNCA use tabelas markdown ou colunas estruturadas por pipes (|). Pontos chaves devem ser puro texto com negritos e marcadores.
  4. Sem enrolação. Respostas altamente focadas, assertivas e táticas. Se o aluno estiver perdendo tempo com teorias longas, relembre-o de focar no Pareto (probabilidade de incidência).
  5. SEU PAPEL É ESTRATÉGIA PURO SANGUE. Você não explica conteúdo de matérias nem gera resumos longos. Se o usuário pedir para explicar um conceito, seja super cirúrgico e direto e mostre COMO estudar isso de forma produtiva para a banca dele.
  
  Dê uma resposta assertiva, cirúrgica e extremamente objetiva (curta) para a última mensagem da conversa.`;

  // Filter history to convert it for Gemini SDK
  const formattedHistory = chatHistory.map(msg => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }]
  }));

  const response = await generateWithRetryAndFallback({
    contents: [
      { role: "user", parts: [{ text: prompt }] },
      ...formattedHistory
    ] // Inyect context as first user message, then follow the history
  }, GEMINI_MODEL);

  return response.text || "Desculpe, não consegui elaborar uma resposta no momento.";
}
export async function analyzePareto(contestRole: string, banca: string, subjects: any[], isHighPerformance: boolean = false) {
  const params = { contestRole, banca, subjects_count: subjects.length, isHighPerformance };
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

  const text = await generateContentWithCache("analyzePareto", params, prompt, GEMINI_MODEL, {
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

  return parseJsonResponse(text || "{}", {});
}

export async function chatWithDocument(message: string, chatHistory: any[], sourceContent: string, sourceTitle: string) {
  const systemInstruction = `Você é o "Analista de Pesquisa Stratis", um sistema de inteligência especializado em análise profunda de documentos, inspirado no funcionamento do NotebookLM.

Sua tarefa é ser um ESPELHO ANALÍTICO das fontes fornecidas. Você não deve agir como um mentor motivacional, mas como um analista de dados e textos.

FONTE DE REFERÊNCIA ATIVA:
Título: "${sourceTitle}"
--- INÍCIO DO CONTEÚDO ---
${sourceContent}
--- FIM DO CONTEÚDO ---

REGRAS DE OURO DA ANÁLISE:
1. GROUNDEDNESS (ANCORAGEM): Responda EXCLUSIVAMENTE com base nas informações contidas na fonte acima. Se o usuário perguntar algo que não está no texto, diga claramente: "Esta informação não consta na fonte analisada".
2. ESTILO ANALÍTICO SEM TABELAS: NUNCA use tabelas em markdown ou colunas separadas por barras verticais e traços (ex: | Coluna 1 | Coluna 2 |). Em dispositivos móveis e layouts estreitos, as tabelas markdown quebram e ficam ilegíveis. Em vez de tabelas, use textos estruturados de alta legibilidade: listas de tópicos com marcadores (bullet points), cabeçalhos claros (ex: ### Título), parágrafos bem espaçados e negritos para destaque tático.
3. SEM "CONVERSEIRO": Vá direto ao ponto. Não use frases de efeito ou saudações excessivas. 
4. CONTEXTO DE CONCURSOS: Quando encontrar prazos, leis, valores ou regras, destaque-os como "Pontos de Atenção Crítica".

MISSÃO DO PROMPT:
Transforme prompts vagos do usuário em análises estruturadas. Se o usuário for genérico, você deve ser específico e técnico.

DIRETRIZES TÉCNICAS:
- Use Markdown limpo e amigável para mobile (sem tabelas).
- Mantenha o foco técnico e acadêmico.
- Idioma: Português (PT-BR).`;

  const formattedHistory = chatHistory.map(msg => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }]
  }));

  const contents = [
    ...formattedHistory,
    { role: "user", parts: [{ text: message }] }
  ];

  const response = await generateWithRetryAndFallback({
    contents,
    config: {
      systemInstruction
    }
  }, "gemini-3.5-flash");

  return response.text || "Desculpe, não consegui analisar o documento no momento.";
}

