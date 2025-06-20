import { api } from "@/services/api/api";
import { LOG_ROUTES, PROFESSOR_LOG_ROUTES } from "./api_routes";
import { LogApiResponse, UserAnalysisLog, LogFilterParams } from "../../@types/Log";

// Função genérica para GET
const getRequest = async <T>(url: string): Promise<T> => {
  console.log("📡 GET Request para:", url);
  try {
    const response = await api.get<T>(url, { withCredentials: true });
    console.log("✅ GET Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ GET Error:", error);
    throw error;
  }
};

// Função genérica para POST
const postRequest = async <T>(url: string, data: object): Promise<T> => {
  console.log("📡 POST Request para:", url, "com dados:", data);
  try {
    const response = await api.post<T>(url, data, { withCredentials: true });
    console.log("✅ POST Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ POST Error:", error);
    throw error;
  }
};

export const logApiSmart = {

  fetchSummary: async (
    userRole: string[],
    entity: "university" | "course" | "class" | "discipline" | "student",
    id: string,
    filters?: LogFilterParams
  ): Promise<UserAnalysisLog | any> => {

    console.log("🔍 logApiSmart.fetchSummary chamado com:", {
      userRole,
      entity,
      id,
      filters
    });

    const isProfessor = userRole.includes("professor");

    // Quando é professor:
    if (isProfessor) {
      console.log("👨‍🏫 Usuário é professor");
      
      if (entity === "discipline") {
        console.log("📚 Buscando dados de disciplina para professor");
        const url = PROFESSOR_LOG_ROUTES.listStudentsByDiscipline(id);
        console.log("🌐 URL da requisição:", url);
        
        try {
          const response = await getRequest<any>(url);
          console.log("✅ Resposta da API para disciplina:", response);
          // Verificar se a resposta tem a estrutura esperada
          const result = response.data || response;
          console.log("📊 Dados finais para disciplina:", result);
          return result;
        } catch (error) {
          console.error("❌ Erro ao buscar dados de disciplina:", error);
          throw error;
        }
      }

      if (entity === "student") {
        console.log("👤 Buscando dados de aluno para professor");
        if (!filters?.disciplineId) {
          throw new Error("disciplineId obrigatório para professores ao buscar aluno");
        }
        const url = PROFESSOR_LOG_ROUTES.getStudentDetails(id, filters.disciplineId);
        console.log("🌐 URL da requisição:", url);
        
        try {
          const response = await getRequest<any>(url);
          console.log("✅ Resposta da API para aluno:", response);
          // Verificar se a resposta tem a estrutura esperada
          const result = response.data || response;
          console.log("📊 Dados finais para aluno:", result);
          return result;
        } catch (error) {
          console.error("❌ Erro ao buscar dados de aluno:", error);
          throw error;
        }
      }
    }

    // Para Admin e Coordenador (e professores nos demais casos)
    console.log("🔧 Usando rotas padrão para:", entity);
    
    switch (entity) {
      case "university":
        const uniUrl = LOG_ROUTES.summary.university(id);
        console.log("🌐 URL universidade:", uniUrl);
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(uniUrl)).data;

      case "course":
        const courseUrl = LOG_ROUTES.summary.course(id);
        console.log("🌐 URL curso:", courseUrl);
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(courseUrl)).data;

      case "class":
        const classUrl = LOG_ROUTES.summary.class(id);
        console.log("🌐 URL turma:", classUrl);
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(classUrl)).data;

      case "discipline":
        const discUrl = LOG_ROUTES.summary.discipline(id);
        console.log("🌐 URL disciplina:", discUrl);
        return (await getRequest<LogApiResponse<UserAnalysisLog>>(discUrl)).data;

      case "student":
        console.log("👤 Buscando dados de aluno via POST");
        const response = await postRequest<LogApiResponse<UserAnalysisLog>>(
          LOG_ROUTES.summary.filteredStudent, {
          universityId: filters?.universityId || "",
          courseId: filters?.courseId,
          classId: filters?.classId,
          studentId: id
        }
        );
        console.log("✅ Resposta da API para aluno:", response);
        if (!response.success) throw new Error(response.error || "Erro ao buscar dados do estudante");
        return response.data;

      default:
        throw new Error("Entidade inválida");
    }
  }
};

export default logApiSmart;
