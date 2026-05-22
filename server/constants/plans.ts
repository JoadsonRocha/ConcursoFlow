export interface PlanLimits {
  summaryLimit: number;
  flashcardLimit: number;
  quizLimit: number;
  mindmapLimit: number;
  importLimit: number;
}

export const PLANS: Record<string, PlanLimits> = {
  free: {
    summaryLimit: 5,
    flashcardLimit: 5,
    quizLimit: 5,
    mindmapLimit: 5,
    importLimit: 1,
  },
  monthly: {
    summaryLimit: 500,
    flashcardLimit: 1000,
    quizLimit: 1000,
    mindmapLimit: 200,
    importLimit: 10,
  },
  annual: {
    summaryLimit: 2000,
    flashcardLimit: 5000,
    quizLimit: 5000,
    mindmapLimit: 500,
    importLimit: 50,
  },
  pro: {
    summaryLimit: 9999999,
    flashcardLimit: 9999999,
    quizLimit: 9999999,
    mindmapLimit: 9999999,
    importLimit: 9999999,
  }
};
