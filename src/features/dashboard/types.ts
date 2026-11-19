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
    effortEstimated?: boolean;
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
  data: (number | null)[];
}

export interface LearningJourneyData {
  labels: string[];
  data: number[];
}

export type AccessPatternData = [number, number, number][];

export interface SessionDetailsData {
  startTime: string;
  endTime: string;
  durationSource?: "recorded" | "estimated" | "unavailable" | "observed";
  sessionDuration?: number;
  ongoing?: boolean;
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

/** Direct comparison charts that can be analysed by the AI (both selections at once). */
export type ComparisonInsightChart =
  | "topic-difference"
  | "radar-overlay"
  | "performance-distribution"
  | "exam-results"
  | "weekly-engagement"
  | "chat-satisfaction";

export interface ExamComparisonData {
  exams: Array<{ title: string; releasedAt: string; expected: number; submitted: number; submissionRate: number | null; averageGrade: number | null }>;
  expected: number;
  submitted: number;
  submissionRate: number | null;
  averageGrade: number | null;
}

export interface EngagementData {
  students: number;
  weeks: Array<{ week: string; activeStudents: number; sessions: number; minutes: number; activeShare: number | null }>;
  averageActiveShare: number | null;
}

export type ChatSatisfactionData =
  | { available: true; days: number; disciplineIgnored: boolean; total: number; up: number; partial: number; down: number; score: number | null; byTopic: Array<{ topic: string; total: number; score: number | null }> }
  | { available: false; reason: "student" }
  | { available: false; reason: "small"; total: number; minGroupSize: number };
