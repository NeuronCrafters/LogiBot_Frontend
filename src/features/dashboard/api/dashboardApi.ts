import type { Language } from "@/i18n";
import { api } from "@/shared/api/httpClient";
import type {
  TopicPerformanceData,
  EffortMatrixData,
  ProficiencyRadarData,
  LearningJourneyData,
  AccessPatternData,
  SessionDetailsData,
  DashboardInsightChart,
  DashboardInsightResponse,
  ComparisonInsightChart,
  ExamComparisonData,
  EngagementData,
  ChatSatisfactionData,
} from "@/features/dashboard/types";

export interface DashboardFilterParams {
  universityId?: string;
  courseId?: string;
  classId?: string;
  studentId?: string;
  disciplineId?: string;
  startDate?: string;
  endDate?: string;
}

export const dashboardApi = {
  getTopicPerformance: (filters: DashboardFilterParams) =>
    api.post<TopicPerformanceData[]>("/dashboard/topic-performance", filters),

  getEffortMatrix: (filters: DashboardFilterParams) =>
    api.post<EffortMatrixData>("/dashboard/effort-matrix", filters),

  getProficiencyRadar: (filters: DashboardFilterParams) =>
    api.post<ProficiencyRadarData>("/dashboard/proficiency-radar", filters),

  getLearningJourney: (filters: DashboardFilterParams) =>
    api.post<LearningJourneyData>("/dashboard/learning-journey", filters),

  getAccessPattern: (filters: DashboardFilterParams) =>
    api.post<AccessPatternData>("/dashboard/access-pattern", filters),

  getSessionDetails: (filters: DashboardFilterParams) =>
    api.post<SessionDetailsData[]>("/dashboard/session-details", filters),

  getChartInsight: (
    chart: DashboardInsightChart,
    filters: DashboardFilterParams,
    force = false,
    language?: Language,
  ) =>
    api.post<DashboardInsightResponse>("/dashboard/insights/chart", {
      chart,
      filters,
      force,
    }, language ? { headers: { "Accept-Language": language, "X-Language": language } } : undefined),

  /** Analysis of both selections together (A × B). */
  getComparisonInsight: (a: DashboardFilterParams, b: DashboardFilterParams, force = false, language?: Language) =>
    api.post<DashboardInsightResponse>("/dashboard/insights/comparison", { a, b, force },
      language ? { headers: { "Accept-Language": language, "X-Language": language } } : undefined),

  /** Analysis of one direct comparison chart (A × B). */
  getComparisonChartInsight: (chart: ComparisonInsightChart, a: DashboardFilterParams, b: DashboardFilterParams, force = false, language?: Language) =>
    api.post<DashboardInsightResponse>("/dashboard/insights/comparison-chart", { chart, a, b, force },
      language ? { headers: { "Accept-Language": language, "X-Language": language } } : undefined),

  getExamComparison: (filters: DashboardFilterParams) =>
    api.post<ExamComparisonData>("/dashboard/compare/exams", filters),

  getEngagement: (filters: DashboardFilterParams) =>
    api.post<EngagementData>("/dashboard/compare/engagement", filters),

  getChatSatisfaction: (filters: DashboardFilterParams) =>
    api.post<ChatSatisfactionData>("/dashboard/compare/chat-satisfaction", filters),

  getOverviewInsight: (filters: DashboardFilterParams, force = false, language?: Language) =>
    api.post<DashboardInsightResponse>("/dashboard/insights/overview", {
      filters,
      force,
    }, language ? { headers: { "Accept-Language": language, "X-Language": language } } : undefined),
};
