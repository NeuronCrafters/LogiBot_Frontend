export interface UsageTime {
  totalSeconds: number;
  formatted: string;
  humanized: string;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface Session {
  date: string;
  sessionStart: Date;
  sessionEnd: Date;
  sessionDuration: number;
  durationInMinutes: number;
  usage: number;
  formatted: string;
  userId: string;
  userName: string;
  courseName?: string;
  className?: string;
}

export interface DailyUsage {
  date: string;
  usage: number;
  formatted: string;
  sessions: Session[];
}

export interface UserAnalysisLog {
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  usageTimeInSeconds: number;
  usageTime: UsageTime;
  subjectCounts: {
    variaveis: number;
    tipos: number;
    funcoes: number;
    loops: number;
    verificacoes: number;
  };
  sessions: Session[];
  dailyUsage: DailyUsage[];
}

export interface LogApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface LogFilterParams {
  startDate?: string;
  endDate?: string;
  universityId?: string;
  courseId?: string;
  classId?: string;
  studentId?: string;
  subject?: string;
  disciplineId?: string;
}
