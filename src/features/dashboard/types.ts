import type { Language } from "@/i18n";
export interface TopicPerformanceData {
  topic: string;
  successPercentage: number;
  errorPercentage: number;
}

export interface EffortMatrixData {
  points: {
    name: string;
    performance: number | null;
    effort: number;
    originalPerformance?: number;
    originalEffort?: number;
    isAverage?: boolean;
  }[];
  unassessedCount?: number;
  averages: {
    avgPerformance: number;
    avgEffort: number;
  };
}

export interface ProficiencyRadarData {
  labels: string[];
  data: number[];
}

export interface LearningJourneyData {
  labels: string[];
  data: number[];
}

export type AccessPatternData = [number, number, number][];

export interface SessionDetailsData {
  startTime: string;
  endTime: string;
}

export type DashboardInsightChart =
  | "usage"
  | "accuracy"
  | "chat-topics"
  | "general-score"
  | "proficiency-radar"
  | "effort-matrix"
  | "learning-journey"
  | "access-pattern";

export interface DashboardInsightResponse {
  language: Language;
  insight: string;
  generatedAt: string;
  cached: boolean;
  chart?: DashboardInsightChart;
}
