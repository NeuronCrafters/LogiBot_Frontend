import { LogEntityType, LogMetricType, LogModeType } from "@/services/api/api_routes";

// Estado do filtro de gráficos
export interface ChartFilterState {
  type: LogEntityType;
  ids: string[];
  mode: LogModeType;
}

// Dados para gráfico de categoria
export interface CategoryData {
  category: string;
  value: number;
}

// Dados para gráfico de acertos/erros
export interface AccuracyData {
  name: string;
  value: number;
}

// Dados para gráfico de uso
export interface UsageData {
  day: string;
  minutes: number;
}

// Dados para comparação de categorias
export interface CategoryComparisonData {
  user: string;
  [category: string]: string | number;
}

// Dados de comparação de acurácia
export interface AccuracyComparisonData {
  name: string;
  correct: number;
  incorrect: number;
}

// Dados de comparação de uso
export interface UsageComparisonData {
  dia: string;
  [user: string]: string | number;
}

// Tipo para resultado da busca de entidades
export interface EntitySearchResult {
  items: Array<{
    id: string;
    name: string;
    [key: string]: any;
  }>;
  total: number;
}

// Definição consolidada dos tipos de filtro
export type FilterType =
  | 'universities'
  | 'courses'
  | 'disciplines'
  | 'classes'
  | 'professors'
  | 'students'
  | 'students-discipline'
  | "students-class"
  | 'students-course';

// Interface FilterData consolidada que atende a todas as necessidades
export interface FilterData {
  filterType: FilterType | '';
  universityId?: string;
  courseId?: string;
  disciplineId?: string;
  classId?: string;
  searchTerm?: string;
}

// Definição do tipo para papéis de usuário
export type Role = "admin" | "course-coordinator" | "professor";

// Nova interface para a resposta da API de uso
export interface UsageApiResponse {
  totalUsageTime: number;
  sessionCount: number;
  sessionDetails: Array<{
    sessionStart: string;
    sessionEnd: string;
    sessionDuration: number;
  }>;
}

// Interface para a resposta da API de acurácia
export interface AccuracyApiResponse {
  totalCorrect: number;
  totalWrong: number;
  accuracy: number; // Porcentagem de acerto (0-100)
}

// Interface para a resposta da API de categorias/assuntos
export interface SubjectsApiResponse {
  subjectFrequency: Record<string, number>;
}

// Interfaces para os formatos de resposta comparativa
export interface CompareAccuracyApiResponse {
  entityId: string;
  name: string;
  totalCorrect: number;
  totalWrong: number;
  accuracy: number;
}

export interface CompareUsageApiResponse {
  dia: string;
  [entityId: string]: string | number;
}

export interface CompareSubjectsApiResponse {
  user: string;
  [category: string]: string | number;
}