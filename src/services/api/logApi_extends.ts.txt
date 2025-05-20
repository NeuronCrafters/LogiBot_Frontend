import { api } from "@/services/api/api";
import { LOG_ROUTES } from "./api_routes";
import { LogEntityType, LogMetricType, LogModeType } from "./api_routes";
import { getCachedData, cacheData, invalidateCache } from "@/utils/chartDataCache";

// Funções base de API
const getRequest = async <T>(url: string): Promise<T> => {
  console.log(`[API Base] Fazendo requisição GET para ${url}`);
  const response = await api.get<T>(url, { withCredentials: true });
  console.log(`[API Base] Resposta recebida de ${url}:`, response.data);
  return response.data;
};

const postRequest = async <T>(url: string, data: object): Promise<T> => {
  console.log(`[API Base] Fazendo requisição POST para ${url} com dados:`, data);
  const response = await api.post<T>(url, data, { withCredentials: true });
  console.log(`[API Base] Resposta recebida de ${url}:`, response.data);
  return response.data;
};

// API base com endpoints originais
export const baseLogApi = {
  // Student
  getStudentAccuracy: <T>(id: string) => getRequest<T>(LOG_ROUTES.student.accuracy(id)),
  getStudentUsage: <T>(id: string) => getRequest<T>(LOG_ROUTES.student.usage(id)),
  getStudentSubjects: <T>(id: string) => getRequest<T>(LOG_ROUTES.student.subjects(id)),
  compareStudentAccuracy: <T>(ids: string[]) => postRequest<T>(LOG_ROUTES.student.compare.accuracy, { ids }),
  compareStudentUsage: <T>(ids: string[]) => postRequest<T>(LOG_ROUTES.student.compare.usage, { ids }),
  compareStudentSubjects: <T>(ids: string[]) => postRequest<T>(LOG_ROUTES.student.compare.subjects, { ids }),

  // Class
  getClassAccuracy: <T>(id: string) => getRequest<T>(LOG_ROUTES.class.accuracy(id)),
  getClassUsage: <T>(id: string) => getRequest<T>(LOG_ROUTES.class.usage(id)),
  getClassSubjects: <T>(id: string) => getRequest<T>(LOG_ROUTES.class.subjects(id)),
  compareClassAccuracy: <T>(ids: string[]) => postRequest<T>(LOG_ROUTES.class.compare.accuracy, { ids }),
  compareClassUsage: <T>(ids: string[]) => postRequest<T>(LOG_ROUTES.class.compare.usage, { ids }),
  compareClassSubjects: <T>(ids: string[]) => postRequest<T>(LOG_ROUTES.class.compare.subjects, { ids }),

  // Course
  getCourseAccuracy: <T>(id: string) => getRequest<T>(LOG_ROUTES.course.accuracy(id)),
  getCourseUsage: <T>(id: string) => getRequest<T>(LOG_ROUTES.course.usage(id)),
  getCourseSubjects: <T>(id: string) => getRequest<T>(LOG_ROUTES.course.subjects(id)),
  compareCourseAccuracy: <T>(ids: string[]) => postRequest<T>(LOG_ROUTES.course.compare.accuracy, { ids }),
  compareCourseUsage: <T>(ids: string[]) => postRequest<T>(LOG_ROUTES.course.compare.usage, { ids }),
  compareCourseSubjects: <T>(ids: string[]) => postRequest<T>(LOG_ROUTES.course.compare.subjects, { ids }),

  // Discipline
  getDisciplineAccuracy: <T>(id: string) => getRequest<T>(LOG_ROUTES.discipline.accuracy(id)),
  getDisciplineUsage: <T>(id: string) => getRequest<T>(LOG_ROUTES.discipline.usage(id)),
  getDisciplineSubjects: <T>(id: string) => getRequest<T>(LOG_ROUTES.discipline.subjects(id)),
  compareDisciplineAccuracy: <T>(ids: string[]) => postRequest<T>(LOG_ROUTES.discipline.compare.accuracy, { ids }),
  compareDisciplineUsage: <T>(ids: string[]) => postRequest<T>(LOG_ROUTES.discipline.compare.usage, { ids }),
  compareDisciplineSubjects: <T>(ids: string[]) => postRequest<T>(LOG_ROUTES.discipline.compare.subjects, { ids }),

  // University
  getUniversityAccuracy: <T>(id: string) => getRequest<T>(LOG_ROUTES.university.accuracy(id)),
  getUniversityUsage: <T>(id: string) => getRequest<T>(LOG_ROUTES.university.usage(id)),
  getUniversitySubjects: <T>(id: string) => getRequest<T>(LOG_ROUTES.university.subjects(id)),
  compareUniversityAccuracy: <T>(ids: string[]) => postRequest<T>(LOG_ROUTES.university.compare.accuracy, { ids }),
  compareUniversityUsage: <T>(ids: string[]) => postRequest<T>(LOG_ROUTES.university.compare.usage, { ids }),
  compareUniversitySubjects: <T>(ids: string[]) => postRequest<T>(LOG_ROUTES.university.compare.subjects, { ids }),
};

