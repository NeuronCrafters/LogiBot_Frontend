// Interface para representar o tempo total de uso
export interface UsageTime {
  totalSeconds: number;       // total de segundos utilizados
  formatted: string;          // string no formato "HH:MM:SS"
  humanized: string;          // string humanizada, ex: "2h 30m"
  hours: number;
  minutes: number;
  seconds: number;
}

// Interface para cada sessão individual
export interface Session {
  date: string;               // data da sessão, formato "YYYY-MM-DD"
  sessionStart: Date;         // início da sessão
  sessionEnd: Date;           // fim da sessão
  sessionDuration: number;    // duração em segundos
  durationInMinutes: number;  // duração convertida para minutos
  usage: number;              // uso em minutos
  formatted: string;          // duração formatada "HH:MM:SS"
  userId: string;
  userName: string;
  courseName?: string;
  className?: string;
}

// Interface para uso diário agregado
export interface DailyUsage {
  date: string;               // data, formato "YYYY-MM-DD"
  usage: number;              // total de minutos usados no dia
  formatted: string;          // total formatado "HH:MM:SS"
  sessions: Session[];        // lista de sessões desse dia
}

// Interface principal representando o log de análise de um usuário
export interface UserAnalysisLog {
  totalCorrectAnswers: number;      // total de acertos
  totalWrongAnswers: number;        // total de erros
  usageTimeInSeconds: number;       // uso total em segundos
  usageTime: UsageTime;             // objeto detalhado de tempo
  subjectCounts: {                  // contagem por assunto
    variaveis: number;
    tipos: number;
    funcoes: number;
    loops: number;
    verificacoes: number;
  };
  sessions: Session[];              // todas as sessões do usuário
  dailyUsage: DailyUsage[];         // uso agregado por dia
}

// Interface de resposta genérica da API de logs
export interface LogApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Parâmetros de filtro para chamadas à API
export interface LogFilterParams {
  startDate?: string;   // "YYYY-MM-DD"
  endDate?: string;
  universityId?: string;
  courseId?: string;
  classId?: string;
  studentId?: string;
  subject?: string;
}
