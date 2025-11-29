import { LogEntityType, LogModeType } from "@/services/api/api_routes";

export interface ChartFilterState {
  type: LogEntityType;
  ids: string[];
  mode: LogModeType;
}

export interface CategoryData {
  category: string;
  value: number;
}

export interface AccuracyData {
  name: string;
  value: number;
}

export interface UsageData {
  day: string;
  minutes: number;
}

export interface CategoryComparisonData {
  user: string;
  [category: string]: string | number;
}

export interface AccuracyComparisonData {
  name: string;
  correct: number;
  incorrect: number;
}

export interface UsageComparisonData {
  dia: string;
  [user: string]: string | number;
}

export interface EntitySearchResult {
  items: Array<{
    id: string;
    name: string;
    [key: string]: any;
  }>;
  total: number;
}

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

export interface FilterData {
  filterType: FilterType | '';
  universityId?: string;
  courseId?: string;
  disciplineId?: string;
  classId?: string;
  searchTerm?: string;
}

export type Role = "admin" | "course-coordinator" | "professor";

export interface UsageApiResponse {
  totalUsageTime: number;
  sessionCount: number;
  sessionDetails: Array<{
    sessionStart: string;
    sessionEnd: string;
    sessionDuration: number;
  }>;
}

export interface AccuracyApiResponse {
  totalCorrect: number;
  totalWrong: number;
  accuracy: number;
}

export interface SubjectsApiResponse {
  subjectFrequency: Record<string, number>;
}

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