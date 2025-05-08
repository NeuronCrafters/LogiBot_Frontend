import { api } from "@/services/api/api";
import { ACADEMIC_ROUTES, PUBLIC_ROUTES, RASA_ROUTES, AcademicEntityType } from "./api/api_routes";

const getRequest = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url, { withCredentials: true });
  return response.data;
};

const postRequest = async <T>(url: string, data: object): Promise<T> => {
  const response = await api.post<T>(url, data, { withCredentials: true });
  return response.data;
};

const deleteRequest = async <T>(url: string): Promise<T> => {
  const response = await api.delete<T>(url, { withCredentials: true });
  return response.data;
};

export const academicApi = {
  async post<T>(entity: AcademicEntityType, data: object): Promise<T> {
    const url = ACADEMIC_ROUTES[entity].post;
    return postRequest<T>(url, data);
  },
  async get<T>(entity: AcademicEntityType, id?: string): Promise<T> {
    const baseUrl = ACADEMIC_ROUTES[entity].get;
    const url = id ? `${baseUrl}/${id}` : baseUrl;
    return getRequest<T>(url);
  },
  async delete<T>(entity: AcademicEntityType, id: string): Promise<T> {
    const baseUrl = ACADEMIC_ROUTES[entity].delete;
    const url = `${baseUrl}/${id}`;
    return deleteRequest<T>(url);
  },
};

export const publicApi = {
  async getInstitutions<T>(): Promise<T> {
    return getRequest<T>(PUBLIC_ROUTES.institutions);
  },
  async getCourses<T>(universityId: string): Promise<T> {
    return getRequest<T>(`${PUBLIC_ROUTES.courses}/${universityId}`);
  },
  async getDisciplines<T>(universityId: string, courseId: string): Promise<T> {
    return getRequest<T>(`${PUBLIC_ROUTES.disciplines}/${universityId}/${courseId}`);
  },
  async getClasses<T>(universityId: string, courseId: string): Promise<T> {
    return getRequest<T>(`${PUBLIC_ROUTES.classes}/${universityId}/${courseId}`);
  },
  async getProfessors<T>(universityId: string, courseId?: string): Promise<T> {
    const url = courseId
      ? `${PUBLIC_ROUTES.professors}/${universityId}/${courseId}`
      : `${PUBLIC_ROUTES.professors}/${universityId}`;
    return getRequest<T>(url);
  },
  async getStudentsByClass<T>(universityId: string, courseId: string, classId: string): Promise<T> {
    return getRequest<T>(`${PUBLIC_ROUTES.studentsByClass}/${universityId}/${courseId}/${classId}`);
  },
  async getStudentsByDiscipline<T>(universityId: string, courseId: string, disciplineId: string): Promise<T> {
    return getRequest<T>(`${PUBLIC_ROUTES.studentsByDiscipline}/${universityId}/${courseId}/${disciplineId}`);
  },
  async getStudentsByCourse<T>(universityId: string, courseId: string): Promise<T> {
    return getRequest<T>(`${PUBLIC_ROUTES.studentsByCourse}/${universityId}/${courseId}`);
  },
};

export const rasaApi = {
  async sendMessage<T>(message: string): Promise<T> {
    return postRequest<T>(RASA_ROUTES.talk, { message });
  },
  async listarNiveis<T>(): Promise<T> {
    return getRequest<T>(RASA_ROUTES.listarNiveis);
  },
  async definirNivel<T>(nivel: string): Promise<T> {
    return postRequest<T>(RASA_ROUTES.definirNivel, { nivel });
  },
  async listarOpcoes<T>(): Promise<T> {
    return getRequest<T>(RASA_ROUTES.listarOpcoes);
  },
  async listarSubopcoes<T>(categoria: string): Promise<T> {
    return postRequest<T>(RASA_ROUTES.listarSubopcoes, { categoria });
  },
  async gerarPerguntas<T>(pergunta: string): Promise<T> {
    return postRequest<T>(RASA_ROUTES.gerarPerguntas, { pergunta });
  },
  async getGabarito<T>(): Promise<T> {
    return getRequest<T>(RASA_ROUTES.getGabarito);
  },
  async verificarRespostas<T>(respostas: string[]): Promise<T> {
    return postRequest<T>(RASA_ROUTES.verificarRespostas, { respostas });
  },
  async actionConversar<T>(): Promise<T> {
    return postRequest<T>(RASA_ROUTES.actionConversar, { text: "conversar" });
  },
  async actionPerguntar<T>(message: string): Promise<T> {
    return postRequest<T>(RASA_ROUTES.actionPerguntar, { message });
  },
};
