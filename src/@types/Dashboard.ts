export interface TopicPerformanceData {
  topic: string;
  successPercentage: number;
  errorPercentage: number;
}

export interface EffortMatrixData {
  points: {
    name: string;
    performance: number;
    effort: number;
    isAverage?: boolean;
  }[];
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