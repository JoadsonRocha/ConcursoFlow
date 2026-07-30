/**
 * Interface que representa um Tópico de estudo dentro de uma matéria.
 */
export interface Topic {
  id: string;
  name: string;
  completed: boolean;     // Se o estudo teórico foi concluído
  revision: boolean;      // Se a revisão foi realizada
  questions: boolean;     // Se as questões foram praticadas
  errorNote?: string;     // Observações sobre erros cometidos
  incidence?: 'Baixa' | 'Média' | 'Alta' | 'Muito Alta'; // Frequência histórica em provas
  aiSummary?: string;     // Resumo gerado e salvo por IA
  aiSummarySavedAt?: string; // Data em que o resumo foi salvo
  savedSummaries?: Array<{
    id: string;
    aiSummary: string;
    savedAt: string;
    revisionCount?: number;
    lastReviewedAt?: string;
  }>;
}

/**
 * Interface que representa uma Disciplina/Matéria do concurso.
 */
export interface Subject {
  id: string;
  name: string;
  totalTopics: number;
  completedTopics: number;
  category: 'Gerais' | 'Específicos';
  incidence: 'Baixa' | 'Média' | 'Alta' | 'Muito Alta'; // Peso da matéria no concurso
  briefing?: string;     // Resumo ou orientações da matéria
  topics?: Topic[];
}

/**
 * Representa um dia individual dentro do Cronograma Estratégico.
 */
export interface ScheduleDay {
  id: string;
  dayNumber: number;      // Número do dia (ex: Dia 1, Dia 2)
  generalTopic: string;   // Matéria principal do dia
  specificTopic: string;  // Assunto específico a ser estudado
  questionGoal: number;   // Meta de questões para o dia
  revisionTask: string;   // Descrição da tarefa de revisão
  completed: boolean;     // Status de conclusão do dia
  actualHours?: number;   // Horas registradas pelo usuário
  actualQuestions?: number; // Questões registradas pelo usuário
}

/**
 * Interface do Ciclo de Revisão MEPP (Método de Estudo de Alta Performance).
 * Utiliza o conceito de Repetição Espaçada (Spaced Repetition).
 */
export interface MeppReview {
  id: string;
  topicName: string;      // Nome do tópico sendo revisado
  subjectName: string;    // Matéria associada
  createdAt: string;      // Data de criação do ciclo
  /**
   * Etapas do dia de estudo (Método MEPP):
   * - theory: Estudo Teórico
   * - recall: Recuperação Ativa (Flashcards/Resumo)
   * - practice: Prática de Questões
   * - errors: Análise de Erros
   */
  stagesCompleted?: string[]; 
  dueDate: string;        // Data em que a revisão deve ser feita (Formato YYYY-MM-DD)
  reviewType: '24h' | '7d' | '30d' | 'completed'; // Gatilhos do Spaced Repetition
  completedAt?: string;   // Data de conclusão efetiva
}

/**
 * Objeto central do Concurso. Contém toda a base de dados do plano de estudos.
 */
export interface Contest {
  id: string;
  name: string;           // Nome do Concurso (ex: SEFAZ-SP)
  role: string;           // Cargo pretendido
  examDate: string;       // Data da prova
  subjects: Subject[];    // Lista de matérias
  dailyGoalHours?: number;
  dailyGoalQuestions?: number;
  dailyContentVolume?: number;
  schedule?: ScheduleDay[];    // O cronograma gerado dia a dia
  dailyHistory?: { date: string, hours: number, questions: number }[]; // Histórico de produtividade
  scheduleStartDate?: string;
  ownerId?: string;       // ID do usuário criador (Firebase Auth UID)
  ownerName?: string;
  likesCount?: number;
  isPublic?: boolean;     // Se o plano é público na comunidade
  banca?: string;         // Banca examinadora (FGV, Cebraspe, etc)
  completedTopicsCount?: number;
  totalTopicsCount?: number;
  subjectsCount?: number;
  
  // Contadores de uso de IA (para planos limitados)
  summaryUsage?: number;
  flashcardUsage?: number;
  mindmapUsage?: number;
  importUsage?: number;
  
  paretoAnalyzed?: boolean; // Se a análise de incidência (Regra 80/20) foi feita
  paretoData?: {
    subjects: {
      id: string;
      name?: string;
      strategicInsight: string;
      goldenPoint: string;
      topics: {
        id: string;
        name?: string;
        incidenceScore: number;
        priorityLabel: string;
      }[];
    }[];
  };
  createdAt?: any;
  updatedAt?: any;
  ownerIsCreator?: boolean;
  meppReviews?: MeppReview[]; // Todos os ciclos de revisão ativos do usuário
}

/**
 * Progresso agregado do usuário no contexto de um concurso.
 */
export interface UserProgress {
  contestId: string;
  completedTopics: string[];
  studyTimeSeconds: number;
  dailyStreak: number;
  dailyHistory: {
    date: string;
    hours: number;
    questions: number;
  }[];
}

/**
 * Perfil completo do usuário no Stratis Planner.
 */
export interface Profile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  userPlan?: 'free' | 'beta' | 'pro' | 'monthly' | 'annual';
  subscriptionId?: string;
  currentContestId?: string | null;
  tourCompleted?: boolean;
  createdAt: any;
  updatedAt: any;
  
  phoneNumber?: string;
  concursoFoco?: string;
  nivelAtual?: string;
  fraseStatus?: string;
  isCreator?: boolean;
  
  fcmToken?: string;
  fcmTokens?: string[];
  notificationsEnabled?: boolean;
  
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  consentDate?: string;
  
  lastUsageReset?: any;
  summaryUsage?: number;
  flashcardUsage?: number;
  mindmapUsage?: number;
  importUsage?: number;
}