// Flag para controlar se estamos em modo de desenvolvimento
const isDev = import.meta.env ? import.meta.env.DEV : process.env.NODE_ENV === "development";

// logApi com cache e logs detalhados
export const logApi_extends = {
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

      console.log(`[API] Iniciando requisição para ${entity}/${metric}/${mode} com ID: ${cacheId}`);

      // Verificar cache se não for forçar refresh
      if (!forceRefresh) {
        const cachedData = getCachedData<T>(entity, metric, mode, cacheId);
        if (cachedData !== null) {
          console.log(`[API] Usando cache para ${entity}/${metric}/${mode}`);
          return cachedData;
        }
      }

      // Log para debugging
      console.log(`[API] Cache não encontrado ou ignorado para ${entity}/${metric}/${mode}`);

      // Se chegamos aqui, precisamos buscar dados da API
      let data: T | undefined;
      let apiEndpoint: string = "";

      // Determinando o endpoint e fazendo a chamada API
      if (mode === "individual") {
        // Modo individual
        console.log(`[API] Usando modo individual para ${entity}/${metric}`);

        if (entity === "student") {
          if (metric === "accuracy") {
            apiEndpoint = LOG_ROUTES.student.accuracy(idOrIds as string);
            console.log(`[API] Chamando endpoint GET: ${apiEndpoint}`);
            const response = await api.get<T>(apiEndpoint, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "usage") {
            apiEndpoint = LOG_ROUTES.student.usage(idOrIds as string);
            console.log(`[API] Chamando endpoint GET: ${apiEndpoint}`);
            const response = await api.get<T>(apiEndpoint, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "subjects") {
            apiEndpoint = LOG_ROUTES.student.subjects(idOrIds as string);
            console.log(`[API] Chamando endpoint GET: ${apiEndpoint}`);
            const response = await api.get<T>(apiEndpoint, { withCredentials: true });
            data = response.data;
          }
        }
        else if (entity === "class") {
          if (metric === "accuracy") {
            apiEndpoint = LOG_ROUTES.class.accuracy(idOrIds as string);
            console.log(`[API] Chamando endpoint GET: ${apiEndpoint}`);
            const response = await api.get<T>(apiEndpoint, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "usage") {
            apiEndpoint = LOG_ROUTES.class.usage(idOrIds as string);
            console.log(`[API] Chamando endpoint GET: ${apiEndpoint}`);
            const response = await api.get<T>(apiEndpoint, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "subjects") {
            apiEndpoint = LOG_ROUTES.class.subjects(idOrIds as string);
            console.log(`[API] Chamando endpoint GET: ${apiEndpoint}`);
            const response = await api.get<T>(apiEndpoint, { withCredentials: true });
            data = response.data;
          }
        }
        else if (entity === "course") {
          if (metric === "accuracy") {
            apiEndpoint = LOG_ROUTES.course.accuracy(idOrIds as string);
            console.log(`[API] Chamando endpoint GET: ${apiEndpoint}`);
            const response = await api.get<T>(apiEndpoint, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "usage") {
            apiEndpoint = LOG_ROUTES.course.usage(idOrIds as string);
            console.log(`[API] Chamando endpoint GET: ${apiEndpoint}`);
            const response = await api.get<T>(apiEndpoint, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "subjects") {
            apiEndpoint = LOG_ROUTES.course.subjects(idOrIds as string);
            console.log(`[API] Chamando endpoint GET: ${apiEndpoint}`);
            const response = await api.get<T>(apiEndpoint, { withCredentials: true });
            data = response.data;
          }
        }
        else if (entity === "discipline") {
          if (metric === "accuracy") {
            apiEndpoint = LOG_ROUTES.discipline.accuracy(idOrIds as string);
            console.log(`[API] Chamando endpoint GET: ${apiEndpoint}`);
            const response = await api.get<T>(apiEndpoint, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "usage") {
            apiEndpoint = LOG_ROUTES.discipline.usage(idOrIds as string);
            console.log(`[API] Chamando endpoint GET: ${apiEndpoint}`);
            const response = await api.get<T>(apiEndpoint, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "subjects") {
            apiEndpoint = LOG_ROUTES.discipline.subjects(idOrIds as string);
            console.log(`[API] Chamando endpoint GET: ${apiEndpoint}`);
            const response = await api.get<T>(apiEndpoint, { withCredentials: true });
            data = response.data;
          }
        }
        else if (entity === "university") {
          if (metric === "accuracy") {
            apiEndpoint = LOG_ROUTES.university.accuracy(idOrIds as string);
            console.log(`[API] Chamando endpoint GET: ${apiEndpoint}`);
            const response = await api.get<T>(apiEndpoint, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "usage") {
            apiEndpoint = LOG_ROUTES.university.usage(idOrIds as string);
            console.log(`[API] Chamando endpoint GET: ${apiEndpoint}`);
            const response = await api.get<T>(apiEndpoint, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "subjects") {
            apiEndpoint = LOG_ROUTES.university.subjects(idOrIds as string);
            console.log(`[API] Chamando endpoint GET: ${apiEndpoint}`);
            const response = await api.get<T>(apiEndpoint, { withCredentials: true });
            data = response.data;
          }
        }
      } else {
        // Modo comparativo
        console.log(`[API] Usando modo comparativo para ${entity}/${metric}`);

        if (entity === "student") {
          if (metric === "accuracy") {
            apiEndpoint = LOG_ROUTES.student.compare.accuracy;
            console.log(`[API] Chamando endpoint POST: ${apiEndpoint} com IDs:`, idOrIds);
            const response = await api.post<T>(apiEndpoint, { ids: idOrIds }, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "usage") {
            apiEndpoint = LOG_ROUTES.student.compare.usage;
            console.log(`[API] Chamando endpoint POST: ${apiEndpoint} com IDs:`, idOrIds);
            const response = await api.post<T>(apiEndpoint, { ids: idOrIds }, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "subjects") {
            apiEndpoint = LOG_ROUTES.student.compare.subjects;
            console.log(`[API] Chamando endpoint POST: ${apiEndpoint} com IDs:`, idOrIds);
            const response = await api.post<T>(apiEndpoint, { ids: idOrIds }, { withCredentials: true });
            data = response.data;
          }
        }
        else if (entity === "class") {
          if (metric === "accuracy") {
            apiEndpoint = LOG_ROUTES.class.compare.accuracy;
            console.log(`[API] Chamando endpoint POST: ${apiEndpoint} com IDs:`, idOrIds);
            const response = await api.post<T>(apiEndpoint, { ids: idOrIds }, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "usage") {
            apiEndpoint = LOG_ROUTES.class.compare.usage;
            console.log(`[API] Chamando endpoint POST: ${apiEndpoint} com IDs:`, idOrIds);
            const response = await api.post<T>(apiEndpoint, { ids: idOrIds }, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "subjects") {
            apiEndpoint = LOG_ROUTES.class.compare.subjects;
            console.log(`[API] Chamando endpoint POST: ${apiEndpoint} com IDs:`, idOrIds);
            const response = await api.post<T>(apiEndpoint, { ids: idOrIds }, { withCredentials: true });
            data = response.data;
          }
        }
        else if (entity === "course") {
          if (metric === "accuracy") {
            apiEndpoint = LOG_ROUTES.course.compare.accuracy;
            console.log(`[API] Chamando endpoint POST: ${apiEndpoint} com IDs:`, idOrIds);
            const response = await api.post<T>(apiEndpoint, { ids: idOrIds }, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "usage") {
            apiEndpoint = LOG_ROUTES.course.compare.usage;
            console.log(`[API] Chamando endpoint POST: ${apiEndpoint} com IDs:`, idOrIds);
            const response = await api.post<T>(apiEndpoint, { ids: idOrIds }, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "subjects") {
            apiEndpoint = LOG_ROUTES.course.compare.subjects;
            console.log(`[API] Chamando endpoint POST: ${apiEndpoint} com IDs:`, idOrIds);
            const response = await api.post<T>(apiEndpoint, { ids: idOrIds }, { withCredentials: true });
            data = response.data;
          }
        }
        else if (entity === "discipline") {
          if (metric === "accuracy") {
            apiEndpoint = LOG_ROUTES.discipline.compare.accuracy;
            console.log(`[API] Chamando endpoint POST: ${apiEndpoint} com IDs:`, idOrIds);
            const response = await api.post<T>(apiEndpoint, { ids: idOrIds }, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "usage") {
            apiEndpoint = LOG_ROUTES.discipline.compare.usage;
            console.log(`[API] Chamando endpoint POST: ${apiEndpoint} com IDs:`, idOrIds);
            const response = await api.post<T>(apiEndpoint, { ids: idOrIds }, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "subjects") {
            apiEndpoint = LOG_ROUTES.discipline.compare.subjects;
            console.log(`[API] Chamando endpoint POST: ${apiEndpoint} com IDs:`, idOrIds);
            const response = await api.post<T>(apiEndpoint, { ids: idOrIds }, { withCredentials: true });
            data = response.data;
          }
        }
        else if (entity === "university") {
          if (metric === "accuracy") {
            apiEndpoint = LOG_ROUTES.university.compare.accuracy;
            console.log(`[API] Chamando endpoint POST: ${apiEndpoint} com IDs:`, idOrIds);
            const response = await api.post<T>(apiEndpoint, { ids: idOrIds }, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "usage") {
            apiEndpoint = LOG_ROUTES.university.compare.usage;
            console.log(`[API] Chamando endpoint POST: ${apiEndpoint} com IDs:`, idOrIds);
            const response = await api.post<T>(apiEndpoint, { ids: idOrIds }, { withCredentials: true });
            data = response.data;
          }
          else if (metric === "subjects") {
            apiEndpoint = LOG_ROUTES.university.compare.subjects;
            console.log(`[API] Chamando endpoint POST: ${apiEndpoint} com IDs:`, idOrIds);
            const response = await api.post<T>(apiEndpoint, { ids: idOrIds }, { withCredentials: true });
            data = response.data;
          }
        }
      }

      // Verificar se a API retornou algo
      if (data === undefined) {
        console.error(`[API] Nenhum dado retornado pelo endpoint ${apiEndpoint}`);
        throw new Error(`Combinação inválida de entity: ${entity}, metric: ${metric}, mode: ${mode}`);
      }

      console.log(`[API] Dados recebidos com sucesso de ${apiEndpoint}:`, data);

      // Adaptação para gráficos de uso quando não há sessionDetails
      if (metric === "usage" && entity !== "student" && typeof data === 'object' && data !== null && !('sessionDetails' in data) && 'totalUsageTime' in data) {
        console.log(`[API] Adaptando formato de dados para compatibilidade com UsageChart`);

        // Criar dados de sessão sintéticos para entidades não-student
        const today = new Date();
        const sessionDetails = [];
        const totalUsageTime = Number((data as any).totalUsageTime || 0);

        // Distribuir os dados em 5 pontos
        for (let i = 0; i < 5; i++) {
          const sessionDate = new Date(today);
          sessionDate.setDate(sessionDate.getDate() - i * 7); // Distribuir ao longo de 5 semanas

          sessionDetails.push({
            sessionStart: sessionDate.toISOString(),
            sessionEnd: sessionDate.toISOString(),
            sessionDuration: totalUsageTime / 5
          });
        }

        (data as any).sessionDetails = sessionDetails;
      }

      // Armazenar dados obtidos no cache
      cacheData(entity, metric, mode, cacheId, data);
      console.log(`[API] Dados armazenados no cache para ${entity}/${metric}/${mode}`);

      return data;
    } catch (error: any) {
      console.error(`[API] Erro ao buscar dados para ${entity}/${metric}/${mode}:`, error);
      console.error(`[API] Detalhes do erro:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Limpar o cache de dados
  clearCache(entity?: LogEntityType) {
    invalidateCache(entity);
    console.log(`[API] Cache ${entity ? `do tipo ${entity}` : "completo"} invalidado.`);
  }
};