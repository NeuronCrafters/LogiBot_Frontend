import { logApi as baseLogApi } from "./api_logs";
import { getCachedData, cacheData } from "@/utils/chartDataCache";
import { LogEntityType, LogMetricType, LogModeType } from "./api_routes";

// Flag para controlar se estamos em modo de desenvolvimento
const isDev = import.meta.env.DEV;

export const logApi = {
  // Preservar todas as funções existentes do baseLogApi
  ...baseLogApi,

  /**
   * Versão otimizada com cache para buscar dados de gráficos
   * @param entity Tipo de entidade
   * @param metric Tipo de métrica 
   * @param mode Modo de visualização
   * @param idOrIds ID ou lista de IDs
   * @param forceRefresh Ignorar cache e forçar atualização
   */
  async getCached<T>(
    entity: LogEntityType,
    metric: LogMetricType,
    mode: LogModeType,
    idOrIds: string | string[],
    forceRefresh: boolean = false
  ): Promise<T> {
    try {
      // Para o modo de comparação, usamos um identificador especial
      const cacheId = Array.isArray(idOrIds)
        ? idOrIds.sort().join('-')
        : idOrIds as string;

      // Verificar cache se não for forçar refresh
      if (!forceRefresh) {
        const cachedData = getCachedData<T>(entity, metric, mode, cacheId);
        if (cachedData !== null) {
          return cachedData;
        }
      }

      // Log para debugging
      if (isDev) {
        console.log(`[LogApi] Buscando dados para ${entity}/${metric}/${mode}`);
      }

      // Inicializa a variável data como undefined para evitar o erro
      let data: T | undefined;

      if (mode === "individual") {
        // Seleciona a função apropriada com base na entidade e métrica
        if (entity === "student") {
          if (metric === "accuracy") data = await baseLogApi.getStudentAccuracy<T>(idOrIds as string);
          else if (metric === "usage") data = await baseLogApi.getStudentUsage<T>(idOrIds as string);
          else if (metric === "subjects") data = await baseLogApi.getStudentSubjects<T>(idOrIds as string);
        }
        else if (entity === "class") {
          if (metric === "accuracy") data = await baseLogApi.getClassAccuracy<T>(idOrIds as string);
          else if (metric === "usage") data = await baseLogApi.getClassUsage<T>(idOrIds as string);
          else if (metric === "subjects") data = await baseLogApi.getClassSubjects<T>(idOrIds as string);
        }
        else if (entity === "course") {
          if (metric === "accuracy") data = await baseLogApi.getCourseAccuracy<T>(idOrIds as string);
          else if (metric === "usage") data = await baseLogApi.getCourseUsage<T>(idOrIds as string);
          else if (metric === "subjects") data = await baseLogApi.getCourseSubjects<T>(idOrIds as string);
        }
        else if (entity === "discipline") {
          if (metric === "accuracy") data = await baseLogApi.getDisciplineAccuracy<T>(idOrIds as string);
          else if (metric === "usage") data = await baseLogApi.getDisciplineUsage<T>(idOrIds as string);
          else if (metric === "subjects") data = await baseLogApi.getDisciplineSubjects<T>(idOrIds as string);
        }
        else if (entity === "university") {
          if (metric === "accuracy") data = await baseLogApi.getUniversityAccuracy<T>(idOrIds as string);
          else if (metric === "usage") data = await baseLogApi.getUniversityUsage<T>(idOrIds as string);
          else if (metric === "subjects") data = await baseLogApi.getUniversitySubjects<T>(idOrIds as string);
        }
      } else {
        // Modo comparativo
        if (entity === "student") {
          if (metric === "accuracy") data = await baseLogApi.compareStudentAccuracy<T>(idOrIds as string[]);
          else if (metric === "usage") data = await baseLogApi.compareStudentUsage<T>(idOrIds as string[]);
          else if (metric === "subjects") data = await baseLogApi.compareStudentSubjects<T>(idOrIds as string[]);
        }
        else if (entity === "class") {
          if (metric === "accuracy") data = await baseLogApi.compareClassAccuracy<T>(idOrIds as string[]);
          else if (metric === "usage") data = await baseLogApi.compareClassUsage<T>(idOrIds as string[]);
          else if (metric === "subjects") data = await baseLogApi.compareClassSubjects<T>(idOrIds as string[]);
        }
        else if (entity === "course") {
          if (metric === "accuracy") data = await baseLogApi.compareCourseAccuracy<T>(idOrIds as string[]);
          else if (metric === "usage") data = await baseLogApi.compareCourseUsage<T>(idOrIds as string[]);
          else if (metric === "subjects") data = await baseLogApi.compareCourseSubjects<T>(idOrIds as string[]);
        }
        else if (entity === "discipline") {
          if (metric === "accuracy") data = await baseLogApi.compareDisciplineAccuracy<T>(idOrIds as string[]);
          else if (metric === "usage") data = await baseLogApi.compareDisciplineUsage<T>(idOrIds as string[]);
          else if (metric === "subjects") data = await baseLogApi.compareDisciplineSubjects<T>(idOrIds as string[]);
        }
        else if (entity === "university") {
          if (metric === "accuracy") data = await baseLogApi.compareUniversityAccuracy<T>(idOrIds as string[]);
          else if (metric === "usage") data = await baseLogApi.compareUniversityUsage<T>(idOrIds as string[]);
          else if (metric === "subjects") data = await baseLogApi.compareUniversitySubjects<T>(idOrIds as string[]);
        }
      }

      // Verificar se encontramos uma combinação válida para obter os dados
      if (data === undefined) {
        throw new Error(`Combinação inválida de entity: ${entity}, metric: ${metric}, mode: ${mode}`);
      }

      // Armazenar dados obtidos no cache
      cacheData(entity, metric, mode, cacheId, data);

      return data;
    } catch (error) {
      console.error(`Erro ao buscar dados para ${entity}/${metric}:`, error);
      throw error;
    }
  },

  // Limpar o cache de dados
  clearCache(entity?: LogEntityType) {
    const { invalidateCache } = require('@/utils/chartDataCache');
    invalidateCache(entity);
  }
};