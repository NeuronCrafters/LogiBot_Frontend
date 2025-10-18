import { api } from "./api";
import type {
  TopicPerformanceData,
  EffortMatrixData,
  ProficiencyRadarData,
  LearningJourneyData,
  AccessPatternData,
  SessionDetailsData
} from "@/@types/Dashboard";

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
    api.post<TopicPerformanceData[]>('/dashboard/topic-performance', filters),

  getEffortMatrix: (filters: DashboardFilterParams) =>
    api.post<EffortMatrixData>('/dashboard/effort-matrix', filters),

  getProficiencyRadar: (filters: DashboardFilterParams) =>
    api.post<ProficiencyRadarData>('/dashboard/proficiency-radar', filters),

  getLearningJourney: (filters: DashboardFilterParams) =>
    api.post<LearningJourneyData>('/dashboard/learning-journey', filters),

  getAccessPattern: (filters: DashboardFilterParams) =>
    api.post<AccessPatternData>('/dashboard/access-pattern', filters),

  getSessionDetails: (filters: DashboardFilterParams) =>
    api.post<SessionDetailsData[]>('/dashboard/session-details', filters),
};