// Gráfico 1: Desempenho por Tópico
export interface TopicPerformanceData {
  topic: string;
  successPercentage: number;
  errorPercentage: number;
}

// Gráfico 2: Matriz de Desempenho
export interface EffortMatrixData {
  points: {
    name: string;
    performance: number; // Eixo Y
    effort: number;      // Eixo X
    isAverage?: boolean;
  }[];
  averages: {
    avgPerformance: number;
    avgEffort: number;
  };
}

// Gráfico 3: Raio-X de Proficiência
export interface ProficiencyRadarData {
  labels: string[];
  data: number[];
}

// Gráfico 4: Jornada de Aprendizagem
export interface LearningJourneyData {
  labels: string[];
  data: number[];
}

// Gráfico 5: Padrões de Acesso (Heatmap)
// Formato: [dia_da_semana, hora_do_dia, numero_de_sessoes]
export type AccessPatternData = [number, number, number][];