export interface Topic {
  id: string;
  name: string;
  completed: boolean;
  revision: boolean;
  questions: boolean;
  errorNote?: string;
}

export interface Subject {
  id: string;
  name: string;
  totalTopics: number;
  completedTopics: number;
  category: 'Gerais' | 'Específicos';
  incidence: 'Baixa' | 'Média' | 'Alta' | 'Muito Alta';
  briefing?: string;
  topics?: Topic[];
}

export interface ScheduleDay {
  id: string;
  dayNumber: number;
  generalTopic: string;
  specificTopic: string;
  questionGoal: number;
  revisionTask: string;
  completed: boolean;
  actualHours?: number;
  actualQuestions?: number;
}

export interface Contest {
  id: string;
  name: string;
  role: string;
  examDate: string;
  subjects: Subject[];
  dailyGoalHours?: number;
  dailyGoalQuestions?: number;
  dailyContentVolume?: number;
  schedule?: ScheduleDay[];
  dailyHistory?: { date: string, hours: number, questions: number }[];
  scheduleStartDate?: string;
  ownerId?: string;
  ownerName?: string;
  likesCount?: number;
  isPublic?: boolean;
  banca?: string;
  summaryUsage?: number;
  flashcardUsage?: number;
  mindmapUsage?: number;
  importUsage?: number;
  paretoAnalyzed?: boolean;
  createdAt?: any;
  updatedAt?: any;
  ownerIsCreator?: boolean;
}

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

export interface Profile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  userPlan?: 'free' | 'pro' | 'monthly' | 'annual';
  subscriptionId?: string;
  currentContestId?: string | null;
  tourCompleted?: boolean;
  createdAt: any;
  updatedAt: any;
  
  // Custom Profile fields
  phoneNumber?: string;
  concursoFoco?: string;
  nivelAtual?: string;
  fraseStatus?: string;
  isCreator?: boolean;
  
  // Usage tracking
  lastUsageReset?: any; // Timestamp
  summaryUsage?: number;
  flashcardUsage?: number;
  mindmapUsage?: number;
  importUsage?: number;
}
