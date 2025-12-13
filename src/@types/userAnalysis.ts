export interface SubjectCounts {
  variaveis: number;
  listas: number;
  condicionais: number;
  operadores_logicos: number;
  funcoes: number;
  repeticao: number;
  verificacoes: number;
}

export interface Session {
  _id?: string;
  sessionStart: string;
  sessionEnd?: string;
  sessionDuration: number;
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  subjectCountsChat: SubjectCounts;
}

export interface UserAnalysisData {
  userId: string;
  name: string;
  className: string;
  totalUsageTime: number;
  sessions: Session[];
}